import { describe, expect, it } from "vitest";

import {
  createTestFactorySequence,
  makeContact,
  makeCustomerProfile,
  makeOrder,
  makePayment,
  makePhase09PilotDataset,
  makeTenant,
} from "./factories";

describe("Phase 09 test factories", () => {
  it("creates deterministic tenant and shared-mobile family fixtures", () => {
    const first = makePhase09PilotDataset();
    const second = makePhase09PilotDataset();

    expect(first.tenant).toEqual(second.tenant);
    expect(first.contact.primaryMobileE164).toBe("+919876543210");
    expect(first.profiles.map((profile) => profile.relationLabel)).toEqual([
      "Self",
      "Spouse",
      "Daughter",
      "Mother",
    ]);
  });

  it("normalizes duplicate mobile variants to the same contact index", () => {
    const tenant = makeTenant({
      sequence: createTestFactorySequence("DUP"),
    });
    const formatted = makeContact({
      mobile: "+91 98765 43210",
      sequence: createTestFactorySequence("DPA"),
      tenant,
    });
    const national = makeContact({
      mobile: "09876543210",
      sequence: createTestFactorySequence("DPB"),
      tenant,
    });

    expect(formatted.primaryMobileE164).toBe(national.primaryMobileE164);
    expect(formatted.primaryMobileNational).toBe("9876543210");
  });

  it("keeps partial delivery and payment correction cases visible", () => {
    const dataset = makePhase09PilotDataset();

    expect(dataset.order.items.map((item) => item.status)).toEqual([
      "ready_for_pickup",
      "stitching",
    ]);
    expect(dataset.order.payments).toContainEqual(
      expect.objectContaining({
        amountPaise: -50000,
        kind: "correction",
        reason: "UPI amount entered twice during rush hour.",
      }),
    );
  });

  it("allows focused overrides for payment and order factories", () => {
    const tenant = makeTenant({
      sequence: createTestFactorySequence("OVR"),
    });
    const contact = makeContact({ sequence: createTestFactorySequence("CTA"), tenant });
    const profile = makeCustomerProfile({
      contact,
      sequence: createTestFactorySequence("CPA"),
    });
    const dataset = makePhase09PilotDataset();
    const order = makeOrder({
      contact,
      customer: profile,
      measurementVersion: dataset.measurementVersion,
      payments: [
        makePayment({
          amountPaise: 120000,
          kind: "advance",
          mode: "cash",
          sequence: createTestFactorySequence("PAY"),
        }),
      ],
      sequence: createTestFactorySequence("ORD"),
      tenant,
    });

    expect(order.payments).toEqual([
      expect.objectContaining({
        amountPaise: 120000,
        kind: "advance",
        mode: "cash",
      }),
    ]);
  });

  it("models duplicate and out-of-order WhatsApp webhook fixtures", () => {
    const dataset = makePhase09PilotDataset();

    expect(dataset.webhooks[1]).toMatchObject({
      duplicateOf: "wamid.event.P090021",
      providerEventId: "wamid.event.P090021",
    });
    expect(dataset.webhooks[2]).toMatchObject({
      status: "sent",
    });
  });
});
