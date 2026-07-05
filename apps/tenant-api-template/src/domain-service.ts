import {
  calculatePaymentLedger,
  createStableId,
  type EntityPrefix,
  nextVersionNumber,
  normalizeIndianMobile,
  normalizeSearchText,
  type PaymentLedgerEntry,
} from "@tailoros/core";
import type {
  ContactProfileSummary,
  CreateContactWithProfiles,
  CreateMeasurementVersion,
  CreateOrder,
  DomainOutboxEventType,
  MeasurementVersionSummary,
  OrderItemInput,
  OrderSummary,
  PaymentKind,
  PaymentMode,
  PaymentSummary,
  RecordPayment,
} from "@tailoros/schemas";

type DomainErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT";
type DomainErrorStatus = 400 | 404 | 409;

export class TenantDomainError extends Error {
  readonly code: DomainErrorCode;
  readonly status: DomainErrorStatus;
  readonly fields?: Record<string, string[]>;

  constructor(input: {
    code: DomainErrorCode;
    message: string;
    status: DomainErrorStatus;
    fields?: Record<string, string[]>;
  }) {
    super(input.message);
    this.name = "TenantDomainError";
    this.code = input.code;
    this.status = input.status;
    if (input.fields) {
      this.fields = input.fields;
    }
  }
}

export type TenantDomainRuntime = {
  requestId: string;
  shopCode?: string;
  now?: Date;
};

export type CustomerProfileRecord = {
  id: string;
  contactId: string;
  customerCode: string;
  fullName: string;
  relationLabel: string | null;
  genderContext: string | null;
};

export type MeasurementProfileRecord = {
  id: string;
  customerProfileId: string;
  garmentTypeCode: string;
  displayName: string;
  currentVersionId: string | null;
  currentVersionNo: number | null;
};

export type MeasurementVersionRecord = {
  id: string;
  measurementProfileId: string;
  customerProfileId: string;
  garmentTypeCode: string;
  versionNo: number;
  values: Record<string, string | number | boolean | null>;
  unit: "inch" | "cm";
};

export type PersistedPaymentRecord = PaymentLedgerEntry & {
  id: string;
  paymentCode: string;
  mode: PaymentMode;
  reason: string | null;
};

export type OrderPaymentState = {
  orderId: string;
  orderCode: string;
  contactId: string;
  customerProfileId: string;
  finalTotalPaise: number;
  balanceDuePaise: number;
  receiptId: string | null;
  receiptCode: string | null;
  payments: PersistedPaymentRecord[];
};

export type SearchResultRecord = {
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  payload: Record<string, unknown>;
};

export type DomainAuditRecord = {
  id: string;
  actorType: "user" | "system" | "support";
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  requestId: string;
  createdAt: string;
};

