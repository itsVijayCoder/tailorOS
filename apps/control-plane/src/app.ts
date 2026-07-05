import { Hono } from "hono";

import { createStableId } from "@tailoros/core";
import {
  createQueueEnvelope,
  createTenantRequestSchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";
import {
  createErrorHandler,
  createNotFoundHandler,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import type { ControlPlaneEnv } from "./env";

export const app = new Hono<ControlPlaneEnv>();

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

  const tenantId = createStableId({ prefix: "TEN" })
    .toLowerCase()
    .replace("ten-", "ten_");
  const envelope = createQueueEnvelope({
    type: "tenant.provision",
    version: 1,
    id: createStableId({ prefix: "JOB" }),
    idempotencyKey: `tenant:${parsed.data.preferredSlug}:provision`,
    payload: {
      tenantId,
      preferredSlug: parsed.data.preferredSlug,
      plan: parsed.data.plan,
    },
  });

  await c.env.TENANT_PROVISION_QUEUE.send(envelope);

  return jsonSuccess(
    c,
    {
      tenantId,
      status: "provisioning_pending",
      queuedJobId: envelope.id,
    },
    202,
  );
});

app.notFound(createNotFoundHandler<ControlPlaneEnv>());
app.onError(createErrorHandler<ControlPlaneEnv>());
