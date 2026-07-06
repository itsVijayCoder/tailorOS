import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MessageCircleWarning,
  PackageCheck,
  TimerReset,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calculateOrderFinancials,
  formatPaise,
  getDashboardSignals,
  getPartialDeliveryOrders,
  isWhatsAppFailureRetryable,
  productionTasks,
  shopOrders,
  whatsAppFailures,
} from "@/features/core-modules/data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { formatShortDate, humanizeStatus, statusTone } from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Shop Dashboard",
};

export default function ShopDashboardPage() {
  const signals = getDashboardSignals();
  const partialDeliveryOrders = getPartialDeliveryOrders();
  const blockedTasks = productionTasks.filter((task) => task.exceptionReason);
  const balanceOrders = shopOrders
    .map((order) => ({ order, financials: calculateOrderFinancials(order) }))
    .filter(({ financials }) => financials.balanceDuePaise > 0);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="/shop/orders"
            >
              New order flow
              <ArrowUpRight aria-hidden className="size-4" />
            </Link>
            <Button>
              Mark pickup
              <PackageCheck aria-hidden className="size-4" />
            </Button>
          </>
        }
        body="The operating cockpit answers what is due, what is blocked, who owes money, and which customer messages need staff action before the counter gets busy."
        eyebrow="Daily cockpit"
        title="Know today’s shop work in under 30 seconds."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${signals.partialDeliveryCount} order has mixed item readiness`}
            icon={PackageCheck}
            label="Today delivery"
            tone="accent"
            value={`${signals.dueTodayCount}`}
          />
          <MetricCard
            detail="Trial date without exact time remains visible"
            icon={TimerReset}
            label="Pending trial"
            tone="warning"
            value="2"
          />
          <MetricCard
            detail="Includes refunds and payment corrections"
            icon={IndianRupee}
            label="Balance due"
            tone="success"
            value={formatPaise(signals.balanceDuePaise)}
          />
          <MetricCard
            detail={`${signals.retryableWhatsAppFailures} retryable, 1 blocked by opt-out`}
            icon={MessageCircleWarning}
            label="WA failures"
            tone="danger"
            value={`${whatsAppFailures.length}`}
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
          <DataPanel
            description="Item-level status is shown before order-level status so partial delivery cannot be hidden."
            title="Today delivery board"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">Order</th>
                    <th className="border-b border-hairline pb-3 pr-4">Customer</th>
                    <th className="border-b border-hairline pb-3 pr-4">Items</th>
                    <th className="border-b border-hairline pb-3 pr-4">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {shopOrders.map((order) => (
                      <tr
                        className="group transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                        key={order.id}
                      >
                        <td className="whitespace-nowrap border-b border-hairline py-4 pr-4 align-top">
                          <Link
                            className="font-ui font-semibold text-ink-display hover:text-accent"
                            href="/shop/orders"
                          >
                            {order.orderCode}
                          </Link>
                          <p className="mt-1 text-xs text-ink-muted">
                            {humanizeStatus(order.status)}
                          </p>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <strong className="block text-ink-display">
                            {order.customerName}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            {order.customerCode}
                          </span>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {order.items.map((item) => (
                              <StatusBadge
                                key={item.id}
                                tone={statusTone(item.status)}
                              >
                                {item.garment}: {humanizeStatus(item.status)}
                              </StatusBadge>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap border-b border-hairline py-4 pr-4 align-top">
                          {formatShortDate(order.promisedDate)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DataPanel>

          <div className="grid gap-5">
            <DataPanel
              description="These are owner-visible blockers, not hidden notes."
              title="Blocked work"
            >
              <div className="grid gap-3">
                {blockedTasks.map((task) => (
                  <article
                    className="rounded-lg border border-hairline bg-surface p-3"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block text-sm text-ink-display">
                          {task.orderCode} · {task.garment}
                        </strong>
                        <p className="mt-1 text-xs leading-5 text-ink-muted">
                          {task.customerName} · {task.assignedTo}
                        </p>
                      </div>
                      <StatusBadge tone="warning">
                        {formatShortDate(task.dueDate)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink-body">
                      {task.exceptionReason}
                    </p>
                  </article>
                ))}
              </div>
            </DataPanel>

            <DataPanel title="WhatsApp failures">
              <div className="grid gap-3">
                {whatsAppFailures.map((failure) => (
                  <article
                    className="rounded-lg border border-hairline bg-surface p-3"
                    key={failure.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge
                        tone={
                          isWhatsAppFailureRetryable(failure)
                            ? "warning"
                            : "danger"
                        }
                      >
                        {failure.retryable ? "Retryable" : "Blocked"}
                      </StatusBadge>
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {failure.orderCode}
                      </span>
                    </div>
                    <strong className="mt-3 block text-sm text-ink-display">
                      {failure.purpose} · {failure.customerName}
                    </strong>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {failure.reason}
                    </p>
                  </article>
                ))}
              </div>
            </DataPanel>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div>
            <SectionHeader
              body="Partial delivery is explicit because one garment can be ready while another is still in stitching."
              eyebrow="Edge control"
              title="Partial delivery visibility"
            />
            <div className="mt-4 grid gap-3">
              {partialDeliveryOrders.map((order) => (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm"
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-medium text-ink-display">
                        {order.orderCode}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {order.customerName} · {order.items.length} items
                      </p>
                    </div>
                    <StatusBadge tone="warning">Mixed readiness</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {order.items.map((item) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
                        key={item.id}
                      >
                        <span className="text-sm font-semibold text-ink-display">
                          {item.garment}
                        </span>
                        <StatusBadge tone={statusTone(item.status)}>
                          {humanizeStatus(item.status)}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <DataPanel
            description="Balance rows open payment capture or receipt sharing in production."
            title="Balance due list"
          >
            <div className="grid gap-3">
              {balanceOrders.map(({ financials, order }) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-3 py-3"
                  key={order.id}
                >
                  <div>
                    <strong className="block text-sm text-ink-display">
                      {order.customerName}
                    </strong>
                    <span className="text-xs text-ink-muted">
                      {order.orderCode} · paid{" "}
                      {formatPaise(financials.netPaidPaise)}
                    </span>
                  </div>
                  <span className="font-ui text-sm font-bold text-ink-display">
                    {formatPaise(financials.balanceDuePaise)}
                  </span>
                </div>
              ))}
            </div>
          </DataPanel>
        </section>

        <section className="grid gap-4 rounded-lg border border-hairline bg-signal-faded p-5 text-signal-darker md:grid-cols-[2.5rem_minmax(0,1fr)]">
          <span className="grid size-10 place-items-center rounded-lg border border-signal bg-signal">
            <AlertTriangle aria-hidden className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-medium text-ink-display">
              Pilot rule: fix data quality before automation.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-ink-body">
              The dashboard deliberately shows identity, item status, balance,
              correction, delay, and opt-out context in the same workspace.
              WhatsApp events should only amplify clean operational records.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge tone="success">
                <CheckCircle2 aria-hidden className="mr-1 size-3.5" />
                Auditable ledger
              </StatusBadge>
              <StatusBadge tone="accent">
                <Clock3 aria-hidden className="mr-1 size-3.5" />
                Item-level workflow
              </StatusBadge>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
