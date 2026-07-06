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
  ConnectorPolicyCheck,
  ProductionTask,
  ReportMetric,
  SettingsItem,
  ShopOrder,
  SharedMobileCase,
  WhatsAppChannel,
  WhatsAppFailure,
  WhatsAppMessageRequest,
  WhatsAppTemplateMapping,
  WhatsAppUsageLedgerLine,
  WhatsAppWebhookEvent,
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
    key: "whatsapp",
    href: "/shop/whatsapp",
    label: "WhatsApp",
    description: "Connector health, templates, policy blocks, webhook evidence.",
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

export const whatsAppChannels = [
  {
    id: "wa_channel_mdu",
    tenantCode: "TEN-MDU",
    branchLabel: "Madurai main counter",
    provider: "meta_cloud_api",
    wabaId: "102938475610293",
    phoneNumberId: "123456789012345",
    displayPhone: "+91 98765 40001",
    status: "active",
    qualityRating: "green",
    messagingLimitTier: "1K conversations/day",
    consentCoveragePct: 87,
    credentialAgeDays: 18,
    tokenRotationDue: "2026-07-21",
    lastHealthCheck: "2026-07-06T09:42:00+05:30",
    risk: null,
  },
  {
    id: "wa_channel_cbe",
    tenantCode: "TEN-CBE",
    branchLabel: "Coimbatore school batch",
    provider: "meta_cloud_api",
    wabaId: "203948576120394",
    phoneNumberId: "223456789012345",
    displayPhone: "+91 99441 40002",
    status: "degraded",
    qualityRating: "yellow",
    messagingLimitTier: "250 conversations/day",
    consentCoveragePct: 62,
    credentialAgeDays: 42,
    tokenRotationDue: "2026-07-10",
    lastHealthCheck: "2026-07-06T09:38:00+05:30",
    risk: "Template sync is behind and quality rating dropped after three user blocks.",
  },
  {
    id: "wa_channel_tnj",
    tenantCode: "TEN-TNJ",
    branchLabel: "Thanjavur pilot shop",
    provider: "meta_cloud_api",
    wabaId: "304958671230495",
    phoneNumberId: "323456789012345",
    displayPhone: "+91 97890 40003",
    status: "blocked",
    qualityRating: "red",
    messagingLimitTier: "Paused by provider",
    consentCoveragePct: 51,
    credentialAgeDays: 96,
    tokenRotationDue: "2026-07-06",
    lastHealthCheck: "2026-07-06T08:55:00+05:30",
    risk: "Credential rotation and provider review are both required before sends resume.",
  },
] as const satisfies readonly WhatsAppChannel[];

