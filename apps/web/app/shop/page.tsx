import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  IndianRupee,
  MessageCircleWarning,
  PackageCheck,
  Ruler,
  Search,
  ShoppingBag,
  TimerReset,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calculateOrderFinancials,
  formatPaise,
  getPartialDeliveryOrders,
  getRealDashboardData,
  getRealOrders,
  isWhatsAppFailureRetryable,
} from "@/features/core-modules/real-data";
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
  description: "Priority-first shop dashboard for TailorOS counter work.",
};

export default async function ShopDashboardPage() {
  const [{ shopOrders }, dashboard] = await Promise.all([
    getRealOrders(),
    getRealDashboardData(),
  ]);

  const todayOrders = dashboard.ordersDueToday;
  const paymentDueOrders = dashboard.paymentDueOrders;
  const productionTasks = dashboard.productionTasks;
  const whatsAppFailures = dashboard.whatsAppFailures;
  const partialDeliveryOrders = getPartialDeliveryOrders(shopOrders);
  const trialFollowUps = shopOrders.filter(
    (order) => Boolean(order.trialDate) && !order.trialTime,
  );
  const blockedTasks = productionTasks.filter((task) => task.exceptionReason);
  const retryableFailureCount = whatsAppFailures.filter(
    isWhatsAppFailureRetryable,
  ).length;

  const balanceOrders = shopOrders
    .map((order) => ({ order, financials: calculateOrderFinancials(order) }))
    .filter(({ financials }) => financials.balanceDuePaise > 0)
    .sort((left, right) => right.financials.balanceDuePaise - left.financials.balanceDuePaise);

  const collectionTotalPaise = balanceOrders.reduce(
    (total, item) => total + item.financials.balanceDuePaise,
    0,
  );
  const firstTodayOrder = todayOrders[0] ?? null;
  const firstBlockedTask = blockedTasks[0] ?? null;
  const firstPartialDeliveryOrder = partialDeliveryOrders[0] ?? null;
  const firstTrialFollowUp = trialFollowUps[0] ?? null;
  const topBalanceOrder = balanceOrders[0] ?? null;
  const deliveryQueue = (todayOrders.length > 0 ? todayOrders : [...shopOrders])
    .slice()
    .sort(
      (left, right) =>
        new Date(left.promisedDate).getTime() -
        new Date(right.promisedDate).getTime(),
    )
    .slice(0, 8);

  const updateCards = [
    {
      actionHref: "/shop/orders",
      actionLabel: "Open queue",
      count: todayOrders.length,
      detail:
        firstTodayOrder
          ? `${firstTodayOrder.orderCode} is the first pickup due today.`
          : "No pickup due today. Review the next date in the queue.",
      icon: PackageCheck,
      title: "Pickup queue",
      tone: todayOrders.length > 0 ? "warning" : "success",
    },
    {
      actionHref: "/shop/payments",
      actionLabel: "Review balances",
      count: paymentDueOrders.length,
      detail:
        paymentDueOrders.length > 0
          ? `${formatPaise(collectionTotalPaise)} is still open across the active balance list.`
          : "No open payment rows need attention right now.",
      icon: IndianRupee,
      title: "Collections",
      tone: paymentDueOrders.length > 0 ? "warning" : "success",
    },
    {
      actionHref: "/shop/production",
      actionLabel: "Open production",
      count: blockedTasks.length,
      detail:
        firstBlockedTask
          ? `${firstBlockedTask.orderCode} · ${firstBlockedTask.garment} is blocked by ${firstBlockedTask.exceptionReason}.`
          : "No production blocker is currently flagged.",
      icon: AlertTriangle,
      title: "Production blockers",
      tone: blockedTasks.length > 0 ? "danger" : "success",
    },
    {
      actionHref: "/shop/whatsapp",
      actionLabel: "Open messages",
      count: whatsAppFailures.length,
      detail:
        whatsAppFailures.length > 0
          ? `${retryableFailureCount} retryable, ${whatsAppFailures.length - retryableFailureCount} terminal.`
          : "No message failures need operator attention.",
      icon: MessageCircleWarning,
      title: "WhatsApp issues",
      tone: whatsAppFailures.length > 0 ? "danger" : "success",
    },
    {
      actionHref: "/shop/orders",
      actionLabel: "Check orders",
      count: partialDeliveryOrders.length,
      detail:
        firstPartialDeliveryOrder
          ? `${firstPartialDeliveryOrder.orderCode} is partially ready and should stay visible.`
          : "No partial deliveries are currently split across items.",
      icon: Clock3,
      title: "Partial deliveries",
      tone: partialDeliveryOrders.length > 0 ? "warning" : "success",
    },
    {
      actionHref: "/shop/orders",
      actionLabel: "Confirm time",
      count: trialFollowUps.length,
      detail:
        firstTrialFollowUp
          ? `${firstTrialFollowUp.orderCode} needs a confirmed trial time before the day slips.`
          : "No trial follow-up is waiting on a time slot.",
      icon: TimerReset,
      title: "Trial follow-up",
      tone: trialFollowUps.length > 0 ? "warning" : "success",
    },
  ] as const;

  const analysisNotes = [
    {
      actionHref: "/shop/payments",
      actionLabel: "Review collections",
      detail:
        topBalanceOrder
          ? `${formatPaise(collectionTotalPaise)} is outstanding across ${balanceOrders.length} orders. The highest balance is ${formatPaise(topBalanceOrder.financials.balanceDuePaise)} on ${topBalanceOrder.order.orderCode}.`
          : "Collections are clear for now.",
      title: "Collections are the main pressure",
    },
    {
      actionHref: "/shop/production",
      actionLabel: "Review blockers",
      detail:
        blockedTasks.length > 0
          ? `${blockedTasks.length} task${blockedTasks.length === 1 ? "" : "s"} are blocked. The oldest one should be addressed first because item-level work is holding the queue.`
          : "Production is not currently blocked.",
      title: "Production is stable unless a blocker appears",
    },
    {
      actionHref: "/shop/whatsapp",
      actionLabel: "Review messages",
      detail:
        whatsAppFailures.length > 0
          ? `${retryableFailureCount} failure${retryableFailureCount === 1 ? "" : "s"} can be retried; the rest need a policy or opt-out decision.`
          : "Message pipeline is clear right now.",
      title: "Messaging risk is isolated",
    },
  ] as const;

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="/shop/orders/new"
            >
              <ShoppingBag aria-hidden className="size-4" />
              New order
            </Link>
            <Link
              className={cn(buttonVariants({ variant: "ghost" }))}
              href="/shop/search"
            >
              <Search aria-hidden className="size-4" />
              Search
            </Link>
          </>
        }
        body="The dashboard should answer what needs to move now, what is stuck, and where staff should act next."
        eyebrow="Daily cockpit"
        title="Dashboard"
      />

      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <DataPanel title="Priority stack">
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="signal">Live updates</Badge>
                <Badge variant="neutral">
                  {todayOrders.length} pickup
                  {todayOrders.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="neutral">
                  {paymentDueOrders.length} collection
                  {paymentDueOrders.length === 1 ? "" : "s"}
                </Badge>
                <Badge variant="neutral">
                  {blockedTasks.length} production blocker
                  {blockedTasks.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="grid gap-4">
                <h2 className="font-display text-3xl font-medium leading-tight text-ink-display sm:text-4xl">
                  Today&apos;s work is concentrated in collections, pickups,
                  and a small number of visible blockers.
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-ink-muted">
                  The useful part of a shop dashboard is not the volume of data.
                  It is the list of records most likely to require a staff
                  decision in the next few minutes.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryChip
                  label="Open balance"
                  value={formatPaise(collectionTotalPaise)}
                />
                <SummaryChip
                  label="Ready items"
                  value={`${dashboard.signals.readyItemCount}`}
                />
                <SummaryChip
                  label="Mixed orders"
                  value={`${partialDeliveryOrders.length}`}
                />
                <SummaryChip
                  label="Trial follow-up"
                  value={`${trialFollowUps.length}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={buttonVariants({ variant: "secondary" })}
                  href="/shop/orders/new"
                >
                  <ShoppingBag aria-hidden className="size-4" />
                  New order
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href="/shop/customers/new"
                >
                  <UsersRound aria-hidden className="size-4" />
                  New customer
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href="/shop/measurements/new"
                >
                  <Clock3 aria-hidden className="size-4" />
                  New measurement
                </Link>
              </div>
            </div>
          </DataPanel>

          <DataPanel title="Today focus">
            <div className="grid gap-2">
              {[
                {
                  detail: "Open pickup and balance queues side by side.",
                  href: "/shop/orders",
                  icon: PackageCheck,
                  title: "Clear deliveries first",
                },
                {
                  detail: "Search the customer before opening a new flow.",
                  href: "/shop/search",
                  icon: Search,
                  title: "Search a customer",
                },
                {
                  detail: "Use the routed intake page for a fresh customer.",
                  href: "/shop/customers/new",
                  icon: UsersRound,
                  title: "Add a customer",
                },
                {
                  detail: "Measurement changes stay versioned and explicit.",
                  href: "/shop/measurements/new",
                  icon: Ruler,
                  title: "Capture measurement",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-hairline bg-surface p-3 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                    href={item.href}
                    key={item.title}
                  >
                    <span className="grid size-8 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <Icon aria-hidden className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm text-ink-display">
                        {item.title}
                      </strong>
                      <span className="block text-xs leading-5 text-ink-muted">
                        {item.detail}
                      </span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 text-accent" />
                  </Link>
                );
              })}
            </div>
          </DataPanel>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={`${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"} on the counter`}
            icon={PackageCheck}
            label="Pickup queue"
            tone={todayOrders.length > 0 ? "warning" : "success"}
            value={`${todayOrders.length}`}
          />
          <MetricCard
            detail={`${trialFollowUps.length} order${trialFollowUps.length === 1 ? "" : "s"} waiting on a time`}
            icon={TimerReset}
            label="Trial follow-up"
            tone={trialFollowUps.length > 0 ? "warning" : "success"}
            value={`${trialFollowUps.length}`}
          />
          <MetricCard
            detail={`${paymentDueOrders.length} order${paymentDueOrders.length === 1 ? "" : "s"} need collection`}
            icon={IndianRupee}
            label="Collections"
            tone={paymentDueOrders.length > 0 ? "warning" : "success"}
            value={formatPaise(collectionTotalPaise)}
          />
          <MetricCard
            detail={`${retryableFailureCount} retryable, ${whatsAppFailures.length - retryableFailureCount} terminal`}
            icon={MessageCircleWarning}
            label="WhatsApp issues"
            tone={whatsAppFailures.length > 0 ? "danger" : "success"}
            value={`${whatsAppFailures.length}`}
          />
        </section>

        <section>
          <SectionHeader
            body="These cards turn the day into a queue of decisions instead of a wall of raw counts."
            eyebrow="Important updates"
            title="What needs attention now"
          />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
            Each card below points at a specific class of work, not a generic
            report. The goal is to keep the counter moving with the least
            amount of scanning.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {updateCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none"
                  key={card.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <StatusBadge tone={card.tone}>
                      {card.count} open
                    </StatusBadge>
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-medium text-ink-display">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {card.detail}
                  </p>
                  <Link
                    className={buttonVariants({ variant: "ghost" })}
                    href={card.actionHref}
                  >
                    {card.actionLabel}
                    <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <DataPanel title="Delivery queue">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="border-b border-hairline pb-3 pr-4">
                      Order
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Customer
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Items
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Due
                    </th>
                    <th className="border-b border-hairline pb-3 pr-4">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryQueue.map((order) => {
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
                          <span className="text-xs text-ink-muted">
                            {humanizeStatus(order.status)}
                          </span>
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
                          <div className="grid gap-1.5">
                            {order.items.map((item) => (
                              <div
                                className="flex flex-wrap items-center gap-2"
                                key={item.id}
                              >
                                <span className="font-semibold text-ink-display">
                                  {item.garment}
                                </span>
                                <StatusBadge tone={statusTone(item.status)}>
                                  {humanizeStatus(item.status)}
                                </StatusBadge>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <span className="block text-ink-display">
                            {formatShortDate(order.promisedDate)}
                          </span>
                          <span className="text-xs text-ink-muted">
                            Trial{" "}
                            {order.trialDate
                              ? `${formatShortDate(order.trialDate)}${order.trialTime ? ` · ${order.trialTime}` : ""}`
                              : "not planned"}
                          </span>
                        </td>
                        <td className="border-b border-hairline py-4 pr-4 align-top">
                          <strong className="block text-ink-display">
                            {formatPaise(financials.balanceDuePaise)}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            paid {formatPaise(financials.netPaidPaise)}
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
            <DataPanel title="Collections pressure">
              <div className="grid gap-3">
                {balanceOrders.length > 0 ? (
                  balanceOrders.slice(0, 5).map(({ financials, order }) => (
                    <div
                      className="grid gap-1 rounded-lg border border-hairline bg-surface p-3"
                      key={order.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm text-ink-display">
                          {order.customerName}
                        </strong>
                        <StatusBadge tone="warning">
                          {formatPaise(financials.balanceDuePaise)}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
                        <span>{order.orderCode}</span>
                        <span>{formatPaise(financials.netPaidPaise)} paid</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                    No collection rows are open.
                  </p>
                )}
              </div>
            </DataPanel>

            <DataPanel title="Production blockers">
              <div className="grid gap-3">
                {blockedTasks.length > 0 ? (
                  blockedTasks.map((task) => (
                    <div
                      className="grid gap-2 rounded-lg border border-hairline bg-surface p-3"
                      key={task.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm text-ink-display">
                            {task.orderCode} · {task.garment}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            {task.customerName} · {task.assignedTo}
                          </span>
                        </div>
                        <StatusBadge tone="danger">
                          {formatShortDate(task.dueDate)}
                        </StatusBadge>
                      </div>
                      <p className="text-sm leading-6 text-ink-muted">
                        {task.exceptionReason}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                    No blocked tasks are visible.
                  </p>
                )}
              </div>
            </DataPanel>

            <DataPanel title="WhatsApp issues">
              <div className="grid gap-3">
                {whatsAppFailures.length > 0 ? (
                  whatsAppFailures.map((failure) => (
                    <div
                      className="grid gap-2 rounded-lg border border-hairline bg-surface p-3"
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
                      <strong className="text-sm text-ink-display">
                        {failure.purpose} · {failure.customerName}
                      </strong>
                      <p className="text-sm leading-6 text-ink-muted">
                        {failure.reason}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                    No WhatsApp failures are open.
                  </p>
                )}
              </div>
            </DataPanel>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <DataPanel title="Trial follow-up">
            <div className="grid gap-3">
              {trialFollowUps.length > 0 ? (
                trialFollowUps.map((order) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-3"
                    key={order.id}
                  >
                    <div>
                      <strong className="block text-sm text-ink-display">
                        {order.customerName}
                      </strong>
                      <span className="text-xs text-ink-muted">
                        {order.orderCode} · {formatShortDate(order.trialDate)}
                      </span>
                    </div>
                    <StatusBadge tone="warning">
                      {order.trialTime ?? "time pending"}
                    </StatusBadge>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                  All trial rows already have a time or are not needed.
                </p>
              )}
            </div>
          </DataPanel>

          <DataPanel title="Operational analysis">
            <div className="grid gap-3">
              {analysisNotes.map((note) => (
                <article
                  className="grid gap-3 rounded-lg border border-hairline bg-surface p-4"
                  key={note.title}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-medium text-ink-display">
                      {note.title}
                    </h3>
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                      href={note.actionHref}
                    >
                      {note.actionLabel}
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </div>
                  <p className="text-sm leading-6 text-ink-muted">
                    {note.detail}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <strong className="mt-1 block font-display text-2xl font-medium leading-none text-ink-display">
        {value}
      </strong>
    </div>
  );
}
