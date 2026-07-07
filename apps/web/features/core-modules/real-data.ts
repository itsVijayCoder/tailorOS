import { calculatePaymentLedger, getRolePermissions } from "@tailoros/core";
import type {
  CustomerContactRead,
  MeasurementTemplateRead,
  MeasurementVersionRead,
  NotificationLogRead,
  OrderRead,
  ProductionTaskRead,
  TenantSettingsRead,
  TodayReportRead,
} from "@tailoros/schemas";

import type {
  CommandSearchResponse,
  CommandSearchResult,
  FamilyAccount,
  MeasurementTemplate,
  MeasurementVersion,
  ProductionTask,
  ReportMetric,
  SettingsItem,
  ShopOrder,
  WhatsAppFailure,
} from "./types";
import {
  readCustomers,
  readDashboard,
  readMeasurements,
  readMeasurementTemplates,
  readNotifications,
  readOrders,
  readProductionTasks,
  readReportToday,
  readSettings,
  searchTenant,
} from "./tenant-api";

export async function getRealDashboardData() {
  const dashboard = await readDashboard();

  return {
    source: dashboard.source,
    error: dashboard.error,
    ordersDueToday: dashboard.data.dashboard.ordersDueToday.map(mapOrder),
    paymentDueOrders: dashboard.data.dashboard.paymentDueOrders.map(mapOrder),
    productionTasks: dashboard.data.dashboard.productionTasks.map(mapTask),
    signals: mapDashboardSignals(dashboard.data.dashboard.report),
    whatsAppFailures:
      dashboard.data.dashboard.notificationFailures.map(mapWhatsAppFailure),
  };
}

export async function getRealFamilyAccounts(query?: string) {
  const customers = await readCustomers(query);
  return {
    error: customers.error,
    familyAccounts: customers.data.customers.map(mapFamilyAccount),
    source: customers.source,
  };
}

export async function getRealCustomerContact(contactId: string) {
  const customers = await readCustomers();
  return {
    contact:
      customers.data.customers.find(
        (customer) => customer.contactId === contactId,
      ) ?? null,
    error: customers.error,
    source: customers.source,
  };
}

export async function getRealMeasurementsData() {
  const [templates, measurements] = await Promise.all([
    readMeasurementTemplates(),
    readMeasurements(),
  ]);

  return {
    error: templates.error ?? measurements.error,
    measurementTemplates: templates.data.templates.map(mapMeasurementTemplate),
    measurementVersions: measurements.data.measurements.map(
      mapMeasurementVersion,
    ),
    source:
      templates.source === "tenant-api" || measurements.source === "tenant-api"
        ? "tenant-api"
        : "offline",
  };
}

export async function getRealOrders() {
  const orders = await readOrders();
  return {
    error: orders.error,
    shopOrders: orders.data.orders.map(mapOrder),
    source: orders.source,
  };
}

export async function getRealPaymentsData() {
  return getRealOrders();
}

export async function getRealProductionData() {
  const [tasks, orders] = await Promise.all([
    readProductionTasks(),
    readOrders(),
  ]);
  return {
    error: tasks.error ?? orders.error,
    productionTasks: tasks.data.tasks.map(mapTask),
    shopOrders: orders.data.orders.map(mapOrder),
    source:
      tasks.source === "tenant-api" || orders.source === "tenant-api"
        ? "tenant-api"
        : "offline",
  };
}

export async function getRealReportsData() {
  const [report, tasks, orders, notifications] = await Promise.all([
    readReportToday("2026-07-06"),
    readProductionTasks(),
    readOrders(),
    readNotifications(),
  ]);

  return {
    error: report.error ?? tasks.error ?? orders.error ?? notifications.error,
    productionTasks: tasks.data.tasks.map(mapTask),
    report: report.data.report,
    reportMetrics: mapReportMetrics(report.data.report),
    shopOrders: orders.data.orders.map(mapOrder),
    source:
      report.source === "tenant-api" ||
      tasks.source === "tenant-api" ||
      orders.source === "tenant-api"
        ? "tenant-api"
        : "offline",
    whatsAppFailures: notifications.data.logs.map(mapWhatsAppFailure),
  };
}

export async function getRealSettingsData() {
  const settings = await readSettings();
  return {
    error: settings.error,
    measurementTemplates: settings.data.settings.garmentTemplates.map(
      mapMeasurementTemplate,
    ),
    settings: settings.data.settings,
    settingsItems: mapSettingsItems(settings.data.settings),
    source: settings.source,
  };
}

export async function searchRealRecords(
  rawQuery: string,
): Promise<CommandSearchResponse> {
  const response = await searchTenant(rawQuery);

  return {
    meta: {
      ...response.data.meta,
      source: response.source === "tenant-api" ? "tenant-api" : "pilot-fixture",
    },
    results: response.data.results.map((result, index) => {
      const entityType = mapSearchEntityType(result.entityType);
      return {
        entityType,
        eyebrow: humanize(result.entityType),
        description: result.subtitle ?? "Tenant search result",
        href: hrefForSearchEntity(entityType),
        hitType: result.hitType,
        id: result.entityId,
        matchedOn: response.data.meta.strategy,
        priority: index,
        title: result.title,
      } satisfies CommandSearchResult;
    }),
  };
}

