import type { WhatsAppMessageStatus } from "@tailoros/schemas";

const statusRank = {
  queued: 10,
  accepted: 20,
  sent: 30,
  delivered: 40,
  read: 50,
  failed: 60,
  blocked: 70,
} as const satisfies Record<WhatsAppMessageStatus, number>;

export function getWhatsAppStatusRank(status: WhatsAppMessageStatus) {
  return statusRank[status];
}

export function shouldApplyWhatsAppStatusUpdate(input: {
  currentStatus: WhatsAppMessageStatus | null;
  nextStatus: WhatsAppMessageStatus;
}) {
  if (!input.currentStatus) {
    return true;
  }

  return (
    getWhatsAppStatusRank(input.nextStatus) >=
    getWhatsAppStatusRank(input.currentStatus)
  );
}
