import {
  calculatePaymentLedger,
  normalizeIndianMobile,
  normalizeSearchText,
} from "@tailoros/core";

import type {
  CommandSearchResult,
  CoreNavItem,
  FamilyAccount,
  MeasurementTemplate,
  MeasurementVersion,
  ProductionTask,
  ReportMetric,
  SettingsItem,
  ShopOrder,
  WhatsAppFailure,
} from "./types";

export const coreNavItems = [
  {
    key: "dashboard",
    href: "/shop",
    label: "Dashboard",
    description: "Daily cockpit, command search, due work, balances, failures.",
  },
  {
    key: "customers",
    href: "/shop/customers",
    label: "Customers",
    description: "Family-aware search, profile selection, duplicate controls.",
  },
  {
    key: "measurements",
    href: "/shop/measurements",
    label: "Measurements",
    description: "Garment templates, versions, fit notes, reference photos.",
  },
  {
    key: "orders",
    href: "/shop/orders",
    label: "Orders",
    description: "Counter-speed wizard, item snapshots, drafts, receipts.",
  },
  {
    key: "production",
    href: "/shop/production",
    label: "Production",
    description: "Status lanes, tailor ownership, exceptions, alterations.",
  },
  {
    key: "payments",
    href: "/shop/payments",
    label: "Payments",
    description: "Ledger, corrections, balances, printable receipts.",
  },
  {
    key: "reports",
    href: "/shop/reports",
    label: "Reports",
    description: "Collections, pending balance, workload, WhatsApp failures.",
  },
  {
    key: "settings",
    href: "/shop/settings",
    label: "Settings",
    description: "Shop profile, roles, templates, receipt and message policy.",
  },
] as const satisfies readonly CoreNavItem[];

export const familyAccounts = [
  {
    id: "fam_01",
    familyCode: "FAM-MDU-00018",
    primaryMobileE164: "+919876543210",
    primaryMobileDisplay: "+91 98765 43210",
    city: "Madurai",
    address: "North Masi Street, Madurai",
    whatsappOptIn: true,
    duplicateRisk:
      "Similar Meena Ravi profile exists under the same mobile. Require relation label and override reason before creating another profile.",
    profiles: [
      {
        id: "cus_01",
        customerCode: "CUS-MDU-000231",
        fullName: "Meena Ravi",
        relationLabel: "Self",
        garmentContext: "Blouse, salwar",
        lastMeasurement: "Blouse v4 updated yesterday",
        activeOrders: 2,
        notes: "Prefers regular fit. Sleeve must stay loose near elbow.",
      },
      {
        id: "cus_02",
        customerCode: "CUS-MDU-000232",
        fullName: "Ravi Kumar",
        relationLabel: "Spouse",
        garmentContext: "Shirt, pant",
        lastMeasurement: "Shirt v2 updated Jun 2026",
        activeOrders: 1,
        notes: "Office uniform repeat order every quarter.",
      },
      {
        id: "cus_03",
        customerCode: "CUS-MDU-000233",
        fullName: "Ananya Ravi",
        relationLabel: "Daughter",
        garmentContext: "Kidswear",
        lastMeasurement: "Kidswear v3 updated May 2026",
        activeOrders: 1,
        notes: "Fast growth warning. Verify length before cutting.",
      },
      {
        id: "cus_04",
        customerCode: "CUS-MDU-000234",
        fullName: "Meena R.",
        relationLabel: "Mother",
        garmentContext: "Blouse alteration",
        lastMeasurement: "Alteration v1 updated Apr 2026",
        activeOrders: 0,
        notes: "Duplicate-name risk. Always confirm relation before order.",
      },
    ],
  },
  {
    id: "fam_02",
    familyCode: "FAM-CBE-00044",
    primaryMobileE164: "+919944112233",
    primaryMobileDisplay: "+91 99441 12233",
    city: "Coimbatore",
    address: "RS Puram, Coimbatore",
    whatsappOptIn: false,
    duplicateRisk: null,
    profiles: [
      {
        id: "cus_05",
        customerCode: "CUS-CBE-000882",
        fullName: "S. Farida",
        relationLabel: "Self",
        garmentContext: "Uniform",
        lastMeasurement: "Uniform v1 captured last week",
        activeOrders: 1,
        notes: "School batch delivery; call before pickup.",
      },
      {
        id: "cus_06",
        customerCode: "CUS-CBE-000883",
        fullName: "Ayaan Shah",
        relationLabel: "Son",
        garmentContext: "Kidswear, alteration",
        lastMeasurement: "Kidswear v2 updated yesterday",
        activeOrders: 1,
        notes: "No WhatsApp opt-in. Use phone call for readiness.",
      },
    ],
  },
] as const satisfies readonly FamilyAccount[];