export const whatsAppTemplateMappings = [
  {
    id: "tpl_confirm_en",
    purpose: "order_confirmation",
    language: "en",
    providerTemplateName: "tailoros_order_confirm_en_v3",
    category: "utility",
    status: "approved",
    variables: ["customer_name", "order_code", "item_count", "promised_date"],
    fallback: "call",
    lastSyncedAt: "2026-07-06T08:30:00+05:30",
    ownerAction: "No action",
  },
  {
    id: "tpl_confirm_ta",
    purpose: "order_confirmation",
    language: "ta",
    providerTemplateName: "tailoros_order_confirm_ta_v2",
    category: "utility",
    status: "approved",
    variables: ["customer_name", "order_code", "promised_date"],
    fallback: "call",
    lastSyncedAt: "2026-07-06T08:30:00+05:30",
    ownerAction: "No action",
  },
  {
    id: "tpl_trial_en",
    purpose: "trial_reminder",
    language: "en",
    providerTemplateName: "tailoros_trial_reminder_en_v4",
    category: "utility",
    status: "approved",
    variables: ["customer_name", "order_code", "trial_date", "trial_time"],
    fallback: "manual_review",
    lastSyncedAt: "2026-07-06T08:29:00+05:30",
    ownerAction: "No action",
  },
  {
    id: "tpl_ready_ta",
    purpose: "ready_for_pickup",
    language: "ta",
    providerTemplateName: "tailoros_ready_pickup_ta_v3",
    category: "utility",
    status: "approved",
    variables: ["customer_name", "order_code", "balance_due"],
    fallback: "call",
    lastSyncedAt: "2026-07-06T08:29:00+05:30",
    ownerAction: "No action",
  },
  {
    id: "tpl_ready_en",
    purpose: "ready_for_pickup",
    language: "en",
    providerTemplateName: "tailoros_ready_pickup_en_v5",
    category: "utility",
    status: "paused",
    variables: ["customer_name", "order_code", "balance_due"],
    fallback: "manual_review",
    lastSyncedAt: "2026-07-06T08:28:00+05:30",
    ownerAction: "Unpause or remap before English pickup sends resume.",
  },
  {
    id: "tpl_balance_en",
    purpose: "balance_due",
    language: "en",
    providerTemplateName: "tailoros_balance_due_en_v1",
    category: "utility",
    status: "pending_review",
    variables: ["customer_name", "order_code", "balance_due", "pickup_date"],
    fallback: "call",
    lastSyncedAt: "2026-07-05T16:10:00+05:30",
    ownerAction: "Wait for provider review; do not send marketing copy.",
  },
  {
    id: "tpl_alteration_ta",
    purpose: "alteration_update",
    language: "ta",
    providerTemplateName: "tailoros_alteration_update_ta_v1",
    category: "utility",
    status: "missing",
    variables: ["customer_name", "order_code", "reason"],
    fallback: "manual_review",
    lastSyncedAt: "2026-07-05T16:10:00+05:30",
    ownerAction: "Create mapping and approve Tamil alteration template.",
  },
] as const satisfies readonly WhatsAppTemplateMapping[];

