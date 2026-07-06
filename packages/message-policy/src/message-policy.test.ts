import { describe, expect, it } from "vitest";

import { isOptOutText } from "./opt-out";
import { evaluateTemplateSendPolicy } from "./policy";
import { resolveSharedMobileInbound } from "./shared-mobile";
import { shouldApplyWhatsAppStatusUpdate } from "./status";

describe("WhatsApp message policy", () => {
  it("blocks missing consent before a provider send", () => {
    expect(
      evaluateTemplateSendPolicy({
        channelStatus: "active",
        credentialStatus: "active",
        consentState: "unknown",
        templateStatus: "approved",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "missing_consent",
      retryable: false,
    });
  });

  it("blocks non-required messages for opted-out recipients", () => {
    expect(
      evaluateTemplateSendPolicy({
        channelStatus: "active",
        credentialStatus: "active",
        consentState: "opted_out",
        templateStatus: "approved",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "opted_out",
      retryable: false,
    });
  });

  it("does not downgrade read status with an older delivered webhook", () => {
    expect(
      shouldApplyWhatsAppStatusUpdate({
        currentStatus: "read",
        nextStatus: "delivered",
      }),
    ).toBe(false);
  });

  it("detects English and Tamil opt-out phrases", () => {
    expect(isOptOutText("STOP")).toBe(true);
    expect(isOptOutText("வேண்டாம்")).toBe(true);
  });

  it("requires disambiguation for several active orders on one mobile", () => {
    expect(
      resolveSharedMobileInbound({
        activeOrders: [
          {
            orderId: "ord_1",
            orderCode: "ORD-MDU-000421",
            customerDisplayName: "Meena Ravi",
          },
          {
            orderId: "ord_2",
            orderCode: "ORD-MDU-000422",
            customerDisplayName: "Ravi Kumar",
          },
        ],
      }),
    ).toMatchObject({ kind: "disambiguation_required" });
  });
});
