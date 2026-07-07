import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CustomerDetailActions } from "@/features/core-modules/components/customer-detail-actions";
import {
  DataPanel,
  PageHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { getRealCustomerContact, getRealOrders } from "@/features/core-modules/real-data";
import { formatShortDate, statusTone } from "@/features/core-modules/presenters";

export const metadata: Metadata = {
  title: "Customer Detail",
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const [{ contact }, { shopOrders }] = await Promise.all([
    getRealCustomerContact(contactId),
    getRealOrders(),
  ]);

  if (!contact) notFound();

  const customerCodes = new Set(
    contact.profiles.map((profile) => profile.customerCode),
  );
  const orders = shopOrders.filter(
    (order) =>
      order.familyCode === contact.contactId ||
      customerCodes.has(order.customerCode),
  );

  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href="/shop/customers"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Customers
          </Link>
        }
        body="Open a customer, confirm the exact family profile, then start order or measurement capture."
        eyebrow="Customer detail"
        title={contact.profiles.map((profile) => profile.fullName).join(", ")}
      />
      <div className="grid gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <DataPanel title="Contact">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={contact.whatsappOptIn ? "whatsapp" : "neutral"}>
                  <MessageCircle aria-hidden className="size-3.5" />
                  {contact.whatsappOptIn ? "WhatsApp opt-in" : "Call fallback"}
                </Badge>
                <StatusBadge tone="neutral">
                  {contact.profiles.length} profile
                  {contact.profiles.length === 1 ? "" : "s"}
                </StatusBadge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-hairline bg-surface p-3">
                  <Phone aria-hidden className="mb-2 size-4 text-accent" />
                  <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Mobile
                  </span>
                  <strong className="mt-1 block text-ink-display">
                    {contact.primaryMobileE164}
                  </strong>
                </div>
                <div className="rounded-lg border border-hairline bg-surface p-3">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Notes
                  </span>
                  <p className="mt-1 text-sm leading-6 text-ink-body">
                    {contact.notes || "No notes captured."}
                  </p>
                </div>
              </div>
            </div>
          </DataPanel>

          <DataPanel title="Next action">
            <div className="grid gap-2">
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href={`/shop/orders/new?contactId=${encodeURIComponent(
                  contact.contactId,
                )}`}
              >
                New order
              </Link>
              <Link
                className={buttonVariants({ variant: "ghost" })}
                href={`/shop/measurements/new?profileId=${encodeURIComponent(
                  contact.profiles[0]?.id ?? "",
                )}`}
              >
                New measurement
              </Link>
            </div>
          </DataPanel>
        </section>

        <CustomerDetailActions contact={contact} />

        <DataPanel title="Orders">
          <div className="grid gap-3">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  className="grid gap-2 rounded-lg border border-hairline bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={order.id}
                >
                  <div>
                    <strong className="text-ink-display">
                      {order.orderCode}
                    </strong>
                    <p className="mt-1 text-sm text-ink-muted">
                      {order.customerName} · Due{" "}
                      {formatShortDate(order.promisedDate)}
                    </p>
                  </div>
                  <StatusBadge tone={statusTone(order.status)}>
                    {order.status.replaceAll("_", " ")}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
                No orders yet.
              </p>
            )}
          </div>
        </DataPanel>
      </div>
    </>
  );
}