export const whatsAppMessageRequests = [
  {
    id: "wamr_01",
    orderCode: "ORD-MDU-000421",
    customerName: "Meena Ravi",
    mobileE164: "+919876543210",
    purpose: "order_confirmation",
    productEvent: "order.booked",
    channelId: "wa_channel_mdu",
    idempotencyKey: "order.booked:ORD-MDU-000421:v1",
    status: "read",
    reason: "Customer opened the order confirmation.",
    retryCount: 0,
    providerMessageId: "wamid.mdu.000421.confirm",
    lastTransitionAt: "2026-07-04T10:18:00+05:30",
    staffAction: null,
  },
  {
    id: "wamr_02",
    orderCode: "ORD-MDU-000421",
    customerName: "Meena Ravi",
    mobileE164: "+919876543210",
    purpose: "ready_for_pickup",
    productEvent: "item.ready_for_pickup",
    channelId: "wa_channel_mdu",
    idempotencyKey: "item.ready_for_pickup:ITM-MDU-000421-01:v1",
    status: "delivered",
    reason: "Provider delivery receipt applied after sent state.",
    retryCount: 0,
    providerMessageId: "wamid.mdu.000421.pickup",
    lastTransitionAt: "2026-07-06T09:14:00+05:30",
    staffAction: null,
  },
  {
    id: "wamr_03",
    orderCode: "ORD-CBE-000144",
    customerName: "Ayaan Shah",
    mobileE164: "+919944112233",
    purpose: "ready_for_pickup",
    productEvent: "item.ready_for_pickup",
    channelId: "wa_channel_cbe",
    idempotencyKey: "item.ready_for_pickup:ITM-CBE-000144-01:v1",
    status: "blocked",
    reason: "Customer opted out on 2026-07-03; call fallback required.",
    retryCount: 0,
    providerMessageId: null,
    lastTransitionAt: "2026-07-05T19:30:00+05:30",
    staffAction: "Call customer before pickup.",
  },
  {
    id: "wamr_04",
    orderCode: "ORD-MDU-000422",
    customerName: "Ravi Kumar",
    mobileE164: "+919876543210",
    purpose: "trial_reminder",
    productEvent: "trial.reminder_due",
    channelId: "wa_channel_mdu",
    idempotencyKey: "trial.reminder_due:ORD-MDU-000422:2026-07-06",
    status: "failed",
    reason: "Transient Meta 5xx response; retry with exponential backoff.",
    retryCount: 2,
    providerMessageId: null,
    lastTransitionAt: "2026-07-06T09:10:00+05:30",
    staffAction: "Auto retry is scheduled.",
  },
  {
    id: "wamr_05",
    orderCode: "ORD-MDU-000421",
    customerName: "Meena Ravi",
    mobileE164: "+919876543210",
    purpose: "order_confirmation",
    productEvent: "order.booked",
    channelId: "wa_channel_mdu",
    idempotencyKey: "order.booked:ORD-MDU-000421:v1",
    status: "duplicate",
    reason: "Idempotency key already produced wamid.mdu.000421.confirm.",
    retryCount: 0,
    providerMessageId: "wamid.mdu.000421.confirm",
    lastTransitionAt: "2026-07-04T10:19:00+05:30",
    staffAction: null,
  },
  {
    id: "wamr_06",
    orderCode: "ORD-CBE-000144",
    customerName: "Ayaan Shah",
    mobileE164: "+919944112233",
    purpose: "alteration_update",
    productEvent: "alteration.created",
    channelId: "wa_channel_cbe",
    idempotencyKey: "alteration.created:ORD-CBE-000144:v1",
    status: "blocked",
    reason: "Tamil alteration template mapping is missing.",
    retryCount: 0,
    providerMessageId: null,
    lastTransitionAt: "2026-07-05T18:50:00+05:30",
    staffAction: "Map the template or use counter call fallback.",
  },
  {
    id: "wamr_07",
    orderCode: "ORD-MDU-000422",
    customerName: "Ravi Kumar",
    mobileE164: "+919876543210",
    purpose: "balance_due",
    productEvent: "balance.follow_up_due",
    channelId: "wa_channel_mdu",
    idempotencyKey: "balance.follow_up_due:ORD-MDU-000422:2026-07-06",
    status: "queued",
    reason: "Waiting for approved balance template before dispatch.",
    retryCount: 0,
    providerMessageId: null,
    lastTransitionAt: "2026-07-06T09:35:00+05:30",
    staffAction: "Review pending provider template.",
  },
  {
    id: "wamr_08",
    orderCode: "ORD-TNJ-000031",
    customerName: "Kala Devi",
    mobileE164: "+919789012345",
    purpose: "order_confirmation",
    productEvent: "order.booked",
    channelId: "wa_channel_tnj",
    idempotencyKey: "order.booked:ORD-TNJ-000031:v1",
    status: "failed",
    reason: "Channel blocked by provider after credential rotation expired.",
    retryCount: 5,
    providerMessageId: null,
    lastTransitionAt: "2026-07-06T08:55:00+05:30",
    staffAction: "Escalate DLQ to platform support.",
  },
  {
    id: "wamr_09",
    orderCode: "ORD-MDU-000422",
    customerName: "Ravi Kumar",
    mobileE164: "+919876543210",
    purpose: "trial_reminder",
    productEvent: "trial.reminder_due",
    channelId: "wa_channel_mdu",
    idempotencyKey: "trial.reminder_due:ORD-MDU-000422:2026-07-05",
    status: "read",
    reason: "Older trial reminder was read; later duplicate stays blocked.",
    retryCount: 0,
    providerMessageId: "wamid.mdu.000422.trial",
    lastTransitionAt: "2026-07-05T17:42:00+05:30",
    staffAction: null,
  },
] as const satisfies readonly WhatsAppMessageRequest[];

