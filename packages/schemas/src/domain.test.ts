import { describe, expect, it } from "vitest";

import {
  createContactWithProfilesSchema,
  createMeasurementVersionSchema,
  createOrderSchema,
  recordPaymentSchema,
} from "./domain";

describe("tenant domain schemas", () => {
  it("accepts one mobile contact with many customer profiles", () => {
    const parsed = createContactWithProfilesSchema.safeParse({
      primaryMobile: "+91 98765 43210",
      whatsappOptIn: true,
      profiles: [
        { fullName: "Meena Ravi", relationLabel: "self" },
        { fullName: "Anika Ravi", relationLabel: "daughter" },
      ],
      createdByUserId: "usr_counter_01",
    });

    expect(parsed.success).toBe(true);
  });

  it("requires measurement values and a change reason", () => {
    const parsed = createMeasurementVersionSchema.safeParse({
      customerProfileId: "CUS-MDU-0001",
      garmentTypeCode: "blouse",
      values: {
        chest: 36,
        shoulder: 14.5,
      },
      reason: "New blouse measurement",
      capturedByUserId: "usr_master_01",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts an order with item snapshots and advance payment", () => {
    const parsed = createOrderSchema.safeParse({
      contactId: "CNT-MDU-0001",
      customerProfileId: "CUS-MDU-0001",
      promisedDeliveryDate: "2026-07-12",
      createdByUserId: "usr_counter_01",
      items: [
        {
          garmentTypeCode: "blouse",
          pricePaise: 150000,
          measurementVersionId: "MVR-MDU-0001",
          measurementValues: {
            chest: 36,
            shoulder: 14.5,
          },
        },
      ],
      advancePayment: {
        amountPaise: 50000,
        mode: "upi",
        recordedByUserId: "usr_cashier_01",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("requires a reason for refunds and corrections", () => {
    const parsed = recordPaymentSchema.safeParse({
      amountPaise: 2500,
      mode: "adjustment",
      kind: "correction",
      recordedByUserId: "usr_owner_01",
    });

    expect(parsed.success).toBe(false);
  });
});
