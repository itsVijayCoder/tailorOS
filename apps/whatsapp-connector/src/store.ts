import type {
  SendTemplateMessage,
  WhatsAppBlockedReason,
  WhatsAppChannelStatus,
  WhatsAppCredentialStatus,
  WhatsAppMessageStatus,
  WhatsAppProvider,
  WhatsAppTemplateCategory,
  WhatsAppTemplatePurpose,
  WhatsAppTemplateStatus,
} from "@tailoros/schemas";

import type { ConsentState } from "@tailoros/message-policy";

export type MessageRequestSummary = {
  id: string;
  status: WhatsAppMessageStatus;
  blockedReason: WhatsAppBlockedReason | null;
};

export type ChannelAccountRecord = {
  id: string;
  tenantId: string;
  provider: WhatsAppProvider;
  phoneNumberId: string;
  displayPhoneNumber: string;
  status: WhatsAppChannelStatus;
  credentialStatus: WhatsAppCredentialStatus;
};

export type TemplateMappingRecord = {
  id: string;
  providerTemplateName: string;
  category: WhatsAppTemplateCategory;
  status: WhatsAppTemplateStatus;
  variableKeys: string[];
};

export type TemplateSendReadiness = {
  channel: ChannelAccountRecord | null;
  consentState: ConsentState;
  template: TemplateMappingRecord | null;
};

export type ConnectorOverview = {
  channels: {
    active: number;
    pending: number;
    failed: number;
  };
  templates: {
    approved: number;
    needsReview: number;
  };
  messages: {
    queued: number;
    delivered: number;
    failed: number;
    blocked: number;
  };
  webhooks: {
    received24h: number;
    duplicateSafeEvents: number;
  };
};

export type WhatsAppConnectorRepository = {
  findMessageRequestByIdempotencyKey(input: {
    tenantId: string;
    idempotencyKey: string;
  }): Promise<MessageRequestSummary | null>;
  getTemplateSendReadiness(
    request: SendTemplateMessage,
  ): Promise<TemplateSendReadiness>;
  insertBlockedMessageRequest(input: {
    request: SendTemplateMessage;
    blockedReason: WhatsAppBlockedReason;
    now: string;
  }): Promise<MessageRequestSummary>;
  insertQueuedMessageRequest(input: {
    request: SendTemplateMessage;
    channel: ChannelAccountRecord;
    template: TemplateMappingRecord;
    now: string;
  }): Promise<MessageRequestSummary>;
  insertOutboxJob(input: {
    id: string;
    tenantId: string;
    messageRequestId: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    now: string;
  }): Promise<void>;
  findChannelByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<ChannelAccountRecord | null>;
  insertWebhookEvent(input: {
    eventId: string;
    provider: WhatsAppProvider;
    providerEventId: string;
    providerMessageId: string | null;
    phoneNumberId: string;
    eventType: string;
    payloadSha256: string;
    rawPayloadJson: string | null;
    now: string;
  }): Promise<void>;
  getOverview(): Promise<ConnectorOverview>;
};

