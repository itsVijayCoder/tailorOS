import { Hono } from "hono";
import { z } from "zod";

import {
  createTenantRequestSchema,
  platformTenantOnboardingRequestSchema,
  tenantIdSchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";
import {
  createErrorHandler,
  createNotFoundHandler,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import { D1ControlPlaneStore } from "./control-store";
import type { ControlPlaneEnv } from "./env";
import {
  createOwnerAccessIds,
  createOwnerSetupSessionToken,
  createTenantSignup,
  ProvisioningQueueError,
  resolveIdempotencyKey,
  retryTenantProvisioning,
  sha256Hex,
  TenantSlugConflictError,
} from "./provisioning";
import { verifyTurnstileToken } from "./turnstile";

export const app = new Hono<ControlPlaneEnv>();

const tenantListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

app.use("*", requestIdMiddleware());

app.get("/health", (c) =>
  jsonSuccess(c, {
    service: "control-plane",
    boundary: "tenant-lifecycle",
    status: "ok",
  }),
);

app.post("/v1/tenants/provision", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = createTenantRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant provisioning request is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const turnstile = await verifyTurnstileToken({
    token: parsed.data.turnstileToken,
    remoteIp: c.req.header("cf-connecting-ip") ?? null,
    env: c.env,
  });

  if (!turnstile.ok) {
    return jsonError(c, {
      code:
        turnstile.status === 503 ? "SERVICE_UNAVAILABLE" : "VALIDATION_ERROR",
      message: turnstile.message,
      status: turnstile.status,
    });
  }

  const idempotency = resolveIdempotencyKey({
    headerValue: c.req.header("idempotency-key") ?? null,
    request: parsed.data,
  });

  if (!idempotency.ok) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Idempotency key is invalid.",
      status: 400,
      fields: { idempotencyKey: [idempotency.message] },
    });
  }

  const store = new D1ControlPlaneStore(c.env.CONTROL_DB);

  try {
    const result = await createTenantSignup({
      request: parsed.data,
      idempotencyKey: idempotency.value,
      store,
      queue: c.env.TENANT_PROVISION_QUEUE,
    });

    return jsonSuccess(c, result, 202);
  } catch (error) {
    if (error instanceof TenantSlugConflictError) {
      return jsonError(c, {
        code: "CONFLICT",
        message: error.message,
        status: 409,
        fields: {
          preferredSlug: [
            "This slug is already reserved. Try adding city, area, or shop code.",
          ],
        },
      });
    }

    if (error instanceof ProvisioningQueueError) {
      return jsonError(c, {
        code: "SERVICE_UNAVAILABLE",
        message: error.message,
        status: 503,
      });
    }

    throw error;
  }
});

app.post("/v1/admin/tenants/onboard", async (c) => {
  const admin = authorizePlatformAdmin(c.req.header("authorization"), c.env);

  if (!admin.ok) {
    return jsonError(c, {
      code: admin.missing ? "UNAUTHORIZED" : "FORBIDDEN",
      message: admin.missing
        ? "A platform admin token is required."
        : "Platform admin token is invalid.",
      status: admin.missing ? 401 : 403,
    });
  }

  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = platformTenantOnboardingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant onboarding request is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const store = new D1ControlPlaneStore(c.env.CONTROL_DB);
  const idempotency = resolveIdempotencyKey({
    headerValue: c.req.header("idempotency-key") ?? null,
    request: {
      ...parsed.data,
      turnstileToken: "test_super_admin_onboarding",
    },
  });

  if (!idempotency.ok) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Idempotency key is invalid.",
      status: 400,
      fields: { idempotencyKey: [idempotency.message] },
    });
  }

  try {
    const provisioning = await createTenantSignup({
      request: {
        ...parsed.data,
        turnstileToken: "test_super_admin_onboarding",
      },
      idempotencyKey: idempotency.value,
      store,
      queue: c.env.TENANT_PROVISION_QUEUE,
    });
    const ids = createOwnerAccessIds();
    const sessionToken = createOwnerSetupSessionToken(provisioning.slug);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const ownerAccess = await store.createOwnerAccess({
      ...ids,
      tenantId: provisioning.tenantId,
      displayName: parsed.data.ownerName,
      email: parsed.data.ownerEmail,
      mobileE164: parsed.data.ownerMobile,
      now: new Date().toISOString(),
      sessionExpiresAt: expiresAt.toISOString(),
      sessionTokenHash: await sha256Hex(sessionToken),
    });

    return jsonSuccess(
      c,
      {
        provisioning,
        ownerAccess: {
          ...ownerAccess,
          sessionToken,
          loginHint: `Use Bearer ${sessionToken} for ${provisioning.slug} until login UI is connected.`,
          tenantApiPath: `/v1/tenant/${provisioning.slug}`,
        },
      },
      202,
    );
  } catch (error) {
    if (error instanceof TenantSlugConflictError) {
      return jsonError(c, {
        code: "CONFLICT",
        message: error.message,
        status: 409,
        fields: {
          preferredSlug: [
            "This slug is already reserved. Try adding city, area, or shop code.",
          ],
        },
      });
    }

    if (error instanceof ProvisioningQueueError) {
      return jsonError(c, {
        code: "SERVICE_UNAVAILABLE",
        message: error.message,
        status: 503,
      });
    }

    throw error;
  }
});

