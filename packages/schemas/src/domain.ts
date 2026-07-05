import { z } from "zod";

export const domainIdSchema = z.string().trim().min(6).max(128);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.");

export const mobileInputSchema = z.string().trim().min(8).max(32);
export const e164PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone number must be E.164 format.");

export const paiseSchema = z.number().int().nonnegative();
export const signedPaiseSchema = z.number().int();

export const jsonPrimitiveSchema = z.union([
  z.string().max(500),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const jsonObjectSchema = z.record(z.string().min(1), z.unknown());

export const measurementValuesSchema = z
  .record(z.string().trim().min(1).max(80), jsonPrimitiveSchema)
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one measurement value is required.",
      });
    }
  });

export const measurementUnitSchema = z.enum(["inch", "cm"]);

export const garmentTypeCodeSchema = z
  .string()
  .trim()
  .min(2)
  .max(48)
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    "Garment type code must be lowercase snake case.",
  );

export const orderStatusSchema = z.enum([
  "draft",
  "booked",
  "measurement_taken",
  "material_confirmed",
  "cutting",
  "stitching",
  "finishing",
  "trial_required",
  "alteration_required",
  "ready_for_pickup",
  "delivered",
  "closed",
  "cancelled",
]);

export const orderItemStatusSchema = z.enum([
  ...orderStatusSchema.options,
  "on_hold",
  "customer_delay",
  "material_shortage",
  "refunded",
]);

export const paymentModeSchema = z.enum([
  "cash",
  "upi",
  "card",
  "bank",
  "credit",
  "adjustment",
]);

export const paymentKindSchema = z.enum([
  "advance",
  "balance",
  "refund",
  "correction",
]);

export const receiptStatusSchema = z.enum(["draft", "partial", "paid", "void"]);

export const notificationStatusSchema = z.enum([
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "blocked",
  "opted_out",
]);

export const domainOutboxEventTypeSchema = z.enum([
  "ORDER_BOOKED",
  "RECEIPT_GENERATED",
  "PAYMENT_RECEIVED",
  "ORDER_STATUS_CHANGED",
  "ORDER_READY_FOR_PICKUP",
]);

export const customerProfileInputSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    relationLabel: z.string().trim().min(1).max(80).optional(),
    genderContext: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const createContactWithProfilesSchema = z
  .object({
    primaryMobile: mobileInputSchema,
    whatsappMobile: mobileInputSchema.optional(),
    whatsappOptIn: z.boolean().default(false),
    address: jsonObjectSchema.optional(),
    notes: z.string().trim().max(1000).optional(),
    profiles: z.array(customerProfileInputSchema).min(1).max(8),
    createdByUserId: domainIdSchema,
  })
  .strict();

export const createMeasurementVersionSchema = z
  .object({
    customerProfileId: domainIdSchema,
    garmentTypeCode: garmentTypeCodeSchema,
    measurementProfileId: domainIdSchema.optional(),
    displayName: z.string().trim().min(2).max(120).optional(),
    values: measurementValuesSchema,
    unit: measurementUnitSchema.default("inch"),
    fitNotes: z.string().trim().max(1000).optional(),
    reason: z.string().trim().min(3).max(240),
    capturedByUserId: domainIdSchema,
  })
  .strict();

