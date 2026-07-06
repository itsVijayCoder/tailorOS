import Link from "next/link";
import {
  Building2,
  ClipboardList,
  CreditCard,
  Gauge,
  MessageCircle,
  Rocket,
  Search,
  ShieldCheck,
  Ruler,
  Settings2,
  Shirt,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

import { coreNavItems } from "../data";
import type { ModuleKey } from "../types";
import { CoreCommandMenu } from "./core-command-menu";

const iconByKey: Record<ModuleKey, typeof Gauge> = {
  customers: UsersRound,
  dashboard: Gauge,
  search: Search,
  measurements: Ruler,
  orders: ClipboardList,
  payments: CreditCard,
  production: Shirt,
  reports: WalletCards,
  release: Rocket,
  security: ShieldCheck,
  settings: Settings2,
  whatsapp: MessageCircle,
};

const shopName = "Sri Raja Tailors";

export function CoreModulesShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-page text-ink-body lg:h-dvh lg:overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-[70] hidden w-72 flex-col border-r border-hairline bg-surface/95 backdrop-blur-xl lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-hairline px-4">
          <BrandLockup subtitle={shopName} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <nav aria-label="Shop modules" className="grid gap-1">
            {coreNavItems.map((item) => {
              const Icon = iconByKey[item.key];

              return (
                <Link
                  className={cn(
                    "group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg px-3 py-2.5 text-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  <span className="grid size-8 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block font-ui text-sm text-ink-display">
                      {item.label}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-ink-muted">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 border-t border-hairline p-3">
          <Link
            className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg px-3 py-2.5 text-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
            href="/admin/tenants"
          >
            <span className="grid size-8 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
              <Building2 aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <strong className="block font-ui text-sm text-ink-display">
                Super admin
              </strong>
              <span className="mt-1 block text-xs leading-5 text-ink-muted">
                Onboard shops and issue owner credentials.
              </span>
            </span>
          </Link>
        </div>
      </aside>

      <section className="min-h-dvh min-w-0 lg:h-dvh lg:pl-72">
        <header className="sticky top-0 z-[60] border-b border-hairline bg-page/94 backdrop-blur-xl">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <BrandLockup subtitle={shopName} />
            </div>
            <div className="hidden min-w-0 leading-tight lg:block">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Shop workspace
              </span>
              <strong className="block truncate font-display text-xl font-medium leading-none text-ink-display">
                {shopName}
              </strong>
            </div>
            <nav
              aria-label="Shop quick navigation"
              className="hidden items-center gap-1 rounded-full border border-hairline bg-surface p-1 shadow-sm xl:flex"
            >
              {coreNavItems.slice(0, 6).map((item) => (
                <Link
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                className="hidden min-h-10 items-center justify-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-semibold text-ink-display shadow-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none sm:inline-flex"
                href="/admin/tenants"
              >
                <Building2 aria-hidden className="size-4" />
                Super admin
              </Link>
              <CoreCommandMenu />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <nav
          aria-label="Mobile shop modules"
          className="sticky top-16 z-[55] overflow-hidden border-b border-hairline bg-page/94 px-3 py-2 backdrop-blur-xl lg:hidden"
        >
          <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1">
            {coreNavItems.map((item) => {
              const Icon = iconByKey[item.key];
              return (
                <Link
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink-muted shadow-sm transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                  href={item.href}
                  key={item.key}
                >
                  <Icon aria-hidden className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink-muted shadow-sm transition duration-200 ease-premium hover:bg-accent-faded hover:text-ink-display focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
              href="/admin/tenants"
            >
              <Building2 aria-hidden className="size-4" />
              Admin
            </Link>
          </div>
        </nav>
        <div className="min-w-0 lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto">
          {children}
        </div>
      </section>
    </main>
  );
}

function BrandLockup({ subtitle }: { subtitle: string }) {
  return (
    <Link className="group flex items-center gap-3" href="/shop">
      <span className="grid size-10 place-items-center rounded-lg border border-accent bg-accent text-sm font-bold text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-2 group-hover:scale-105 motion-reduce:transition-none">
        TX
      </span>
      <span className="min-w-0 leading-tight">
        <strong className="block font-display text-lg font-medium leading-none text-ink-display">
          TailorOS
        </strong>
        <span className="block truncate text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
