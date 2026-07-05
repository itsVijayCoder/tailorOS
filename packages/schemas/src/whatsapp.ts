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
    productId: z.string().trim().min(3).max(80),
    recipient: whatsappRecipientSchema,
    templatePurpose: whatsappTemplatePurposeSchema,
    language: whatsappLanguageSchema.default("en"),
    variables: z.record(z.string().min(1), z.string().max(500)),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict();

export type SendTemplateMessage = z.infer<typeof sendTemplateMessageSchema>;
export type WhatsAppTemplatePurpose = z.infer<
  typeof whatsappTemplatePurposeSchema
>;
