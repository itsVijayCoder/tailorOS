export type SharedMobileResolution =
  | {
      kind: "safe_status";
      orderId: string;
      orderCode: string;
    }
  | {
      kind: "disambiguation_required";
      choices: readonly {
        orderId: string;
        orderCode: string;
        customerDisplayName: string;
      }[];
    }
  | {
      kind: "unknown_number";
    };

export function resolveSharedMobileInbound(input: {
  activeOrders: readonly {
    orderId: string;
    orderCode: string;
    customerDisplayName: string;
  }[];
}): SharedMobileResolution {
  if (input.activeOrders.length === 0) {
    return { kind: "unknown_number" };
  }

  if (input.activeOrders.length === 1) {
    const order = input.activeOrders[0];

    if (!order) {
      return { kind: "unknown_number" };
    }

    return {
      kind: "safe_status",
      orderId: order.orderId,
      orderCode: order.orderCode,
    };
  }

  return {
    kind: "disambiguation_required",
    choices: input.activeOrders.map((order) => ({
      orderId: order.orderId,
      orderCode: order.orderCode,
      customerDisplayName: order.customerDisplayName,
    })),
  };
}
