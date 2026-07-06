import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  FileText,
  LockKeyhole,
  Printer,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import {
  calculateOrderFinancials,
  formatPaise,
  shopOrders,
} from "@/features/core-modules/data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { formatShortDate } from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Payments and Receipts",
};

export default function PaymentsPage() {
  const ledgerRows = shopOrders.flatMap((order) =>
    order.payments.map((payment) => ({ order, payment })),
  );
  const balanceDuePaise = shopOrders.reduce(
    (total, order) => total + calculateOrderFinancials(order).balanceDuePaise,
    0,
  );
  const paidPaise = shopOrders.reduce(
    (total, order) => total + calculateOrderFinancials(order).netPaidPaise,
    0,
  );
  const correctionCount = ledgerRows.filter(
    ({ payment }) => payment.kind === "correction" || payment.kind === "refund",
  ).length;

  return (
    <>
      <PageHeader
        body="Payments are trust-sensitive. Staff append ledger rows, refunds, and corrections with reasons; they do not silently mutate historical records."
        eyebrow="Money control"
        title="Ledger payments and simple receipts for local shop trust."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Net paid after corrections and refunds"
            icon={BadgeIndianRupee}
            label="Collected"
            tone="success"
            value={formatPaise(paidPaise)}
          />
          <MetricCard
            detail="Derived from ledger, not manually typed"
            icon={LockKeyhole}
            label="Balance"
            tone="warning"
            value={formatPaise(balanceDuePaise)}
          />
          <MetricCard
            detail="Refund/correction rows with reasons"
            icon={ShieldCheck}
            label="Audit rows"
            tone="danger"
            value={`${correctionCount}`}
          />
          <MetricCard
            detail="HTML-first printable receipt path"
            icon={Printer}
            label="Receipts"
            tone="accent"
            value={`${shopOrders.length}`}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Every row is append-only. Corrections and refunds must carry a staff reason."
            title="Payment ledger"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">Order</th>
                    <th className="border-b border-hairline pb-3 pr-4">Kind</th>
                    <th className="border-b border-hairline pb-3 pr-4">Mode</th>
                    <th className="border-b border-hairline pb-3 pr-4">Amount</th>
                    <th className="border-b border-hairline pb-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map(({ order, payment }) => (
                    <tr
                      className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                      key={payment.id}
                    >
                      <td className="border-b border-hairline py-4 pr-4 align-top">
                        <strong className="block text-ink-display">
                          {order.orderCode}
                        </strong>
                        <span className="text-xs text-ink-muted">
                          {order.customerName}
                        </span>
                      </td>
                      <td className="border-b border-hairline py-4 pr-4 align-top">
                        <StatusBadge
                          tone={
                            payment.kind === "correction" ||
                            payment.kind === "refund"
                              ? "warning"
                              : "success"
                          }
                        >
                          {payment.kind}
                        </StatusBadge>
                      </td>
                      <td className="border-b border-hairline py-4 pr-4 align-top uppercase text-ink-muted">
                        {payment.mode}
                      </td>
                      <td className="border-b border-hairline py-4 pr-4 align-top font-semibold text-ink-display">
                        {formatPaise(payment.amountPaise)}
                      </td>
                      <td className="border-b border-hairline py-4 align-top">
                        <span className="text-sm leading-6 text-ink-muted">
                          {payment.reason ?? "Not required"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>

          <DataPanel title="Correction policy">
            <div className="grid gap-3 text-sm leading-6 text-ink-body">
              {[
                "Advance and balance payments must be positive.",
                "Refunds and corrections require a reason.",
                "Receipt balance is recalculated from ledger rows.",
                "Payment correction permission is owner or manager only.",
              ].map((rule) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={rule}
                >
                  {rule}
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="Receipt is HTML-first for v1. PDF or image export can be generated and stored in R2 after the pilot proves the receipt layout."
            eyebrow="Receipt"
            title="Printable receipt snapshots"
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {shopOrders.map((order) => {
              const financials = calculateOrderFinancials(order);
              const paid = financials.balanceDuePaise === 0;

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-5 shadow-sm"
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <ReceiptText aria-hidden className="size-5" />
                    </span>
                    <StatusBadge tone={paid ? "success" : "warning"}>
                      {paid ? "Paid" : "Partial"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-medium text-ink-display">
                    {order.receiptCode}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {order.customerName} · {order.orderCode}
                  </p>
                  <div className="mt-4 grid gap-2 rounded-lg border border-hairline bg-surface p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-muted">Total</span>
                      <strong className="text-sm text-ink-display">
                        {formatPaise(order.totalPaise)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-muted">Paid</span>
                      <strong className="text-sm text-ink-display">
                        {formatPaise(financials.netPaidPaise)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-muted">Balance</span>
                      <strong className="text-sm text-ink-display">
                        {formatPaise(financials.balanceDuePaise)}
                      </strong>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-ink-muted">
                    Issued {formatShortDate(order.orderDate)} · signed token
                    link policy belongs to the tenant API.
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-hairline bg-surface-strong p-5">
          <div className="grid gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
            <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
              <FileText aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-medium text-ink-display">
                Receipt storage boundary
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-ink-muted">
                D1 stores receipt metadata and ledger state. R2 stores rendered
                receipt snapshots and downloadable files. Public links must be
                signed, scoped to one receipt, and expire by tenant policy.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
