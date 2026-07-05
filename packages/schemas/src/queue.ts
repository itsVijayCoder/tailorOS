import { z } from "zod";

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(12, "Idempotency key must be at least 12 characters.")
  .max(160, "Idempotency key must be at most 160 characters.")
  .regex(
    /^[A-Za-z0-9:_-]+$/,
    "Idempotency key may only contain letters, numbers, colon, underscore, or dash.",
  );

export const queueJobTypeSchema = z.enum([
  "tenant.provision",
  "tenant.migrate",
  "whatsapp.send-template",
  "whatsapp.process-webhook",
  "receipt.generate",
]);

export const queueEnvelopeSchema = z
  .object({
    type: queueJobTypeSchema,
    version: z.number().int().positive(),
    id: z.string().trim().min(8).max(128),
    idempotencyKey: idempotencyKeySchema,
    createdAt: z.string().datetime({ offset: true }),
    payload: z.record(z.string().min(1), z.unknown()),
  })
  .strict();

export type QueueJobType = z.infer<typeof queueJobTypeSchema>;
export type QueueEnvelope = z.infer<typeof queueEnvelopeSchema>;

export function createQueueEnvelope(input: {
  type: QueueJobType;
  version: number;
  id: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  createdAt?: string;
}): QueueEnvelope {
  return queueEnvelopeSchema.parse({
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
  });
}
