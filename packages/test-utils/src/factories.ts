import { createStableId, normalizeIndianMobile } from "@tailoros/core";

export type TestFactorySequence = {
  nextEntropy(label?: string): string;
};

export type TestTenant = Readonly<{
  id: string;
  shopCode: string;
  slug: string;
  name: string;
  city: string;
  defaultLanguage: "en" | "ta";
}>;

export type TestContact = Readonly<{
  id: string;
  tenantId: string;
  familyId: string;
  familyCode: string;
  primaryMobileE164: string;
  primaryMobileNational: string;
  whatsappOptIn: boolean;
  address: string;
}>;

export type TestCustomerProfile = Readonly<{
  id: string;
  contactId: string;
  customerCode: string;
  fullName: string;
  relationLabel: string;
  garmentContext: string;
}>;

export type TestMeasurementProfile = Readonly<{
  id: string;
  customerId: string;
  garmentType: "blouse" | "shirt" | "pant" | "salwar_kameez" | "uniform";
  currentVersionNo: number;
  unit: "inch" | "cm";
}>;

export type TestMeasurementVersion = Readonly<{
  id: string;
  measurementProfileId: string;
  versionNo: number;
  unit: "inch" | "cm";
  reason: string;
  values: Record<string, string>;
}>;

export type TestOrderItem = Readonly<{
  id: string;
  itemCode: string;
  garmentType: string;
  status:
    | "confirmed"
    | "cutting"
    | "stitching"
    | "ready_for_pickup"
    | "delivered";
  measurementVersionId: string;
  promisedDate: string;
  pricePaise: number;
  overrideNote: string | null;
}>;

export type TestPayment = Readonly<{
  id: string;
  kind: "advance" | "balance" | "refund" | "correction";
  mode: "cash" | "upi" | "card" | "bank" | "adjustment";
  amountPaise: number;
  reason: string | null;
}>;

export type TestOrder = Readonly<{
  id: string;
  orderCode: string;
  receiptCode: string;
  tenantId: string;
  familyId: string;
  customerId: string;
  promisedDate: string;
  status: "confirmed" | "stitching" | "partial_ready" | "delivered";
  items: readonly TestOrderItem[];
  payments: readonly TestPayment[];
  totalPaise: number;
}>;

export type TestWhatsAppWebhook = Readonly<{
  id: string;
  provider: "meta";
  phoneNumberId: string;
  providerMessageId: string;
  providerEventId: string;
  status: "sent" | "delivered" | "read" | "failed";
  occurredAt: string;
  duplicateOf: string | null;
}>;

export function createTestFactorySequence(
  seed = "TOS",
): TestFactorySequence {
  let value = 0;

  return {
    nextEntropy(label = seed) {
      value += 1;
      return `${label}${value.toString().padStart(4, "0")}`.slice(0, 12);
    },
  };
}

export function makeTenant(
  input: Partial<Omit<TestTenant, "id">> & {
    sequence?: TestFactorySequence;
  } = {},
): TestTenant {
  const sequence = input.sequence ?? createTestFactorySequence("TEN");
  const shopCode = input.shopCode ?? "MDU";

  return {
    city: input.city ?? "Madurai",
    defaultLanguage: input.defaultLanguage ?? "ta",
    id: createStableId({
      entropy: sequence.nextEntropy("TEN"),
      prefix: "TEN",
      shopCode,
    }),
    name: input.name ?? "Sri Raja Tailors",
    shopCode,
    slug: input.slug ?? "sri-raja-tailors-madurai",
  };
}

export function makeContact(input: {
  tenant: TestTenant;
  mobile?: string;
  whatsappOptIn?: boolean;
  sequence?: TestFactorySequence;
}): TestContact {
  const sequence = input.sequence ?? createTestFactorySequence("CNT");
  const mobile = normalizeIndianMobile(input.mobile ?? "+91 98765 43210");
  const familyId = createStableId({
    entropy: sequence.nextEntropy("FAM"),
    prefix: "FAM",
    shopCode: input.tenant.shopCode,
  });

  return {
    address: `${input.tenant.city} main bazaar`,
    familyCode: familyId,
    familyId,
    id: createStableId({
      entropy: sequence.nextEntropy("CNT"),
      prefix: "CNT",
      shopCode: input.tenant.shopCode,
    }),
    primaryMobileE164: mobile.e164,
    primaryMobileNational: mobile.nationalNumber,
    tenantId: input.tenant.id,
    whatsappOptIn: input.whatsappOptIn ?? true,
  };
}

