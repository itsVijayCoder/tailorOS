import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, UserRoundPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import {
  DataPanel,
  PageHeader,
  StatusBadge,
} from "@/features/core-modules/components/module-primitives";
import { getRealFamilyAccounts } from "@/features/core-modules/real-data";

export const metadata: Metadata = {
  title: "Search",
  description: "Customer search for TailorOS shop operations.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const { familyAccounts } = await getRealFamilyAccounts(query);

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
        body="Search customers and open the selected customer detail page."
        eyebrow="Search"
        title="Search customers"
      />
      <div className="grid gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <form action="/shop/search" className="max-w-3xl">
          <SearchField
            defaultValue={query}
            name="q"
            placeholder="Search mobile, customer code, or name"
          />
        </form>

        <DataPanel title="Results">
          <div className="grid gap-3">
            {familyAccounts.length > 0 ? (
              familyAccounts.map((family) => (
                <Link
                  className="rounded-lg border border-hairline bg-surface p-4 transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded motion-reduce:transition-none"
                  href={`/shop/customers/${family.id}`}
                  key={family.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-medium text-ink-display">
                        {family.profiles
                          .map((profile) => profile.fullName)
                          .join(", ")}
                      </h2>
                      <p className="mt-1 text-sm text-ink-muted">
                        {family.primaryMobileDisplay}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">
                        {family.profiles.length} profile
                        {family.profiles.length === 1 ? "" : "s"}
                      </StatusBadge>
                      <ArrowRight aria-hidden className="size-4 text-accent" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-hairline bg-surface p-5 text-sm text-ink-muted">
                <Search aria-hidden className="mb-3 size-5 text-accent" />
                No customer found.
              </div>
            )}
          </div>
        </DataPanel>
      </div>
    </>
  );
}