export const measurementTemplates = [
  {
    code: "blouse",
    label: "Blouse",
    version: "v3 active",
    defaultDays: 5,
    requiredFields: ["bust", "waist", "shoulder", "sleeve", "length"],
    optionalFields: ["neck front", "neck back", "princess cut", "lining"],
    rangeHint: "Inch values with 0.25 precision; warn on bust > 60.",
  },
  {
    code: "shirt",
    label: "Shirt",
    version: "v2 active",
    defaultDays: 4,
    requiredFields: ["chest", "waist", "shoulder", "sleeve", "shirt length"],
    optionalFields: ["collar", "cuff", "pocket", "pleat"],
    rangeHint: "Require collar for formal shirt orders.",
  },
  {
    code: "pant",
    label: "Pant",
    version: "v2 active",
    defaultDays: 4,
    requiredFields: ["waist", "seat", "thigh", "knee", "length"],
    optionalFields: ["bottom", "rise", "pocket", "pleat"],
    rangeHint: "Flag length changes above 2 inches from previous version.",
  },
  {
    code: "salwar_kameez",
    label: "Salwar / Kameez",
    version: "v1 active",
    defaultDays: 6,
    requiredFields: ["chest", "waist", "hip", "top length", "sleeve"],
    optionalFields: ["dupatta", "bottom length", "neck style", "lining"],
    rangeHint: "Style notes required for neck and sleeve preference.",
  },
  {
    code: "kidswear",
    label: "Kidswear",
    version: "v2 active",
    defaultDays: 4,
    requiredFields: ["chest", "waist", "height", "length"],
    optionalFields: ["age", "growth margin", "school section"],
    rangeHint: "Growth warning appears if older than 90 days.",
  },
  {
    code: "uniform",
    label: "Uniform",
    version: "v1 active",
    defaultDays: 7,
    requiredFields: ["chest", "waist", "length", "school code"],
    optionalFields: ["batch", "section", "logo placement", "fabric lot"],
    rangeHint: "Batch orders require fabric-lot reference.",
  },
  {
    code: "alteration",
    label: "Alteration",
    version: "v1 active",
    defaultDays: 2,
    requiredFields: ["issue", "requested change", "garment area"],
    optionalFields: ["before photo", "chargeable", "trial result"],
    rangeHint: "Reason and before-state note are required.",
  },
] as const satisfies readonly MeasurementTemplate[];

export const measurementVersions = [
  {
    id: "mv_01",
    customerCode: "CUS-MDU-000231",
    garment: "Blouse",
    versionNo: 4,
    unit: "inch",
    changedAt: "2026-07-05T11:20:00+05:30",
    changedBy: "Master Arun",
    reason: "Customer requested regular fit after tight sleeve trial.",
    changedFields: [
      { label: "Sleeve", from: "10.5", to: "11" },
      { label: "Armhole", from: "15", to: "15.5" },
      { label: "Fit", from: "Tight", to: "Regular" },
    ],
  },
  {
    id: "mv_02",
    customerCode: "CUS-CBE-000883",
    garment: "Kidswear",
    versionNo: 2,
    unit: "inch",
    changedAt: "2026-07-05T16:05:00+05:30",
    changedBy: "Nisha",
    reason: "Growth update before school uniform batch cutting.",
    changedFields: [
      { label: "Height", from: "42", to: "44" },
      { label: "Top length", from: "19", to: "20.25" },
    ],
  },
] as const satisfies readonly MeasurementVersion[];

