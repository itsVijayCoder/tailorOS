import { describe, expect, it } from "vitest";

import { hmacSha256Hex, sha256Hex } from "@tailoros/whatsapp";

import { createWhatsAppConnectorApp } from "./app";
import type {
  ChannelAccountRecord,
  ConnectorOverview,
  MessageRequestSummary,
  TemplateMappingRecord,
  TemplateSendReadiness,
  WhatsAppConnectorRepository,
} from "./store";

const activeChannel = {
  credentialStatus: "active",
  displayPhoneNumber: "+91 98765 43210",
  id: "cha_meta_001",
  phoneNumberId: "12345",
  provider: "meta",
  status: "active",
  tenantId: "ten_1234567890abcd",
} as const satisfies ChannelAccountRecord;

const approvedTemplate = {
  category: "utility",
  id: "tpl_order_ta",
  providerTemplateName: "order_confirmed_ta",
  status: "approved",
  variableKeys: ["customerName", "orderCode", "deliveryDate"],
} as const satisfies TemplateMappingRecord;

describe("whatsapp-connector routes", () => {
  it("requires an internal service token for template sends", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "opted_in",
      template: approvedTemplate,
    });
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });

    const response = await app.request(
      "/v1/messages/template",
      {
        body: JSON.stringify(validTemplateRequest()),
        headers: { "content-type": "application/json" },
        method: "POST",
      },
      createEnv(),
    );

    expect(response.status).toBe(401);
  });

  it("blocks sends with missing consent before queueing", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "unknown",
      template: approvedTemplate,
    });
    const queue = createQueueSpy();
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });

    const response = await app.request(
      "/v1/messages/template",
      {
        body: JSON.stringify(validTemplateRequest()),
        headers: {
          authorization: "Bearer test-internal-token",
          "content-type": "application/json",
        },
        method: "POST",
      },
      createEnv({ sendQueue: queue.queue }),
    );
    const body = (await response.json()) as {
      data: { blockedReason: string; status: string };
    };

    expect(response.status).toBe(202);
    expect(body.data).toMatchObject({
      blockedReason: "missing_consent",
      status: "blocked",
    });
    expect(queue.sent).toHaveLength(0);
  });

  it("queues approved template sends with a connector-owned payload", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "opted_in",
      template: approvedTemplate,
    });
    const queue = createQueueSpy();
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });

    const response = await app.request(
      "/v1/messages/template",
      {
        body: JSON.stringify(validTemplateRequest()),
        headers: {
          authorization: "Bearer test-internal-token",
          "content-type": "application/json",
        },
        method: "POST",
      },
      createEnv({ sendQueue: queue.queue }),
    );
    const body = (await response.json()) as {
      data: { queuedJobId: string; status: string };
    };

    expect(response.status).toBe(202);
    expect(body.data.status).toBe("queued");
    expect(queue.sent).toHaveLength(1);
    expect(queue.sent[0]).toMatchObject({
      payload: {
        channel: { phoneNumberId: "12345" },
        requestId: repository.lastQueuedRequestId,
        template: { providerTemplateName: "order_confirmed_ta" },
      },
      type: "whatsapp.send-template",
    });
  });

  it("rejects invalid Meta webhook signatures", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "opted_in",
      template: approvedTemplate,
    });
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });

    const response = await app.request(
      "/webhooks/meta",
      {
        body: JSON.stringify(metaWebhookPayload()),
        headers: { "x-hub-signature-256": "sha256=bad" },
        method: "POST",
      },
      createEnv(),
    );

    expect(response.status).toBe(401);
  });

  it("verifies, dedupes, and queues Meta webhook events", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "opted_in",
      template: approvedTemplate,
    });
    const queue = createQueueSpy();
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });
    const rawBody = JSON.stringify(metaWebhookPayload());
    const digest = await hmacSha256Hex({
      secret: "test-app-secret",
      value: rawBody,
    });

    const response = await app.request(
      "/webhooks/meta",
      {
        body: rawBody,
        headers: { "x-hub-signature-256": `sha256=${digest}` },
        method: "POST",
      },
      createEnv({ webhookQueue: queue.queue }),
    );
    const body = (await response.json()) as {
      data: { queuedEventCount: number };
    };

    expect(response.status).toBe(202);
    expect(body.data.queuedEventCount).toBe(1);
    expect(repository.webhookEventIds).toEqual([
      "wamid.outbound:read:1783315201:",
    ]);
    expect(queue.sent[0]).toMatchObject({
      payload: { events: [{ type: "message.read" }], phoneNumberId: "12345" },
      type: "whatsapp.process-webhook",
    });
  });

  it("verifies Meta challenge token by hash", async () => {
    const repository = new MemoryConnectorRepository({
      consentState: "opted_in",
      template: approvedTemplate,
    });
    const verifyHash = await sha256Hex("verify-token");
    const app = createWhatsAppConnectorApp({
      repository: () => repository,
    });

    const response = await app.request(
      "/webhooks/meta?hub.mode=subscribe&hub.challenge=abc123&hub.verify_token=verify-token",
      { method: "GET" },
      createEnv({ verifyHash }),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("abc123");
  });
});

