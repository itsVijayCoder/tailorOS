import type { OrderStatus } from "@tailoros/core";

export type ModuleKey =
  | "dashboard"
  | "search"
  | "customers"
  | "measurements"
  | "orders"
  | "production"
  | "whatsapp"
  | "payments"
  | "reports"
  | "settings";

export type CoreNavItem = Readonly<{
  key: ModuleKey;
  href: string;
  label: string;
  description: string;
}>;

export type CustomerProfile = Readonly<{
  id: string;
  customerCode: string;
  fullName: string;
  relationLabel: string;
  garmentContext: string;
  lastMeasurement: string;
  activeOrders: number;
  notes: string;
}>;

export type FamilyAccount = Readonly<{
  id: string;
  familyCode: string;
  primaryMobileE164: string;
  primaryMobileDisplay: string;
  city: string;
  address: string;
  whatsappOptIn: boolean;
  duplicateRisk: string | null;
  profiles: readonly CustomerProfile[];
}>;

export type MeasurementTemplate = Readonly<{
  code: string;
  label: string;
  version: string;
  defaultDays: number;
  requiredFields: readonly string[];
  optionalFields: readonly string[];
  rangeHint: string;
}>;

export type MeasurementVersion = Readonly<{
  id: string;
  customerCode: string;
  garment: string;
  versionNo: number;
  unit: "inch" | "cm";
  changedAt: string;
  changedBy: string;
  reason: string;
  changedFields: readonly {
    label: string;
    from: string;
    to: string;
  }[];
}>;

export type OrderItem = Readonly<{
  id: string;
  itemCode: string;
  garment: string;
  status: OrderStatus | "on_hold" | "customer_delay" | "material_shortage";
  promisedDate: string;
  assignedTo: string;
  pricePaise: number;
  measurementVersion: string;
  overrideNote: string | null;
}>;

export type PaymentLedgerLine = Readonly<{
  id: string;
  kind: "advance" | "balance" | "refund" | "correction";
  mode: "cash" | "upi" | "card" | "bank" | "credit" | "adjustment";
  amountPaise: number;
  reason: string | null;
  recordedAt: string;
}>;

export type ShopOrder = Readonly<{
  id: string;
  orderCode: string;
  receiptCode: string;
  customerCode: string;
  customerName: string;
  familyCode: string;
  mobileE164: string;
  orderDate: string;
  trialDate: string | null;
  trialTime: string | null;
  promisedDate: string;
  status: OrderStatus;
  totalPaise: number;
  items: readonly OrderItem[];
  payments: readonly PaymentLedgerLine[];
  notes: string;
}>;

export type ProductionTask = Readonly<{
  id: string;
  orderCode: string;
  itemCode: string;
  customerName: string;
  garment: string;
  lane:
    | "confirmed"
    | "fabric_received"
    | "cutting"
    | "stitching"
    | "trial_ready"
    | "alteration_needed"
    | "ready_for_pickup"
    | "delivered";
  assignedTo: string;
  dueDate: string;
  exceptionReason: string | null;
  notifyCustomer: boolean;
}>;

export type WhatsAppFailure = Readonly<{
  id: string;
  orderCode: string;
  customerName: string;
  purpose: string;
  status: "failed" | "blocked" | "opted_out";
  reason: string;
  retryable: boolean;
  occurredAt: string;
}>;

export type WhatsAppChannel = Readonly<{
  id: string;
  tenantCode: string;
  branchLabel: string;
  provider: "meta_cloud_api";
  wabaId: string;
  phoneNumberId: string;
  displayPhone: string;
  status: "active" | "degraded" | "blocked";
  qualityRating: "green" | "yellow" | "red";
  messagingLimitTier: string;
  consentCoveragePct: number;
  credentialAgeDays: number;
  tokenRotationDue: string;
  lastHealthCheck: string;
  risk: string | null;
}>;

export type WhatsAppTemplateMapping = Readonly<{
  id: string;
  purpose:
    | "order_confirmation"
    | "trial_reminder"
    | "ready_for_pickup"
    | "balance_due"
    | "alteration_update";
  language: "en" | "ta";
  providerTemplateName: string;
  category: "utility" | "marketing" | "authentication";
  status: "approved" | "pending_review" | "paused" | "missing";
  variables: readonly string[];
  fallback: "call" | "sms" | "manual_review";
  lastSyncedAt: string;
  ownerAction: string;
}>;

export type WhatsAppMessageRequest = Readonly<{
  id: string;
  orderCode: string;
  customerName: string;
  mobileE164: string;
  purpose: WhatsAppTemplateMapping["purpose"];
  productEvent: string;
  channelId: string;
  idempotencyKey: string;
  status:
    | "queued"
    | "accepted"
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "blocked"
    | "duplicate";
  reason: string;
  retryCount: number;
  providerMessageId: string | null;
  lastTransitionAt: string;
  staffAction: string | null;
}>;

export type WhatsAppWebhookEvent = Readonly<{
  id: string;
  channelId: string;
  providerMessageId: string;
  receivedAt: string;
  eventType: "status" | "inbound_message" | "template_status";
  normalizedStatus:
    | "accepted"
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "inbound"
    | "template_paused";
  handling:
    "applied" | "duplicate_ignored" | "stale_ignored" | "profile_selection";
  detail: string;
}>;

export type WhatsAppUsageLedgerLine = Readonly<{
  id: string;
  tenantCode: string;
  period: string;
  utilityConversations: number;
  serviceConversations: number;
  templateMessages: number;
  estimatedCostPaise: number;
  evidence: string;
}>;

export type SharedMobileCase = Readonly<{
  id: string;
  mobileDisplay: string;
  inboundText: string;
  candidateProfiles: readonly string[];
  resolution: "auto_matched" | "needs_staff_selection" | "blocked";
  decision: string;
}>;

export type ConnectorPolicyCheck = Readonly<{
  id: string;
  label: string;
  state: "pass" | "warn" | "block";
  detail: string;
}>;

export type ReportMetric = Readonly<{
  label: string;
  value: string;
  detail: string;
  trend: "up" | "down" | "flat";
}>;

export type SettingsItem = Readonly<{
  id: string;
  title: string;
  state: "ready" | "needs_review" | "blocked";
  owner: string;
  detail: string;
}>;

export type SearchEntityType =
  "family" | "customer" | "order" | "receipt" | "message";

export type CommandSearchResult = Readonly<{
  entityType: SearchEntityType;
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  priority: number;
  hitType: "exact" | "prefix" | "shortcut" | "fts";
  matchedOn: string;
}>;

export type CommandSearchMeta = Readonly<{
  rawQuery: string;
  normalizedQuery: string;
  queryKind:
    | "empty"
    | "mobile"
    | "customer_code"
    | "order_code"
    | "receipt_code"
    | "shortcut"
    | "text";
  strategy:
    | "none"
    | "indexed_mobile_prefix"
    | "indexed_code_exact"
    | "indexed_status_date"
    | "fts_prefix";
  minLengthSatisfied: boolean;
  resultCount: number;
  latencyBudgetMs: number | null;
  elapsedMs: number;
  source: "pilot-fixture";
}>;

export type CommandSearchResponse = Readonly<{
  results: readonly CommandSearchResult[];
  meta: CommandSearchMeta;
}>;