app.get("/v1/tenants", async (c) => {
  const parsed = tenantListQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant list query is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const tenants = await new D1ControlPlaneStore(c.env.CONTROL_DB).listSummaries(
    parsed.data.limit,
  );

  return jsonSuccess(c, { tenants });
});

app.get("/v1/tenants/:tenantId", async (c) => {
  const parsed = tenantIdSchema.safeParse(c.req.param("tenantId"));

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant ID is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const tenant = await new D1ControlPlaneStore(
    c.env.CONTROL_DB,
  ).findSummaryByTenantId(parsed.data);

  if (!tenant) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { tenant });
});

app.post("/v1/tenants/:tenantId/retry", async (c) => {
  const parsed = tenantIdSchema.safeParse(c.req.param("tenantId"));

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant ID is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const store = new D1ControlPlaneStore(c.env.CONTROL_DB);
  const existing = await store.findSummaryByTenantId(parsed.data);

  if (!existing) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant not found.",
      status: 404,
    });
  }

  const retry = await retryTenantProvisioning({
    tenantId: parsed.data,
    store,
    queue: c.env.TENANT_PROVISION_QUEUE,
  });

  if (!retry) {
    return jsonError(c, {
      code: "CONFLICT",
      message: "Tenant is not in a recoverable provisioning state.",
      status: 409,
    });
  }

  return jsonSuccess(c, retry, 202);
});

app.post("/v1/tenants/:tenantId/suspend", async (c) => {
  const parsed = tenantIdSchema.safeParse(c.req.param("tenantId"));

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Tenant ID is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const store = new D1ControlPlaneStore(c.env.CONTROL_DB);
  const existing = await store.findSummaryByTenantId(parsed.data);

  if (!existing) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant not found.",
      status: 404,
    });
  }

  const now = new Date().toISOString();
  await store.markProvisioningProgress({
    tenantId: existing.tenantId,
    tenantStatus: "suspended",
    jobStatus: existing.jobStatus ?? "succeeded",
    step: existing.provisioningStep ?? "active",
    now,
    lastError: existing.lastError,
  });
  await store.recordAudit({
    id: `AUD-${crypto.randomUUID()}`,
    tenantId: existing.tenantId,
    actorType: "platform_admin",
    actorId: c.req.header("x-platform-admin-id") ?? null,
    action: "tenant.suspended",
    targetType: "tenant",
    targetId: existing.tenantId,
    reasonCode: c.req.header("x-support-reason") ?? "support_action",
    summary: "Tenant was suspended by platform admin.",
    metadataJson: null,
    createdAt: now,
  });

  const tenant = await store.findSummaryByTenantId(existing.tenantId);
  return jsonSuccess(c, { tenant });
});

app.notFound(createNotFoundHandler<ControlPlaneEnv>());
app.onError(createErrorHandler<ControlPlaneEnv>());

function authorizePlatformAdmin(authorization: string | undefined, env: Env) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const configuredToken =
    (env as Env & { PLATFORM_ADMIN_TOKEN?: string }).PLATFORM_ADMIN_TOKEN ??
    (env.ENVIRONMENT === "local" ? "local_super_admin_token_dev_2026" : "");

  if (!token) {
    return { ok: false as const, missing: true };
  }

  if (!configuredToken || token !== configuredToken) {
    return { ok: false as const, missing: false };
  }

  return { ok: true as const };
}
