import type { NormalizedWhatsAppWebhookEvent } from "@tailoros/schemas";

import type {
  ProviderSendResult,
  ProviderWebhookInput,
  TemplateSendInput,
  TextSendInput,
  WhatsAppProviderAdapter,
} from "./types";

type MetaAdapterOptions = {
  accessToken: string;
  graphApiVersion?: string;
  graphApiBaseUrl?: string;
  fetcher?: typeof fetch;
};

type MetaMessageResponse = {
  messages?: readonly { id?: string }[];
  error?: {
    code?: number;
    error_subcode?: number;
    message?: string;
    type?: string;
  };
};

const DEFAULT_GRAPH_API_VERSION = "v25.0";
const DEFAULT_GRAPH_API_BASE_URL = "https://graph.facebook.com";

export function createMetaWhatsAppAdapter(
  options: MetaAdapterOptions,
): WhatsAppProviderAdapter {
  const fetcher = options.fetcher ?? fetch;
  const graphApiVersion =
    options.graphApiVersion?.trim() || DEFAULT_GRAPH_API_VERSION;
  const graphApiBaseUrl =
    options.graphApiBaseUrl?.replace(/\/$/, "") || DEFAULT_GRAPH_API_BASE_URL;

  return {
    provider: "meta",
    async sendTemplate(input) {
      return sendMetaMessage({
        accessToken: options.accessToken,
        body: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to,
          type: "template",
          template: {
            name: input.templateName,
            language: { code: input.languageCode },
            components: buildTemplateComponents(input),
          },
        },
        fetcher,
        graphApiBaseUrl,
        graphApiVersion,
        phoneNumberId: input.phoneNumberId,
      });
    },
    async sendTextWithinServiceWindow(input) {
      return sendMetaMessage({
        accessToken: options.accessToken,
        body: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to,
          type: "text",
          text: {
            body: input.text,
            preview_url: false,
          },
        },
        fetcher,
        graphApiBaseUrl,
        graphApiVersion,
        phoneNumberId: input.phoneNumberId,
      });
    },
    async normalizeWebhook(input: ProviderWebhookInput) {
      return normalizeMetaWebhook(input.payload);
    },
  };
}

export function normalizeMetaWebhook(
  payload: unknown,
): NormalizedWhatsAppWebhookEvent[] {
  if (!isRecord(payload)) {
    return [];
  }

  const entries = asRecords(payload.entry);
  const events: NormalizedWhatsAppWebhookEvent[] = [];

  for (const entry of entries) {
    for (const change of asRecords(entry.changes)) {
      const value = isRecord(change.value) ? change.value : null;
      if (!value) {
        continue;
      }

      const metadata = isRecord(value.metadata) ? value.metadata : {};
      const phoneNumberId = readString(metadata.phone_number_id);
      if (!phoneNumberId) {
        continue;
      }

      for (const status of asRecords(value.statuses)) {
        const normalized = normalizeMetaStatus(status, phoneNumberId);
        if (normalized) {
          events.push(normalized);
        }
      }

      for (const message of asRecords(value.messages)) {
        const normalized = normalizeMetaInboundMessage(message, phoneNumberId);
        if (normalized) {
          events.push(normalized);
        }
      }
    }
  }

  return events;
}

function normalizeMetaStatus(
  status: Record<string, unknown>,
  phoneNumberId: string,
): NormalizedWhatsAppWebhookEvent | null {
  const providerMessageId = readString(status.id);
  const providerStatus = readString(status.status);
  const timestamp = readString(status.timestamp);

  if (!providerMessageId || !providerStatus || !timestamp) {
    return null;
  }

  const firstError = asRecords(status.errors)[0];
  const errorCode = firstError ? readString(firstError.code) : undefined;
  const errorMessage = firstError
    ? readString(firstError.message) || readString(firstError.title)
    : undefined;
  const type = mapMetaStatus(providerStatus);

  return {
    provider: "meta",
    providerEventId: [
      providerMessageId,
      providerStatus,
      timestamp,
      errorCode ?? "",
    ].join(":"),
    providerMessageId,
    phoneNumberId,
    type,
    occurredAt: fromMetaTimestamp(timestamp),
    ...(errorCode ? { failureCode: errorCode } : {}),
    ...(errorMessage ? { failureMessage: errorMessage } : {}),
  };
}

function normalizeMetaInboundMessage(
  message: Record<string, unknown>,
  phoneNumberId: string,
): NormalizedWhatsAppWebhookEvent | null {
  const providerMessageId = readString(message.id);
  const from = readString(message.from);
  const timestamp = readString(message.timestamp);

  if (!providerMessageId || !from || !timestamp) {
    return null;
  }

  const text = isRecord(message.text) ? readString(message.text.body) : null;

  return {
    provider: "meta",
    providerEventId: providerMessageId,
    providerMessageId,
    phoneNumberId,
    type: "message.inbound",
    occurredAt: fromMetaTimestamp(timestamp),
    fromPhoneE164: from.startsWith("+") ? from : `+${from}`,
    waId: from,
    ...(text ? { textPreview: text.slice(0, 500) } : {}),
  };
}

function mapMetaStatus(status: string): NormalizedWhatsAppWebhookEvent["type"] {
  switch (status) {
    case "sent":
      return "message.sent";
    case "delivered":
      return "message.delivered";
    case "read":
      return "message.read";
    case "failed":
      return "message.failed";
    default:
      return "message.failed";
  }
}

async function sendMetaMessage(input: {
  accessToken: string;
  body: Record<string, unknown>;
  fetcher: typeof fetch;
  graphApiBaseUrl: string;
  graphApiVersion: string;
  phoneNumberId: string;
}): Promise<ProviderSendResult> {
  const response = await input.fetcher(
    `${input.graphApiBaseUrl}/${input.graphApiVersion}/${input.phoneNumberId}/messages`,
    {
      body: JSON.stringify(input.body),
      headers: {
        authorization: `Bearer ${input.accessToken}`,
        "content-type": "application/json",
      },
      method: "POST",
    },
  );
  const payload = (await response.json().catch(() => null)) as MetaMessageResponse | null;
  const providerMessageId = payload?.messages?.[0]?.id;

  if (response.ok && providerMessageId) {
    return {
      accepted: true,
      providerMessageId,
      raw: payload,
    };
  }

  const errorCode =
    payload?.error?.code?.toString() ??
    payload?.error?.error_subcode?.toString() ??
    `HTTP_${response.status}`;

  return {
    accepted: false,
    errorCode,
    errorMessage:
      payload?.error?.message ?? "Meta Cloud API did not accept the message.",
    retryable: response.status >= 500 || response.status === 429,
    raw: payload,
  };
}

function buildTemplateComponents(input: TemplateSendInput) {
  const parameters = input.variableKeys.map((key) => ({
    text: input.variables[key] ?? "",
    type: "text",
  }));

  if (parameters.length === 0) {
    return [];
  }

  return [
    {
      type: "body",
      parameters,
    },
  ];
}

function fromMetaTimestamp(timestamp: string) {
  const numeric = Number(timestamp);
  if (Number.isFinite(numeric)) {
    return new Date(numeric * 1000).toISOString();
  }

  return new Date(timestamp).toISOString();
}

function asRecords(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
