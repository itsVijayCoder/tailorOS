/// <reference types="node" />

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  ContactProfileSummary,
  MeasurementVersionSummary,
  OrderSummary,
  PaymentSummary,
} from "@tailoros/schemas";

import {
  createContactWithProfilesService,
  createMeasurementVersionService,
  createOrderService,
  recordPaymentService,
  TenantDomainError,
  type ContactProfileCreateRecord,
  type CustomerProfileRecord,
  type MeasurementProfileRecord,
  type MeasurementVersionCreateRecord,
  type MeasurementVersionRecord,
  type OrderCreateRecord,
  type OrderPaymentState,
  type PaymentRecordBundle,
  type SearchResultRecord,
  type TenantDomainRepository,
} from "./domain-service";

const fixedNow = new Date("2026-07-05T10:00:00.000Z");
const runtime = {
  requestId: "req_phase04_domain",
  shopCode: "MDU",
  now: fixedNow,
};

describe("tenant domain services", () => {
  it("keeps one mobile as a contact with many customer profiles", async () => {
    const repository = new InMemoryTenantDomainRepository();

    const contact = await createContactWithProfilesService({
      repository,
      runtime,
      data: {
        primaryMobile: "+91 98765 43210",
        whatsappOptIn: true,
        createdByUserId: "usr_counter_01",
        profiles: [
          { fullName: "Meena Ravi", relationLabel: "self" },
          { fullName: "Ravi Kumar", relationLabel: "spouse" },
          { fullName: "Anika Ravi", relationLabel: "daughter" },
          { fullName: "Arun Ravi", relationLabel: "son" },
        ],
      },
    });

    expect(contact.primaryMobileE164).toBe("+919876543210");
    expect(contact.profiles).toHaveLength(4);
    await expect(
      createContactWithProfilesService({
        repository,
        runtime,
        data: {
          primaryMobile: "09876543210",
          whatsappOptIn: false,
          createdByUserId: "usr_counter_01",
          profiles: [{ fullName: "Duplicate Person" }],
        },
      }),
    ).rejects.toBeInstanceOf(TenantDomainError);
  });

  it("versions measurements and preserves order snapshots", async () => {
    const repository = new InMemoryTenantDomainRepository();
    const contact = await seedFamily(repository);
    const customerProfileId = contact.profiles[0]?.id;
    expect(customerProfileId).toBeDefined();

    const firstVersion = await createMeasurementVersionService({
      repository,
      runtime,
      data: {
        customerProfileId: customerProfileId!,
        garmentTypeCode: "blouse",
        displayName: "Blouse",
        values: { chest: 36, shoulder: 14 },
        unit: "inch",
        reason: "Initial capture",
        capturedByUserId: "usr_master_01",
      },
    });
    const order = await createOrderService({
      repository,
      runtime,
      data: {
        contactId: contact.contactId,
        customerProfileId: customerProfileId!,
        currentStatus: "booked",
        discountPaise: 0,
        promisedDeliveryDate: "2026-07-15",
        createdByUserId: "usr_counter_01",
        items: [
          {
            garmentTypeCode: "blouse",
            quantity: 1,
            pricePaise: 150000,
            measurementVersionId: firstVersion.measurementVersionId,
          },
        ],
      },
    });
    const secondVersion = await createMeasurementVersionService({
      repository,
      runtime,
      data: {
        customerProfileId: customerProfileId!,
        garmentTypeCode: "blouse",
        displayName: "Blouse",
        values: { chest: 38, shoulder: 14.5 },
        unit: "inch",
        reason: "Customer changed fit",
        capturedByUserId: "usr_master_01",
      },
    });

    expect(firstVersion.versionNo).toBe(1);
    expect(secondVersion.versionNo).toBe(2);
    expect(repository.orderSnapshots.get(order.orderId)?.[0]?.values).toEqual({
      chest: 36,
      shoulder: 14,
    });
  });

  it("uses payment ledger rows and audits corrections", async () => {
    const repository = new InMemoryTenantDomainRepository();
    const contact = await seedFamily(repository);
    const customerProfileId = contact.profiles[0]?.id;
    expect(customerProfileId).toBeDefined();
    const measurement = await createMeasurementVersionService({
      repository,
      runtime,
      data: {
        customerProfileId: customerProfileId!,
        garmentTypeCode: "blouse",
        displayName: "Blouse",
        values: { chest: 36 },
        unit: "inch",
        reason: "Initial capture",
        capturedByUserId: "usr_master_01",
      },
    });
    const order = await createOrderService({
      repository,
      runtime,
      data: {
        contactId: contact.contactId,
        customerProfileId: customerProfileId!,
        currentStatus: "booked",
        discountPaise: 0,
        createdByUserId: "usr_counter_01",
        items: [
          {
            garmentTypeCode: "blouse",
            quantity: 1,
            pricePaise: 200000,
            measurementVersionId: measurement.measurementVersionId,
          },
        ],
        advancePayment: {
          amountPaise: 50000,
          mode: "cash",
          recordedByUserId: "usr_cashier_01",
        },
      },
    });

    const correction = await recordPaymentService({
      repository,
      orderId: order.orderId,
      runtime,
      data: {
        amountPaise: -10000,
        mode: "adjustment",
        kind: "correction",
        reason: "Counter entered excess advance",
        recordedByUserId: "usr_owner_01",
      },
    });

    expect(order.balanceDuePaise).toBe(150000);
    expect(correction.balanceDuePaise).toBe(160000);
    expect(repository.audits.at(-1)?.action).toBe("payment.corrected");
    expect(repository.audits.at(-1)?.reason).toBe(
      "Counter entered excess advance",
    );
  });

  it("writes outbox events without coupling order creation to WhatsApp send", async () => {
    const repository = new InMemoryTenantDomainRepository();
    const contact = await seedFamily(repository);
    const customerProfileId = contact.profiles[0]?.id;
    expect(customerProfileId).toBeDefined();

    const order = await createOrderService({
      repository,
      runtime,
      data: {
        contactId: contact.contactId,
        customerProfileId: customerProfileId!,
        currentStatus: "booked",
        discountPaise: 0,
        createdByUserId: "usr_counter_01",
        items: [
          {
            garmentTypeCode: "alteration",
            quantity: 1,
            pricePaise: 50000,
            allowWithoutMeasurementReason: "Simple hem alteration",
          },
        ],
      },
    });

    expect(order.outboxEventIds).toHaveLength(2);
    expect(repository.outbox.map((event) => event.eventType)).toEqual([
      "ORDER_BOOKED",
      "RECEIPT_GENERATED",
    ]);
  });
});

