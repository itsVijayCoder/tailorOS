import {
  normalizeIndianMobile,
  normalizeSearchText,
  transitionOrder,
} from "@tailoros/core";
import {
  auditLogReadSchema,
  customerContactReadSchema,
  customerTimelineEventSchema,
  measurementTemplateReadSchema,
  measurementVersionReadSchema,
  notificationLogReadSchema,
  orderReadSchema,
  productionTaskReadSchema,
  receiptReadSchema,
  tenantDashboardReadSchema,
  tenantSettingsReadSchema,
  todayReportReadSchema,
  type AuditLogRead,
  type CustomerContactRead,
  type CustomerTimelineEvent,
  type MeasurementTemplateRead,
  type MeasurementVersionRead,
  type NotificationLogRead,
  type OrderRead,
  type ProductionTaskRead,
  type ReceiptRead,
  type TenantDashboardRead,
  type TenantSettingsRead,
  type TodayReportRead,
} from "@tailoros/schemas";

import type { TenantDomainRuntime } from "./domain-service";

type CustomerRow = {
  contactId: string;
  primaryMobileE164: string;
  primaryMobileNational: string;
  whatsappMobileE164: string | null;
  whatsappOptIn: number;
  addressJson: string | null;
  notes: string | null;
  contactCreatedAt: string;
  contactUpdatedAt: string;
  profileId: string | null;
  customerCode: string | null;
  fullName: string | null;
  relationLabel: string | null;
  genderContext: string | null;
  activeOrders: number | null;
  latestMeasurementAt: string | null;
};

type TemplateRow = {
  code: string;
  displayName: string;
  measurementSchemaJson: string;
  defaultExpectedDays: number;
  defaultPricePaise: number;
  isActive: number;
  updatedAt: string;
};

type MeasurementVersionRow = {
  measurementProfileId: string;
  measurementVersionId: string;
  customerProfileId: string;
  customerCode: string;
  customerName: string;
  garmentTypeCode: string;
  displayName: string;
  versionNo: number;
  valuesJson: string;
  unit: "inch" | "cm";
  fitNotes: string | null;
  reason: string;
  capturedByUserId: string;
  capturedAt: string;
};