export class D1WhatsAppConnectorRepository
  implements WhatsAppConnectorRepository
{
  constructor(private readonly db: D1Database) {}

  async findMessageRequestByIdempotencyKey(input: {
    tenantId: string;
    idempotencyKey: string;
  }) {
    return await this.db
      .prepare(
        `
          SELECT
            id,
            status,
            blocked_reason AS blockedReason
          FROM message_requests
          WHERE tenant_id = ? AND idempotency_key = ?
          LIMIT 1
        `,
      )
      .bind(input.tenantId, input.idempotencyKey)
      .first<MessageRequestSummary>();
  }

  async getTemplateSendReadiness(request: SendTemplateMessage) {
    const channel = await this.findActiveChannelForTenant(request.tenantId);
    const consent = await this.db
      .prepare(
        `
          SELECT status
          FROM contact_consents
          WHERE tenant_id = ? AND contact_method_id = ?
          LIMIT 1
        `,
      )
      .bind(request.tenantId, request.recipient.contactMethodId)
      .first<{ status: ConsentState }>();

    const template = channel
      ? await this.findTemplateMapping({
          channelAccountId: channel.id,
          language: request.language,
          templatePurpose: request.templatePurpose,
          tenantId: request.tenantId,
        })
      : null;

    return {
      channel,
      consentState: consent?.status ?? "unknown",
      template,
    };
  }

  async insertBlockedMessageRequest(input: {
    request: SendTemplateMessage;
    blockedReason: WhatsAppBlockedReason;
    now: string;
  }) {
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `
          INSERT INTO message_requests (
            id,
            tenant_id,
            product_code,
            contact_method_id,
            recipient_phone_e164,
            template_purpose,
            language,
            idempotency_key,
            status,
            blocked_reason,
            requested_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'blocked', ?, ?, ?)
        `,
      )
      .bind(
        id,
        input.request.tenantId,
        input.request.productCode,
        input.request.recipient.contactMethodId,
        input.request.recipient.phoneE164,
        input.request.templatePurpose,
        input.request.language,
        input.request.idempotencyKey,
        input.blockedReason,
        input.now,
        input.now,
      )
      .run();

    return {
      blockedReason: input.blockedReason,
      id,
      status: "blocked",
    } satisfies MessageRequestSummary;
  }

  async insertQueuedMessageRequest(input: {
    request: SendTemplateMessage;
    channel: ChannelAccountRecord;
    template: TemplateMappingRecord;
    now: string;
  }) {
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `
          INSERT INTO message_requests (
            id,
            tenant_id,
            product_code,
            contact_method_id,
            recipient_phone_e164,
            template_purpose,
            language,
            idempotency_key,
            channel_account_id,
            template_mapping_id,
            status,
            requested_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?)
        `,
      )
      .bind(
        id,
        input.request.tenantId,
        input.request.productCode,
        input.request.recipient.contactMethodId,
        input.request.recipient.phoneE164,
        input.request.templatePurpose,
        input.request.language,
        input.request.idempotencyKey,
        input.channel.id,
        input.template.id,
        input.now,
        input.now,
      )
      .run();

    return {
      blockedReason: null,
      id,
      status: "queued",
    } satisfies MessageRequestSummary;
  }

  async insertOutboxJob(input: {
    id: string;
    tenantId: string;
    messageRequestId: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    now: string;
  }) {
    await this.db
      .prepare(
        `
          INSERT INTO outbox_jobs (
            id,
            tenant_id,
            message_request_id,
            job_type,
            idempotency_key,
            payload_json,
            status,
            created_at
          )
          VALUES (?, ?, ?, 'whatsapp.send-template', ?, ?, 'queued', ?)
        `,
      )
      .bind(
        input.id,
        input.tenantId,
        input.messageRequestId,
        input.idempotencyKey,
        JSON.stringify(input.payload),
        input.now,
      )
      .run();
  }

  async findChannelByPhoneNumberId(phoneNumberId: string) {
    return await this.db
      .prepare(
        `
          SELECT
            id,
            tenant_id AS tenantId,
            provider,
            phone_number_id AS phoneNumberId,
            display_phone_number AS displayPhoneNumber,
            status,
            credential_status AS credentialStatus
          FROM channel_accounts
          WHERE provider = 'meta' AND phone_number_id = ?
          LIMIT 1
        `,
      )
      .bind(phoneNumberId)
      .first<ChannelAccountRecord>();
  }

  async insertWebhookEvent(input: {
    eventId: string;
    provider: WhatsAppProvider;
    providerEventId: string;
    providerMessageId: string | null;
    phoneNumberId: string;
    eventType: string;
    payloadSha256: string;
    rawPayloadJson: string | null;
    now: string;
  }) {
    await this.db
      .prepare(
        `
          INSERT OR IGNORE INTO webhook_events (
            id,
            provider,
            provider_event_id,
            provider_message_id,
            phone_number_id,
            event_type,
            payload_sha256,
            raw_payload_json,
            received_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .bind(
        input.eventId,
        input.provider,
        input.providerEventId,
        input.providerMessageId,
        input.phoneNumberId,
        input.eventType,
        input.payloadSha256,
        input.rawPayloadJson,
        input.now,
      )
      .run();
  }

  async getOverview() {
    const [channelRows, templateRows, messageRows, webhookRows] =
      await Promise.all([
        this.db
          .prepare(
            `
              SELECT status, COUNT(*) AS count
              FROM channel_accounts
              GROUP BY status
            `,
          )
          .all<{ status: WhatsAppChannelStatus; count: number }>(),
        this.db
          .prepare(
            `
              SELECT status, COUNT(*) AS count
              FROM template_mappings
              GROUP BY status
            `,
          )
          .all<{ status: WhatsAppTemplateStatus; count: number }>(),
        this.db
          .prepare(
            `
              SELECT status, COUNT(*) AS count
              FROM message_requests
              GROUP BY status
            `,
          )
          .all<{ status: WhatsAppMessageStatus; count: number }>(),
        this.db
          .prepare(
            `
              SELECT
                COUNT(*) AS received24h,
                COUNT(DISTINCT provider_event_id) AS duplicateSafeEvents
              FROM webhook_events
              WHERE received_at >= datetime('now', '-1 day')
            `,
          )
          .first<{ received24h: number; duplicateSafeEvents: number }>(),
      ]);

    return {
      channels: {
        active: countRows(channelRows.results, "active"),
        failed: countRows(channelRows.results, "failed"),
        pending: countRows(channelRows.results, "pending"),
      },
      messages: {
        blocked: countRows(messageRows.results, "blocked"),
        delivered: countRows(messageRows.results, "delivered"),
        failed: countRows(messageRows.results, "failed"),
        queued: countRows(messageRows.results, "queued"),
      },
      templates: {
        approved: countRows(templateRows.results, "approved"),
        needsReview: templateRows.results
          .filter((row) => row.status !== "approved")
          .reduce((total, row) => total + row.count, 0),
      },
      webhooks: {
        duplicateSafeEvents: webhookRows?.duplicateSafeEvents ?? 0,
        received24h: webhookRows?.received24h ?? 0,
      },
    };
  }

  private async findActiveChannelForTenant(tenantId: string) {
    return await this.db
      .prepare(
        `
          SELECT
            id,
            tenant_id AS tenantId,
            provider,
            phone_number_id AS phoneNumberId,
            display_phone_number AS displayPhoneNumber,
            status,
            credential_status AS credentialStatus
          FROM channel_accounts
          WHERE tenant_id = ? AND provider = 'meta'
          ORDER BY
            CASE status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
            updated_at DESC
          LIMIT 1
        `,
      )
      .bind(tenantId)
      .first<ChannelAccountRecord>();
  }

  private async findTemplateMapping(input: {
    tenantId: string;
    channelAccountId: string;
    templatePurpose: WhatsAppTemplatePurpose;
    language: "en" | "ta";
  }) {
    const row = await this.db
      .prepare(
        `
          SELECT
            id,
            provider_template_name AS providerTemplateName,
            category,
            status,
            variable_keys_json AS variableKeysJson
          FROM template_mappings
          WHERE
            tenant_id = ?
            AND channel_account_id = ?
            AND template_purpose = ?
            AND language = ?
          LIMIT 1
        `,
      )
      .bind(
        input.tenantId,
        input.channelAccountId,
        input.templatePurpose,
        input.language,
      )
      .first<{
        id: string;
        providerTemplateName: string;
        category: WhatsAppTemplateCategory;
        status: WhatsAppTemplateStatus;
        variableKeysJson: string;
      }>();

    if (!row) {
      return null;
    }

    return {
      category: row.category,
      id: row.id,
      providerTemplateName: row.providerTemplateName,
      status: row.status,
      variableKeys: parseVariableKeys(row.variableKeysJson),
    } satisfies TemplateMappingRecord;
  }
}

function countRows<TStatus extends string>(
  rows: readonly { status: TStatus; count: number }[],
  status: TStatus,
) {
  return rows.find((row) => row.status === status)?.count ?? 0;
}

function parseVariableKeys(value: string) {
  const parsed = JSON.parse(value) as unknown;

  return Array.isArray(parsed)
    ? parsed.filter((entry): entry is string => typeof entry === "string")
    : [];
}
