import { isOptOutText, shouldApplyWhatsAppStatusUpdate } from "@tailoros/message-policy";
import {
  queueEnvelopeSchema,
  whatsappTemplateSendJobPayloadSchema,
  whatsappWebhookJobPayloadSchema,
  type NormalizedWhatsAppWebhookEvent,
  type QueueEnvelope,
  type WhatsAppMessageStatus,
} from "@tailoros/schemas";
import { createMetaWhatsAppAdapter } from "@tailoros/whatsapp";

type QueueAction =
  | {
      action: "ack";
    }
  | {
      action: "retry";
      delaySeconds: number;
    };

export type WhatsAppConsumerRepository = {
  markAccepted(input: {
    messageRequestId: string;
    providerMessageId: string;
    providerPayloadJson: string;
    now: string;
  }): Promise<void>;
  markFailed(input: {
    failureCode: string;
    failureMessage: string;
    messageRequestId: string;
    now: string;
    retryable: boolean;
  }): Promise<void>;
  applyWebhookStatus(input: {
    event: NormalizedWhatsAppWebhookEvent;
    now: string;
  }): Promise<void>;
  recordOptOut(input: {
    event: NormalizedWhatsAppWebhookEvent;
    now: string;
  }): Promise<void>;
};

export async function processWhatsAppQueueEnvelope(input: {
  attempts: number;
  env: Env;
  envelope: QueueEnvelope;
  repository: WhatsAppConsumerRepository;
  fetcher?: typeof fetch;
  now?: () => Date;
}): Promise<QueueAction> {
  if (input.envelope.type === "whatsapp.send-template") {
    return await processTemplateSend(input);
  }

  if (input.envelope.type === "whatsapp.process-webhook") {
    return await processWebhook(input);
  }

  console.warn(
    JSON.stringify({
      job_id: input.envelope.id,
      job_type: input.envelope.type,
      level: "warn",
      message: "WhatsApp consumer ignored a non-WhatsApp job.",
      worker: "whatsapp-consumer",
    }),
  );

  return { action: "ack" };
}

async function processTemplateSend(input: {
  attempts: number;
  env: Env;
  envelope: QueueEnvelope;
  repository: WhatsAppConsumerRepository;
  fetcher?: typeof fetch;
  now?: () => Date;
}): Promise<QueueAction> {
  const parsedPayload = whatsappTemplateSendJobPayloadSchema.safeParse(
    input.envelope.payload,
  );

  if (!parsedPayload.success) {
    console.error(
      JSON.stringify({
        issues: parsedPayload.error.issues,
        job_id: input.envelope.id,
        level: "error",
        message: "WhatsApp send job payload is invalid.",
        worker: "whatsapp-consumer",
      }),
    );

    return { action: "ack" };
  }

  const payload = parsedPayload.data;
  const adapter = createMetaWhatsAppAdapter({
    accessToken: input.env.META_ACCESS_TOKEN_LOCAL,
    graphApiVersion: input.env.META_GRAPH_API_VERSION,
    ...(input.fetcher ? { fetcher: input.fetcher } : {}),
  });
  const result = await adapter.sendTemplate({
    category: payload.template.category,
    clientMessageId: payload.idempotencyKey,
    languageCode: payload.language,
    phoneNumberId: payload.channel.phoneNumberId,
    templateName: payload.template.providerTemplateName,
    templatePurpose: payload.templatePurpose,
    tenantId: payload.tenantId,
    to: payload.recipientPhoneE164,
    variableKeys: payload.template.variableKeys,
    variables: payload.variables,
  });
  const now = (input.now ?? (() => new Date()))().toISOString();

  if (result.accepted) {
    await input.repository.markAccepted({
      messageRequestId: payload.requestId,
      now,
      providerMessageId: result.providerMessageId,
      providerPayloadJson: JSON.stringify(result.raw),
    });

    return { action: "ack" };
  }

  await input.repository.markFailed({
    failureCode: result.errorCode,
    failureMessage: result.errorMessage,
    messageRequestId: payload.requestId,
    now,
    retryable: result.retryable,
  });

  if (result.retryable && input.attempts < 3) {
    return { action: "retry", delaySeconds: 60 * input.attempts };
  }

  return { action: "ack" };
}

