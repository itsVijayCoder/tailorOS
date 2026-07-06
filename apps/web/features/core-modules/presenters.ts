import type { OrderItem, ProductionTask, SettingsItem } from "./types";

export function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "accent" {
  if (
    status === "ready_for_pickup" ||
    status === "delivered" ||
    status === "closed" ||
    status === "ready" ||
    status === "active" ||
    status === "approved" ||
    status === "read" ||
    status === "pass" ||
    status === "applied" ||
    status === "auto_matched"
  ) {
    return "success";
  }

  if (
    status === "alteration_required" ||
    status === "trial_required" ||
    status === "customer_delay" ||
    status === "material_shortage" ||
    status === "on_hold" ||
    status === "degraded" ||
    status === "pending_review" ||
    status === "paused" ||
    status === "queued" ||
    status === "duplicate" ||
    status === "warn" ||
    status === "duplicate_ignored" ||
    status === "stale_ignored" ||
    status === "profile_selection" ||
    status === "needs_staff_selection"
  ) {
    return "warning";
  }

  if (
    status === "cancelled" ||
    status === "refunded" ||
    status === "blocked" ||
    status === "failed" ||
    status === "missing" ||
    status === "block"
  ) {
    return "danger";
  }

  if (
    status === "booked" ||
    status === "measurement_taken" ||
    status === "cutting" ||
    status === "stitching" ||
    status === "finishing" ||
    status === "accepted" ||
    status === "sent" ||
    status === "inbound" ||
    status === "template_paused"
  ) {
    return "accent";
  }

  return "neutral";
}

export function settingTone(state: SettingsItem["state"]) {
  if (state === "ready") {
    return "success" as const;
  }

  if (state === "blocked") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function taskLaneLabel(lane: ProductionTask["lane"]) {
  return humanizeStatus(lane);
}

export function itemStatusLabel(status: OrderItem["status"]) {
  return humanizeStatus(status);
}

export function formatShortDate(input: string | null) {
  if (!input) {
    return "Not set";
  }

  const date = new Date(`${input}T00:00:00+05:30`);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
