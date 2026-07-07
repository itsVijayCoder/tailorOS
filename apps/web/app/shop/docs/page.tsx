import type { Metadata } from "next";
import {
  BadgeIndianRupee,
  MessageCircle,
  ReceiptText,
  Ruler,
  Search,
  ShoppingBag,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DataPanel,
  PageHeader,
} from "@/features/core-modules/components/module-primitives";

export const metadata: Metadata = {
  title: "Shop Docs",
};

const orderFlow = [
  {
    icon: UsersRound,
    title: "Customer or family profile",
    body: "A mobile number opens the family contact. Orders and measurements are attached to the selected profile.",
  },
  {
    icon: ShoppingBag,
    title: "Order and line items",
    body: "Each garment is an item with its own quantity, promised date, price, and production status.",
  },
  {
    icon: Ruler,
    title: "Measurement",
    body: "Use the latest measurement when it is valid, or capture another version before confirming the item.",
  },
  {
    icon: BadgeIndianRupee,
    title: "Payment",
    body: "Advance creates a ledger row. Balance is derived from order totals and payments.",
  },
  {
    icon: ReceiptText,
    title: "Receipt",
    body: "Receipt output summarizes customer, items, paid amount, balance, and pickup date.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    body: "Order confirmation and pickup messages are queued after receipt-safe order creation.",
  },
] as const;

const rules = [
  "Cmd/Ctrl K is search-only and must not create records.",
  "Selecting an existing customer opens the customer detail route.",
  "New customer, new order, and new measurement are routed pages.",
  "Family members are added from the customer detail page.",
  "Measurements are versioned and should not rewrite prior order snapshots.",
  "Operational pages should show actions and state, not implementation notes.",
] as const;

export default function ShopDocsPage() {
  return (
    <>
      <PageHeader
        body="Operational rules and flow details live here so shop pages stay clean."
        eyebrow="Docs"
        title="Workflow reference"
      />
      <div className="grid gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <DataPanel title="Order creation flow">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orderFlow.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={step.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <Badge variant="signal">Step {index + 1}</Badge>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-medium text-ink-display">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </DataPanel>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <DataPanel title="Rules moved from shop screens">
            <div className="grid gap-3">
              {rules.map((rule) => (
                <div
                  className="rounded-lg border border-hairline bg-surface p-3 text-sm leading-6 text-ink-body"
                  key={rule}
                >
                  {rule}
                </div>
              ))}
            </div>
          </DataPanel>

          <DataPanel title="Search behavior">
            <div className="grid gap-3 text-sm leading-6 text-ink-body">
              <div className="rounded-lg border border-hairline bg-surface p-3">
                <Search aria-hidden className="mr-2 inline size-4 text-accent" />
                Search returns customer contacts for fast counter lookup.
              </div>
              <div className="rounded-lg border border-hairline bg-surface p-3">
                Existing customer selection navigates to the detail page before
                order or measurement capture.
              </div>
            </div>
          </DataPanel>
        </section>
      </div>
    </>
  );
}