async function processWebhook(input: {
  envelope: QueueEnvelope;
  repository: WhatsAppConsumerRepository;
  now?: () => Date;
}): Promise<QueueAction> {
  const parsedPayload = whatsappWebhookJobPayloadSchema.safeParse(
    input.envelope.payload,
  );

  if (!parsedPayload.success) {
    console.error(
      JSON.stringify({
        issues: parsedPayload.error.issues,
        job_id: input.envelope.id,
        level: "error",
        message: "WhatsApp webhook job payload is invalid.",
        worker: "whatsapp-consumer",
      }),
    );

    return { action: "ack" };
  }

  const now = (input.now ?? (() => new Date()))().toISOString();

  for (const event of parsedPayload.data.events) {
    await input.repository.applyWebhookStatus({ event, now });

    if (event.type === "message.inbound" && event.textPreview) {
      if (isOptOutText(event.textPreview)) {
        await input.repository.recordOptOut({ event, now });
      }
    }
  }

  return { action: "ack" };
}

export class D1WhatsAppConsumerRepository
  implements WhatsAppConsumerRepository
{
  constructor(private readonly db: D1Database) {}

  async markAccepted(input: {
    messageRequestId: string;
    providerMessageId: string;
    providerPayloadJson: string;
    now: string;
  }) {
    await this.db
      .prepare(
        `
          UPDATE message_requests
          SET
            status = 'accepted',
            provider_message_id = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .bind(input.providerMessageId, input.now, input.messageRequestId)
      .run();
  }

  async markFailed(input: {
    failureCode: string;
    failureMessage: string;
    messageRequestId: string;
    now: string;
    retryable: boolean;
  }) {
    await this.db
      .prepare(
        `
          UPDATE message_requests
          SET
            status = 'failed',
            failure_code = ?,
            failure_message = ?,
            retry_count = retry_count + ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .bind(
        input.failureCode,
        input.failureMessage,
        input.retryable ? 1 : 0,
        input.now,
        input.messageRequestId,
      )
      .run();
  }

  async applyWebhookStatus(input: {
    event: NormalizedWhatsAppWebhookEvent;
    now: string;
  }) {
    const nextStatus = mapWebhookEventToStatus(input.event);
    if (!input.event.providerMessageId || !nextStatus) {
      return;
    }

    const current = await this.db
      .prepare(
        `
          SELECT status
          FROM message_requests
          WHERE provider_message_id = ?
          LIMIT 1
        `,
      )
      .bind(input.event.providerMessageId)
      .first<{ status: WhatsAppMessageStatus }>();

    if (
      !shouldApplyWhatsAppStatusUpdate({
        currentStatus: current?.status ?? null,
        nextStatus,
      })
    ) {
      return;
    }

    await this.db
      .prepare(
        `
          UPDATE message_requests
          SET
            status = ?,
            failure_code = COALESCE(?, failure_code),
            failure_message = COALESCE(?, failure_message),
            updated_at = ?
          WHERE provider_message_id = ?
        `,
      )
      .bind(
        nextStatus,
        input.event.failureCode ?? null,
        input.event.failureMessage ?? null,
        input.now,
        input.event.providerMessageId,
      )
      .run();
  }

  async recordOptOut(input: {
    event: NormalizedWhatsAppWebhookEvent;
    now: string;
  }) {
    if (!input.event.fromPhoneE164) {
      return;
    }

    const channel = await this.db
      .prepare(
        `
          SELECT tenant_id AS tenantId
          FROM channel_accounts
          WHERE phone_number_id = ?
          LIMIT 1
        `,
      )
      .bind(input.event.phoneNumberId)
      .first<{ tenantId: string }>();

    if (!channel) {
      return;
    }

    await this.db
      .prepare(
        `
          INSERT INTO contact_consents (
            id,
            tenant_id,
            contact_method_id,
            phone_e164,
            status,
            source,
            proof_note,
            captured_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, 'opted_out', 'whatsapp_inbound', ?, ?, ?)
          ON CONFLICT(tenant_id, contact_method_id) DO UPDATE SET
            status = 'opted_out',
            source = 'whatsapp_inbound',
            proof_note = excluded.proof_note,
            updated_at = excluded.updated_at
        `,
      )
      .bind(
        crypto.randomUUID(),
        channel.tenantId,
        `wa:${input.event.fromPhoneE164}`,
        input.event.fromPhoneE164,
        input.event.textPreview ?? "Opt-out received by WhatsApp.",
        input.now,
        input.now,
      )
      .run();
  }
}

function mapWebhookEventToStatus(
  event: NormalizedWhatsAppWebhookEvent,
): WhatsAppMessageStatus | null {
  switch (event.type) {
    case "message.sent":
      return "sent";
    case "message.delivered":
      return "delivered";
    case "message.read":
      return "read";
    case "message.failed":
      return "failed";
    case "message.inbound":
    case "message.opted_out":
      return null;
  }
}

export function parseQueueEnvelopeForTest(value: unknown) {
  return queueEnvelopeSchema.parse(value);
}