export const whatsAppWebhookEvents = [
  {
    id: "waweb_01",
    channelId: "wa_channel_mdu",
    providerMessageId: "wamid.mdu.000421.confirm",
    receivedAt: "2026-07-04T10:16:20+05:30",
    eventType: "status",
    normalizedStatus: "sent",
    handling: "applied",
    detail: "Initial sent receipt accepted for order confirmation.",
  },
  {
    id: "waweb_02",
    channelId: "wa_channel_mdu",
    providerMessageId: "wamid.mdu.000421.confirm",
    receivedAt: "2026-07-04T10:17:01+05:30",
    eventType: "status",
    normalizedStatus: "delivered",
    handling: "applied",
    detail: "Delivery rank advanced from sent to delivered.",
  },
  {
    id: "waweb_03",
    channelId: "wa_channel_mdu",
    providerMessageId: "wamid.mdu.000421.confirm",
    receivedAt: "2026-07-04T10:17:08+05:30",
    eventType: "status",
    normalizedStatus: "delivered",
    handling: "duplicate_ignored",
    detail: "Duplicate provider receipt kept from mutating audit history.",
  },
  {
    id: "waweb_04",
    channelId: "wa_channel_mdu",
    providerMessageId: "wamid.mdu.000421.confirm",
    receivedAt: "2026-07-04T10:18:00+05:30",
    eventType: "status",
    normalizedStatus: "read",
    handling: "applied",
    detail: "Read receipt advanced the request to terminal customer-visible state.",
  },
  {
    id: "waweb_05",
    channelId: "wa_channel_mdu",
    providerMessageId: "wamid.mdu.000421.confirm",
    receivedAt: "2026-07-04T10:18:12+05:30",
    eventType: "status",
    normalizedStatus: "sent",
    handling: "stale_ignored",
    detail: "Out-of-order sent event arrived after read and was ignored.",
  },
  {
    id: "waweb_06",
    channelId: "wa_channel_cbe",
    providerMessageId: "wamid.cbe.inbound.stop",
    receivedAt: "2026-07-03T20:10:00+05:30",
    eventType: "inbound_message",
    normalizedStatus: "inbound",
    handling: "profile_selection",
    detail: "STOP arrived on a shared family number; staff must confirm profile scope.",
  },
  {
    id: "waweb_07",
    channelId: "wa_channel_cbe",
    providerMessageId: "wamid.cbe.template.pause",
    receivedAt: "2026-07-05T16:10:00+05:30",
    eventType: "template_status",
    normalizedStatus: "template_paused",
    handling: "applied",
    detail: "Provider paused English ready-for-pickup template.",
  },
] as const satisfies readonly WhatsAppWebhookEvent[];

export const whatsAppUsageLedger = [
  {
    id: "wausage_01",
    tenantCode: "TEN-MDU",
    period: "2026-07",
    utilityConversations: 42,
    serviceConversations: 16,
    templateMessages: 71,
    estimatedCostPaise: 5120,
    evidence: "Meta conversation export reconciled with message_requests.",
  },
  {
    id: "wausage_02",
    tenantCode: "TEN-CBE",
    period: "2026-07",
    utilityConversations: 18,
    serviceConversations: 9,
    templateMessages: 29,
    estimatedCostPaise: 2280,
    evidence: "Usage row is tenant scoped and immutable after reconciliation.",
  },
  {
    id: "wausage_03",
    tenantCode: "TEN-TNJ",
    period: "2026-07",
    utilityConversations: 2,
    serviceConversations: 0,
    templateMessages: 4,
    estimatedCostPaise: 280,
    evidence: "DLQ evidence remains visible while channel is blocked.",
  },
] as const satisfies readonly WhatsAppUsageLedgerLine[];

export const sharedMobileCases = [
  {
    id: "shared_01",
    mobileDisplay: "+91 98765 43210",
    inboundText: "I will collect Ravi shirt tomorrow",
    candidateProfiles: ["Meena Ravi", "Ravi Kumar", "Ananya Ravi", "Meena R."],
    resolution: "auto_matched",
    decision: "Matched to Ravi Kumar because the inbound text names Ravi and shirt.",
  },
  {
    id: "shared_02",
    mobileDisplay: "+91 98765 43210",
    inboundText: "Stop messages",
    candidateProfiles: ["Meena Ravi", "Ravi Kumar", "Ananya Ravi", "Meena R."],
    resolution: "needs_staff_selection",
    decision: "Apply opt-out only after staff chooses family-wide or profile-specific scope.",
  },
  {
    id: "shared_03",
    mobileDisplay: "+91 99441 12233",
    inboundText: "Call me",
    candidateProfiles: ["S. Farida", "Ayaan Shah"],
    resolution: "blocked",
    decision: "Automation is blocked because the profile cannot be inferred safely.",
  },
] as const satisfies readonly SharedMobileCase[];