export function calculateOrderFinancials(order: ShopOrder) {
  return calculatePaymentLedger({
    finalTotalPaise: order.totalPaise,
    payments: order.payments.map((payment) => ({
      amountPaise: payment.amountPaise,
      kind: payment.kind,
    })),
  });
}

export function formatPaise(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value / 100);
}

export function isItemReady(status: ShopOrder["items"][number]["status"]) {
  return (
    status === "ready_for_pickup" ||
    status === "delivered" ||
    status === "closed"
  );
}

export function getPartialDeliveryOrders(shopOrders: readonly ShopOrder[]) {
  return shopOrders.filter((order) => {
    const readyItems = order.items.filter((item) => isItemReady(item.status));
    return readyItems.length > 0 && readyItems.length < order.items.length;
  });
}

export function isWhatsAppFailureRetryable(failure: WhatsAppFailure) {
  return (
    failure.retryable &&
    failure.status !== "blocked" &&
    failure.status !== "opted_out"
  );
}

export function mapDashboardSignals(report: TodayReportRead) {
  return {
    balanceDuePaise: report.balanceDuePaise,
    dueTodayCount: report.dueTodayCount,
    partialDeliveryCount: report.partialDeliveryCount,
    readyItemCount: report.readyForPickupCount,
    retryableWhatsAppFailures: report.whatsappBlockedCount,
  };
}

function mapFamilyAccount(contact: CustomerContactRead): FamilyAccount {
  const address =
    contact.address && typeof contact.address.line1 === "string"
      ? String(contact.address.line1)
      : (contact.notes ?? "Address not captured");

  return {
    address,
    city:
      contact.address && typeof contact.address.city === "string"
        ? String(contact.address.city)
        : "Tenant city",
    duplicateRisk: null,
    familyCode: contact.contactId,
    id: contact.contactId,
    primaryMobileDisplay: contact.primaryMobileE164,
    primaryMobileE164: contact.primaryMobileE164,
    profiles: contact.profiles.map((profile) => ({
      activeOrders: profile.activeOrders,
      customerCode: profile.customerCode,
      fullName: profile.fullName,
      garmentContext: profile.genderContext ?? "General tailoring profile",
      id: profile.id,
      lastMeasurement: profile.latestMeasurementAt
        ? `Last measurement ${new Date(profile.latestMeasurementAt).toLocaleDateString("en-IN")}`
        : "No measurement captured yet",
      notes: "",
      relationLabel: profile.relationLabel ?? "profile",
    })),
    whatsappOptIn: contact.whatsappOptIn,
  };
}

function mapMeasurementTemplate(
  template: MeasurementTemplateRead,
): MeasurementTemplate {
  const fields = Array.isArray(template.measurementSchema.fields)
    ? template.measurementSchema.fields
        .filter((field): field is string => typeof field === "string")
        .map((field) => humanize(field))
    : [];

  return {
    code: template.code,
    defaultDays: template.defaultExpectedDays,
    label: template.displayName,
    optionalFields: [],
    rangeHint: `${formatPaise(template.defaultPricePaise)} default price`,
    requiredFields: fields,
    version: template.isActive ? "active" : "inactive",
  };
}

function mapMeasurementVersion(
  version: MeasurementVersionRead,
): MeasurementVersion {
  return {
    changedAt: version.capturedAt,
    changedBy: version.capturedByUserId,
    changedFields: Object.entries(version.values).map(([label, value]) => ({
      from: "Previous version",
      label: humanize(label),
      to: String(value ?? ""),
    })),
    customerCode: version.customerCode,
    garment: version.displayName,
    id: version.measurementVersionId,
    reason: version.reason,
    unit: version.unit,
    versionNo: version.versionNo,
  };
}

function mapOrder(order: OrderRead): ShopOrder {
  return {
    customerCode: order.customerCode,
    customerName: order.customerName,
    familyCode: order.contactId,
    id: order.orderId,
    items: order.items.map((item) => ({
      assignedTo:
        item.assignedStaffName ?? item.assignedStaffUserId ?? "Unassigned",
      garment: item.garmentDisplayName,
      id: item.id,
      itemCode: item.itemCode,
      measurementVersion:
        item.sourceMeasurementVersionId ??
        item.measurementSnapshotId ??
        "snapshot",
      overrideNote: item.measurementOverride
        ? Object.keys(item.measurementOverride).join(", ")
        : null,
      pricePaise: item.pricePaise,
      promisedDate:
        item.promisedDeliveryDate ??
        order.promisedDeliveryDate ??
        order.orderDate,
      status: item.itemStatus,
    })),
    mobileE164: order.primaryMobileE164,
    notes: order.notes ?? "No notes captured.",
    orderCode: order.orderCode,
    orderDate: order.orderDate,
    payments: order.payments.map((payment) => ({
      amountPaise: payment.amountPaise,
      id: payment.id,
      kind: payment.kind,
      mode: payment.mode,
      reason: payment.reason,
      recordedAt: payment.recordedAt,
    })),
    promisedDate: order.promisedDeliveryDate ?? order.orderDate,
    receiptCode: order.receipt?.receiptCode ?? "Receipt pending",
    status: order.currentStatus,
    totalPaise: order.finalTotalPaise,
    trialDate: order.trialDate,
    trialTime: null,
  };
}

