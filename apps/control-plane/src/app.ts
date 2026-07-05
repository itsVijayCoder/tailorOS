import { Hono } from "hono";
import { z } from "zod";

import {
  createTenantRequestSchema,
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
  createTenantSignup,
  ProvisioningQueueError,
  resolveIdempotencyKey,
  retryTenantProvisioning,
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
