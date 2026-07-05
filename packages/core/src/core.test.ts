import { describe, expect, it } from "vitest";

import {
  calculatePaymentLedger,
  nextVersionNumber,
  normalizeSearchText,
} from "./domain";
import { createStableId } from "./ids";
import { addMoney, moneyFromRupees, subtractMoney } from "./money";
import { canTransitionOrder, transitionOrder } from "./order-state";
import { normalizeIndianMobile } from "./phone";

describe("TailorOS core domain utilities", () => {
  it("normalizes Indian mobile input without treating mobile as identity", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toEqual({
      countryCode: "91",
      nationalNumber: "9876543210",
      e164: "+919876543210",
    });
    expect(normalizeIndianMobile("09876543210").e164).toBe("+919876543210");
  });

  it("creates readable stable IDs with tenant shop code prefixes", () => {
    expect(
      createStableId({
        prefix: "ORD",
        shopCode: "mdu",
        entropy: "000231",
      }),
    ).toBe("ORD-MDU-000231");
  });

  it("calculates rupee money in paise", () => {
    const total = moneyFromRupees("1200.50");
    const advance = moneyFromRupees("200.25");

    expect(addMoney([total, advance]).paise).toBe(140075);
    expect(subtractMoney(total, advance)).toEqual({
      currency: "INR",
      paise: 100025,
    });
  });

  it("enforces the order state machine", () => {
    expect(canTransitionOrder("booked", "material_confirmed")).toBe(true);
    expect(() =>
      transitionOrder({ from: "ready_for_pickup", to: "stitching" }),
    ).toThrow("Invalid order transition");
    expect(() => transitionOrder({ from: "booked", to: "cancelled" })).toThrow(
      "requires a reason",
    );
  });

  it("calculates ledger balance without mutating payment history", () => {
    expect(
      calculatePaymentLedger({
        finalTotalPaise: 500_00,
        payments: [
          { kind: "advance", amountPaise: 200_00 },
          { kind: "balance", amountPaise: 100_00 },
          { kind: "refund", amountPaise: 50_00 },
          { kind: "correction", amountPaise: -25_00 },
        ],
      }),
    ).toEqual({
      chargedPaise: 500_00,
      collectedPaise: 300_00,
      refundedPaise: 50_00,
      correctedPaise: -25_00,
      netPaidPaise: 225_00,
      balanceDuePaise: 275_00,
    });
  });

  it("normalizes search text and advances measurement versions", () => {
    expect(normalizeSearchText("  Meena   Ravi / ORD-1042 ")).toBe(
      "meena ravi ord 1042",
    );
    expect(nextVersionNumber(null)).toBe(1);
    expect(nextVersionNumber(3)).toBe(4);
  });
});
