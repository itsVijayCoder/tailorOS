export const orderStatuses = [
  "draft",
  "booked",
  "measurement_taken",
  "material_confirmed",
  "cutting",
  "stitching",
  "finishing",
  "trial_required",
  "alteration_required",
  "ready_for_pickup",
  "delivered",
  "closed",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

const transitions = {
  draft: ["booked", "cancelled"],
  booked: ["measurement_taken", "material_confirmed", "cancelled"],
  measurement_taken: ["material_confirmed", "cutting", "cancelled"],
  material_confirmed: ["cutting", "cancelled"],
  cutting: ["stitching", "cancelled"],
  stitching: ["finishing", "trial_required", "alteration_required"],
  finishing: ["trial_required", "ready_for_pickup"],
  trial_required: ["alteration_required", "ready_for_pickup"],
  alteration_required: ["stitching", "finishing", "ready_for_pickup"],
  ready_for_pickup: ["delivered"],
  delivered: ["closed"],
  closed: [],
  cancelled: [],
} satisfies Record<OrderStatus, readonly OrderStatus[]>;

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  const allowedTransitions: readonly OrderStatus[] = transitions[from];
  return allowedTransitions.includes(to);
}

export function transitionOrder(input: {
  from: OrderStatus;
  to: OrderStatus;
  reason?: string;
}): OrderStatus {
  if (!canTransitionOrder(input.from, input.to)) {
    throw new Error(
      `Invalid order transition from ${input.from} to ${input.to}.`,
    );
  }

  if (input.to === "cancelled" && !input.reason?.trim()) {
    throw new Error("Cancelling an order requires a reason.");
  }

  return input.to;
}