export function makeCustomerProfile(input: {
  contact: TestContact;
  fullName?: string;
  relationLabel?: string;
  garmentContext?: string;
  sequence?: TestFactorySequence;
}): TestCustomerProfile {
  const sequence = input.sequence ?? createTestFactorySequence("CUS");
  const customerCode = createStableId({
    entropy: sequence.nextEntropy("CUS"),
    prefix: "CUS",
  });

  return {
    contactId: input.contact.id,
    customerCode,
    fullName: input.fullName ?? "Meena Ravi",
    garmentContext: input.garmentContext ?? "Blouse, salwar",
    id: customerCode.toLowerCase().replaceAll("-", "_"),
    relationLabel: input.relationLabel ?? "Self",
  };
}

export function makeMeasurementProfile(input: {
  customer: TestCustomerProfile;
  garmentType?: TestMeasurementProfile["garmentType"];
  unit?: TestMeasurementProfile["unit"];
  sequence?: TestFactorySequence;
}): TestMeasurementProfile {
  const sequence = input.sequence ?? createTestFactorySequence("MPR");

  return {
    currentVersionNo: 1,
    customerId: input.customer.id,
    garmentType: input.garmentType ?? "blouse",
    id: createStableId({
      entropy: sequence.nextEntropy("MPR"),
      prefix: "MPR",
    }),
    unit: input.unit ?? "inch",
  };
}

export function makeMeasurementVersion(input: {
  profile: TestMeasurementProfile;
  reason?: string;
  values?: Record<string, string>;
  sequence?: TestFactorySequence;
}): TestMeasurementVersion {
  const sequence = input.sequence ?? createTestFactorySequence("MVR");

  return {
    id: createStableId({
      entropy: sequence.nextEntropy("MVR"),
      prefix: "MVR",
    }),
    measurementProfileId: input.profile.id,
    reason: input.reason ?? "Pilot fitting correction before cutting.",
    unit: input.profile.unit,
    values: input.values ?? {
      bust: "36",
      length: "14.5",
      shoulder: "14",
      sleeve: "11",
      waist: "32",
    },
    versionNo: input.profile.currentVersionNo,
  };
}

export function makePayment(
  input: Partial<Omit<TestPayment, "id">> & {
    sequence?: TestFactorySequence;
  } = {},
): TestPayment {
  const sequence = input.sequence ?? createTestFactorySequence("PAY");

  return {
    amountPaise: input.amountPaise ?? 250000,
    id: createStableId({
      entropy: sequence.nextEntropy("PAY"),
      prefix: "PAY",
    }),
    kind: input.kind ?? "advance",
    mode: input.mode ?? "upi",
    reason: input.reason ?? null,
  };
}

export function makeOrder(input: {
  tenant: TestTenant;
  contact: TestContact;
  customer: TestCustomerProfile;
  measurementVersion: TestMeasurementVersion;
  sequence?: TestFactorySequence;
  items?: readonly Partial<TestOrderItem>[];
  payments?: readonly TestPayment[];
}): TestOrder {
  const sequence = input.sequence ?? createTestFactorySequence("ORD");
  const orderCode = createStableId({
    entropy: sequence.nextEntropy("ORD"),
    prefix: "ORD",
    shopCode: input.tenant.shopCode,
  });
  const items =
    input.items?.map((item, index) => ({
      garmentType: item.garmentType ?? (index === 0 ? "Blouse" : "Salwar"),
      id:
        item.id ??
        createStableId({
          entropy: sequence.nextEntropy("ITM"),
          prefix: "ITM",
          shopCode: input.tenant.shopCode,
        }),
      itemCode: item.itemCode ?? `${orderCode}-${index + 1}`,
      measurementVersionId:
        item.measurementVersionId ?? input.measurementVersion.id,
      overrideNote: item.overrideNote ?? null,
      pricePaise: item.pricePaise ?? (index === 0 ? 320000 : 300000),
      promisedDate: item.promisedDate ?? "2026-07-08",
      status: item.status ?? (index === 0 ? "ready_for_pickup" : "stitching"),
    })) ??
    [
      {
        garmentType: "Blouse",
        id: createStableId({
          entropy: sequence.nextEntropy("ITM"),
          prefix: "ITM",
          shopCode: input.tenant.shopCode,
        }),
        itemCode: `${orderCode}-1`,
        measurementVersionId: input.measurementVersion.id,
        overrideNote: "Keep sleeve 0.5 inch loose for this order only.",
        pricePaise: 320000,
        promisedDate: "2026-07-07",
        status: "ready_for_pickup" as const,
      },
      {
        garmentType: "Salwar",
        id: createStableId({
          entropy: sequence.nextEntropy("ITM"),
          prefix: "ITM",
          shopCode: input.tenant.shopCode,
        }),
        itemCode: `${orderCode}-2`,
        measurementVersionId: input.measurementVersion.id,
        overrideNote: null,
        pricePaise: 300000,
        promisedDate: "2026-07-08",
        status: "stitching" as const,
      },
    ];
  const payments =
    input.payments ??
    [
      makePayment({ amountPaise: 250000, kind: "advance", mode: "upi" }),
      makePayment({
        amountPaise: -50000,
        kind: "correction",
        mode: "adjustment",
        reason: "UPI amount entered twice during rush hour.",
      }),
    ];

  return {
    customerId: input.customer.id,
    familyId: input.contact.familyId,
    id: orderCode.toLowerCase().replaceAll("-", "_"),
    items,
    orderCode,
    payments,
    promisedDate: "2026-07-08",
    receiptCode: createStableId({
      entropy: sequence.nextEntropy("RCT"),
      prefix: "RCT",
      shopCode: input.tenant.shopCode,
    }),
    status: "partial_ready",
    tenantId: input.tenant.id,
    totalPaise: items.reduce((total, item) => total + item.pricePaise, 0),
  };
}

