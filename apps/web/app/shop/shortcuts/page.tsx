import type { Metadata } from "next";
import { Keyboard, Ruler, Search, ShoppingBag, UserRoundPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DataPanel,
  PageHeader,
} from "@/features/core-modules/components/module-primitives";

export const metadata: Metadata = {
  title: "Shortcuts",
};

const shortcuts = [
  {
    icon: Search,
    keys: ["Cmd K", "Ctrl K"],
    label: "Search customer",
    target: "Opens search only. Selecting a customer opens the detail page.",
  },
  {
    icon: UserRoundPlus,
    keys: ["Ctrl Alt C"],
    label: "New customer",
    target: "Navigates to /shop/customers/new.",
  },
  {
    icon: ShoppingBag,
    keys: ["Ctrl Alt O"],
    label: "New order",
    target: "Navigates to /shop/orders/new.",
  },
  {
    icon: Ruler,
    keys: ["Ctrl Alt M"],
    label: "New measurement",
    target: "Navigates to /shop/measurements/new.",
  },
] as const;

export default function ShortcutsPage() {
  return (
    <>
      <PageHeader
        body="Keyboard shortcuts are global inside the shop workspace and avoid browser-reserved new-tab/new-window commands."
        eyebrow="Shortcuts"
        title="Keyboard commands"
      />
      <div className="grid gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <DataPanel title="Available shortcuts">
          <div className="grid gap-3 md:grid-cols-2">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;

              return (
                <article
                  className="rounded-lg border border-hairline bg-surface p-4"
                  key={shortcut.label}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg border border-hairline bg-page text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {shortcut.keys.map((key) => (
                        <Badge key={key} variant="neutral">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-medium text-ink-display">
                    {shortcut.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {shortcut.target}
                  </p>
                </article>
              );
            })}
          </div>
        </DataPanel>
        <DataPanel title="Platform behavior">
          <div className="grid gap-3 text-sm leading-6 text-ink-body">
            <div className="rounded-lg border border-hairline bg-surface p-3">
              <Keyboard aria-hidden className="mr-2 inline size-4 text-accent" />
              On macOS, search supports Command K. On Windows and Linux, search
              supports Control K.
            </div>
            <div className="rounded-lg border border-hairline bg-surface p-3">
              Create shortcuts use Control Alt with the same letter on all
              platforms to avoid browser new-window commands.
            </div>
          </div>
        </DataPanel>
      </div>
    </>
  );
}