export const connectorPolicyChecks = [
  {
    id: "policy_consent",
    label: "Consent and opt-out",
    state: "block",
    detail: "Ayaan Shah cannot receive template sends until staff records consent reversal.",
  },
  {
    id: "policy_template",
    label: "Template mapping",
    state: "warn",
    detail: "Balance-due English is pending review and Tamil alteration mapping is missing.",
  },
  {
    id: "policy_idempotency",
    label: "Idempotency",
    state: "pass",
    detail: "Repeated order confirmation reused the existing provider message id.",
  },
  {
    id: "policy_status_rank",
    label: "Status ranking",
    state: "pass",
    detail: "Out-of-order sent webhook was ignored after read state.",
  },
  {
    id: "policy_provider",
    label: "Provider health",
    state: "block",
    detail: "Thanjavur sends are DLQ-only while the channel is blocked.",
  },
] as const satisfies readonly ConnectorPolicyCheck[];

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

export function isWhatsAppRequestRetryable(request: WhatsAppMessageRequest) {
  return request.status === "failed" && request.retryCount < 3;
}

export function isWhatsAppRequestDeadLettered(request: WhatsAppMessageRequest) {
  return request.status === "failed" && request.retryCount >= 3;
}

export function getWhatsAppTemplateReadiness() {
  return {
    approved: whatsAppTemplateMappings.filter(
      (template) => template.status === "approved",
    ).length,
    missing: whatsAppTemplateMappings.filter(
      (template) => template.status === "missing",
    ).length,
    paused: whatsAppTemplateMappings.filter(
      (template) => template.status === "paused",
    ).length,
    pendingReview: whatsAppTemplateMappings.filter(
      (template) => template.status === "pending_review",
    ).length,
  };
}

export function getWhatsAppWebhookReliability() {
  const duplicateIgnored = whatsAppWebhookEvents.filter(
    (event) => event.handling === "duplicate_ignored",
  ).length;
  const staleIgnored = whatsAppWebhookEvents.filter(
    (event) => event.handling === "stale_ignored",
  ).length;
  const profileSelection = whatsAppWebhookEvents.filter(
    (event) => event.handling === "profile_selection",
  ).length;
  const applied = whatsAppWebhookEvents.filter(
    (event) => event.handling === "applied",
  ).length;

  return {
    applied,
    duplicateIgnored,
    exceptions: duplicateIgnored + staleIgnored + profileSelection,
    profileSelection,
    staleIgnored,
  };
}

export function getWhatsAppPolicyBlockBreakdown() {
  const grouped = whatsAppMessageRequests
    .filter((request) => request.status === "blocked")
    .reduce<Map<string, number>>((blocks, request) => {
      const key = request.reason.toLowerCase().includes("opted out")
        ? "Opt-out"
        : request.reason.toLowerCase().includes("template")
          ? "Template"
          : "Policy";

      blocks.set(key, (blocks.get(key) ?? 0) + 1);
      return blocks;
    }, new Map());

  return Array.from(grouped, ([label, count]) => ({ count, label }));
}