export function makeWhatsAppWebhook(
  input: Partial<Omit<TestWhatsAppWebhook, "id">> & {
    sequence?: TestFactorySequence;
  } = {},
): TestWhatsAppWebhook {
  const sequence = input.sequence ?? createTestFactorySequence("WEV");
  const providerEventId =
    input.providerEventId ?? `wamid.event.${sequence.nextEntropy("EVT")}`;

  return {
    duplicateOf: input.duplicateOf ?? null,
    id: createStableId({
      entropy: sequence.nextEntropy("WEV"),
      prefix: "WEV",
    }),
    occurredAt: input.occurredAt ?? "2026-07-06T10:00:00.000+05:30",
    phoneNumberId: input.phoneNumberId ?? "1234567890",
    provider: "meta",
    providerEventId,
    providerMessageId: input.providerMessageId ?? "wamid.tailoros.001",
    status: input.status ?? "delivered",
  };
}

export function makePhase09PilotDataset() {
  const sequence = createTestFactorySequence("P09");
  const tenant = makeTenant({ sequence });
  const contact = makeContact({
    mobile: "+91 98765 43210",
    sequence,
    tenant,
  });
  const profiles = [
    makeCustomerProfile({
      contact,
      fullName: "Meena Ravi",
      garmentContext: "Blouse, salwar",
      relationLabel: "Self",
      sequence,
    }),
    makeCustomerProfile({
      contact,
      fullName: "Ravi Kumar",
      garmentContext: "Shirt, pant",
      relationLabel: "Spouse",
      sequence,
    }),
    makeCustomerProfile({
      contact,
      fullName: "Ananya Ravi",
      garmentContext: "Kidswear",
      relationLabel: "Daughter",
      sequence,
    }),
    makeCustomerProfile({
      contact,
      fullName: "Meena R.",
      garmentContext: "Blouse alteration",
      relationLabel: "Mother",
      sequence,
    }),
  ] as const;
  const measurementProfile = makeMeasurementProfile({
    customer: profiles[0],
    sequence,
  });
  const measurementVersion = makeMeasurementVersion({
    profile: measurementProfile,
    sequence,
  });
  const order = makeOrder({
    contact,
    customer: profiles[0],
    measurementVersion,
    sequence,
    tenant,
  });
  const webhooks = [
    makeWhatsAppWebhook({
      occurredAt: "2026-07-06T10:00:00.000+05:30",
      sequence,
      status: "delivered",
    }),
    makeWhatsAppWebhook({
      duplicateOf: "wamid.event.P090021",
      occurredAt: "2026-07-06T10:00:03.000+05:30",
      providerEventId: "wamid.event.P090021",
      sequence,
      status: "delivered",
    }),
    makeWhatsAppWebhook({
      occurredAt: "2026-07-06T09:59:30.000+05:30",
      sequence,
      status: "sent",
    }),
  ] as const;

  return {
    contact,
    measurementProfile,
    measurementVersion,
    order,
    profiles,
    tenant,
    webhooks,
  } as const;
}