function validTemplateRequest() {
  return {
    idempotencyKey: "order-confirmed:ord_01:v1",
    language: "ta",
    productCode: "tailoros",
    recipient: {
      contactMethodId: "cm_123456",
      phoneE164: "+919876543210",
    },
    templatePurpose: "order_confirmation",
    tenantId: "ten_1234567890abcd",
    variables: {
      customerName: "Meena",
      deliveryDate: "2026-07-12",
      orderCode: "ORD-MDU-000421",
    },
  };
}

function metaWebhookPayload() {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "12345" },
              statuses: [
                {
                  id: "wamid.outbound",
                  status: "read",
                  timestamp: "1783315201",
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function createQueueSpy() {
  const sent: unknown[] = [];
  const queue = {
    send: async (message: unknown) => {
      sent.push(message);

      return {
        metadata: { metrics: { backlogBytes: 0, backlogCount: sent.length } },
      };
    },
  } as Queue;

  return { queue, sent };
}

function createEnv(input?: {
  sendQueue?: Queue;
  verifyHash?: string;
  webhookQueue?: Queue;
}) {
  const defaultQueue = createQueueSpy().queue;

  return {
    CONNECTOR_DB: {},
    ENVIRONMENT: "local",
    INTERNAL_SERVICE_TOKEN: "test-internal-token",
    META_APP_SECRET: "test-app-secret",
    META_GRAPH_API_VERSION: "v25.0",
    META_WEBHOOK_VERIFY_TOKEN_HASH:
      input?.verifyHash ?? "local-placeholder-hash",
    WHATSAPP_SEND_QUEUE: input?.sendQueue ?? defaultQueue,
    WHATSAPP_WEBHOOK_QUEUE: input?.webhookQueue ?? defaultQueue,
  } as unknown as Env;
}

class MemoryConnectorRepository implements WhatsAppConnectorRepository {
  readonly webhookEventIds: string[] = [];
  lastQueuedRequestId: string | null = null;

  constructor(
    private readonly readiness: Omit<TemplateSendReadiness, "channel"> & {
      channel?: ChannelAccountRecord | null;
    },
  ) {}

  async findMessageRequestByIdempotencyKey() {
    return null;
  }

  async getTemplateSendReadiness() {
    return {
      channel: this.readiness.channel ?? activeChannel,
      consentState: this.readiness.consentState,
      template: this.readiness.template,
    };
  }

  async insertBlockedMessageRequest(): Promise<MessageRequestSummary> {
    return {
      blockedReason: "missing_consent",
      id: "msg_blocked",
      status: "blocked",
    };
  }

  async insertQueuedMessageRequest(): Promise<MessageRequestSummary> {
    this.lastQueuedRequestId = "msg_queued";

    return {
      blockedReason: null,
      id: "msg_queued",
      status: "queued",
    };
  }

  async insertOutboxJob() {}

  async findChannelByPhoneNumberId() {
    return activeChannel;
  }

  async insertWebhookEvent(input: { providerEventId: string }) {
    if (!this.webhookEventIds.includes(input.providerEventId)) {
      this.webhookEventIds.push(input.providerEventId);
    }
  }

  async getOverview(): Promise<ConnectorOverview> {
    return {
      channels: { active: 1, failed: 0, pending: 0 },
      messages: { blocked: 0, delivered: 0, failed: 0, queued: 0 },
      templates: { approved: 1, needsReview: 0 },
      webhooks: { duplicateSafeEvents: 0, received24h: 0 },
    };
  }
}
