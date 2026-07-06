import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  IndianRupee,
  MessageCircleWarning,
  PackageCheck,
  UsersRound,
} from "lucide-react";

import {
  calculateOrderFinancials,
  formatPaise,
  getRealReportsData,
} from "@/features/core-modules/real-data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { formatShortDate } from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const { productionTasks, reportMetrics, shopOrders, whatsAppFailures } =
    await getRealReportsData();
  const overdueOrders = shopOrders.filter(
    (order) => order.promisedDate <= "2026-07-06",
  );
  const tailorLoad = Array.from(
    productionTasks.reduce<Map<string, number>>((load, task) => {
      load.set(task.assignedTo, (load.get(task.assignedTo) ?? 0) + 1);
      return load;
    }, new Map()),
  );

  return (
    <>
      <PageHeader
        body="Reports should answer the owner’s next action: call, collect, reassign, mark ready, review correction, or inspect a failed message."
        eyebrow="Reports"
        title="Operating visibility without busy dashboards."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportMetrics.map((metric) => (
            <MetricCard
              detail={metric.detail}
              icon={
                metric.label === "Today collection"
                  ? IndianRupee
                  : metric.label === "Pending balance"
                    ? BarChart3
                    : metric.label === "Overdue delivery"
                      ? PackageCheck
                      : MessageCircleWarning
              }
              key={metric.label}
              label={metric.label}
              tone={
                metric.trend === "up"
                  ? "success"
                  : metric.trend === "down"
                    ? "accent"
                    : "warning"
              }
              value={metric.value}
            />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <DataPanel
            description="Every row links back to the operational record that can be acted on."
            title="Overdue and due-today delivery"
          >
            <div className="grid gap-3">
              {overdueOrders.map((order) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-medium text-ink-display">
                        {order.orderCode}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        {order.customerName} · due{" "}
                        {formatShortDate(order.promisedDate)}
                      </p>
                    </div>
                    <StatusBadge tone="warning">Owner action</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-body">
                    {order.notes}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Pending balance is calculated from ledger rows so reports cannot drift from receipts."
            title="Pending balances"
          >
            <div className="grid gap-3">
              {shopOrders.map((order) => {
                const financials = calculateOrderFinancials(order);

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-3 py-3"
                    key={order.id}
                  >
                    <div>
                      <strong className="block text-sm text-ink-display">
                        {order.customerName}
                      </strong>
                      <span className="text-xs text-ink-muted">
                        {order.orderCode} · {order.receiptCode}
                      </span>
                    </div>
                    <span className="font-ui text-sm font-bold text-ink-display">
                      {formatPaise(financials.balanceDuePaise)}
                    </span>
                  </div>
                );
              })}
            </div>
          </DataPanel>
        </section>

        <section className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <DataPanel title="Tailor workload">
            <div className="grid gap-3">
              {tailorLoad.map(([name, count]) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3"
                  key={name}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink-display">
                      <UsersRound aria-hidden className="size-4 text-accent" />
                      {name}
                    </span>
                    <StatusBadge tone={count > 1 ? "warning" : "accent"}>
                      {count} task{count > 1 ? "s" : ""}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-panel">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, count * 38)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Messaging reports separate retryable provider failures from opt-out blocks."
            title="WhatsApp delivery failures"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {whatsAppFailures.map((failure) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={failure.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <MessageCircleWarning
                      aria-hidden
                      className="size-5 text-accent"
                    />
                    <StatusBadge
                      tone={failure.retryable ? "warning" : "danger"}
                    >
                      {failure.retryable ? "Retry" : "Blocked"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-3 font-display text-xl font-medium text-ink-display">
                    {failure.customerName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {failure.reason}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="Exports are useful after access control is enforced. In Phase 05, report rows keep their operational action visible."
            eyebrow="Access"
            title="Report controls"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ArrowUpRight,
                title: "Collection export",
                body: "Owner/manager only, includes correction reasons.",
              },
              {
                icon: ArrowDownRight,
                title: "Pending balance follow-up",
                body: "Counter action opens customer/order context.",
              },
              {
                icon: AlertTriangle,
                title: "Delay exception review",
                body: "Owner can inspect reason before customer promise changes.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-4"
                  key={item.title}
                >
                  <Icon aria-hidden className="size-5 text-accent" />
                  <h3 className="mt-3 font-display text-xl font-medium text-ink-display">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
