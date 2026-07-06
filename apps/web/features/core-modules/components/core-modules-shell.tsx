import Link from "next/link";
import {
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

import { Badge } from "@/components/ui/badge";
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

export function CoreModulesShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-page text-ink-body">
      <header className="sticky top-0 z-40 border-b border-hairline bg-page/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[96rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link className="group flex items-center gap-3" href="/shop">
            <span className="grid size-10 place-items-center rounded-lg border border-accent bg-accent text-sm font-bold text-accent-foreground shadow-token transition duration-200 ease-premium group-hover:-rotate-2 group-hover:scale-105 motion-reduce:transition-none">
              TX
            </span>
            <span className="leading-tight">
              <strong className="block font-display text-lg font-medium leading-none text-ink-display">
                TailorOS
              </strong>
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Shop OS pilot
              </span>
            </span>
          </Link>
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
            <CoreCommandMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <nav
        aria-label="Mobile shop modules"
        className="sticky top-16 z-30 overflow-hidden border-b border-hairline bg-page/92 px-3 py-2 backdrop-blur-xl lg:hidden"
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
        </div>
      </nav>
      <div className="mx-auto grid w-full max-w-[96rem] lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-hairline bg-surface/40 px-4 py-6 lg:block">
          <div className="sticky top-24 grid gap-5">
            <div className="rounded-lg border border-hairline bg-surface-strong p-4 shadow-sm">
              <Badge variant="signal">Phase 05-06</Badge>
              <h2 className="mt-3 font-display text-2xl font-medium leading-none text-ink-display">
                Core modules
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Pilot-ready workflow screens for counter, owner, tailor, and
                platform support roles.
              </p>
            </div>
            <nav aria-label="Shop modules" className="grid gap-1">
              {coreNavItems.map((item) => {
                const Icon = iconByKey[item.key];

                return (
                  <Link
                    className={cn(
                      "group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-lg px-3 py-3 text-sm transition duration-200 ease-premium hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
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
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
