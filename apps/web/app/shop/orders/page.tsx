import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  ClipboardCheck,
  CopyCheck,
  FileClock,
  FileText,
  Fingerprint,
  ReceiptText,
  Ruler,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  formatShortDate,
  humanizeStatus,
  itemStatusLabel,
  statusTone,
} from "@/features/core-modules/presenters";

const wizardSteps = [
  {
    icon: Fingerprint,
    title: "Select exact profile",
    body: "Search mobile or code, then choose one customer profile before measurements appear.",
  },
  {
    icon: FileText,
    title: "Add garment items",
    body: "Create one or more items with garment, quantity, price, date, and assigned tailor.",
  },
  {
    icon: Ruler,
    title: "Snapshot measurement",
    body: "Use latest garment version or capture a new version before order confirmation.",
  },
  {
    icon: CopyCheck,
    title: "Apply item override",
    body: "Temporary changes are stored on the item and never mutate the permanent profile.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Record advance",
    body: "Advance starts the ledger. Balance is derived, not manually typed.",
  },
  {
    icon: ReceiptText,
    title: "Generate receipt",
    body: "Receipt links to order, item summary, paid amount, balance, and notification outbox.",
  },
] as const;

export const metadata: Metadata = {
  title: "Order Book",
};

export default function OrdersPage() {
  const activeOrders = shopOrders;
  const totalItems = shopOrders.reduce((total, order) => total + order.items.length, 0);

  return (
    <>
      <PageHeader
        body="The counter workflow keeps identity, item, measurement, dates, price, advance, and receipt state visible. IDs stay server-generated and the browser only protects unsaved drafts."
        eyebrow="Order book"
        title="A fast wizard that still protects correctness."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Pilot active order records"
            icon={FileText}
            label="Orders"
            tone="accent"
            value={`${shopOrders.length}`}
          />
          <MetricCard
            detail="Independent item status and promise dates"
            icon={ClipboardCheck}
            label="Items"
            tone="success"
            value={`${totalItems}`}
          />
          <MetricCard
            detail="Browser draft prevents accidental navigation loss"
            icon={FileClock}
            label="Draft guard"
            tone="warning"
            value="On"
          />
          <MetricCard
            detail="Target after staff training"
            icon={CopyCheck}
            label="Repeat flow"
            tone="neutral"
            value="2 min"
          />
        </section>

        <section>
          <SectionHeader
            body="The order wizard is intentionally linear because staff must not skip identity or measurement snapshot decisions under rush-hour pressure."
            eyebrow="Wizard"
            title="New order flow"
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {wizardSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:shadow-raised motion-reduce:transition-none"
                  key={step.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <Badge variant="signal">Step {index + 1}</Badge>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-medium text-ink-display">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel
            description="Rows are compact and action-first. Every row can open the order drawer in production."
            title="Active order book"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">Order</th>
                    <th className="border-b border-hairline pb-3 pr-4">Profile</th>
                    <th className="border-b border-hairline pb-3 pr-4">Dates</th>
                    <th className="border-b border-hairline pb-3 pr-4">Items</th>
                    <th className="border-b border-hairline pb-3">Money</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order) => {
                    const financials = calculateOrderFinancials(order);

                    return (
                      <tr
                        className="transition duration-200 ease-premium hover:bg-accent-faded/60 motion-reduce:transition-none"
                        key={order.id}
                      >
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <strong className="block text-ink-display">
                            {order.orderCode}
                          </strong>
                          <StatusBadge tone={statusTone(order.status)}>
                            {humanizeStatus(order.status)}
                          </StatusBadge>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <strong className="block text-ink-display">
                            {order.customerName}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            {order.customerCode} · {order.familyCode}
                          </span>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <span className="block">
                            Due {formatShortDate(order.promisedDate)}
                          </span>
                          <span className="text-xs text-ink-muted">
                            Trial{" "}
                            {order.trialDate
                              ? `${formatShortDate(order.trialDate)} ${order.trialTime ?? "time pending"}`
                              : "not required"}
                          </span>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <div className="grid gap-2">
                            {order.items.map((item) => (
                              <div
                                className="rounded-lg border border-hairline bg-surface px-3 py-2"
                                key={item.id}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold text-ink-display">
                                    {item.garment}
                                  </span>
                                  <StatusBadge tone={statusTone(item.status)}>
                                    {itemStatusLabel(item.status)}
                                  </StatusBadge>
                                </div>
                                <p className="mt-1 text-xs text-ink-muted">
                                  {item.measurementVersion}
                                  {item.overrideNote
                                    ? ` · override: ${item.overrideNote}`
                                    : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-hairline py-4 align-top">
                          <strong className="block text-ink-display">
                            {formatPaise(order.totalPaise)}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            balance {formatPaise(financials.balanceDuePaise)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DataPanel>

          <div className="grid gap-5">
            <DataPanel title="Draft rules">
              <div className="grid gap-3 text-sm leading-6 text-ink-body">
                {[
                  "Drafts can exist only when required fields are incomplete.",
                  "Browser draft stores unsaved steps but not final order IDs.",
                  "Server creates order, item, payment, and receipt IDs.",
                  "Draft restore must show the selected customer identity first.",
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
            <DataPanel title="Acceptance targets">
              <div className="grid gap-3">
                {[
                  ["Repeat customer", "Around 2 minutes"],
                  ["New customer", "Under 5 minutes"],
                  ["Required ID source", "Server"],
                  ["Order summary", "Printable first"],
                ].map(([label, value]) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-3 py-2"
                    key={label}
                  >
                    <span className="text-sm text-ink-muted">{label}</span>
                    <strong className="text-sm text-ink-display">{value}</strong>
                  </div>
                ))}
              </div>
            </DataPanel>
          </div>
        </section>
      </div>
    </>
  );
}