export const shopOrders = [
  {
    id: "ord_01",
    orderCode: "ORD-MDU-000421",
    receiptCode: "RCP-MDU-000388",
    customerCode: "CUS-MDU-000231",
    customerName: "Meena Ravi",
    familyCode: "FAM-MDU-00018",
    mobileE164: "+919876543210",
    orderDate: "2026-07-04",
    trialDate: "2026-07-06",
    trialTime: null,
    promisedDate: "2026-07-07",
    status: "stitching",
    totalPaise: 620000,
    items: [
      {
        id: "item_01",
        itemCode: "ITM-MDU-000421-01",
        garment: "Blouse",
        status: "ready_for_pickup",
        promisedDate: "2026-07-07",
        assignedTo: "Master Arun",
        pricePaise: 320000,
        measurementVersion: "Blouse v4",
        overrideNote: "Keep sleeve 0.5 inch loose for this order only.",
      },
      {
        id: "item_02",
        itemCode: "ITM-MDU-000421-02",
        garment: "Salwar",
        status: "stitching",
        promisedDate: "2026-07-08",
        assignedTo: "Latha",
        pricePaise: 300000,
        measurementVersion: "Salwar v2",
        overrideNote: null,
      },
    ],
    payments: [
      {
        id: "pay_01",
        kind: "advance",
        mode: "upi",
        amountPaise: 250000,
        reason: null,
        recordedAt: "2026-07-04T10:15:00+05:30",
      },
      {
        id: "pay_02",
        kind: "correction",
        mode: "adjustment",
        amountPaise: -50000,
        reason: "UPI amount entered twice during rush hour.",
        recordedAt: "2026-07-04T10:21:00+05:30",
      },
    ],
    notes: "Partial delivery possible. Show item count before closing order.",
  },
  {
    id: "ord_02",
    orderCode: "ORD-MDU-000422",
    receiptCode: "RCP-MDU-000389",
    customerCode: "CUS-MDU-000232",
    customerName: "Ravi Kumar",
    familyCode: "FAM-MDU-00018",
    mobileE164: "+919876543210",
    orderDate: "2026-07-03",
    trialDate: null,
    trialTime: null,
    promisedDate: "2026-07-06",
    status: "cutting",
    totalPaise: 280000,
    items: [
      {
        id: "item_03",
        itemCode: "ITM-MDU-000422-01",
        garment: "Shirt",
        status: "cutting",
        promisedDate: "2026-07-06",
        assignedTo: "Selvam",
        pricePaise: 280000,
        measurementVersion: "Shirt v2",
        overrideNote: null,
      },
    ],
    payments: [
      {
        id: "pay_03",
        kind: "advance",
        mode: "cash",
        amountPaise: 100000,
        reason: null,
        recordedAt: "2026-07-03T18:35:00+05:30",
      },
    ],
    notes: "Due today; owner action needed if cutting is not completed by noon.",
  },
  {
    id: "ord_03",
    orderCode: "ORD-CBE-000144",
    receiptCode: "RCP-CBE-000102",
    customerCode: "CUS-CBE-000883",
    customerName: "Ayaan Shah",
    familyCode: "FAM-CBE-00044",
    mobileE164: "+919944112233",
    orderDate: "2026-07-02",
    trialDate: "2026-07-05",
    trialTime: "17:30",
    promisedDate: "2026-07-06",
    status: "alteration_required",
    totalPaise: 420000,
    items: [
      {
        id: "item_04",
        itemCode: "ITM-CBE-000144-01",
        garment: "Uniform set",
        status: "alteration_required",
        promisedDate: "2026-07-06",
        assignedTo: "Priya",
        pricePaise: 420000,
        measurementVersion: "Kidswear v2",
        overrideNote: "Add 1 inch growth margin to pant length.",
      },
    ],
    payments: [
      {
        id: "pay_04",
        kind: "advance",
        mode: "upi",
        amountPaise: 200000,
        reason: null,
        recordedAt: "2026-07-02T12:10:00+05:30",
      },
      {
        id: "pay_05",
        kind: "refund",
        mode: "upi",
        amountPaise: 25000,
        reason: "Fabric logo patch unavailable; discount refunded.",
        recordedAt: "2026-07-05T19:15:00+05:30",
      },
    ],
    notes: "WhatsApp opted out. Counter must call when ready.",
  },
] as const satisfies readonly ShopOrder[];

export const productionTasks = [
  {
    id: "task_01",
    orderCode: "ORD-MDU-000421",
    itemCode: "ITM-MDU-000421-01",
    customerName: "Meena Ravi",
    garment: "Blouse",
    lane: "ready_for_pickup",
    assignedTo: "Master Arun",
    dueDate: "2026-07-07",
    exceptionReason: null,
    notifyCustomer: true,
  },
  {
    id: "task_02",
    orderCode: "ORD-MDU-000421",
    itemCode: "ITM-MDU-000421-02",
    customerName: "Meena Ravi",
    garment: "Salwar",
    lane: "stitching",
    assignedTo: "Latha",
    dueDate: "2026-07-08",
    exceptionReason: null,
    notifyCustomer: false,
  },
  {
    id: "task_03",
    orderCode: "ORD-MDU-000422",
    itemCode: "ITM-MDU-000422-01",
    customerName: "Ravi Kumar",
    garment: "Shirt",
    lane: "cutting",
    assignedTo: "Selvam",
    dueDate: "2026-07-06",
    exceptionReason: "Owner review by noon; due today.",
    notifyCustomer: false,
  },
  {
    id: "task_04",
    orderCode: "ORD-CBE-000144",
    itemCode: "ITM-CBE-000144-01",
    customerName: "Ayaan Shah",
    garment: "Uniform set",
    lane: "alteration_needed",
    assignedTo: "Priya",
    dueDate: "2026-07-06",
    exceptionReason: "Trial issue: pant length short after growth update.",
    notifyCustomer: false,
  },
] as const satisfies readonly ProductionTask[];

