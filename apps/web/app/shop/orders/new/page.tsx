import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { OrderIntakeFlow } from "@/features/core-modules/components/order-intake-flow";
import { PageHeader } from "@/features/core-modules/components/module-primitives";
import { readCustomers, readMeasurementTemplates } from "@/features/core-modules/tenant-api";

export const metadata: Metadata = {
  title: "New Order",
};

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; profileId?: string }>;
}) {
  const [params, customers, templates] = await Promise.all([
    searchParams,
    readCustomers(),
    readMeasurementTemplates(),
  ]);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/shop/search"
            >
              <Search aria-hidden className="size-4" />
              Search customer
            </Link>
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/shop/orders"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Orders
            </Link>
          </>
        }
        body="Create an order from a selected profile, including item, measurement, payment, receipt, and WhatsApp outbox state."
        eyebrow="New order"
        title="Create order"
      />
      <div className="grid gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <OrderIntakeFlow
          contacts={customers.data.customers}
          initialContactId={params.contactId ?? ""}
          initialProfileId={params.profileId ?? ""}
          templates={templates.data.templates}
        />
      </div>
    </>
  );
}
