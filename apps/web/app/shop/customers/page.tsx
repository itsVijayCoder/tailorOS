import type { Metadata } from "next";
import Link from "next/link";
import {
  History,
  MessageCircle,
  UserRoundPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import {
  getRealDashboardData,
  getRealFamilyAccounts,
  getRealOrders,
} from "@/features/core-modules/real-data";
import {
  DataPanel,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import {
  formatShortDate,
  statusTone,
} from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Customers and Family",
};

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, orders, dashboard] = await Promise.all([
    getRealFamilyAccounts(),
    getRealOrders(),
    getRealDashboardData(),
  ]);
  const familyAccounts = customers.familyAccounts;
  const shopOrders = orders.shopOrders;
  const whatsAppFailures = dashboard.whatsAppFailures;
  const selectedCustomerCode =
    familyAccounts[0]?.profiles[0]?.customerCode ?? "";

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/shop/customers/new"
          >
            <UserRoundPlus aria-hidden className="size-4" />
            New customer
          </Link>
        }
        body="The adoption-critical workflow starts with one search box, then forces exact profile selection before measurements, orders, or payment history can be edited."
        eyebrow="Customer module"
        title="Customers"
      />
      <div className="grid gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <DataPanel title="Customer lookup">
            <div className="grid gap-5">
              <SearchField
                defaultValue="09876543210"
                readOnly
                aria-label="Customer search example"
              />
              <div className="grid gap-4">
                {familyAccounts.map((family) => (
                  <article
                    className="rounded-lg border border-hairline bg-surface p-4"
                    key={family.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              family.whatsappOptIn ? "whatsapp" : "warning"
                            }
                          >
                            {family.whatsappOptIn
                              ? "WhatsApp opt-in"
                              : "Call fallback"}
                          </Badge>
                          <StatusBadge tone="neutral">
                            {family.familyCode}
                          </StatusBadge>
                        </div>
                        <h2 className="mt-3 font-display text-2xl font-medium text-ink-display">
                          {family.primaryMobileDisplay}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-ink-muted">
                          {family.address}
                        </p>
                      </div>
                      <div className="grid gap-1 rounded-lg border border-hairline bg-page px-3 py-2 text-sm">
                        <span className="font-semibold text-ink-display">
                          {family.profiles.length} profiles
                        </span>
                        <span className="text-ink-muted">
                          Mobile is channel, not identity
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {family.profiles.map((profile) => (
                        <Link
                          className="group rounded-lg border border-hairline bg-page p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                          href={`/shop/customers/${family.id}`}
                          key={profile.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-display text-xl font-medium text-ink-display">
                                {profile.fullName}
                              </h3>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                {profile.customerCode}
                              </p>
                            </div>
                            <StatusBadge tone="accent">
                              {profile.relationLabel}
                            </StatusBadge>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-ink-body">
                            {profile.garmentContext}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-ink-muted">
                            {profile.lastMeasurement}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3 text-sm">
                            <span className="text-ink-muted">
                              Active orders
                            </span>
                            <strong className="text-ink-display">
                              {profile.activeOrders}
                            </strong>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </DataPanel>
        </section>

        <section>
          <SectionHeader
            body="Profile timeline keeps orders, measurements, payments, receipts, and WhatsApp history together so staff do not bounce between modules."
            eyebrow="Timeline"
            title="Customer profile activity"
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <DataPanel title="Orders">
              <div className="grid gap-3">
                {shopOrders
                  .filter(
                    (order) => order.customerCode === selectedCustomerCode,
                  )
                  .map((order) => (
                    <div
                      className="rounded-lg border border-hairline bg-surface p-3"
                      key={order.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block text-sm text-ink-display">
                            {order.orderCode}
                          </strong>
                          <span className="text-xs text-ink-muted">
                            Due {formatShortDate(order.promisedDate)}
                          </span>
                        </div>
                        <StatusBadge tone={statusTone(order.status)}>
                          {order.status.replaceAll("_", " ")}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
              </div>
            </DataPanel>
            <DataPanel title="Measurements">
              <div className="grid gap-3">
                {["Blouse v4", "Salwar v2", "Alteration v1"].map((item) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-3"
                    key={item}
                  >
                    <History aria-hidden className="size-4 text-accent" />
                    <span className="text-sm font-semibold text-ink-display">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </DataPanel>
            <DataPanel title="Messages">
              <div className="grid gap-3">
                {whatsAppFailures.length > 0 ? (
                  whatsAppFailures.map((failure) => (
                    <div
                      className="rounded-lg border border-hairline bg-surface p-3"
                      key={failure.id}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle
                          aria-hidden
                          className="size-4 text-accent"
                        />
                        <strong className="text-sm text-ink-display">
                          {failure.purpose}
                        </strong>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {failure.reason}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    body="Messages will appear after notification logs are connected."
                    title="No messages"
                  />
                )}
              </div>
            </DataPanel>
          </div>
        </section>
      </div>
    </>
  );
}