export type DomainOutboxRecord = {
  id: string;
  eventType: DomainOutboxEventType;
  aggregateType: string;
  aggregateId: string;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SearchProjectionRecord = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  searchText: string;
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type ContactProfileCreateRecord = {
  contact: {
    id: string;
    primaryMobileE164: string;
    primaryMobileNational: string;
    whatsappMobileE164: string | null;
    whatsappOptIn: boolean;
    addressJson: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  profiles: CustomerProfileRecord[];
  phoneHistory: {
    id: string;
    phoneE164: string;
    phoneNational: string;
    phoneKind: "primary" | "whatsapp";
  }[];
  audit: DomainAuditRecord;
  search: SearchProjectionRecord[];
};

export type MeasurementVersionCreateRecord = {
  measurementProfile: MeasurementProfileRecord & {
    createdAt: string;
    updatedAt: string;
    shouldCreate: boolean;
  };
  version: MeasurementVersionRecord & {
    fitNotes: string | null;
    reason: string;
    capturedByUserId: string;
    capturedAt: string;
  };
  audit: DomainAuditRecord;
  search: SearchProjectionRecord;
};

export type OrderItemCreateRecord = {
  id: string;
  itemCode: string;
  garmentTypeCode: string;
  quantity: number;
  itemStatus: string;
  pricePaise: number;
  assignedStaffUserId: string | null;
  promisedDeliveryDate: string | null;
  notes: string | null;
  snapshot: {
    id: string;
    sourceMeasurementVersionId: string | null;
    values: Record<string, string | number | boolean | null>;
    override: Record<string, string | number | boolean | null> | null;
  };
};

export type OrderCreateRecord = {
  order: {
    id: string;
    orderCode: string;
    contactId: string;
    customerProfileId: string;
    currentStatus: OrderSummary["currentStatus"];
    orderDate: string;
    trialDate: string | null;
    promisedDeliveryDate: string | null;
    subtotalPaise: number;
    discountPaise: number;
    finalTotalPaise: number;
    balanceDuePaise: number;
    notes: string | null;
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
  };
  items: OrderItemCreateRecord[];
  initialPayment: PaymentCreateRecord | null;
  receipt: ReceiptUpsertRecord;
  audit: DomainAuditRecord;
  outbox: DomainOutboxRecord[];
  search: SearchProjectionRecord[];
};

export type PaymentCreateRecord = {
  id: string;
  paymentCode: string;
  orderId: string;
  amountPaise: number;
  mode: PaymentMode;
  kind: PaymentKind;
  reference: string | null;
  reason: string | null;
  recordedByUserId: string;
  recordedAt: string;
};

export type ReceiptUpsertRecord = {
  id: string;
  receiptCode: string;
  orderId: string;
  status: "draft" | "partial" | "paid" | "void";
  paidPaise: number;
  balanceDuePaise: number;
  issuedByUserId: string;
  issuedAt: string;
  updatedAt: string;
};

export type PaymentRecordBundle = {
  payment: PaymentCreateRecord;
  receipt: ReceiptUpsertRecord;
  balanceDuePaise: number;
  audit: DomainAuditRecord;
  outbox: DomainOutboxRecord[];
  search: SearchProjectionRecord;
};

export type TenantDomainRepository = {
  findContactByMobile(
    mobileE164: string,
  ): Promise<ContactProfileSummary | null>;
  createContactWithProfiles(
    record: ContactProfileCreateRecord,
  ): Promise<ContactProfileSummary>;
  findCustomerProfile(
    customerProfileId: string,
  ): Promise<CustomerProfileRecord | null>;
  findMeasurementProfileById(
    measurementProfileId: string,
  ): Promise<MeasurementProfileRecord | null>;
  findMeasurementProfileByCustomerAndGarment(input: {
    customerProfileId: string;
    garmentTypeCode: string;
    displayName: string;
  }): Promise<MeasurementProfileRecord | null>;
  createMeasurementVersion(
    record: MeasurementVersionCreateRecord,
  ): Promise<MeasurementVersionSummary>;
  findMeasurementVersion(
    measurementVersionId: string,
  ): Promise<MeasurementVersionRecord | null>;
  createOrder(record: OrderCreateRecord): Promise<OrderSummary>;
  findOrderPaymentState(orderId: string): Promise<OrderPaymentState | null>;
  recordPayment(record: PaymentRecordBundle): Promise<PaymentSummary>;
  search(input: {
    query: string;
    limit: number;
  }): Promise<SearchResultRecord[]>;
};

const simpleServiceGarments = new Set(["alteration", "sari_fall"]);

export async function createContactWithProfilesService(input: {
  repository: TenantDomainRepository;
  data: CreateContactWithProfiles;
  runtime: TenantDomainRuntime;
}): Promise<ContactProfileSummary> {
  const now = toIso(input.runtime.now);
  const primaryMobile = normalizeMobile(
    input.data.primaryMobile,
    "primaryMobile",
  );
  const whatsappMobile = input.data.whatsappMobile
    ? normalizeMobile(input.data.whatsappMobile, "whatsappMobile")
    : null;
  const existing = await input.repository.findContactByMobile(
    primaryMobile.e164,
  );

  if (existing) {
    throw new TenantDomainError({
      code: "CONFLICT",
      message:
        "A contact already exists for this mobile. Add family profiles to that contact instead.",
      status: 409,
      fields: { primaryMobile: ["Mobile number already exists."] },
    });
  }

  const contactId = createDomainId("CNT", input.runtime);
  const profiles = input.data.profiles.map<CustomerProfileRecord>((profile) => {
    const id = createDomainId("CUS", input.runtime);
    return {
      id,
      customerCode: id,
      contactId,
      fullName: profile.fullName,
      relationLabel: profile.relationLabel ?? null,
      genderContext: profile.genderContext ?? null,
    };
  });

  return input.repository.createContactWithProfiles({
    contact: {
      id: contactId,
      primaryMobileE164: primaryMobile.e164,
      primaryMobileNational: primaryMobile.nationalNumber,
      whatsappMobileE164: whatsappMobile?.e164 ?? null,
      whatsappOptIn: input.data.whatsappOptIn,
      addressJson: input.data.address
        ? JSON.stringify(input.data.address)
        : null,
      notes: input.data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    },
    profiles,
    phoneHistory: [
      {
        id: createDomainId("CNT", input.runtime),
        phoneE164: primaryMobile.e164,
        phoneNational: primaryMobile.nationalNumber,
        phoneKind: "primary",
      },
      ...(whatsappMobile
        ? [
            {
              id: createDomainId("CNT", input.runtime),
              phoneE164: whatsappMobile.e164,
              phoneNational: whatsappMobile.nationalNumber,
              phoneKind: "whatsapp" as const,
            },
          ]
        : []),
    ],
    audit: createAudit({
      action: "contact.created",
      actorUserId: input.data.createdByUserId,
      entityType: "customer_contact",
      entityId: contactId,
      requestId: input.runtime.requestId,
      after: { contactId, profileIds: profiles.map((profile) => profile.id) },
      now,
    }),
    search: [
      createSearchProjection({
        id: createDomainId("SCH", input.runtime),
        entityType: "contact",
        entityId: contactId,
        title: primaryMobile.e164,
        subtitle: profiles.map((profile) => profile.fullName).join(", "),
        fields: [
          primaryMobile.e164,
          primaryMobile.nationalNumber,
          ...profiles.map((profile) => profile.fullName),
          ...profiles.map((profile) => profile.customerCode),
        ],
        payload: {
          contactId,
          profileIds: profiles.map((profile) => profile.id),
        },
        updatedAt: now,
      }),
      ...profiles.map((profile) =>
        createSearchProjection({
          id: createDomainId("SCH", input.runtime),
          entityType: "customer_profile",
          entityId: profile.id,
          title: profile.fullName,
          subtitle: primaryMobile.e164,
          fields: [
            profile.fullName,
            profile.customerCode,
            profile.relationLabel ?? "",
            primaryMobile.e164,
            primaryMobile.nationalNumber,
          ],
          payload: { contactId, customerProfileId: profile.id },
          updatedAt: now,
        }),
      ),
    ],
  });
}

export async function createMeasurementVersionService(input: {
  repository: TenantDomainRepository;
  data: CreateMeasurementVersion;
  runtime: TenantDomainRuntime;
}): Promise<MeasurementVersionSummary> {
  const now = toIso(input.runtime.now);
  const profile = await input.repository.findCustomerProfile(
    input.data.customerProfileId,
  );

  if (!profile) {
    throw notFound("Customer profile was not found.", "customerProfileId");
  }

  const displayName =
    input.data.displayName ?? `${input.data.garmentTypeCode} measurements`;
  const measurementProfile = await resolveMeasurementProfile({
    repository: input.repository,
    data: input.data,
    displayName,
    runtime: input.runtime,
    now,
  });
  const versionNo = nextVersionNumber(measurementProfile.currentVersionNo);
  const measurementVersionId = createDomainId("MVR", input.runtime);

  return input.repository.createMeasurementVersion({
    measurementProfile: {
      ...measurementProfile,
      currentVersionId: measurementVersionId,
      currentVersionNo: versionNo,
      createdAt: now,
      updatedAt: now,
    },
    version: {
      id: measurementVersionId,
      measurementProfileId: measurementProfile.id,
      customerProfileId: profile.id,
      garmentTypeCode: input.data.garmentTypeCode,
      versionNo,
      values: input.data.values,
      unit: input.data.unit,
      fitNotes: input.data.fitNotes ?? null,
      reason: input.data.reason,
      capturedByUserId: input.data.capturedByUserId,
      capturedAt: now,
    },
    audit: createAudit({
      action: "measurement.version_created",
      actorUserId: input.data.capturedByUserId,
      entityType: "measurement_profile",
      entityId: measurementProfile.id,
      reason: input.data.reason,
      requestId: input.runtime.requestId,
      after: {
        measurementProfileId: measurementProfile.id,
        measurementVersionId,
        versionNo,
      },
      now,
    }),
    search: createSearchProjection({
      id: createDomainId("SCH", input.runtime),
      entityType: "measurement_profile",
      entityId: measurementProfile.id,
      title: `${profile.fullName} - ${displayName}`,
      subtitle: `v${versionNo} ${input.data.unit}`,
      fields: [
        profile.fullName,
        profile.customerCode,
        input.data.garmentTypeCode,
        displayName,
        Object.keys(input.data.values).join(" "),
      ],
      payload: {
        customerProfileId: profile.id,
        measurementProfileId: measurementProfile.id,
        measurementVersionId,
      },
      updatedAt: now,
    }),
  });
}

export async function createOrderService(input: {
  repository: TenantDomainRepository;
  data: CreateOrder;
  runtime: TenantDomainRuntime;
}): Promise<OrderSummary> {
  const now = toIso(input.runtime.now);
  const orderDate = input.data.orderDate ?? now.slice(0, 10);
  const profile = await input.repository.findCustomerProfile(
    input.data.customerProfileId,
  );

  if (!profile) {
    throw notFound("Customer profile was not found.", "customerProfileId");
  }

  if (profile.contactId !== input.data.contactId) {
    throw new TenantDomainError({
      code: "VALIDATION_ERROR",
      message: "Selected customer profile does not belong to the contact.",
      status: 400,
      fields: {
        customerProfileId: [
          "Choose a profile under the selected family/contact before ordering.",
        ],
      },
    });
  }

  const orderId = createDomainId("ORD", input.runtime);
  const items = await Promise.all(
    input.data.items.map((item, index) =>
      buildOrderItem({
        repository: input.repository,
        item,
        index,
        runtime: input.runtime,
      }),
    ),
  );
  const subtotalPaise = items.reduce(
    (total, item) => total + item.pricePaise * item.quantity,
    0,
  );
  const finalTotalPaise = Math.max(subtotalPaise - input.data.discountPaise, 0);
  const initialPayment = input.data.advancePayment
    ? createPaymentRecord({
        orderId,
        amountPaise: input.data.advancePayment.amountPaise,
        mode: input.data.advancePayment.mode,
        kind: "advance",
        reference: input.data.advancePayment.reference ?? null,
        reason: null,
        recordedByUserId: input.data.advancePayment.recordedByUserId,
        runtime: input.runtime,
        now,
      })
    : null;

  if (initialPayment && initialPayment.amountPaise > finalTotalPaise) {
    throw new TenantDomainError({
      code: "VALIDATION_ERROR",
      message: "Advance cannot exceed the order total.",
      status: 400,
      fields: { advancePayment: ["Advance cannot exceed final total."] },
    });
  }

  const ledger = calculatePaymentLedger({
    finalTotalPaise,
    payments: initialPayment
      ? [{ kind: initialPayment.kind, amountPaise: initialPayment.amountPaise }]
      : [],
  });
  const receipt = createReceiptRecord({
    orderId,
    paidPaise: ledger.netPaidPaise,
    balanceDuePaise: ledger.balanceDuePaise,
    issuedByUserId: input.data.createdByUserId,
    runtime: input.runtime,
    now,
  });
  const outbox = [
    createOutboxEvent({
      eventType: "ORDER_BOOKED",
      aggregateType: "order",
      aggregateId: orderId,
      payload: {
        orderId,
        customerProfileId: profile.id,
        contactId: profile.contactId,
        itemCount: items.length,
      },
      runtime: input.runtime,
      now,
    }),
    createOutboxEvent({
      eventType: "RECEIPT_GENERATED",
      aggregateType: "receipt",
      aggregateId: receipt.id,
      payload: {
        receiptId: receipt.id,
        orderId,
        paidPaise: receipt.paidPaise,
        balanceDuePaise: receipt.balanceDuePaise,
      },
      runtime: input.runtime,
      now,
    }),
    ...(initialPayment
      ? [
          createOutboxEvent({
            eventType: "PAYMENT_RECEIVED",
            aggregateType: "payment",
            aggregateId: initialPayment.id,
            payload: {
              paymentId: initialPayment.id,
              orderId,
              amountPaise: initialPayment.amountPaise,
              balanceDuePaise: ledger.balanceDuePaise,
            },
            runtime: input.runtime,
            now,
          }),
        ]
      : []),
  ];

  return input.repository.createOrder({
    order: {
      id: orderId,
      orderCode: orderId,
      contactId: input.data.contactId,
      customerProfileId: input.data.customerProfileId,
      currentStatus: input.data.currentStatus,
      orderDate,
      trialDate: input.data.trialDate ?? null,
      promisedDeliveryDate: input.data.promisedDeliveryDate ?? null,
      subtotalPaise,
      discountPaise: input.data.discountPaise,
      finalTotalPaise,
      balanceDuePaise: ledger.balanceDuePaise,
      notes: input.data.notes ?? null,
      createdByUserId: input.data.createdByUserId,
      createdAt: now,
      updatedAt: now,
    },
    items,
    initialPayment,
    receipt,
    audit: createAudit({
      action: "order.created",
      actorUserId: input.data.createdByUserId,
      entityType: "order",
      entityId: orderId,
      requestId: input.runtime.requestId,
      after: {
        orderId,
        customerProfileId: profile.id,
        finalTotalPaise,
        balanceDuePaise: ledger.balanceDuePaise,
      },
      now,
    }),
    outbox,
    search: [
      createSearchProjection({
        id: createDomainId("SCH", input.runtime),
        entityType: "order",
        entityId: orderId,
        title: orderId,
        subtitle: profile.fullName,
        fields: [
          orderId,
          profile.fullName,
          profile.customerCode,
          input.data.currentStatus,
          ...items.map((item) => item.garmentTypeCode),
        ],
        payload: {
          orderId,
          customerProfileId: profile.id,
          contactId: profile.contactId,
          balanceDuePaise: ledger.balanceDuePaise,
        },
        updatedAt: now,
      }),
    ],
  });
}

export async function recordPaymentService(input: {
  repository: TenantDomainRepository;
  orderId: string;
  data: RecordPayment;
  runtime: TenantDomainRuntime;
}): Promise<PaymentSummary> {
  const now = toIso(input.runtime.now);
  const order = await input.repository.findOrderPaymentState(input.orderId);

  if (!order) {
    throw notFound("Order was not found.", "orderId");
  }

  const payment = createPaymentRecord({
    orderId: order.orderId,
    amountPaise: input.data.amountPaise,
    mode: input.data.mode,
    kind: input.data.kind,
    reference: input.data.reference ?? null,
    reason: input.data.reason ?? null,
    recordedByUserId: input.data.recordedByUserId,
    runtime: input.runtime,
    now,
  });
  const projectedPayments = [
    ...order.payments.map((item) => ({
      amountPaise: item.amountPaise,
      kind: item.kind,
    })),
    { amountPaise: payment.amountPaise, kind: payment.kind },
  ];
  const ledger = calculatePaymentLedger({
    finalTotalPaise: order.finalTotalPaise,
    payments: projectedPayments,
  });

  if (
    (payment.kind === "advance" || payment.kind === "balance") &&
    ledger.netPaidPaise > order.finalTotalPaise
  ) {
    throw new TenantDomainError({
      code: "VALIDATION_ERROR",
      message: "Payment would exceed the order total.",
      status: 400,
      fields: { amountPaise: ["Payment would exceed the order total."] },
    });
  }

  const receipt = createReceiptRecord({
    orderId: order.orderId,
    paidPaise: ledger.netPaidPaise,
    balanceDuePaise: ledger.balanceDuePaise,
    issuedByUserId: input.data.recordedByUserId,
    runtime: input.runtime,
    now,
    ...(order.receiptId ? { receiptId: order.receiptId } : {}),
    ...(order.receiptCode ? { receiptCode: order.receiptCode } : {}),
  });
  const outbox = [
    createOutboxEvent({
      eventType: "PAYMENT_RECEIVED",
      aggregateType: "payment",
      aggregateId: payment.id,
      payload: {
        paymentId: payment.id,
        orderId: order.orderId,
        receiptId: receipt.id,
        amountPaise: payment.amountPaise,
        mode: payment.mode,
        kind: payment.kind,
        balanceDuePaise: ledger.balanceDuePaise,
      },
      runtime: input.runtime,
      now,
    }),
    createOutboxEvent({
      eventType: "RECEIPT_GENERATED",
      aggregateType: "receipt",
      aggregateId: receipt.id,
      payload: {
        receiptId: receipt.id,
        orderId: order.orderId,
        paidPaise: receipt.paidPaise,
        balanceDuePaise: receipt.balanceDuePaise,
      },
      runtime: input.runtime,
      now,
    }),
  ];

  return input.repository.recordPayment({
    payment,
    receipt,
    balanceDuePaise: ledger.balanceDuePaise,
    audit: createAudit({
      action:
        payment.kind === "correction"
          ? "payment.corrected"
          : payment.kind === "refund"
            ? "payment.refunded"
            : "payment.recorded",
      actorUserId: input.data.recordedByUserId,
      entityType: "order",
      entityId: order.orderId,
      reason: input.data.reason ?? null,
      requestId: input.runtime.requestId,
      before: { balanceDuePaise: order.balanceDuePaise },
      after: {
        paymentId: payment.id,
        balanceDuePaise: ledger.balanceDuePaise,
      },
      now,
    }),
    outbox,
    search: createSearchProjection({
      id: createDomainId("SCH", input.runtime),
      entityType: "order",
      entityId: order.orderId,
      title: order.orderCode,
      subtitle: `Balance ${ledger.balanceDuePaise}`,
      fields: [order.orderCode, String(ledger.balanceDuePaise), payment.kind],
      payload: {
        orderId: order.orderId,
        contactId: order.contactId,
        customerProfileId: order.customerProfileId,
        balanceDuePaise: ledger.balanceDuePaise,
      },
      updatedAt: now,
    }),
  });
}

async function resolveMeasurementProfile(input: {
  repository: TenantDomainRepository;
  data: CreateMeasurementVersion;
  displayName: string;
  runtime: TenantDomainRuntime;
  now: string;
}): Promise<MeasurementProfileRecord & { shouldCreate: boolean }> {
  const existing = input.data.measurementProfileId
    ? await input.repository.findMeasurementProfileById(
        input.data.measurementProfileId,
      )
    : await input.repository.findMeasurementProfileByCustomerAndGarment({
        customerProfileId: input.data.customerProfileId,
        garmentTypeCode: input.data.garmentTypeCode,
        displayName: input.displayName,
      });

  if (input.data.measurementProfileId && !existing) {
    throw notFound(
      "Measurement profile was not found.",
      "measurementProfileId",
    );
  }

  if (existing) {
    if (existing.customerProfileId !== input.data.customerProfileId) {
      throw new TenantDomainError({
        code: "VALIDATION_ERROR",
        message: "Measurement profile does not belong to the customer profile.",
        status: 400,
        fields: {
          measurementProfileId: [
            "Choose a measurement profile for the selected customer.",
          ],
        },
      });
    }

    return { ...existing, shouldCreate: false };
  }

  return {
    id: createDomainId("MPR", input.runtime),
    customerProfileId: input.data.customerProfileId,
    garmentTypeCode: input.data.garmentTypeCode,
    displayName: input.displayName,
    currentVersionId: null,
    currentVersionNo: null,
    shouldCreate: true,
  };
}

async function buildOrderItem(input: {
  repository: TenantDomainRepository;
  item: OrderItemInput;
  index: number;
  runtime: TenantDomainRuntime;
}): Promise<OrderItemCreateRecord> {
  const measurementVersion = input.item.measurementVersionId
    ? await input.repository.findMeasurementVersion(
        input.item.measurementVersionId,
      )
    : null;

  if (input.item.measurementVersionId && !measurementVersion) {
    throw notFound(
      "Measurement version was not found.",
      "measurementVersionId",
    );
  }

  if (!measurementVersion && !input.item.measurementValues) {
    if (
      !input.item.allowWithoutMeasurementReason ||
      !simpleServiceGarments.has(input.item.garmentTypeCode)
    ) {
      throw new TenantDomainError({
        code: "VALIDATION_ERROR",
        message:
          "Order item needs a measurement snapshot or an explicit simple-service reason.",
        status: 400,
        fields: {
          items: [
            "Measurement snapshot is required unless this is an allowed alteration/simple service.",
          ],
        },
      });
    }
  }

  const values = input.item.measurementValues ??
    measurementVersion?.values ?? {
      reason:
        input.item.allowWithoutMeasurementReason ?? "No measurement needed",
    };
  const itemId = createDomainId("ITM", input.runtime);

  return {
    id: itemId,
    itemCode: itemId,
    garmentTypeCode: input.item.garmentTypeCode,
    quantity: input.item.quantity,
    itemStatus: "booked",
    pricePaise: input.item.pricePaise,
    assignedStaffUserId: input.item.assignedStaffUserId ?? null,
    promisedDeliveryDate: input.item.promisedDeliveryDate ?? null,
    notes: input.item.notes ?? input.item.allowWithoutMeasurementReason ?? null,
    snapshot: {
      id: createDomainId("SNP", input.runtime),
      sourceMeasurementVersionId: measurementVersion?.id ?? null,
      values,
      override: input.item.measurementOverride ?? null,
    },
  };
}

function createPaymentRecord(input: {
  orderId: string;
  amountPaise: number;
  mode: PaymentMode;
  kind: PaymentKind;
  reference: string | null;
  reason: string | null;
  recordedByUserId: string;
  runtime: TenantDomainRuntime;
  now: string;
}): PaymentCreateRecord {
  const id = createDomainId("PAY", input.runtime);
  return {
    id,
    paymentCode: id,
    orderId: input.orderId,
    amountPaise: input.amountPaise,
    mode: input.mode,
    kind: input.kind,
    reference: input.reference,
    reason: input.reason,
    recordedByUserId: input.recordedByUserId,
    recordedAt: input.now,
  };
}

function createReceiptRecord(input: {
  orderId: string;
  receiptId?: string;
  receiptCode?: string;
  paidPaise: number;
  balanceDuePaise: number;
  issuedByUserId: string;
  runtime: TenantDomainRuntime;
  now: string;
}): ReceiptUpsertRecord {
  const id = input.receiptId ?? createDomainId("RCT", input.runtime);

  return {
    id,
    receiptCode: input.receiptCode ?? id,
    orderId: input.orderId,
    status:
      input.balanceDuePaise === 0
        ? "paid"
        : input.paidPaise > 0
          ? "partial"
          : "draft",
    paidPaise: input.paidPaise,
    balanceDuePaise: input.balanceDuePaise,
    issuedByUserId: input.issuedByUserId,
    issuedAt: input.now,
    updatedAt: input.now,
  };
}

function createAudit(input: {
  action: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  reason?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  requestId: string;
  now: string;
}): DomainAuditRecord {
  return {
    id: createDomainId("AUD", {}),
    actorType: input.actorUserId ? "user" : "system",
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    reason: input.reason ?? null,
    beforeJson: input.before ? JSON.stringify(input.before) : null,
    afterJson: input.after ? JSON.stringify(input.after) : null,
    requestId: input.requestId,
    createdAt: input.now,
  };
}

function createOutboxEvent(input: {
  eventType: DomainOutboxEventType;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  runtime: TenantDomainRuntime;
  now: string;
}): DomainOutboxRecord {
  return {
    id: createDomainId("OUT", input.runtime),
    eventType: input.eventType,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    idempotencyKey: `${input.eventType}:${input.aggregateId}:${input.runtime.requestId}`,
    payload: {
      ...input.payload,
      requestId: input.runtime.requestId,
    },
    createdAt: input.now,
  };
}

function createSearchProjection(input: {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  fields: string[];
  payload: Record<string, unknown>;
  updatedAt: string;
}): SearchProjectionRecord {
  return {
    id: input.id,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    subtitle: input.subtitle,
    searchText: normalizeSearchText(
      [input.title, input.subtitle, ...input.fields].filter(Boolean).join(" "),
    ),
    payload: input.payload,
    updatedAt: input.updatedAt,
  };
}

function createDomainId(
  prefix: EntityPrefix,
  runtime: Pick<TenantDomainRuntime, "shopCode">,
) {
  return createStableId({
    prefix,
    ...(runtime.shopCode ? { shopCode: runtime.shopCode } : {}),
  });
}

function normalizeMobile(input: string, field: string) {
  try {
    return normalizeIndianMobile(input);
  } catch (error) {
    throw new TenantDomainError({
      code: "VALIDATION_ERROR",
      message:
        error instanceof Error ? error.message : "Invalid mobile number.",
      status: 400,
      fields: { [field]: ["Enter a valid Indian mobile number."] },
    });
  }
}

function notFound(message: string, field: string): TenantDomainError {
  return new TenantDomainError({
    code: "NOT_FOUND",
    message,
    status: 404,
    fields: { [field]: [message] },
  });
}

function toIso(date: Date | undefined) {
  return (date ?? new Date()).toISOString();
}
