import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";

import { orderStatuses, transitionOrder } from "@tailoros/core";
import {
  createContactWithProfilesSchema,
  createMeasurementVersionSchema,
  createOrderSchema,
  createTenantStaffMemberSchema,
  listCustomersQuerySchema,
  listMeasurementsQuerySchema,
  listOrdersQuerySchema,
  listPaymentsQuerySchema,
  productionTasksQuerySchema,
  recordPaymentSchema,
  reportTodayQuerySchema,
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
import {
  createStaffMember,
  getCustomer,
  getCustomerTimeline,
  getDashboard,
  getOrder,
  getReceipt,
  getSettings,
  getTodayReport,
  listAuditLogs,
  listCustomers,
  listMeasurementTemplates,
  listMeasurementVersions,
  listNotificationLogs,
  listOrders,
  listPayments,
  listProductionTasks,
  renderReceiptHtml,
  transitionOrderStatus,
  updateProductionTask,
} from "./read-models";

const transitionSchema = z
  .object({
    from: z.enum(orderStatuses),
    to: z.enum(orderStatuses),
    reason: z.string().trim().min(3).max(240).optional(),
  })
  .strict();

const persistTransitionSchema = z
  .object({
    to: z.enum(orderStatuses),
    reason: z.string().trim().min(3).max(240).optional(),
    actorUserId: z.string().trim().min(6).max(128).optional(),
  })
  .strict();

const updateProductionTaskSchema = z
  .object({
    taskStatus: z.enum([
      ...orderStatuses,
      "on_hold",
      "customer_delay",
      "material_shortage",
      "refunded",
    ]),
    assignedStaffUserId: z
      .string()
      .trim()
      .min(6)
      .max(128)
      .nullable()
      .optional(),
    delayReason: z.string().trim().min(3).max(500).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    actorUserId: z.string().trim().min(6).max(128).optional(),
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

app.get("/v1/dashboard", async (c) => {
  const parsed = reportTodayQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(c, "Dashboard query is invalid.", parsed.error);
  }

  const date = parsed.data.date ?? todayInIndia();
  const dashboard = await getDashboard({ db: c.env.TENANT_DB, date });
  return jsonSuccess(c, { dashboard });
});

app.get("/v1/customers/search", async (c) => {
  const parsed = listCustomersQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(
      c,
      "Customer search query is invalid.",
      parsed.error,
    );
  }

  const customers = await listCustomers({
    db: c.env.TENANT_DB,
    limit: parsed.data.limit,
    ...(parsed.data.q ? { query: parsed.data.q } : {}),
  });

  return jsonSuccess(c, { customers });
});

app.get("/v1/customers/:contactId", async (c) => {
  const customer = await getCustomer({
    db: c.env.TENANT_DB,
    contactId: c.req.param("contactId"),
  });

  if (!customer) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Customer contact was not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { customer });
});

app.get("/v1/customers/:contactId/timeline", async (c) => {
  const timeline = await getCustomerTimeline({
    db: c.env.TENANT_DB,
    contactId: c.req.param("contactId"),
    limit: 40,
  });

  return jsonSuccess(c, { timeline });
});

app.get("/v1/customers/:customerProfileId/measurements", async (c) => {
  const measurements = await listMeasurementVersions({
    db: c.env.TENANT_DB,
    customerProfileId: c.req.param("customerProfileId"),
    limit: 50,
  });

  return jsonSuccess(c, { measurements });
});

app.get("/v1/measurements/templates", async (c) => {
  const templates = await listMeasurementTemplates(c.env.TENANT_DB);
  return jsonSuccess(c, { templates });
});

app.get("/v1/measurements", async (c) => {
  const parsed = listMeasurementsQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(c, "Measurement query is invalid.", parsed.error);
  }

  const measurements = await listMeasurementVersions({
    db: c.env.TENANT_DB,
    limit: parsed.data.limit,
    ...(parsed.data.customerProfileId
      ? { customerProfileId: parsed.data.customerProfileId }
      : {}),
  });

  return jsonSuccess(c, { measurements });
});

app.get("/v1/orders", async (c) => {
  const parsed = listOrdersQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(c, "Order list query is invalid.", parsed.error);
  }

  const orders = await listOrders({
    db: c.env.TENANT_DB,
    limit: parsed.data.limit,
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.customerProfileId
      ? { customerProfileId: parsed.data.customerProfileId }
      : {}),
    ...(parsed.data.dueDate ? { dueDate: parsed.data.dueDate } : {}),
  });

  return jsonSuccess(c, { orders });
});

app.get("/v1/orders/:orderId", async (c) => {
  const order = await getOrder({
    db: c.env.TENANT_DB,
    orderId: c.req.param("orderId"),
  });

  if (!order) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Order was not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { order });
});

app.get("/v1/orders/:orderId/payments", async (c) => {
  const payments = await listPayments({
    db: c.env.TENANT_DB,
    orderId: c.req.param("orderId"),
    limit: 100,
  });

  return jsonSuccess(c, { payments });
});

app.post("/v1/orders/:orderId/status", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = persistTransitionSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(c, "Order status payload is invalid.", parsed.error);
  }

  const order = await transitionOrderStatus({
    db: c.env.TENANT_DB,
    orderId: c.req.param("orderId"),
    to: parsed.data.to,
    runtime: getDomainRuntime(c),
    actorUserId: getActorUserId(c, parsed.data.actorUserId),
    ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
  });

  if (!order) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Order was not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { order });
});

