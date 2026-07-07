import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardCheck,
  CopyCheck,
  FileClock,
  FileText,
  Plus,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  calculateOrderFinancials,
  formatPaise,
  getRealOrders,
} from "@/features/core-modules/real-data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  formatShortDate,
  humanizeStatus,
  itemStatusLabel,
  statusTone,
} from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Order Book",
};

export default async function OrdersPage() {
  const { shopOrders } = await getRealOrders();
  const activeOrders = shopOrders;
  const totalItems = shopOrders.reduce(
    (total, order) => total + order.items.length,
    0,
  );

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/shop/orders/new"
          >
            <Plus aria-hidden className="size-4" />
            New order
          </Link>
        }
        body="The counter workflow keeps identity, item, measurement, dates, price, advance, and receipt state visible. IDs stay server-generated and the browser only protects unsaved drafts."
        eyebrow="Order book"
        title="Orders"
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
          <DataPanel title="Active order book">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">
                      Order
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Profile
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Dates
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Items
                    </th>
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
        </section>
      </div>
    </>
  );
}