export const whatsAppFailures = [
  {
    id: "wa_01",
    orderCode: "ORD-CBE-000144",
    customerName: "Ayaan Shah",
    purpose: "ready for pickup",
    status: "opted_out",
    reason: "Customer opted out on 2026-07-03. Call fallback required.",
    retryable: false,
    occurredAt: "2026-07-05T19:30:00+05:30",
  },
  {
    id: "wa_02",
    orderCode: "ORD-MDU-000422",
    customerName: "Ravi Kumar",
    purpose: "delivery reminder",
    status: "failed",
    reason: "Provider rejected approved template variable length.",
    retryable: true,
    occurredAt: "2026-07-06T09:10:00+05:30",
  },
] as const satisfies readonly WhatsAppFailure[];

export const reportMetrics = [
  {
    label: "Today collection",
    value: "INR 4,750",
    detail: "3 payments, 1 correction visible",
    trend: "up",
  },
  {
    label: "Pending balance",
    value: "INR 8,450",
    detail: "4 active orders need follow-up",
    trend: "flat",
  },
  {
    label: "Overdue delivery",
    value: "2 items",
    detail: "Both have owner-visible exception reasons",
    trend: "down",
  },
  {
    label: "WhatsApp failures",
    value: "2",
    detail: "1 retryable, 1 blocked by opt-out",
    trend: "flat",
  },
] as const satisfies readonly ReportMetric[];

export const settingsItems = [
  {
    id: "set_01",
    title: "Shop and receipt identity",
    state: "ready",
    owner: "Owner",
    detail: "Shop code MDU, branch address, receipt prefix, and terms configured.",
  },
  {
    id: "set_02",
    title: "Garment templates",
    state: "needs_review",
    owner: "Master tailor",
    detail: "Kidswear growth warning and uniform logo fields need pilot review.",
  },
  {
    id: "set_03",
    title: "Roles and permissions",
    state: "ready",
    owner: "Owner",
    detail: "Tailors can update tasks but cannot see reports or payment correction.",
  },
  {
    id: "set_04",
    title: "WhatsApp message policy",
    state: "blocked",
    owner: "Platform support",
    detail: "Provider templates are external; TailorOS only records consent and outbox state.",
  },
] as const satisfies readonly SettingsItem[];

export function formatPaise(amountPaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amountPaise / 100);
}

export function calculateOrderFinancials(order: ShopOrder) {
  return calculatePaymentLedger({
    finalTotalPaise: order.totalPaise,
    payments: order.payments.map((payment) => ({
      amountPaise: payment.amountPaise,
      kind: payment.kind,
    })),
  });
}

export function isItemReady(status: ShopOrder["items"][number]["status"]) {
  return (
    status === "ready_for_pickup" ||
    status === "delivered" ||
    status === "closed"
  );
}

export function getPartialDeliveryOrders() {
  return shopOrders.filter((order) => {
    const readyItems = order.items.filter((item) => isItemReady(item.status));
    return readyItems.length > 0 && readyItems.length < order.items.length;
  });
}

export function isWhatsAppFailureRetryable(failure: WhatsAppFailure) {
  return failure.retryable && failure.status !== "blocked" && failure.status !== "opted_out";
}

export function getDashboardSignals() {
  const dueToday = shopOrders.filter((order) => order.promisedDate <= "2026-07-06");
  const readyItems = shopOrders.flatMap((order) =>
    order.items
      .filter((item) => isItemReady(item.status))
      .map((item) => ({ item, order })),
  );
  const balanceDuePaise = shopOrders.reduce(
    (total, order) => total + calculateOrderFinancials(order).balanceDuePaise,
    0,
  );

  return {
    balanceDuePaise,
    dueTodayCount: dueToday.length,
    partialDeliveryCount: getPartialDeliveryOrders().length,
    readyItemCount: readyItems.length,
    retryableWhatsAppFailures: whatsAppFailures.filter((failure) =>
      isWhatsAppFailureRetryable(failure),
    ).length,
  };
}

