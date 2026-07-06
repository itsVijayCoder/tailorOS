import type { OrderStatus } from "@tailoros/core";

export type ModuleKey =
  | "dashboard"
  | "customers"
  | "measurements"
  | "orders"
  | "production"
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
  | "family"
  | "customer"
  | "order"
  | "receipt"
  | "message";

export type CommandSearchResult = Readonly<{
  entityType: SearchEntityType;
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  priority: number;
}>;
