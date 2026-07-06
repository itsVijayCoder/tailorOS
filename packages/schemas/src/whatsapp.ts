import { z } from "zod";

import { idempotencyKeySchema } from "./queue";
import { tenantIdSchema } from "./tenant";

export const whatsappTemplatePurposeSchema = z.enum([
  "order_confirmation",
  "receipt",
  "payment_received",
  "trial_reminder",
  "ready_for_pickup",
  "payment_due",
  "delivery",
  "opt_in",
  "opt_out",
]);

export const whatsappLanguageSchema = z.enum(["en", "ta"]);
export const whatsappProviderSchema = z.enum([
  "meta",
  "twilio",
  "360dialog",
  "authkey",
  "wati",
]);

export const whatsappTemplateCategorySchema = z.enum([
  "utility",
  "authentication",
  "marketing",
  "service",
]);

export const whatsappTemplateStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "paused",
  "disabled",
]);

export const whatsappChannelStatusSchema = z.enum([
  "pending",
  "active",
  "disabled",
  "failed",
]);

export const whatsappCredentialStatusSchema = z.enum([
  "pending",
  "active",
  "expired",
  "rotating",
  "disabled",
]);

export const whatsappMessageStatusSchema = z.enum([
  "queued",
  "accepted",
  "sent",
  "delivered",
  "read",
  "failed",
  "blocked",
]);

export const whatsappBlockedReasonSchema = z.enum([
  "duplicate_request",
  "missing_channel",
  "provider_health_issue",
  "missing_consent",
  "opted_out",
  "missing_template",
  "outside_service_window",
]);

export const whatsappNormalizedEventTypeSchema = z.enum([
  "message.inbound",
  "message.sent",
  "message.delivered",
  "message.read",
  "message.failed",
  "message.opted_out",
]);

export const whatsappRecipientSchema = z
  .object({
    contactMethodId: z.string().trim().min(6).max(128),
    phoneE164: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/, "Phone number must be E.164 format."),
  })
  .strict();

export const sendTemplateMessageSchema = z
  .object({
    tenantId: tenantIdSchema,
    productCode: z.string().trim().min(3).max(80).default("tailoros"),
    productId: z.string().trim().min(3).max(80).optional(),
    recipient: whatsappRecipientSchema,
    templatePurpose: whatsappTemplatePurposeSchema,
    language: whatsappLanguageSchema.default("en"),
    variables: z.record(z.string().min(1), z.string().max(500)),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict();

export const whatsappChannelSnapshotSchema = z
  .object({
    id: z.string().trim().min(6).max(128),
    tenantId: tenantIdSchema,
    provider: whatsappProviderSchema,
    phoneNumberId: z.string().trim().min(3).max(128),
    displayPhoneNumber: z.string().trim().min(3).max(64),
    status: whatsappChannelStatusSchema,
    credentialStatus: whatsappCredentialStatusSchema,
  })
  .strict();

export const whatsappTemplateMappingSnapshotSchema = z
  .object({
    id: z.string().trim().min(6).max(128),
    providerTemplateName: z.string().trim().min(1).max(256),
    category: whatsappTemplateCategorySchema,
    status: whatsappTemplateStatusSchema,
    variableKeys: z.array(z.string().trim().min(1).max(64)).max(32),
  })
  .strict();

export const whatsappTemplateSendJobPayloadSchema = z
  .object({
    requestId: z.string().trim().min(6).max(128),
    tenantId: tenantIdSchema,
    productCode: z.string().trim().min(3).max(80),
    contactMethodId: z.string().trim().min(6).max(128),
    recipientPhoneE164: whatsappRecipientSchema.shape.phoneE164,
    templatePurpose: whatsappTemplatePurposeSchema,
    language: whatsappLanguageSchema,
    variables: z.record(z.string().min(1), z.string().max(500)),
    idempotencyKey: idempotencyKeySchema,
    channel: whatsappChannelSnapshotSchema,
    template: whatsappTemplateMappingSnapshotSchema,
  })
  .strict();

export const normalizedWhatsAppWebhookEventSchema = z
  .object({
    provider: whatsappProviderSchema,
    providerEventId: z.string().trim().min(1).max(256),
    providerMessageId: z.string().trim().min(1).max(256).optional(),
    phoneNumberId: z.string().trim().min(1).max(128),
    type: whatsappNormalizedEventTypeSchema,
    occurredAt: z.string().datetime({ offset: true }),
    fromPhoneE164: z.string().trim().min(3).max(32).optional(),
    waId: z.string().trim().min(3).max(64).optional(),
    textPreview: z.string().trim().max(500).optional(),
    failureCode: z.string().trim().max(128).optional(),
    failureMessage: z.string().trim().max(500).optional(),
  })
  .strict();

export const whatsappWebhookJobPayloadSchema = z
  .object({
    provider: whatsappProviderSchema,
    phoneNumberId: z.string().trim().min(1).max(128),
    payloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
    events: z.array(normalizedWhatsAppWebhookEventSchema).min(1).max(200),
  })
  .strict();

export type SendTemplateMessage = z.infer<typeof sendTemplateMessageSchema>;
export type WhatsAppTemplatePurpose = z.infer<
  typeof whatsappTemplatePurposeSchema
>;
export type WhatsAppProvider = z.infer<typeof whatsappProviderSchema>;
export type WhatsAppTemplateCategory = z.infer<
  typeof whatsappTemplateCategorySchema
>;
export type WhatsAppTemplateStatus = z.infer<
  typeof whatsappTemplateStatusSchema
>;
export type WhatsAppChannelStatus = z.infer<typeof whatsappChannelStatusSchema>;
export type WhatsAppCredentialStatus = z.infer<
  typeof whatsappCredentialStatusSchema
>;
export type WhatsAppMessageStatus = z.infer<typeof whatsappMessageStatusSchema>;
export type WhatsAppBlockedReason = z.infer<typeof whatsappBlockedReasonSchema>;
export type WhatsAppTemplateSendJobPayload = z.infer<
  typeof whatsappTemplateSendJobPayloadSchema
>;
export type NormalizedWhatsAppWebhookEvent = z.infer<
  typeof normalizedWhatsAppWebhookEventSchema
>;
export type WhatsAppWebhookJobPayload = z.infer<
  typeof whatsappWebhookJobPayloadSchema
>;
