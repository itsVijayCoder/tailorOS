import { z } from "zod";

import {
  domainIdSchema,
  garmentTypeCodeSchema,
  isoDateSchema,
  isoDateTimeSchema,
  jsonObjectSchema,
  measurementUnitSchema,
  notificationStatusSchema,
  orderItemStatusSchema,
  orderStatusSchema,
  paymentKindSchema,
  paymentModeSchema,
  receiptStatusSchema,
} from "./domain";

export const tenantRoleSchema = z.enum([
  "owner",
  "manager",
  "counter_staff",
  "measurement_taker",
  "tailor",
  "cutter",
  "cashier",
  "viewer",
  "platform_support",
]);

export const staffStatusSchema = z.enum(["invited", "active", "disabled"]);

export const tenantStaffMemberSchema = z
  .object({
    userId: domainIdSchema,
    displayName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().nullable(),
    mobileE164: z.string().trim().min(8).max(32).nullable(),
    role: tenantRoleSchema,
    status: staffStatusSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const customerProfileReadSchema = z
  .object({
    id: domainIdSchema,
    customerCode: z.string().trim().min(3).max(80),
    fullName: z.string().trim().min(2).max(120),
    relationLabel: z.string().trim().max(80).nullable(),
    genderContext: z.string().trim().max(80).nullable(),
    activeOrders: z.number().int().nonnegative(),
    latestMeasurementAt: isoDateTimeSchema.nullable(),
  })
  .strict();

export const customerContactReadSchema = z
  .object({
    contactId: domainIdSchema,
    primaryMobileE164: z.string().trim().min(8).max(32),
    primaryMobileNational: z.string().trim().min(8).max(16),
    whatsappMobileE164: z.string().trim().min(8).max(32).nullable(),
    whatsappOptIn: z.boolean(),
    address: jsonObjectSchema.nullable(),
    notes: z.string().trim().max(1000).nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    profiles: z.array(customerProfileReadSchema),
  })
  .strict();

export const customerTimelineEventSchema = z
  .object({
    id: domainIdSchema,
    type: z.enum([
      "order",
      "measurement",
      "payment",
      "receipt",
      "notification",
      "audit",
    ]),
    title: z.string().trim().min(1).max(160),
    detail: z.string().trim().max(500).nullable(),
    occurredAt: isoDateTimeSchema,
    entityId: domainIdSchema,
  })
  .strict();

export const measurementTemplateReadSchema = z
  .object({
    code: garmentTypeCodeSchema,
    displayName: z.string().trim().min(2).max(120),
    measurementSchema: jsonObjectSchema,
    defaultExpectedDays: z.number().int().nonnegative(),
    defaultPricePaise: z.number().int().nonnegative(),
    isActive: z.boolean(),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const measurementVersionReadSchema = z
  .object({
    measurementProfileId: domainIdSchema,
    measurementVersionId: domainIdSchema,
    customerProfileId: domainIdSchema,
    customerCode: z.string().trim().min(3).max(80),
    customerName: z.string().trim().min(2).max(120),
    garmentTypeCode: garmentTypeCodeSchema,
    displayName: z.string().trim().min(2).max(120),
    versionNo: z.number().int().positive(),
    values: jsonObjectSchema,
    unit: measurementUnitSchema,
    fitNotes: z.string().trim().max(1000).nullable(),
    reason: z.string().trim().min(1).max(240),
    capturedByUserId: domainIdSchema,
    capturedAt: isoDateTimeSchema,
  })
  .strict();

export const orderItemReadSchema = z
  .object({
    id: domainIdSchema,
    itemCode: z.string().trim().min(3).max(80),
    garmentTypeCode: garmentTypeCodeSchema,
    garmentDisplayName: z.string().trim().min(2).max(120),
    quantity: z.number().int().positive(),
    itemStatus: orderItemStatusSchema,
    pricePaise: z.number().int().nonnegative(),
    assignedStaffUserId: domainIdSchema.nullable(),
    assignedStaffName: z.string().trim().min(1).max(120).nullable(),
    promisedDeliveryDate: isoDateSchema.nullable(),
    notes: z.string().trim().max(1000).nullable(),
    measurementSnapshotId: domainIdSchema.nullable(),
    sourceMeasurementVersionId: domainIdSchema.nullable(),
    measurementValues: jsonObjectSchema,
    measurementOverride: jsonObjectSchema.nullable(),
  })
  .strict();

export const paymentLedgerReadSchema = z
  .object({
    id: domainIdSchema,
    paymentCode: z.string().trim().min(3).max(80),
    orderId: domainIdSchema,
    amountPaise: z.number().int(),
    mode: paymentModeSchema,
    kind: paymentKindSchema,
    reference: z.string().trim().min(1).max(160).nullable(),
    reason: z.string().trim().min(1).max(240).nullable(),
    recordedByUserId: domainIdSchema,
    recordedByName: z.string().trim().min(1).max(120).nullable(),
    recordedAt: isoDateTimeSchema,
  })
  .strict();

export const receiptReadSchema = z
  .object({
    id: domainIdSchema,
    receiptCode: z.string().trim().min(3).max(80),
    orderId: domainIdSchema,
    status: receiptStatusSchema,
    paidPaise: z.number().int().nonnegative(),
    balanceDuePaise: z.number().int().nonnegative(),
    issuedByUserId: domainIdSchema,
    issuedAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const orderReadSchema = z
  .object({
    orderId: domainIdSchema,
    orderCode: z.string().trim().min(3).max(80),
    contactId: domainIdSchema,
    customerProfileId: domainIdSchema,
    customerCode: z.string().trim().min(3).max(80),
    customerName: z.string().trim().min(2).max(120),
    primaryMobileE164: z.string().trim().min(8).max(32),
    currentStatus: orderStatusSchema,
    orderDate: isoDateSchema,
    trialDate: isoDateSchema.nullable(),
    promisedDeliveryDate: isoDateSchema.nullable(),
    subtotalPaise: z.number().int().nonnegative(),
    discountPaise: z.number().int().nonnegative(),
    finalTotalPaise: z.number().int().nonnegative(),
    balanceDuePaise: z.number().int().nonnegative(),
    notes: z.string().trim().max(1000).nullable(),
    createdByUserId: domainIdSchema,
    createdByName: z.string().trim().min(1).max(120).nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
    items: z.array(orderItemReadSchema),
    payments: z.array(paymentLedgerReadSchema),
    receipt: receiptReadSchema.nullable(),
  })
  .strict();

export const productionTaskReadSchema = z
  .object({
    id: domainIdSchema,
    orderItemId: domainIdSchema,
    orderId: domainIdSchema,
    orderCode: z.string().trim().min(3).max(80),
    itemCode: z.string().trim().min(3).max(80),
    customerName: z.string().trim().min(2).max(120),
    garmentTypeCode: garmentTypeCodeSchema,
    garmentDisplayName: z.string().trim().min(2).max(120),
    taskStatus: orderItemStatusSchema,
    assignedStaffUserId: domainIdSchema.nullable(),
    assignedStaffName: z.string().trim().min(1).max(120).nullable(),
    dueDate: isoDateSchema.nullable(),
    delayReason: z.string().trim().max(500).nullable(),
    notes: z.string().trim().max(1000).nullable(),
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const notificationLogReadSchema = z
  .object({
    id: domainIdSchema,
    orderId: domainIdSchema.nullable(),
    customerProfileId: domainIdSchema.nullable(),
    contactId: domainIdSchema.nullable(),
    eventType: z.string().trim().min(2).max(80),
    recipientMobileE164: z.string().trim().min(8).max(32).nullable(),
    templatePurpose: z.string().trim().min(2).max(120).nullable(),
    status: notificationStatusSchema,
    failureReason: z.string().trim().max(500).nullable(),
    connectorMessageId: z.string().trim().min(1).max(160).nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .strict();

export const auditLogReadSchema = z
  .object({
    id: domainIdSchema,
    actorType: z.enum(["user", "system", "support"]),
    actorUserId: domainIdSchema.nullable(),
    actorName: z.string().trim().min(1).max(120).nullable(),
    action: z.string().trim().min(2).max(120),
    entityType: z.string().trim().min(2).max(80),
    entityId: domainIdSchema,
    reason: z.string().trim().max(500).nullable(),
    requestId: z.string().trim().min(8).max(128),
    createdAt: isoDateTimeSchema,
  })
  .strict();

export const todayReportReadSchema = z
  .object({
    date: isoDateSchema,
    dueTodayCount: z.number().int().nonnegative(),
    overdueCount: z.number().int().nonnegative(),
    readyForPickupCount: z.number().int().nonnegative(),
    activeOrderCount: z.number().int().nonnegative(),
    partialDeliveryCount: z.number().int().nonnegative(),
    collectedPaise: z.number().int().nonnegative(),
    balanceDuePaise: z.number().int().nonnegative(),
    correctionCount: z.number().int().nonnegative(),
    whatsappBlockedCount: z.number().int().nonnegative(),
    pendingOutboxCount: z.number().int().nonnegative(),
  })
  .strict();

export const tenantSettingsReadSchema = z
  .object({
    garmentTemplates: z.array(measurementTemplateReadSchema),
    staff: z.array(tenantStaffMemberSchema),
    receiptBranding: z
      .object({
        shopName: z.string().trim().min(1).max(120),
        city: z.string().trim().min(1).max(80).nullable(),
        footerNote: z.string().trim().max(240).nullable(),
      })
      .strict(),
  })
  .strict();

export const tenantDashboardReadSchema = z
  .object({
    report: todayReportReadSchema,
    ordersDueToday: z.array(orderReadSchema),
    productionTasks: z.array(productionTaskReadSchema),
    paymentDueOrders: z.array(orderReadSchema),
    notificationFailures: z.array(notificationLogReadSchema),
  })
  .strict();

export const listCustomersQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const listOrdersQuerySchema = z
  .object({
    status: orderStatusSchema.optional(),
    customerProfileId: domainIdSchema.optional(),
    dueDate: isoDateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const listMeasurementsQuerySchema = z
  .object({
    customerProfileId: domainIdSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const listPaymentsQuerySchema = z
  .object({
    orderId: domainIdSchema.optional(),
    date: isoDateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const productionTasksQuerySchema = z
  .object({
    status: orderItemStatusSchema.optional(),
    assignedStaffUserId: domainIdSchema.optional(),
    dueDate: isoDateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const reportTodayQuerySchema = z
  .object({
    date: isoDateSchema.optional(),
  })
  .strict();

export type TenantRole = z.infer<typeof tenantRoleSchema>;
export type TenantStaffMember = z.infer<typeof tenantStaffMemberSchema>;
export type CustomerProfileRead = z.infer<typeof customerProfileReadSchema>;
export type CustomerContactRead = z.infer<typeof customerContactReadSchema>;
export type CustomerTimelineEvent = z.infer<typeof customerTimelineEventSchema>;
export type MeasurementTemplateRead = z.infer<
  typeof measurementTemplateReadSchema
>;
export type MeasurementVersionRead = z.infer<
  typeof measurementVersionReadSchema
>;
export type OrderItemRead = z.infer<typeof orderItemReadSchema>;
export type PaymentLedgerRead = z.infer<typeof paymentLedgerReadSchema>;
export type ReceiptRead = z.infer<typeof receiptReadSchema>;
export type OrderRead = z.infer<typeof orderReadSchema>;
export type ProductionTaskRead = z.infer<typeof productionTaskReadSchema>;
export type NotificationLogRead = z.infer<typeof notificationLogReadSchema>;
export type AuditLogRead = z.infer<typeof auditLogReadSchema>;
export type TodayReportRead = z.infer<typeof todayReportReadSchema>;
export type TenantSettingsRead = z.infer<typeof tenantSettingsReadSchema>;
export type TenantDashboardRead = z.infer<typeof tenantDashboardReadSchema>;
