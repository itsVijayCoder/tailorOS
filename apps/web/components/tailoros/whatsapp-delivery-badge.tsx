import { StatusChip } from "@/components/ui/status-chip";

export type WhatsAppDeliveryState =
  "queued" | "sent" | "delivered" | "read" | "failed" | "opted-out";

const deliveryStatusMap = {
  queued: "queued",
  sent: "sent",
  delivered: "delivered-message",
  read: "read",
  failed: "failed",
  "opted-out": "opted-out",
} as const;

export function WhatsAppDeliveryBadge({
  state,
}: {
  state: WhatsAppDeliveryState;
}) {
  return <StatusChip status={deliveryStatusMap[state]} />;
}