describe("tenant D1 migration", () => {
  it("applies to a fresh SQLite database with seeds and FTS", () => {
    const require = createRequire(import.meta.url);
    const { DatabaseSync } = require("node:sqlite") as {
      DatabaseSync: new (path: string) => SqliteDatabase;
    };
    const db = new DatabaseSync(":memory:");
    const migration = readFileSync(
      join(process.cwd(), "apps/tenant-api-template/migrations/0001_tenant_domain.sql"),
      "utf8",
    );

    db.exec(migration);

    expect(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get("customer_contacts"),
    ).toEqual({ name: "customer_contacts" });
    expect(
      db
        .prepare("SELECT COUNT(*) AS count FROM garment_types")
        .get(),
    ).toEqual({ count: 8 });
    expect(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get("search_docs_fts"),
    ).toEqual({ name: "search_docs_fts" });

    db.close();
  });
});

async function seedFamily(repository: InMemoryTenantDomainRepository) {
  return createContactWithProfilesService({
    repository,
    runtime,
    data: {
      primaryMobile: "+91 98765 43210",
      whatsappOptIn: false,
      createdByUserId: "usr_counter_01",
      profiles: [{ fullName: "Meena Ravi", relationLabel: "self" }],
    },
  });
}

type SqliteStatement = {
  get(...params: unknown[]): unknown;
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
  close(): void;
};

class InMemoryTenantDomainRepository implements TenantDomainRepository {
  readonly contacts = new Map<string, ContactProfileSummary>();
  readonly profiles = new Map<string, CustomerProfileRecord>();
  readonly measurementProfiles = new Map<string, MeasurementProfileRecord>();
  readonly measurementVersions = new Map<string, MeasurementVersionRecord>();
  readonly orderStates = new Map<string, OrderPaymentState>();
  readonly orderSnapshots = new Map<
    string,
    { sourceMeasurementVersionId: string | null; values: Record<string, unknown> }[]
  >();
  readonly audits: ContactProfileCreateRecord["audit"][] = [];
  readonly outbox: OrderCreateRecord["outbox"] = [];
  readonly searchDocs: SearchResultRecord[] = [];

  async findContactByMobile(mobileE164: string) {
    return (
      [...this.contacts.values()].find(
        (contact) =>
          contact.primaryMobileE164 === mobileE164 ||
          contact.whatsappMobileE164 === mobileE164,
      ) ?? null
    );
  }

  async createContactWithProfiles(record: ContactProfileCreateRecord) {
    const summary: ContactProfileSummary = {
      contactId: record.contact.id,
      primaryMobileE164: record.contact.primaryMobileE164,
      primaryMobileNational: record.contact.primaryMobileNational,
      whatsappMobileE164: record.contact.whatsappMobileE164,
      whatsappOptIn: record.contact.whatsappOptIn,
      profiles: record.profiles.map((profile) => ({
        id: profile.id,
        customerCode: profile.customerCode,
        fullName: profile.fullName,
        relationLabel: profile.relationLabel,
        genderContext: profile.genderContext,
      })),
    };
    this.contacts.set(record.contact.id, summary);
    for (const profile of record.profiles) {
      this.profiles.set(profile.id, profile);
    }
    this.audits.push(record.audit);
    return summary;
  }

