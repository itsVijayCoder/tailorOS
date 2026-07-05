export type PaymentLedgerEntry = Readonly<{
  amountPaise: number;
  kind: "advance" | "balance" | "refund" | "correction";
}>;

export type PaymentLedgerSummary = Readonly<{
  chargedPaise: number;
  collectedPaise: number;
  refundedPaise: number;
  correctedPaise: number;
  netPaidPaise: number;
  balanceDuePaise: number;
}>;

export function calculatePaymentLedger(input: {
  finalTotalPaise: number;
  payments: readonly PaymentLedgerEntry[];
}): PaymentLedgerSummary {
  if (!Number.isInteger(input.finalTotalPaise) || input.finalTotalPaise < 0) {
    throw new Error("Order total must be a non-negative integer paise value.");
  }

  const totals = input.payments.reduce(
    (result, payment) => {
      if (!Number.isInteger(payment.amountPaise) || payment.amountPaise === 0) {
        throw new Error(
          "Payment amount must be a non-zero integer paise value.",
        );
      }

      if (payment.kind === "refund") {
        return {
          ...result,
          refundedPaise: result.refundedPaise + Math.abs(payment.amountPaise),
        };
      }

      if (payment.kind === "correction") {
        return {
          ...result,
          correctedPaise: result.correctedPaise + payment.amountPaise,
        };
      }

      if (payment.amountPaise < 0) {
        throw new Error("Advance and balance payments must be positive.");
      }

      return {
        ...result,
        collectedPaise: result.collectedPaise + payment.amountPaise,
      };
    },
    {
      collectedPaise: 0,
      refundedPaise: 0,
      correctedPaise: 0,
    },
  );

  const netPaidPaise =
    totals.collectedPaise + totals.correctedPaise - totals.refundedPaise;

  return {
    chargedPaise: input.finalTotalPaise,
    collectedPaise: totals.collectedPaise,
    refundedPaise: totals.refundedPaise,
    correctedPaise: totals.correctedPaise,
    netPaidPaise,
    balanceDuePaise: Math.max(input.finalTotalPaise - netPaidPaise, 0),
  };
}

export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function nextVersionNumber(currentVersionNo: number | null): number {
  if (currentVersionNo === null) {
    return 1;
  }

  if (!Number.isInteger(currentVersionNo) || currentVersionNo < 1) {
    throw new Error("Current measurement version must be a positive integer.");
  }

  return currentVersionNo + 1;
}
