import { describe, expect, it } from "vitest";

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
});