  async findCustomerProfile(customerProfileId: string) {
    return this.profiles.get(customerProfileId) ?? null;
  }

  async findMeasurementProfileById(measurementProfileId: string) {
    return this.measurementProfiles.get(measurementProfileId) ?? null;
  }

  async findMeasurementProfileByCustomerAndGarment(input: {
    customerProfileId: string;
    garmentTypeCode: string;
    displayName: string;
  }) {
    return (
      [...this.measurementProfiles.values()].find(
        (profile) =>
          profile.customerProfileId === input.customerProfileId &&
          profile.garmentTypeCode === input.garmentTypeCode &&
          profile.displayName === input.displayName,
      ) ?? null
    );
  }

  async createMeasurementVersion(record: MeasurementVersionCreateRecord) {
    const profile = {
      id: record.measurementProfile.id,
      customerProfileId: record.measurementProfile.customerProfileId,
      garmentTypeCode: record.measurementProfile.garmentTypeCode,
      displayName: record.measurementProfile.displayName,
      currentVersionId: record.version.id,
      currentVersionNo: record.version.versionNo,
    };
    this.measurementProfiles.set(profile.id, profile);
    this.measurementVersions.set(record.version.id, record.version);
    this.audits.push(record.audit);

    return {
      measurementProfileId: profile.id,
      measurementVersionId: record.version.id,
      customerProfileId: record.version.customerProfileId,
      garmentTypeCode: record.version.garmentTypeCode,
      versionNo: record.version.versionNo,
      values: record.version.values,
      unit: record.version.unit,
      capturedAt: record.version.capturedAt,
    } satisfies MeasurementVersionSummary;
  }

  async findMeasurementVersion(measurementVersionId: string) {
    return this.measurementVersions.get(measurementVersionId) ?? null;
  }

  async createOrder(record: OrderCreateRecord) {
    const payments = record.initialPayment
      ? [
          {
            id: record.initialPayment.id,
            paymentCode: record.initialPayment.paymentCode,
            amountPaise: record.initialPayment.amountPaise,
            mode: record.initialPayment.mode,
            kind: record.initialPayment.kind,
            reason: record.initialPayment.reason,
          },
        ]
      : [];
    this.orderStates.set(record.order.id, {
      orderId: record.order.id,
      orderCode: record.order.orderCode,
      contactId: record.order.contactId,
      customerProfileId: record.order.customerProfileId,
      finalTotalPaise: record.order.finalTotalPaise,
      balanceDuePaise: record.order.balanceDuePaise,
      receiptId: record.receipt.id,
      receiptCode: record.receipt.receiptCode,
      payments,
    });
    this.orderSnapshots.set(
      record.order.id,
      record.items.map((item) => ({
        sourceMeasurementVersionId: item.snapshot.sourceMeasurementVersionId,
        values: item.snapshot.values,
      })),
    );
    this.audits.push(record.audit);
    this.outbox.push(...record.outbox);

    return {
      orderId: record.order.id,
      orderCode: record.order.orderCode,
      contactId: record.order.contactId,
      customerProfileId: record.order.customerProfileId,
      currentStatus: record.order.currentStatus,
      itemCount: record.items.length,
      subtotalPaise: record.order.subtotalPaise,
      discountPaise: record.order.discountPaise,
      finalTotalPaise: record.order.finalTotalPaise,
      balanceDuePaise: record.order.balanceDuePaise,
      receiptId: record.receipt.id,
      outboxEventIds: record.outbox.map((outbox) => outbox.id),
    } satisfies OrderSummary;
  }

  async findOrderPaymentState(orderId: string) {
    return this.orderStates.get(orderId) ?? null;
  }

  async recordPayment(record: PaymentRecordBundle) {
    const order = this.orderStates.get(record.payment.orderId);
    if (!order) {
      throw new Error("Missing order in in-memory repository.");
    }

    order.payments.push({
      id: record.payment.id,
      paymentCode: record.payment.paymentCode,
      amountPaise: record.payment.amountPaise,
      mode: record.payment.mode,
      kind: record.payment.kind,
      reason: record.payment.reason,
    });
    order.balanceDuePaise = record.balanceDuePaise;
    this.audits.push(record.audit);
    this.outbox.push(...record.outbox);

    return {
      paymentId: record.payment.id,
      paymentCode: record.payment.paymentCode,
      orderId: record.payment.orderId,
      amountPaise: record.payment.amountPaise,
      mode: record.payment.mode,
      kind: record.payment.kind,
      balanceDuePaise: record.balanceDuePaise,
      receiptId: record.receipt.id,
      outboxEventIds: record.outbox.map((outbox) => outbox.id),
    } satisfies PaymentSummary;
  }

  async search() {
    return this.searchDocs;
  }
}