export function getWhatsAppConnectorSignals() {
  const deliveredOrRead = whatsAppMessageRequests.filter(
    (request) => request.status === "delivered" || request.status === "read",
  );
  const read = deliveredOrRead.filter((request) => request.status === "read");
  const totalConsentCoverage = whatsAppChannels.reduce(
    (total, channel) => total + channel.consentCoveragePct,
    0,
  );
  const webhookReliability = getWhatsAppWebhookReliability();
  const templateReadiness = getWhatsAppTemplateReadiness();

  return {
    activeChannels: whatsAppChannels.filter((channel) => channel.status === "active")
      .length,
    blockedRequests: whatsAppMessageRequests.filter(
      (request) => request.status === "blocked",
    ).length,
    consentCoveragePct: Math.round(totalConsentCoverage / whatsAppChannels.length),
    degradedChannels: whatsAppChannels.filter(
      (channel) => channel.status !== "active",
    ).length,
    duplicateRequests: whatsAppMessageRequests.filter(
      (request) => request.status === "duplicate",
    ).length,
    estimatedCostPaise: whatsAppUsageLedger.reduce(
      (total, line) => total + line.estimatedCostPaise,
      0,
    ),
    queueBacklog:
      whatsAppMessageRequests.filter((request) => request.status === "queued")
        .length +
      whatsAppMessageRequests.filter((request) =>
        isWhatsAppRequestRetryable(request),
      ).length,
    readRatePct:
      deliveredOrRead.length > 0
        ? Math.round((read.length / deliveredOrRead.length) * 100)
        : 0,
    deadLetteredRequests: whatsAppMessageRequests.filter((request) =>
      isWhatsAppRequestDeadLettered(request),
    ).length,
    retryableFailures: whatsAppMessageRequests.filter((request) =>
      isWhatsAppRequestRetryable(request),
    ).length,
    templatesNeedingReview:
      templateReadiness.missing +
      templateReadiness.paused +
      templateReadiness.pendingReview,
    webhookExceptions: webhookReliability.exceptions,
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
        href: "/shop/whatsapp",
        priority: failure.retryable ? 4 : 9,
      });
    }
  }

  for (const channel of whatsAppChannels) {
    const channelText = normalizeSearchText(
      [
        channel.branchLabel,
        channel.tenantCode,
        channel.displayPhone,
        channel.phoneNumberId,
        channel.wabaId,
        channel.status,
        channel.risk ?? "",
      ].join(" "),
    );

    if (channelText.includes(normalizedText)) {
      results.push({
        entityType: "message",
        id: channel.id,
        title: `${channel.branchLabel} - ${channel.displayPhone}`,
        eyebrow: channel.status === "active" ? "Active channel" : "Channel action",
        description: channel.risk ?? `${channel.messagingLimitTier}, ${channel.qualityRating} quality`,
        href: "/shop/whatsapp",
        priority: channel.status === "active" ? 6 : 3,
      });
    }
  }

  for (const template of whatsAppTemplateMappings) {
    const templateText = normalizeSearchText(
      [
        template.purpose,
        template.language,
        template.providerTemplateName,
        template.status,
        template.ownerAction,
      ].join(" "),
    );

    if (templateText.includes(normalizedText)) {
      results.push({
        entityType: "message",
        id: template.id,
        title: `${template.providerTemplateName} (${template.language})`,
        eyebrow: template.status === "approved" ? "Approved template" : "Template review",
        description: template.ownerAction,
        href: "/shop/whatsapp",
        priority: template.status === "approved" ? 8 : 2,
      });
    }
  }

  for (const request of whatsAppMessageRequests) {
    const requestText = normalizeSearchText(
      [
        request.orderCode,
        request.customerName,
        request.mobileE164,
        request.purpose,
        request.productEvent,
        request.status,
        request.reason,
        request.idempotencyKey,
      ].join(" "),
    );

    if (requestText.includes(normalizedText)) {
      results.push({
        entityType: "message",
        id: request.id,
        title: `${request.purpose} - ${request.customerName}`,
        eyebrow:
          request.status === "blocked"
            ? "Policy block"
            : request.status === "failed"
              ? "Retry evidence"
              : "Message request",
        description: request.reason,
        href: "/shop/whatsapp",
        priority: request.status === "failed" || request.status === "blocked" ? 2 : 7,
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