function mapTask(task: ProductionTaskRead): ProductionTask {
  return {
    assignedTo:
      task.assignedStaffName ?? task.assignedStaffUserId ?? "Unassigned",
    customerName: task.customerName,
    dueDate: task.dueDate ?? "2026-07-06",
    exceptionReason: task.delayReason,
    garment: task.garmentDisplayName,
    id: task.id,
    itemCode: task.itemCode,
    lane: laneForStatus(task.taskStatus),
    notifyCustomer:
      task.taskStatus === "ready_for_pickup" || task.taskStatus === "delivered",
    orderCode: task.orderCode,
  };
}

function mapWhatsAppFailure(log: NotificationLogRead): WhatsAppFailure {
  return {
    customerName: log.customerProfileId ?? "Customer",
    id: log.id,
    occurredAt: log.createdAt,
    orderCode: log.orderId ?? "No order",
    purpose: log.templatePurpose ?? log.eventType,
    reason: log.failureReason ?? humanize(log.status),
    retryable: log.status === "failed",
    status:
      log.status === "opted_out"
        ? "opted_out"
        : log.status === "blocked"
          ? "blocked"
          : "failed",
  };
}

function mapReportMetrics(report: TodayReportRead): ReportMetric[] {
  return [
    {
      detail: `${report.correctionCount} correction/refund rows today`,
      label: "Today collection",
      trend: "up",
      value: formatPaise(report.collectedPaise),
    },
    {
      detail: "Derived from active order balances",
      label: "Pending balance",
      trend: "flat",
      value: formatPaise(report.balanceDuePaise),
    },
    {
      detail: `${report.dueTodayCount} due today`,
      label: "Overdue delivery",
      trend: "down",
      value: `${report.overdueCount}`,
    },
    {
      detail: `${report.pendingOutboxCount} pending outbox event(s)`,
      label: "WhatsApp blocks",
      trend: "flat",
      value: `${report.whatsappBlockedCount}`,
    },
  ];
}

function mapSettingsItems(settings: TenantSettingsRead): SettingsItem[] {
  return [
    {
      detail: `${settings.garmentTemplates.length} garment templates loaded from tenant settings`,
      id: "garment-templates",
      owner: "owner",
      state: settings.garmentTemplates.length > 0 ? "ready" : "blocked",
      title: "Garment templates",
    },
    {
      detail: `${settings.staff.length} active/invited staff records`,
      id: "staff",
      owner: "owner",
      state: settings.staff.length > 0 ? "ready" : "needs_review",
      title: "Staff roles",
    },
    {
      detail: settings.receiptBranding.shopName,
      id: "receipt-branding",
      owner: "owner",
      state: "ready",
      title: "Receipt branding",
    },
  ];
}

function laneForStatus(
  status: ProductionTaskRead["taskStatus"],
): ProductionTask["lane"] {
  if (status === "material_confirmed") return "fabric_received";
  if (status === "finishing" || status === "trial_required")
    return "trial_ready";
  if (status === "alteration_required") return "alteration_needed";
  if (
    status === "delivered" ||
    status === "closed" ||
    status === "cancelled" ||
    status === "refunded"
  ) {
    return "delivered";
  }
  if (status === "ready_for_pickup") return "ready_for_pickup";
  if (status === "cutting") return "cutting";
  if (status === "stitching") return "stitching";
  return "confirmed";
}

function mapSearchEntityType(
  entityType: string,
): CommandSearchResult["entityType"] {
  if (entityType === "contact") return "family";
  if (
    entityType === "customer_profile" ||
    entityType === "measurement_profile"
  ) {
    return "customer";
  }
  if (entityType === "receipt") return "receipt";
  if (entityType === "notification") return "message";
  return "order";
}

function hrefForSearchEntity(entityType: CommandSearchResult["entityType"]) {
  if (entityType === "family" || entityType === "customer")
    return "/shop/customers";
  if (entityType === "receipt") return "/shop/payments";
  if (entityType === "message") return "/shop/whatsapp";
  return "/shop/orders";
}

function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const realSecurityRoleRows = [
  "owner",
  "manager",
  "counter_staff",
  "measurement_taker",
  "tailor",
  "cutter",
  "cashier",
  "viewer",
] as const;

export function getRealRoleRows() {
  return realSecurityRoleRows.map((role) => ({
    allowedHighlights: getRolePermissions(role).slice(0, 4),
    blockedHighlights: [],
    label: humanize(role),
    permissions: getRolePermissions(role),
    role,
    scope: "Tenant membership",
  }));
}
