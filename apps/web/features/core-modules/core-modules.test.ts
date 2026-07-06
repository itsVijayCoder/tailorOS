import { describe, expect, it } from "vitest";

import {
  calculateOrderFinancials,
  getDashboardSignals,
  getPartialDeliveryOrders,
  isWhatsAppFailureRetryable,
  searchPilotRecords,
  shopOrders,
  whatsAppFailures,
} from "./data";

describe("Phase 05 core modules", () => {
  it("normalizes shared mobile searches and returns the family before profiles", () => {
    const nationalResults = searchPilotRecords("09876543210");
    const formattedResults = searchPilotRecords("+91 98765 43210");

    expect(nationalResults[0]?.entityType).toBe("family");
    expect(nationalResults[0]?.title).toContain("FAM-MDU-00018");
    expect(nationalResults.some((result) => result.title.includes("CUS-MDU-000231"))).toBe(
      true,
    );
    expect(formattedResults.map((result) => result.id)).toEqual(
      nationalResults.map((result) => result.id),
    );
  });

  it("keeps partial delivery visible at item level", () => {
    const partialOrders = getPartialDeliveryOrders();
    const order = partialOrders.find(
      (candidate) => candidate.orderCode === "ORD-MDU-000421",
    );

    expect(order).toBeDefined();
    expect(order?.items.map((item) => item.status)).toEqual([
      "ready_for_pickup",
      "stitching",
    ]);
  });

  it("derives balances from advances, refunds, and corrections", () => {
    const correctedOrder = shopOrders.find(
      (order) => order.orderCode === "ORD-MDU-000421",
    );
    const refundedOrder = shopOrders.find(
      (order) => order.orderCode === "ORD-CBE-000144",
    );

    expect(correctedOrder).toBeDefined();
    expect(refundedOrder).toBeDefined();

    if (!correctedOrder || !refundedOrder) {
      throw new Error("Expected pilot orders to exist.");
    }

    expect(calculateOrderFinancials(correctedOrder)).toMatchObject({
      balanceDuePaise: 420000,
      correctedPaise: -50000,
      netPaidPaise: 200000,
    });
    expect(calculateOrderFinancials(refundedOrder)).toMatchObject({
      balanceDuePaise: 245000,
      netPaidPaise: 175000,
      refundedPaise: 25000,
    });
  });

  it("blocks opt-out WhatsApp failures from retry actions", () => {
    const optOutFailure = whatsAppFailures.find(
      (failure) => failure.status === "opted_out",
    );
    const retryableFailure = whatsAppFailures.find(
      (failure) => failure.status === "failed",
    );

    expect(optOutFailure).toBeDefined();
    expect(retryableFailure).toBeDefined();

    if (!optOutFailure || !retryableFailure) {
      throw new Error("Expected WhatsApp failure fixtures to exist.");
    }

    expect(isWhatsAppFailureRetryable(optOutFailure)).toBe(false);
    expect(isWhatsAppFailureRetryable(retryableFailure)).toBe(true);
  });

  it("summarizes dashboard signals from the same source data as module pages", () => {
    expect(getDashboardSignals()).toMatchObject({
      balanceDuePaise: 845000,
      dueTodayCount: 2,
      partialDeliveryCount: 1,
      readyItemCount: 1,
      retryableWhatsAppFailures: 1,
    });
  });
});