type OrderRow = {
  orderId: string;
  orderCode: string;
  contactId: string;
  customerProfileId: string;
  customerCode: string;
  customerName: string;
  primaryMobileE164: string;
  currentStatus: OrderRead["currentStatus"];
  orderDate: string;
  trialDate: string | null;
  promisedDeliveryDate: string | null;
  subtotalPaise: number;
  discountPaise: number;
  finalTotalPaise: number;
  balanceDuePaise: number;
  notes: string | null;
  createdByUserId: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItemRow = {
  id: string;
  itemCode: string;
  garmentTypeCode: string;
  garmentDisplayName: string;
  quantity: number;
  itemStatus: OrderRead["items"][number]["itemStatus"];
  pricePaise: number;
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  promisedDeliveryDate: string | null;
  notes: string | null;
  measurementSnapshotId: string | null;
  sourceMeasurementVersionId: string | null;
  measurementValuesJson: string | null;
  measurementOverrideJson: string | null;
};

type PaymentRow = {
  id: string;
  paymentCode: string;
  orderId: string;
  amountPaise: number;
  mode: OrderRead["payments"][number]["mode"];
  kind: OrderRead["payments"][number]["kind"];
  reference: string | null;
  reason: string | null;
  recordedByUserId: string;
  recordedByName: string | null;
  recordedAt: string;
};

type ReceiptRow = {
  id: string;
  receiptCode: string;
  orderId: string;
  status: ReceiptRead["status"];
  paidPaise: number;
  balanceDuePaise: number;
  issuedByUserId: string;
  issuedAt: string;
  updatedAt: string;
};

type ProductionTaskRow = {
  id: string;
  orderItemId: string;
  orderId: string;
  orderCode: string;
  itemCode: string;
  customerName: string;
  garmentTypeCode: string;
  garmentDisplayName: string;
  taskStatus: ProductionTaskRead["taskStatus"];
  assignedStaffUserId: string | null;
  assignedStaffName: string | null;
  dueDate: string | null;
  delayReason: string | null;
  notes: string | null;
  updatedAt: string;
};

type NotificationRow = {
  id: string;
  orderId: string | null;
  customerProfileId: string | null;
  contactId: string | null;
  eventType: string;
  recipientMobileE164: string | null;
  templatePurpose: string | null;
  status: NotificationLogRead["status"];
  failureReason: string | null;
  connectorMessageId: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditRow = {
  id: string;
  actorType: AuditLogRead["actorType"];
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  requestId: string;
  createdAt: string;
};

type StaffRow = {
  userId: string;
  displayName: string;
  email: string | null;
  mobileE164: string | null;
  role: TenantSettingsRead["staff"][number]["role"];
  status: TenantSettingsRead["staff"][number]["status"];
  createdAt: string;
  updatedAt: string;
};

const closedOrderStatuses = ["delivered", "closed", "cancelled"] as const;
const closedStatusSql = closedOrderStatuses
  .map((status) => `'${status}'`)
  .join(", ");

export async function listCustomers(input: {
  db: D1Database;
  query?: string;
  limit: number;
}): Promise<CustomerContactRead[]> {
  const query = input.query?.trim();
  const filters: string[] = ["p.is_active = 1"];
  const values: unknown[] = [];

  if (query) {
    const normalizedName = `%${normalizeSearchText(query)}%`;
    let mobile: string | null = null;

    try {
      mobile = normalizeIndianMobile(query).e164;
    } catch {
      mobile = null;
    }

    filters.push(`(
      c.primary_mobile_e164 LIKE ?
      OR c.primary_mobile_national LIKE ?
      OR p.search_name LIKE ?
      OR p.customer_code LIKE ?
      OR p.full_name LIKE ?
    )`);
    values.push(
      `${mobile ?? query}%`,
      `%${query.replace(/\D/g, "")}%`,
      normalizedName,
      `${query}%`,
      `%${query}%`,
    );
  }

  values.push(input.limit);

  const rows = await input.db
    .prepare(
      `${customerSelect}
      WHERE ${filters.join(" AND ")}
      ORDER BY c.updated_at DESC, p.created_at ASC
      LIMIT ?`,
    )
    .bind(...values)
    .all<CustomerRow>();

  return parseCustomerRows(rows.results);
}

export async function getCustomer(input: {
  db: D1Database;
  contactId: string;
}): Promise<CustomerContactRead | null> {
  const rows = await input.db
    .prepare(
      `${customerSelect}
      WHERE c.id = ? AND p.is_active = 1
      ORDER BY p.created_at ASC`,
    )
    .bind(input.contactId)
    .all<CustomerRow>();

  return parseCustomerRows(rows.results)[0] ?? null;
}

export async function getCustomerTimeline(input: {
  db: D1Database;
  contactId: string;
  limit: number;
}): Promise<CustomerTimelineEvent[]> {
  const rows = await input.db
    .prepare(
      `SELECT id, type, title, detail, occurredAt, entityId
      FROM (
        SELECT
          o.id AS id,
          'order' AS type,
          o.order_code AS title,
          o.current_status AS detail,
          o.created_at AS occurredAt,
          o.id AS entityId
        FROM orders o
        WHERE o.contact_id = ?
        UNION ALL
        SELECT
          mv.id AS id,
          'measurement' AS type,
          gt.display_name || ' v' || mv.version_no AS title,
          mv.reason AS detail,
          mv.captured_at AS occurredAt,
          mv.id AS entityId
        FROM measurement_versions mv
        INNER JOIN measurement_profiles mp ON mp.id = mv.measurement_profile_id
        INNER JOIN garment_types gt ON gt.code = mp.garment_type_code
        INNER JOIN customer_profiles p ON p.id = mp.customer_profile_id
        WHERE p.contact_id = ?
        UNION ALL
        SELECT
          pay.id AS id,
          'payment' AS type,
          pay.payment_code AS title,
          pay.kind || ' ' || pay.amount_paise AS detail,
          pay.recorded_at AS occurredAt,
          pay.id AS entityId
        FROM payments pay
        INNER JOIN orders o ON o.id = pay.order_id
        WHERE o.contact_id = ?
        UNION ALL
        SELECT
          n.id AS id,
          'notification' AS type,
          n.event_type AS title,
          COALESCE(n.failure_reason, n.status) AS detail,
          n.created_at AS occurredAt,
          n.id AS entityId
        FROM notification_logs n
        WHERE n.contact_id = ?
      )
      ORDER BY occurredAt DESC
      LIMIT ?`,
    )
    .bind(
      input.contactId,
      input.contactId,
      input.contactId,
      input.contactId,
      input.limit,
    )
    .all<{
      id: string;
      type: CustomerTimelineEvent["type"];
      title: string;
      detail: string | null;
      occurredAt: string;
      entityId: string;
    }>();

  return rows.results.map((row) => customerTimelineEventSchema.parse(row));
}

export async function listMeasurementTemplates(
  db: D1Database,
): Promise<MeasurementTemplateRead[]> {
  const rows = await db
    .prepare(
      `SELECT
        code,
        display_name AS displayName,
        measurement_schema_json AS measurementSchemaJson,
        default_expected_days AS defaultExpectedDays,
        default_price_paise AS defaultPricePaise,
        is_active AS isActive,
        updated_at AS updatedAt
      FROM garment_types
      ORDER BY is_active DESC, display_name ASC`,
    )
    .all<TemplateRow>();

  return rows.results.map(parseTemplateRow);
}

export async function listMeasurementVersions(input: {
  db: D1Database;
  customerProfileId?: string;
  limit: number;
}): Promise<MeasurementVersionRead[]> {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (input.customerProfileId) {
    filters.push("mp.customer_profile_id = ?");
    values.push(input.customerProfileId);
  }

  values.push(input.limit);

  const rows = await input.db
    .prepare(
      `SELECT
        mp.id AS measurementProfileId,
        mv.id AS measurementVersionId,
        mp.customer_profile_id AS customerProfileId,
        p.customer_code AS customerCode,
        p.full_name AS customerName,
        mp.garment_type_code AS garmentTypeCode,
        mp.display_name AS displayName,
        mv.version_no AS versionNo,
        mv.values_json AS valuesJson,
        mv.unit AS unit,
        mv.fit_notes AS fitNotes,
        mv.reason AS reason,
        mv.captured_by_user_id AS capturedByUserId,
        mv.captured_at AS capturedAt
      FROM measurement_versions mv
      INNER JOIN measurement_profiles mp ON mp.id = mv.measurement_profile_id
      INNER JOIN customer_profiles p ON p.id = mp.customer_profile_id
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY mv.captured_at DESC
      LIMIT ?`,
    )
    .bind(...values)
    .all<MeasurementVersionRow>();

  return rows.results.map(parseMeasurementVersionRow);
}

export async function listOrders(input: {
  db: D1Database;
  status?: OrderRead["currentStatus"];
  customerProfileId?: string;
  dueDate?: string;
  limit: number;
}): Promise<OrderRead[]> {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (input.status) {
    filters.push("o.current_status = ?");
    values.push(input.status);
  }

  if (input.customerProfileId) {
    filters.push("o.customer_profile_id = ?");
    values.push(input.customerProfileId);
  }

  if (input.dueDate) {
    filters.push("o.promised_delivery_date = ?");
    values.push(input.dueDate);
  }

  values.push(input.limit);

  const rows = await input.db
    .prepare(
      `${orderSelect}
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY o.promised_delivery_date ASC, o.updated_at DESC
      LIMIT ?`,
    )
    .bind(...values)
    .all<OrderRow>();

  const orders = await Promise.all(
    rows.results.map((row) => hydrateOrder(input.db, row)),
  );

  return orders;
}

export async function getOrder(input: {
  db: D1Database;
  orderId: string;
}): Promise<OrderRead | null> {
  const row = await input.db
    .prepare(`${orderSelect} WHERE o.id = ? LIMIT 1`)
    .bind(input.orderId)
    .first<OrderRow>();

  return row ? hydrateOrder(input.db, row) : null;
}

export async function listPayments(input: {
  db: D1Database;
  orderId?: string;
  date?: string;
  limit: number;
}): Promise<PaymentRow[]> {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (input.orderId) {
    filters.push("pay.order_id = ?");
    values.push(input.orderId);
  }

  if (input.date) {
    filters.push("substr(pay.recorded_at, 1, 10) = ?");
    values.push(input.date);
  }

  values.push(input.limit);

  const rows = await input.db
    .prepare(
      `${paymentSelect}
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY pay.recorded_at DESC
      LIMIT ?`,
    )
    .bind(...values)
    .all<PaymentRow>();

  return rows.results;
}

export async function listProductionTasks(input: {
  db: D1Database;
  status?: ProductionTaskRead["taskStatus"];
  assignedStaffUserId?: string;
  dueDate?: string;
  limit: number;
}): Promise<ProductionTaskRead[]> {
  const filters: string[] = [];
  const values: unknown[] = [];

  if (input.status) {
    filters.push("pt.task_status = ?");
    values.push(input.status);
  }

  if (input.assignedStaffUserId) {
    filters.push("pt.assigned_staff_user_id = ?");
    values.push(input.assignedStaffUserId);
  }

  if (input.dueDate) {
    filters.push("pt.due_date = ?");
    values.push(input.dueDate);
  }

  values.push(input.limit);

  const rows = await input.db
    .prepare(
      `${productionTaskSelect}
      ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
      ORDER BY pt.due_date ASC, pt.updated_at DESC
      LIMIT ?`,
    )
    .bind(...values)
    .all<ProductionTaskRow>();

  return rows.results.map((row) => productionTaskReadSchema.parse(row));
}

export async function listNotificationLogs(input: {
  db: D1Database;
  limit: number;
  failuresOnly?: boolean;
}): Promise<NotificationLogRead[]> {
  const rows = await input.db
    .prepare(
      `${notificationSelect}
      ${input.failuresOnly ? "WHERE status IN ('failed', 'blocked', 'opted_out')" : ""}
      ORDER BY created_at DESC
      LIMIT ?`,
    )
    .bind(input.limit)
    .all<NotificationRow>();

  return rows.results.map((row) => notificationLogReadSchema.parse(row));
}

export async function listAuditLogs(input: {
  db: D1Database;
  limit: number;
}): Promise<AuditLogRead[]> {
  const rows = await input.db
    .prepare(
      `SELECT
        a.id AS id,
        a.actor_type AS actorType,
        a.actor_user_id AS actorUserId,
        sp.display_name AS actorName,
        a.action AS action,
        a.entity_type AS entityType,
        a.entity_id AS entityId,
        a.reason AS reason,
        a.request_id AS requestId,
        a.created_at AS createdAt
      FROM audit_logs a
      LEFT JOIN staff_profiles sp ON sp.user_id = a.actor_user_id
      ORDER BY a.created_at DESC
      LIMIT ?`,
    )
    .bind(input.limit)
    .all<AuditRow>();

  return rows.results.map((row) => auditLogReadSchema.parse(row));
}

export async function getReceipt(input: {
  db: D1Database;
  receiptId: string;
}): Promise<ReceiptRead | null> {
  const row = await input.db
    .prepare(`${receiptSelect} WHERE r.id = ? LIMIT 1`)
    .bind(input.receiptId)
    .first<ReceiptRow>();

  return row ? receiptReadSchema.parse(row) : null;
}

export async function getTodayReport(input: {
  db: D1Database;
  date: string;
}): Promise<TodayReportRead> {
  const [
    dueToday,
    overdue,
    ready,
    active,
    payments,
    corrections,
    whatsappBlocked,
    pendingOutbox,
    partialDelivery,
  ] = await Promise.all([
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM orders
      WHERE promised_delivery_date = ?
        AND current_status NOT IN (${closedStatusSql})`,
      [input.date],
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM orders
      WHERE promised_delivery_date < ?
        AND current_status NOT IN (${closedStatusSql})`,
      [input.date],
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM order_items
      WHERE item_status = 'ready_for_pickup'`,
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM orders
      WHERE current_status NOT IN (${closedStatusSql})`,
    ),
    input.db
      .prepare(
        `SELECT
          COALESCE(SUM(CASE
            WHEN kind IN ('advance', 'balance') THEN amount_paise
            WHEN kind IN ('refund', 'correction') THEN amount_paise
            ELSE 0
          END), 0) AS collectedPaise
        FROM payments
        WHERE substr(recorded_at, 1, 10) = ?`,
      )
      .bind(input.date)
      .first<{ collectedPaise: number }>(),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM payments
      WHERE kind IN ('refund', 'correction')
        AND substr(recorded_at, 1, 10) = ?`,
      [input.date],
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM notification_logs
      WHERE status IN ('failed', 'blocked', 'opted_out')`,
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM outbox_events
      WHERE status = 'pending'`,
    ),
    countFirst(
      input.db,
      `SELECT COUNT(*) AS count
      FROM (
        SELECT order_id
        FROM order_items
        GROUP BY order_id
        HAVING SUM(CASE WHEN item_status = 'ready_for_pickup' THEN 1 ELSE 0 END) > 0
          AND SUM(CASE WHEN item_status <> 'ready_for_pickup' THEN 1 ELSE 0 END) > 0
      )`,
    ),
  ]);

  const balance = await input.db
    .prepare(
      `SELECT COALESCE(SUM(balance_due_paise), 0) AS balanceDuePaise
      FROM orders
      WHERE current_status NOT IN (${closedStatusSql})`,
    )
    .first<{ balanceDuePaise: number }>();

  return todayReportReadSchema.parse({
    date: input.date,
    dueTodayCount: dueToday,
    overdueCount: overdue,
    readyForPickupCount: ready,
    activeOrderCount: active,
    partialDeliveryCount: partialDelivery,
    collectedPaise: Math.max(payments?.collectedPaise ?? 0, 0),
    balanceDuePaise: balance?.balanceDuePaise ?? 0,
    correctionCount: corrections,
    whatsappBlockedCount: whatsappBlocked,
    pendingOutboxCount: pendingOutbox,
  });
}

export async function getSettings(db: D1Database): Promise<TenantSettingsRead> {
  const [garmentTemplates, staffRows, brandingRow] = await Promise.all([
    listMeasurementTemplates(db),
    db
      .prepare(
        `SELECT
          user_id AS userId,
          display_name AS displayName,
          email,
          mobile_e164 AS mobileE164,
          role,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM staff_profiles
        ORDER BY status ASC, role ASC, display_name ASC`,
      )
      .all<StaffRow>(),
    db
      .prepare(
        `SELECT value_json AS valueJson
        FROM tenant_settings
        WHERE key = 'receipt_branding'
        LIMIT 1`,
      )
      .first<{ valueJson: string }>(),
  ]);

  const receiptBranding = parseJsonRecord(brandingRow?.valueJson ?? "{}");

  return tenantSettingsReadSchema.parse({
    garmentTemplates,
    staff: staffRows.results,
    receiptBranding: {
      shopName:
        typeof receiptBranding.shopName === "string"
          ? receiptBranding.shopName
          : "TailorOS Shop",
      city:
        typeof receiptBranding.city === "string" ? receiptBranding.city : null,
      footerNote:
        typeof receiptBranding.footerNote === "string"
          ? receiptBranding.footerNote
          : null,
    },
  });
}

export async function getDashboard(input: {
  db: D1Database;
  date: string;
}): Promise<TenantDashboardRead> {
  const [
    report,
    ordersDueToday,
    productionTasks,
    paymentDueOrders,
    notificationFailures,
  ] = await Promise.all([
    getTodayReport(input),
    listOrders({ db: input.db, dueDate: input.date, limit: 12 }),
    listProductionTasks({ db: input.db, limit: 12 }),
    listOrders({ db: input.db, limit: 12 }),
    listNotificationLogs({
      db: input.db,
      limit: 8,
      failuresOnly: true,
    }),
  ]);

  return tenantDashboardReadSchema.parse({
    report,
    ordersDueToday,
    productionTasks: productionTasks.filter((task) => task.delayReason),
    paymentDueOrders: paymentDueOrders.filter(
      (order) => order.balanceDuePaise > 0,
    ),
    notificationFailures,
  });
}

export async function transitionOrderStatus(input: {
  db: D1Database;
  orderId: string;
  to: OrderRead["currentStatus"];
  reason?: string;
  runtime: TenantDomainRuntime;
  actorUserId: string;
}) {
  const current = await getOrder({ db: input.db, orderId: input.orderId });

  if (!current) {
    return null;
  }

  const nextStatus = transitionOrder({
    from: current.currentStatus,
    to: input.to,
    ...(input.reason ? { reason: input.reason } : {}),
  });
  const now = toIso(input.runtime.now);

  await input.db.batch([
    input.db
      .prepare(
        `UPDATE orders
        SET current_status = ?,
            updated_at = ?
        WHERE id = ?`,
      )
      .bind(nextStatus, now, input.orderId),
    input.db
      .prepare(
        `UPDATE search_projection
        SET status = ?,
            updated_at = ?
        WHERE entity_type = 'order' AND entity_id = ?`,
      )
      .bind(nextStatus, now, input.orderId),
    input.db
      .prepare(
        `INSERT INTO audit_logs (
          id,
          actor_type,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          reason,
          before_json,
          after_json,
          request_id,
          created_at
        ) VALUES (?, 'user', ?, 'order.status_changed', 'order', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        createLocalId("AUD"),
        input.actorUserId,
        input.orderId,
        input.reason ?? null,
        JSON.stringify({ currentStatus: current.currentStatus }),
        JSON.stringify({ currentStatus: nextStatus }),
        input.runtime.requestId,
        now,
      ),
    input.db
      .prepare(
        `INSERT INTO outbox_events (
          id,
          event_type,
          aggregate_type,
          aggregate_id,
          idempotency_key,
          payload_json,
          status,
          created_at,
          processed_at
        ) VALUES (?, ?, 'order', ?, ?, ?, 'pending', ?, NULL)`,
      )
      .bind(
        createLocalId("OUT"),
        nextStatus === "ready_for_pickup"
          ? "ORDER_READY_FOR_PICKUP"
          : "ORDER_STATUS_CHANGED",
        input.orderId,
        `ORDER_STATUS_CHANGED:${input.orderId}:${input.runtime.requestId}`,
        JSON.stringify({
          orderId: input.orderId,
          from: current.currentStatus,
          to: nextStatus,
          requestId: input.runtime.requestId,
        }),
        now,
      ),
  ]);

  return getOrder({ db: input.db, orderId: input.orderId });
}

export async function updateProductionTask(input: {
  db: D1Database;
  taskId: string;
  taskStatus: ProductionTaskRead["taskStatus"];
  assignedStaffUserId?: string | null;
  delayReason?: string | null;
  notes?: string | null;
  runtime: TenantDomainRuntime;
  actorUserId: string;
}): Promise<ProductionTaskRead | null> {
  const existing = await input.db
    .prepare(`${productionTaskSelect} WHERE pt.id = ? LIMIT 1`)
    .bind(input.taskId)
    .first<ProductionTaskRow>();

  if (!existing) {
    return null;
  }

  const now = toIso(input.runtime.now);

  await input.db.batch([
    input.db
      .prepare(
        `UPDATE production_tasks
        SET task_status = ?,
            assigned_staff_user_id = COALESCE(?, assigned_staff_user_id),
            delay_reason = ?,
            notes = ?,
            updated_at = ?
        WHERE id = ?`,
      )
      .bind(
        input.taskStatus,
        input.assignedStaffUserId ?? null,
        input.delayReason ?? null,
        input.notes ?? null,
        now,
        input.taskId,
      ),
    input.db
      .prepare(
        `UPDATE order_items
        SET item_status = ?,
            assigned_staff_user_id = COALESCE(?, assigned_staff_user_id),
            notes = ?,
            updated_at = ?
        WHERE id = ?`,
      )
      .bind(
        input.taskStatus,
        input.assignedStaffUserId ?? null,
        input.notes ?? existing.notes,
        now,
        existing.orderItemId,
      ),
    input.db
      .prepare(
        `INSERT INTO audit_logs (
          id,
          actor_type,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          reason,
          before_json,
          after_json,
          request_id,
          created_at
        ) VALUES (?, 'user', ?, 'production.task_updated', 'production_task', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        createLocalId("AUD"),
        input.actorUserId,
        input.taskId,
        input.delayReason ?? null,
        JSON.stringify({ taskStatus: existing.taskStatus }),
        JSON.stringify({ taskStatus: input.taskStatus }),
        input.runtime.requestId,
        now,
      ),
  ]);

  const updated = await input.db
    .prepare(`${productionTaskSelect} WHERE pt.id = ? LIMIT 1`)
    .bind(input.taskId)
    .first<ProductionTaskRow>();

  return updated ? productionTaskReadSchema.parse(updated) : null;
}

export async function renderReceiptHtml(input: {
  db: D1Database;
  receiptId: string;
}): Promise<string | null> {
  const receipt = await getReceipt(input);
  if (!receipt) {
    return null;
  }

  const order = await getOrder({ db: input.db, orderId: receipt.orderId });
  if (!order) {
    return null;
  }

  const settings = await getSettings(input.db);
  const rows = order.items
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.garmentDisplayName)}</td>
        <td>${item.quantity}</td>
        <td>${formatPaise(item.pricePaise)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(receipt.receiptCode)}</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 32px; color: #111827; }
      h1 { margin: 0; font-size: 28px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 0; text-align: left; }
      .meta, .footer { color: #4b5563; }
      .totals { margin-top: 24px; display: grid; gap: 8px; max-width: 320px; margin-left: auto; }
      .line { display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(settings.receiptBranding.shopName)}</h1>
    <p class="meta">${escapeHtml(settings.receiptBranding.city ?? "")}</p>
    <h2>Receipt ${escapeHtml(receipt.receiptCode)}</h2>
    <p>${escapeHtml(order.customerName)} · ${escapeHtml(order.orderCode)}</p>
    <table>
      <thead><tr><th>Garment</th><th>Qty</th><th>Price</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="line"><span>Total</span><strong>${formatPaise(order.finalTotalPaise)}</strong></div>
      <div class="line"><span>Paid</span><strong>${formatPaise(receipt.paidPaise)}</strong></div>
      <div class="line"><span>Balance</span><strong>${formatPaise(receipt.balanceDuePaise)}</strong></div>
    </div>
    <p class="footer">${escapeHtml(settings.receiptBranding.footerNote ?? "")}</p>
  </body>
</html>`;
}

const customerSelect = `SELECT
  c.id AS contactId,
  c.primary_mobile_e164 AS primaryMobileE164,
  c.primary_mobile_national AS primaryMobileNational,
  c.whatsapp_mobile_e164 AS whatsappMobileE164,
  c.whatsapp_opt_in AS whatsappOptIn,
  c.address_json AS addressJson,
  c.notes AS notes,
  c.created_at AS contactCreatedAt,
  c.updated_at AS contactUpdatedAt,
  p.id AS profileId,
  p.customer_code AS customerCode,
  p.full_name AS fullName,
  p.relation_label AS relationLabel,
  p.gender_context AS genderContext,
  (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.customer_profile_id = p.id
      AND o.current_status NOT IN (${closedStatusSql})
  ) AS activeOrders,
  (
    SELECT MAX(mv.captured_at)
    FROM measurement_profiles mp
    INNER JOIN measurement_versions mv ON mv.measurement_profile_id = mp.id
    WHERE mp.customer_profile_id = p.id
  ) AS latestMeasurementAt
FROM customer_contacts c
LEFT JOIN customer_profiles p ON p.contact_id = c.id`;

const orderSelect = `SELECT
  o.id AS orderId,
  o.order_code AS orderCode,
  o.contact_id AS contactId,
  o.customer_profile_id AS customerProfileId,
  p.customer_code AS customerCode,
  p.full_name AS customerName,
  c.primary_mobile_e164 AS primaryMobileE164,
  o.current_status AS currentStatus,
  o.order_date AS orderDate,
  o.trial_date AS trialDate,
  o.promised_delivery_date AS promisedDeliveryDate,
  o.subtotal_paise AS subtotalPaise,
  o.discount_paise AS discountPaise,
  o.final_total_paise AS finalTotalPaise,
  o.balance_due_paise AS balanceDuePaise,
  o.notes AS notes,
  o.created_by_user_id AS createdByUserId,
  sp.display_name AS createdByName,
  o.created_at AS createdAt,
  o.updated_at AS updatedAt
FROM orders o
INNER JOIN customer_profiles p ON p.id = o.customer_profile_id
INNER JOIN customer_contacts c ON c.id = o.contact_id
LEFT JOIN staff_profiles sp ON sp.user_id = o.created_by_user_id`;

const itemSelect = `SELECT
  i.id AS id,
  i.item_code AS itemCode,
  i.garment_type_code AS garmentTypeCode,
  gt.display_name AS garmentDisplayName,
  i.quantity AS quantity,
  i.item_status AS itemStatus,
  i.price_paise AS pricePaise,
  i.assigned_staff_user_id AS assignedStaffUserId,
  staff.display_name AS assignedStaffName,
  i.promised_delivery_date AS promisedDeliveryDate,
  i.notes AS notes,
  s.id AS measurementSnapshotId,
  s.source_measurement_version_id AS sourceMeasurementVersionId,
  s.values_json AS measurementValuesJson,
  s.override_json AS measurementOverrideJson
FROM order_items i
INNER JOIN garment_types gt ON gt.code = i.garment_type_code
LEFT JOIN staff_profiles staff ON staff.user_id = i.assigned_staff_user_id
LEFT JOIN order_measurement_snapshots s ON s.order_item_id = i.id`;

const paymentSelect = `SELECT
  pay.id AS id,
  pay.payment_code AS paymentCode,
  pay.order_id AS orderId,
  pay.amount_paise AS amountPaise,
  pay.mode AS mode,
  pay.kind AS kind,
  pay.reference AS reference,
  pay.reason AS reason,
  pay.recorded_by_user_id AS recordedByUserId,
  staff.display_name AS recordedByName,
  pay.recorded_at AS recordedAt
FROM payments pay
LEFT JOIN staff_profiles staff ON staff.user_id = pay.recorded_by_user_id`;

const receiptSelect = `SELECT
  r.id AS id,
  r.receipt_code AS receiptCode,
  r.order_id AS orderId,
  r.status AS status,
  r.paid_paise AS paidPaise,
  r.balance_due_paise AS balanceDuePaise,
  r.issued_by_user_id AS issuedByUserId,
  r.issued_at AS issuedAt,
  r.updated_at AS updatedAt
FROM receipts r`;

const productionTaskSelect = `SELECT
  pt.id AS id,
  pt.order_item_id AS orderItemId,
  o.id AS orderId,
  o.order_code AS orderCode,
  i.item_code AS itemCode,
  p.full_name AS customerName,
  i.garment_type_code AS garmentTypeCode,
  gt.display_name AS garmentDisplayName,
  pt.task_status AS taskStatus,
  pt.assigned_staff_user_id AS assignedStaffUserId,
  staff.display_name AS assignedStaffName,
  pt.due_date AS dueDate,
  pt.delay_reason AS delayReason,
  pt.notes AS notes,
  pt.updated_at AS updatedAt
FROM production_tasks pt
INNER JOIN order_items i ON i.id = pt.order_item_id
INNER JOIN orders o ON o.id = i.order_id
INNER JOIN customer_profiles p ON p.id = o.customer_profile_id
INNER JOIN garment_types gt ON gt.code = i.garment_type_code
LEFT JOIN staff_profiles staff ON staff.user_id = pt.assigned_staff_user_id`;

const notificationSelect = `SELECT
  id,
  order_id AS orderId,
  customer_profile_id AS customerProfileId,
  contact_id AS contactId,
  event_type AS eventType,
  recipient_mobile_e164 AS recipientMobileE164,
  template_purpose AS templatePurpose,
  status,
  failure_reason AS failureReason,
  connector_message_id AS connectorMessageId,
  created_at AS createdAt,
  updated_at AS updatedAt
FROM notification_logs`;

async function hydrateOrder(db: D1Database, row: OrderRow): Promise<OrderRead> {
  const [items, payments, receipt] = await Promise.all([
    db
      .prepare(`${itemSelect} WHERE i.order_id = ? ORDER BY i.created_at ASC`)
      .bind(row.orderId)
      .all<OrderItemRow>(),
    db
      .prepare(
        `${paymentSelect} WHERE pay.order_id = ? ORDER BY pay.recorded_at ASC`,
      )
      .bind(row.orderId)
      .all<PaymentRow>(),
    db
      .prepare(`${receiptSelect} WHERE r.order_id = ? LIMIT 1`)
      .bind(row.orderId)
      .first<ReceiptRow>(),
  ]);

  return orderReadSchema.parse({
    ...row,
    items: items.results.map((item) => {
      const { measurementValuesJson, measurementOverrideJson, ...readItem } =
        item;

      return {
        ...readItem,
        measurementValues: parseJsonRecord(measurementValuesJson ?? "{}"),
        measurementOverride: measurementOverrideJson
          ? parseJsonRecord(measurementOverrideJson)
          : null,
      };
    }),
    payments: payments.results,
    receipt: receipt ? receiptReadSchema.parse(receipt) : null,
  });
}

function parseCustomerRows(rows: CustomerRow[]) {
  const grouped = new Map<string, CustomerContactRead>();

  for (const row of rows) {
    const current =
      grouped.get(row.contactId) ??
      customerContactReadSchema.parse({
        contactId: row.contactId,
        primaryMobileE164: row.primaryMobileE164,
        primaryMobileNational: row.primaryMobileNational,
        whatsappMobileE164: row.whatsappMobileE164,
        whatsappOptIn: row.whatsappOptIn === 1,
        address: row.addressJson ? parseJsonRecord(row.addressJson) : null,
        notes: row.notes,
        createdAt: row.contactCreatedAt,
        updatedAt: row.contactUpdatedAt,
        profiles: [],
      });

    if (row.profileId && row.customerCode && row.fullName) {
      current.profiles.push({
        id: row.profileId,
        customerCode: row.customerCode,
        fullName: row.fullName,
        relationLabel: row.relationLabel,
        genderContext: row.genderContext,
        activeOrders: row.activeOrders ?? 0,
        latestMeasurementAt: row.latestMeasurementAt,
      });
    }

    grouped.set(row.contactId, current);
  }

  return [...grouped.values()].map((contact) =>
    customerContactReadSchema.parse(contact),
  );
}

function parseTemplateRow(row: TemplateRow): MeasurementTemplateRead {
  return measurementTemplateReadSchema.parse({
    code: row.code,
    displayName: row.displayName,
    measurementSchema: parseJsonRecord(row.measurementSchemaJson),
    defaultExpectedDays: row.defaultExpectedDays,
    defaultPricePaise: row.defaultPricePaise,
    isActive: row.isActive === 1,
    updatedAt: row.updatedAt,
  });
}

function parseMeasurementVersionRow(
  row: MeasurementVersionRow,
): MeasurementVersionRead {
  return measurementVersionReadSchema.parse({
    ...row,
    values: parseJsonRecord(row.valuesJson),
  });
}

async function countFirst(db: D1Database, sql: string, values: unknown[] = []) {
  const row = await db
    .prepare(sql)
    .bind(...values)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

function parseJsonRecord(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

function toIso(now?: Date) {
  return (now ?? new Date()).toISOString();
}

function createLocalId(prefix: string) {
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 18);
  return `${prefix}-${random}`;
}

function formatPaise(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value / 100);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
