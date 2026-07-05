import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";

import { orderStatuses, transitionOrder } from "@tailoros/core";
import {
  createContactWithProfilesSchema,
  createMeasurementVersionSchema,
  createOrderSchema,
  createQueueEnvelope,
  recordPaymentSchema,
  searchTenantDomainQuerySchema,
  zodIssuesToFieldErrors,
} from "@tailoros/schemas";
import {
  createErrorHandler,
  createNotFoundHandler,
  getRequestId,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import {
  createContactWithProfilesService,
  createMeasurementVersionService,
  createOrderService,
  recordPaymentService,
  TenantDomainError,
  type TenantDomainRuntime,
} from "./domain-service";
import { D1TenantDomainRepository } from "./domain-store";
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

app.post("/v1/contacts", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = createContactWithProfilesSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Contact payload is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  try {
    const contact = await createContactWithProfilesService({
      repository: new D1TenantDomainRepository(c.env.TENANT_DB),
      data: parsed.data,
      runtime: getDomainRuntime(c),
    });

    return jsonSuccess(c, { contact }, 201);
  } catch (error) {
    if (error instanceof TenantDomainError) {
      return domainError(c, error);
    }

    throw error;
  }
});

app.post("/v1/measurements", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = createMeasurementVersionSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Measurement payload is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  try {
    const measurement = await createMeasurementVersionService({
      repository: new D1TenantDomainRepository(c.env.TENANT_DB),
      data: parsed.data,
      runtime: getDomainRuntime(c),
    });

    return jsonSuccess(c, { measurement }, 201);
  } catch (error) {
    if (error instanceof TenantDomainError) {
      return domainError(c, error);
    }

    throw error;
  }
});

app.post("/v1/orders", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Order payload is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  try {
    const order = await createOrderService({
      repository: new D1TenantDomainRepository(c.env.TENANT_DB),
      data: parsed.data,
      runtime: getDomainRuntime(c),
    });

    return jsonSuccess(c, { order }, 201);
  } catch (error) {
    if (error instanceof TenantDomainError) {
      return domainError(c, error);
    }

    throw error;
  }
});

app.post("/v1/orders/:orderId/payments", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = recordPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Payment payload is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  try {
    const payment = await recordPaymentService({
      repository: new D1TenantDomainRepository(c.env.TENANT_DB),
      orderId: c.req.param("orderId"),
      data: parsed.data,
      runtime: getDomainRuntime(c),
    });

    return jsonSuccess(c, { payment }, 201);
  } catch (error) {
    if (error instanceof TenantDomainError) {
      return domainError(c, error);
    }

    throw error;
  }
});

app.get("/v1/search", async (c) => {
  const parsed = searchTenantDomainQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return jsonError(c, {
      code: "VALIDATION_ERROR",
      message: "Search query is invalid.",
      status: 400,
      fields: zodIssuesToFieldErrors(parsed.error.issues),
    });
  }

  const results = await new D1TenantDomainRepository(c.env.TENANT_DB).search({
    query: parsed.data.q,
    limit: parsed.data.limit,
  });

  return jsonSuccess(c, { results });
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

function getDomainRuntime(c: Context<TenantApiEnv>): TenantDomainRuntime {
  const shopCode = c.req.header("x-shop-code")?.trim();

  return {
    requestId: getRequestId(c),
    ...(shopCode ? { shopCode } : {}),
  };
}

function domainError(c: Context<TenantApiEnv>, error: TenantDomainError) {
  return jsonError(c, {
    code: error.code,
    message: error.message,
    status: error.status,
    ...(error.fields ? { fields: error.fields } : {}),
  });
}