export function searchPilotRecords(rawQuery: string): CommandSearchResult[] {
  const normalizedText = normalizeSearchText(rawQuery);
  if (normalizedText.length < 2) {
    return [];
  }

  const mobile = tryNormalizeMobile(rawQuery);
  const uppercase = rawQuery.trim().toUpperCase().replace(/\s+/g, "");
  const results: CommandSearchResult[] = [];

  for (const family of familyAccounts) {
    const familyText = normalizeSearchText(
      [
        family.familyCode,
        family.primaryMobileE164,
        family.primaryMobileDisplay,
        family.city,
        family.address,
      ].join(" "),
    );
    const mobileMatches = mobile !== null && family.primaryMobileE164 === mobile;

    if (mobileMatches || familyText.includes(normalizedText)) {
      results.push({
        entityType: "family",
        id: family.id,
        title: `${family.familyCode} - ${family.primaryMobileDisplay}`,
        eyebrow: "Family contact",
        description: `${family.profiles.length} profiles in ${family.city}`,
        href: "/shop/customers",
        priority: mobileMatches ? 1 : 5,
      });
    }

    for (const profile of family.profiles) {
      const profileText = normalizeSearchText(
        [
          profile.customerCode,
          profile.fullName,
          profile.relationLabel,
          profile.garmentContext,
          family.primaryMobileE164,
        ].join(" "),
      );
      const exactCode = profile.customerCode === uppercase;

      if (exactCode || mobileMatches || profileText.includes(normalizedText)) {
        results.push({
          entityType: "customer",
          id: profile.id,
          title: `${profile.fullName} (${profile.customerCode})`,
          eyebrow: "Customer profile",
          description: `${profile.relationLabel} - ${profile.lastMeasurement}`,
          href: "/shop/customers",
          priority: exactCode ? 0 : mobileMatches ? 2 : 6,
        });
      }
    }
  }

  for (const order of shopOrders) {
    const financials = calculateOrderFinancials(order);
    const orderText = normalizeSearchText(
      [
        order.orderCode,
        order.receiptCode,
        order.customerCode,
        order.customerName,
        order.status,
        order.mobileE164,
        order.items.map((item) => item.garment).join(" "),
      ].join(" "),
    );
    const exactOrder = order.orderCode === uppercase;
    const exactReceipt = order.receiptCode === uppercase;
    const mobileMatches = mobile !== null && order.mobileE164 === mobile;

    if (exactOrder || mobileMatches || orderText.includes(normalizedText)) {
      results.push({
        entityType: "order",
        id: order.id,
        title: `${order.orderCode} - ${order.customerName}`,
        eyebrow: "Order",
        description: `${order.items.length} item(s), balance ${formatPaise(financials.balanceDuePaise)}`,
        href: "/shop/orders",
        priority: exactOrder ? 0 : mobileMatches ? 3 : 7,
      });
    }

    if (exactReceipt || orderText.includes(normalizedText)) {
      results.push({
        entityType: "receipt",
        id: `${order.id}-receipt`,
        title: `${order.receiptCode} - ${order.customerName}`,
        eyebrow: "Receipt",
        description: `${formatPaise(financials.netPaidPaise)} paid, ${formatPaise(financials.balanceDuePaise)} due`,
        href: "/shop/payments",
        priority: exactReceipt ? 0 : 8,
      });
    }
  }

  for (const failure of whatsAppFailures) {
    const failureText = normalizeSearchText(
      [
        failure.orderCode,
        failure.customerName,
        failure.purpose,
        failure.status,
        failure.reason,
      ].join(" "),
    );

    if (failureText.includes(normalizedText)) {
      results.push({
        entityType: "message",
        id: failure.id,
        title: `${failure.purpose} - ${failure.customerName}`,
        eyebrow: failure.retryable ? "Retryable message" : "Blocked message",
        description: failure.reason,
        href: "/shop",
        priority: failure.retryable ? 4 : 9,
      });
    }
  }

  return dedupeResults(results)
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
    .slice(0, 10);
}

function tryNormalizeMobile(input: string): string | null {
  try {
    return normalizeIndianMobile(input).e164;
  } catch {
    return null;
  }
}

function dedupeResults(results: CommandSearchResult[]): CommandSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.entityType}:${result.id}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
