import { describe, expect, it } from "vitest";

import { createMetaWhatsAppAdapter, normalizeMetaWebhook } from "./meta";
import { hmacSha256Hex, verifyMetaSignature } from "./security";

describe("Meta WhatsApp adapter", () => {
  it("builds a template send request and returns provider message ID", async () => {
    const requests: Request[] = [];
    const adapter = createMetaWhatsAppAdapter({
      accessToken: "test-token",
      fetcher: async (input, init) => {
        requests.push(new Request(input, init));

        return Response.json({ messages: [{ id: "wamid.test" }] });
      },
      graphApiVersion: "v25.0",
    });

    const result = await adapter.sendTemplate({
      category: "utility",
      clientMessageId: "order-confirmed:ord_1:v1",
      languageCode: "ta",
      phoneNumberId: "12345",
      templateName: "order_confirmed_ta",
      templatePurpose: "order_confirmation",
      tenantId: "ten_1234567890abcd",
      to: "+919876543210",
      variableKeys: ["customerName", "orderCode"],
      variables: {
        customerName: "Meena",
        orderCode: "ORD-MDU-000421",
      },
    });

    expect(result).toMatchObject({
      accepted: true,
      providerMessageId: "wamid.test",
    });
    expect(requests[0]?.url).toContain("/v25.0/12345/messages");
    expect(requests[0]?.headers.get("authorization")).toBe("Bearer test-token");
  });

  it("normalizes duplicate-safe status and inbound events", () => {
    const events = normalizeMetaWebhook({
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "12345" },
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.inbound",
                    timestamp: "1783315200",
                    text: { body: "STATUS" },
                  },
                ],
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
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      phoneNumberId: "12345",
      providerEventId: "wamid.outbound:read:1783315201:",
      type: "message.read",
    });
    expect(events[1]).toMatchObject({
      fromPhoneE164: "+919876543210",
      textPreview: "STATUS",
      type: "message.inbound",
    });
  });

  it("verifies Meta webhook signatures with HMAC SHA-256", async () => {
    const rawBody = JSON.stringify({ object: "whatsapp_business_account" });
    const digest = await hmacSha256Hex({
      secret: "app-secret",
      value: rawBody,
    });

    await expect(
      verifyMetaSignature({
        appSecret: "app-secret",
        rawBody,
        signatureHeader: `sha256=${digest}`,
      }),
    ).resolves.toBe(true);
  });
});
