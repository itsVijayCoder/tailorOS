import type { Metadata } from "next";
import {
  AlertTriangle,
  BellOff,
  BellRing,
  ClipboardList,
  Scissors,
  Shirt,
  UserRoundCheck,
} from "lucide-react";

import { getRealProductionData } from "@/features/core-modules/real-data";
import {
  DataPanel,
  MetricCard,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  formatShortDate,
  statusTone,
  taskLaneLabel,
} from "@/features/core-modules/presenters";
import type { ProductionTask } from "@/features/core-modules/types";

const laneOrder: readonly ProductionTask["lane"][] = [
  "confirmed",
  "fabric_received",
  "cutting",
  "stitching",
  "trial_ready",
  "alteration_needed",
  "ready_for_pickup",
  "delivered",
];

export const metadata: Metadata = {
  title: "Production Board",
};

export default async function ProductionPage() {
  const { productionTasks, shopOrders } = await getRealProductionData();
  const assignedTailors = new Set(
    productionTasks.map((task) => task.assignedTo),
  );
  const exceptionTasks = productionTasks.filter((task) => task.exceptionReason);
  const readyTasks = productionTasks.filter(
    (task) => task.lane === "ready_for_pickup",
  );

  return (
    <>
      <PageHeader
        body="Production is deliberately simple: status lane, tailor, due date, exception reason, and customer notification control. Internal work should not spam customers."
        eyebrow="Production board"
        title="A shared view of what is due, stuck, and owned."
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Across active pilot orders"
            icon={ClipboardList}
            label="Tasks"
            tone="accent"
            value={`${productionTasks.length}`}
          />
          <MetricCard
            detail="Only selected statuses notify customer"
            icon={BellRing}
            label="Notify"
            tone="success"
            value={`${productionTasks.filter((task) => task.notifyCustomer).length}`}
          />
          <MetricCard
            detail="Owner-visible reason required"
            icon={AlertTriangle}
            label="Exceptions"
            tone="warning"
            value={`${exceptionTasks.length}`}
          />
          <MetricCard
            detail="Tailors with assigned work"
            icon={UserRoundCheck}
            label="Assignees"
            tone="neutral"
            value={`${assignedTailors.size}`}
          />
        </section>

        <section>
          <SectionHeader
            body="The lanes map to the Phase 05 workflow. Empty lanes remain visible because they are part of the status contract."
            eyebrow="Board"
            title="Status lanes"
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            {laneOrder.map((lane) => {
              const laneTasks = productionTasks.filter(
                (task) => task.lane === lane,
              );

              return (
                <DataPanel
                  className="min-h-72"
                  description={`${laneTasks.length} task(s)`}
                  key={lane}
                  title={taskLaneLabel(lane)}
                >
                  <div className="grid gap-3">
                    {laneTasks.length > 0 ? (
                      laneTasks.map((task) => (
                        <article
                          className="rounded-lg border border-hairline bg-surface p-3 shadow-sm transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent motion-reduce:transition-none"
                          key={task.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page text-accent">
                              {lane === "cutting" ? (
                                <Scissors aria-hidden className="size-4" />
                              ) : (
                                <Shirt aria-hidden className="size-4" />
                              )}
                            </span>
                            <StatusBadge tone={statusTone(lane)}>
                              {formatShortDate(task.dueDate)}
                            </StatusBadge>
                          </div>
                          <h3 className="mt-3 font-ui text-sm font-semibold text-ink-display">
                            {task.orderCode} · {task.garment}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-ink-muted">
                            {task.customerName} · {task.itemCode}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline pt-3">
                            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                              {task.assignedTo}
                            </span>
                            {task.notifyCustomer ? (
                              <BellRing
                                aria-label="Customer can be notified"
                                className="size-4 text-state-success"
                              />
                            ) : (
                              <BellOff
                                aria-label="Internal only"
                                className="size-4 text-ink-muted"
                              />
                            )}
                          </div>
                          {task.exceptionReason ? (
                            <p className="mt-3 rounded-lg border border-signal bg-signal-faded p-2 text-xs leading-5 text-ink-body">
                              {task.exceptionReason}
                            </p>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm leading-6 text-ink-muted">
                        No current work in this lane.
                      </div>
                    )}
                  </div>
                </DataPanel>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <DataPanel
            description="Alteration logs must explain the issue, requested change, trial result, and whether it is chargeable."
            title="Alteration log"
          >
            <div className="grid gap-3">
              {exceptionTasks.map((task) => (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={task.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-medium text-ink-display">
                        {task.orderCode}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {task.customerName} · {task.garment}
                      </p>
                    </div>
                    <StatusBadge tone="warning">Reason required</StatusBadge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-body">
                    {task.exceptionReason}
                  </p>
                </article>
              ))}
            </div>
          </DataPanel>

          <DataPanel
            description="Pickup readiness should be surfaced to the dashboard, balance list, and notification outbox."
            title="Ready for pickup"
          >
            <div className="grid gap-3">
              {readyTasks.map((task) => {
                const order = shopOrders.find(
                  (candidate) => candidate.orderCode === task.orderCode,
                );

                return (
                  <article
                    className="rounded-lg border border-state-success bg-surface p-4"
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-medium text-ink-display">
                          {task.garment}
                        </h3>
                        <p className="mt-1 text-sm text-ink-muted">
                          {task.customerName} · {task.orderCode}
                        </p>
                      </div>
                      <StatusBadge tone="success">Pickup</StatusBadge>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-ink-body">
                      {order
                        ? `${order.items.filter((item) => item.status === "ready_for_pickup").length} of ${order.items.length} item(s) ready. Do not close the order until all items are delivered or partial delivery is explicitly recorded.`
                        : "Order details unavailable."}
                    </p>
                  </article>
                );
              })}
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}
