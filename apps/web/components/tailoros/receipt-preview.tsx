import { FileText } from "lucide-react";

import { StatusChip, type TailorOSStatus } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";

export type ReceiptPreviewProps = {
  balanceDue: number;
  className?: string;
  customerName: string;
  orderId: string;
  paidAmount: number;
  receiptId: string;
  status: TailorOSStatus;
};

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

export function ReceiptPreview({
  balanceDue,
  className,
  customerName,
  orderId,
  paidAmount,
  receiptId,
  status,
}: ReceiptPreviewProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-hairline bg-surface-strong p-5 shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Receipt
          </p>
          <h3 className="mt-1 font-ui text-xl font-semibold text-ink-display">
            {receiptId}
          </h3>
        </div>
        <div className="grid size-10 place-items-center rounded-full bg-accent-faded text-accent-darker">
          <FileText aria-hidden className="size-5" />
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Customer</dt>
          <dd className="font-semibold text-ink-display">{customerName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Order</dt>
          <dd className="font-semibold text-ink-display">{orderId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Paid</dt>
          <dd className="font-semibold text-state-success">
            {moneyFormatter.format(paidAmount)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Balance</dt>
          <dd className="font-semibold text-ink-display">
            {moneyFormatter.format(balanceDue)}
          </dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-hairline pt-4">
        <StatusChip status={status} />
      </div>
    </article>
  );
}
