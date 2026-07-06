import { describe, expect, it } from "vitest";

import {
  createQueueEnvelope,
  type NormalizedWhatsAppWebhookEvent,
} from "@tailoros/schemas";

import {
  processWhatsAppQueueEnvelope,
  type WhatsAppConsumerRepository,
} from "./processor";

describe("whatsapp-consumer processor", () => {
  it("records provider acceptance for template send jobs", async () => {
    const repository = new MemoryConsumerRepository();
    const result = await processWhatsAppQueueEnvelope({
      attempts: 1,
      env: createEnv(),
      envelope: createQueueEnvelope({
        id: "JOB-WAS-001",
        idempotencyKey: "order-confirmed:ord_01:v1",
        payload: templateJobPayload(),
        type: "whatsapp.send-template",
        version: 1,
      }),
      fetcher: async () => Response.json({ messages: [{ id: "wamid.accepted" }] }),
      repository,
    });

    expect(result.action).toBe("ack");
    expect(repository.accepted).toEqual([
      {
        messageRequestId: "msg_queued",
        providerMessageId: "wamid.accepted",
      },
    ]);
  });

  it("retries transient provider failures and records the failure", async () => {
    const repository = new MemoryConsumerRepository();
    const result = await processWhatsAppQueueEnvelope({
      attempts: 1,
      env: createEnv(),
      envelope: createQueueEnvelope({
        id: "JOB-WAS-002",
        idempotencyKey: "order-confirmed:ord_02:v1",
        payload: templateJobPayload(),
        type: "whatsapp.send-template",
        version: 1,
      }),
      fetcher: async () =>
        Response.json(
          { error: { code: 131000, message: "Provider temporarily busy." } },
          { status: 503 },
        ),
      repository,
    });

    expect(result).toEqual({ action: "retry", delaySeconds: 60 });
    expect(repository.failed[0]).toMatchObject({
      failureCode: "131000",
      retryable: true,
    });
  });

  it("acks terminal provider failures after max attempts", async () => {
    const repository = new MemoryConsumerRepository();
    const result = await processWhatsAppQueueEnvelope({
      attempts: 3,
      env: createEnv(),
      envelope: createQueueEnvelope({
        id: "JOB-WAS-003",
        idempotencyKey: "order-confirmed:ord_03:v1",
        payload: templateJobPayload(),
        type: "whatsapp.send-template",
        version: 1,
      }),
      fetcher: async () =>
        Response.json(
          { error: { code: 131000, message: "Provider still busy." } },
          { status: 503 },
        ),
      repository,
    });

    expect(result.action).toBe("ack");
  });

  it("applies webhook events and records STOP opt-out", async () => {
    const repository = new MemoryConsumerRepository();
    const inboundStop = {
      fromPhoneE164: "+919876543210",
      occurredAt: "2026-07-06T10:00:00.000Z",
      phoneNumberId: "12345",
      provider: "meta",
      providerEventId: "wamid.inbound",
      providerMessageId: "wamid.inbound",
      textPreview: "STOP",
      type: "message.inbound",
      waId: "919876543210",
    } satisfies NormalizedWhatsAppWebhookEvent;
    const readEvent = {
      occurredAt: "2026-07-06T10:00:01.000Z",
      phoneNumberId: "12345",
      provider: "meta",
      providerEventId: "wamid.outbound:read:1783315201:",
      providerMessageId: "wamid.outbound",
      type: "message.read",
    } satisfies NormalizedWhatsAppWebhookEvent;

    const result = await processWhatsAppQueueEnvelope({
      attempts: 1,
      env: createEnv(),
      envelope: createQueueEnvelope({
        id: "JOB-WAW-001",
        idempotencyKey: "webhook:abc123456789",
        payload: {
          events: [readEvent, inboundStop],
          payloadSha256:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          phoneNumberId: "12345",
          provider: "meta",
        },
        type: "whatsapp.process-webhook",
        version: 1,
      }),
      repository,
    });

    expect(result.action).toBe("ack");
    expect(repository.statusEvents).toEqual([
      "message.read",
      "message.inbound",
    ]);
    expect(repository.optOuts).toEqual(["+919876543210"]);
  });
});

function templateJobPayload() {
  return {
    channel: {
      credentialStatus: "active",
      displayPhoneNumber: "+91 98765 43210",
      id: "cha_meta_001",
      phoneNumberId: "12345",
      provider: "meta",
      status: "active",
      tenantId: "ten_1234567890abcd",
    },
    contactMethodId: "cm_123456",
    idempotencyKey: "order-confirmed:ord_01:v1",
    language: "ta",
    productCode: "tailoros",
    recipientPhoneE164: "+919876543210",
    requestId: "msg_queued",
    template: {
      category: "utility",
      id: "tpl_order_ta",
      providerTemplateName: "order_confirmed_ta",
      status: "approved",
      variableKeys: ["customerName", "orderCode"],
    },
    templatePurpose: "order_confirmation",
    tenantId: "ten_1234567890abcd",
    variables: {
      customerName: "Meena",
      orderCode: "ORD-MDU-000421",
    },
  };
}

function createEnv() {
  return {
    CONNECTOR_DB: {},
    ENVIRONMENT: "local",
    META_ACCESS_TOKEN_LOCAL: "test-token",
    META_GRAPH_API_VERSION: "v25.0",
  } as unknown as Env;
}

class MemoryConsumerRepository implements WhatsAppConsumerRepository {
  readonly accepted: {
    messageRequestId: string;
    providerMessageId: string;
  }[] = [];
  readonly failed: {
    failureCode: string;
    retryable: boolean;
  }[] = [];
  readonly optOuts: string[] = [];
  readonly statusEvents: string[] = [];

  async markAccepted(input: {
    messageRequestId: string;
    providerMessageId: string;
  }) {
    this.accepted.push({
      messageRequestId: input.messageRequestId,
      providerMessageId: input.providerMessageId,
    });
  }

  async markFailed(input: { failureCode: string; retryable: boolean }) {
    this.failed.push({
      failureCode: input.failureCode,
      retryable: input.retryable,
    });
  }

  async applyWebhookStatus(input: { event: NormalizedWhatsAppWebhookEvent }) {
    this.statusEvents.push(input.event.type);
  }

  async recordOptOut(input: { event: NormalizedWhatsAppWebhookEvent }) {
    if (input.event.fromPhoneE164) {
      this.optOuts.push(input.event.fromPhoneE164);
    }
  }
}
