import { Hono } from "hono";
import { z } from "zod";

import { orderStatuses, transitionOrder } from "@tailoros/core";
import { createQueueEnvelope, zodIssuesToFieldErrors } from "@tailoros/schemas";
import {
  createErrorHandler,
  createNotFoundHandler,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import type { TenantApiEnv } from "./env";

const transitionSchema = z
  .object({
    from: z.enum(orderStatuses),
    to: z.enum(orderStatuses),
    reason: z.string().trim().min(3).max(240).optional(),
  })
  .strict();

export const app = new Hono<TenantApiEnv>();

app.use("*", requestIdMiddleware());

app.get("/health", (c) =>
  jsonSuccess(c, {
    service: "tenant-api-template",
    boundary: "tenant-plane",
    status: "ok",
  }),
);

app.get("/internal/tenants/:slug/health", (c) =>
  jsonSuccess(c, {
    service: "tenant-api-template",
    tenantSlug: c.req.param("slug"),
    status: "ok",
  }),
);

app.post("/v1/orders/transition-preview", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = transitionSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Order transition payload is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const nextStatus = transitionOrder({
    from: parsed.data.from,
    to: parsed.data.to,
    ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
  });
  return jsonSuccess(c, { nextStatus });
});

app.post("/v1/orders/:orderId/notification-outbox", async (c) => {
  const orderId = c.req.param("orderId");
  const envelope = createQueueEnvelope({
    type: "whatsapp.send-template",
    version: 1,
    id: `JOB-${orderId.toUpperCase().slice(0, 24)}`,
    idempotencyKey: `order:${orderId}:notification`,
    payload: { orderId },
  });

  await c.env.WHATSAPP_SEND_QUEUE.send(envelope);
  return jsonSuccess(c, { queuedJobId: envelope.id }, 202);
});

app.notFound(createNotFoundHandler<TenantApiEnv>());
app.onError(createErrorHandler<TenantApiEnv>());