app.get("/v1/payments", async (c) => {
  const parsed = listPaymentsQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(c, "Payment query is invalid.", parsed.error);
  }

  const payments = await listPayments({
    db: c.env.TENANT_DB,
    limit: parsed.data.limit,
    ...(parsed.data.orderId ? { orderId: parsed.data.orderId } : {}),
    ...(parsed.data.date ? { date: parsed.data.date } : {}),
  });

  return jsonSuccess(c, { payments });
});

app.get("/v1/production/tasks", async (c) => {
  const parsed = productionTasksQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(
      c,
      "Production task query is invalid.",
      parsed.error,
    );
  }

  const tasks = await listProductionTasks({
    db: c.env.TENANT_DB,
    limit: parsed.data.limit,
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.assignedStaffUserId
      ? { assignedStaffUserId: parsed.data.assignedStaffUserId }
      : {}),
    ...(parsed.data.dueDate ? { dueDate: parsed.data.dueDate } : {}),
  });

  return jsonSuccess(c, { tasks });
});

app.patch("/v1/production/tasks/:taskId", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = updateProductionTaskSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(
      c,
      "Production task payload is invalid.",
      parsed.error,
    );
  }

  const task = await updateProductionTask({
    db: c.env.TENANT_DB,
    taskId: c.req.param("taskId"),
    taskStatus: parsed.data.taskStatus,
    runtime: getDomainRuntime(c),
    actorUserId: getActorUserId(c, parsed.data.actorUserId),
    ...(parsed.data.assignedStaffUserId !== undefined
      ? { assignedStaffUserId: parsed.data.assignedStaffUserId }
      : {}),
    ...(parsed.data.delayReason !== undefined
      ? { delayReason: parsed.data.delayReason }
      : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
  });

  if (!task) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Production task was not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { task });
});

app.get("/v1/reports/today", async (c) => {
  const parsed = reportTodayQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return validationError(c, "Report query is invalid.", parsed.error);
  }

  const report = await getTodayReport({
    db: c.env.TENANT_DB,
    date: parsed.data.date ?? todayInIndia(),
  });

  return jsonSuccess(c, { report });
});

app.get("/v1/settings", async (c) => {
  const settings = await getSettings(c.env.TENANT_DB);
  return jsonSuccess(c, { settings });
});

app.post("/v1/staff", async (c) => {
  const body = (await c.req.json().catch(() => null)) as unknown;
  const parsed = createTenantStaffMemberSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(c, "Staff payload is invalid.", parsed.error);
  }

  const staff = await createStaffMember({
    db: c.env.TENANT_DB,
    displayName: parsed.data.displayName,
    role: parsed.data.role,
    status: parsed.data.status,
    ...(parsed.data.email ? { email: parsed.data.email } : {}),
    ...(parsed.data.mobileE164 ? { mobileE164: parsed.data.mobileE164 } : {}),
    ...(parsed.data.userId ? { userId: parsed.data.userId } : {}),
  });

  return jsonSuccess(c, { staff }, 201);
});

app.get("/v1/notifications", async (c) => {
  const logs = await listNotificationLogs({
    db: c.env.TENANT_DB,
    limit: 50,
    failuresOnly: c.req.query("failures") === "true",
  });

  return jsonSuccess(c, { logs });
});

app.get("/v1/audit-logs", async (c) => {
  const logs = await listAuditLogs({
    db: c.env.TENANT_DB,
    limit: 50,
  });

  return jsonSuccess(c, { logs });
});

app.get("/v1/receipts/:receiptId", async (c) => {
  const receipt = await getReceipt({
    db: c.env.TENANT_DB,
    receiptId: c.req.param("receiptId"),
  });

  if (!receipt) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Receipt was not found.",
      status: 404,
    });
  }

  return jsonSuccess(c, { receipt });
});

app.get("/v1/receipts/:receiptId/print", async (c) => {
  const html = await renderReceiptHtml({
    db: c.env.TENANT_DB,
    receiptId: c.req.param("receiptId"),
  });

  if (!html) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Receipt was not found.",
      status: 404,
    });
  }

  return c.body(html, 200, { "content-type": "text/html; charset=utf-8" });
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

  const search = await new D1TenantDomainRepository(c.env.TENANT_DB).search({
    query: parsed.data.q,
    limit: parsed.data.limit,
  });

  return jsonSuccess(c, search);
});

app.post("/v1/orders/:orderId/notification-outbox", (c) =>
  jsonError(c, {
    code: "SERVICE_UNAVAILABLE",
    message:
      "Tenant APIs must call the WhatsApp connector internal send API with a signed service token and full template payload; direct queue writes are disabled.",
    status: 503,
  }),
);

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

function validationError(
  c: Context<TenantApiEnv>,
  message: string,
  error: z.ZodError,
) {
  return jsonError(c, {
    code: "VALIDATION_ERROR",
    message,
    status: 400,
    fields: zodIssuesToFieldErrors(error.issues),
  });
}

function getActorUserId(c: Context<TenantApiEnv>, fallback?: string) {
  return (
    c.req.header("x-tailoros-user-id")?.trim() ||
    fallback?.trim() ||
    "usr_system_01"
  );
}

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).format(new Date());
}