export const orderItemInputSchema = z
  .object({
    garmentTypeCode: garmentTypeCodeSchema,
    quantity: z.number().int().positive().max(50).default(1),
    pricePaise: paiseSchema,
    measurementVersionId: domainIdSchema.optional(),
    measurementValues: measurementValuesSchema.optional(),
    measurementOverride: measurementValuesSchema.optional(),
    allowWithoutMeasurementReason: z.string().trim().min(6).max(240).optional(),
    assignedStaffUserId: domainIdSchema.optional(),
    promisedDeliveryDate: isoDateSchema.optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();

export const initialOrderPaymentSchema = z
  .object({
    amountPaise: paiseSchema,
    mode: paymentModeSchema,
    reference: z.string().trim().min(1).max(160).optional(),
    recordedByUserId: domainIdSchema,
  })
  .strict();

export const createOrderSchema = z
  .object({
    contactId: domainIdSchema,
    customerProfileId: domainIdSchema,
    currentStatus: orderStatusSchema.default("booked"),
    orderDate: isoDateSchema.optional(),
    trialDate: isoDateSchema.optional(),
    promisedDeliveryDate: isoDateSchema.optional(),
    discountPaise: paiseSchema.default(0),
    createdByUserId: domainIdSchema,
    notes: z.string().trim().max(1000).optional(),
    items: z.array(orderItemInputSchema).min(1).max(25),
    advancePayment: initialOrderPaymentSchema.optional(),
  })
  .strict();

export const recordPaymentSchema = z
  .object({
    amountPaise: signedPaiseSchema.refine((value) => value !== 0, {
      message: "Payment amount must not be zero.",
    }),
    mode: paymentModeSchema,
    kind: paymentKindSchema,
    reference: z.string().trim().min(1).max(160).optional(),
    reason: z.string().trim().min(6).max(240).optional(),
    recordedByUserId: domainIdSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      (value.kind === "refund" || value.kind === "correction") &&
      !value.reason
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Refunds and payment corrections require a reason.",
      });
    }

    if (
      (value.kind === "advance" ||
        value.kind === "balance" ||
        value.kind === "refund") &&
      value.amountPaise < 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["amountPaise"],
        message: "Advance, balance, and refund amounts must be positive.",
      });
    }
  });

export const searchTenantDomainQuerySchema = z
  .object({
    q: z.string().trim().min(2).max(120),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const contactProfileSummarySchema = z
  .object({
    contactId: domainIdSchema,
    primaryMobileE164: e164PhoneSchema,
    primaryMobileNational: z.string().trim().min(8).max(16),
    whatsappMobileE164: e164PhoneSchema.nullable(),
    whatsappOptIn: z.boolean(),
    profiles: z.array(
      z
        .object({
          id: domainIdSchema,
          customerCode: z.string().trim().min(3).max(80),
          fullName: z.string().trim().min(2).max(120),
          relationLabel: z.string().trim().max(80).nullable(),
          genderContext: z.string().trim().max(80).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const measurementVersionSummarySchema = z
  .object({
    measurementProfileId: domainIdSchema,
    measurementVersionId: domainIdSchema,
    customerProfileId: domainIdSchema,
    garmentTypeCode: garmentTypeCodeSchema,
    versionNo: z.number().int().positive(),
    values: measurementValuesSchema,
    unit: measurementUnitSchema,
    capturedAt: isoDateTimeSchema,
  })
  .strict();

export const orderSummarySchema = z
  .object({
    orderId: domainIdSchema,
    orderCode: z.string().trim().min(3).max(80),
    contactId: domainIdSchema,
    customerProfileId: domainIdSchema,
    currentStatus: orderStatusSchema,
    itemCount: z.number().int().positive(),
    subtotalPaise: paiseSchema,
    discountPaise: paiseSchema,
    finalTotalPaise: paiseSchema,
    balanceDuePaise: paiseSchema,
    receiptId: domainIdSchema.nullable(),
    outboxEventIds: z.array(domainIdSchema),
  })
  .strict();

export const paymentSummarySchema = z
  .object({
    paymentId: domainIdSchema,
    paymentCode: z.string().trim().min(3).max(80),
    orderId: domainIdSchema,
    amountPaise: signedPaiseSchema,
    mode: paymentModeSchema,
    kind: paymentKindSchema,
    balanceDuePaise: paiseSchema,
    receiptId: domainIdSchema,
    outboxEventIds: z.array(domainIdSchema),
  })
  .strict();

export type CreateContactWithProfiles = z.infer<
  typeof createContactWithProfilesSchema
>;
export type ContactProfileSummary = z.infer<typeof contactProfileSummarySchema>;
export type CreateMeasurementVersion = z.infer<
  typeof createMeasurementVersionSchema
>;
export type MeasurementVersionSummary = z.infer<
  typeof measurementVersionSummarySchema
>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type RecordPayment = z.infer<typeof recordPaymentSchema>;
export type PaymentSummary = z.infer<typeof paymentSummarySchema>;
export type PaymentKind = z.infer<typeof paymentKindSchema>;
export type PaymentMode = z.infer<typeof paymentModeSchema>;
export type DomainOutboxEventType = z.infer<typeof domainOutboxEventTypeSchema>;
