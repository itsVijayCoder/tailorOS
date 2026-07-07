import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CustomerIntakeForm } from "@/features/core-modules/components/customer-intake-form";
import { PageHeader } from "@/features/core-modules/components/module-primitives";

export const metadata: Metadata = {
  title: "New Customer",
};

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ mobile?: string; name?: string }>;
}) {
  const params = await searchParams;

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
              Search first
            </Link>
            <Link
              className={buttonVariants({ variant: "ghost" })}
              href="/shop/customers"
            >
              <ArrowLeft aria-hidden className="size-4" />
              Customers
            </Link>
          </>
        }
        body="Create a contact and first measured profile, then continue from the customer detail page."
        eyebrow="New customer"
        title="Add a customer or first family profile."
      />
      <div className="mx-auto grid max-w-3xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <CustomerIntakeForm
          defaultMobile={params.mobile ?? ""}
          defaultName={params.name ?? ""}
        />
      </div>
    </>
  );
}
