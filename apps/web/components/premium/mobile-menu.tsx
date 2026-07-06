"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { PremiumButton } from "@/components/premium/premium-button";
import { TransitionLink } from "@/components/premium/transition-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type NavigationItem = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  items: NavigationItem[];
};

export function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-11 place-items-center rounded-full border border-border bg-card/70 text-foreground shadow-sm backdrop-blur transition hover:border-border-accent"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <X aria-hidden className="size-4" />
        ) : (
          <Menu aria-hidden className="size-4" />
        )}
      </button>
      <div
        className={cn(
          "fixed inset-x-4 top-20 z-40 rounded-[1.5rem] border border-border bg-popover/95 p-4 text-popover-foreground shadow-soft backdrop-blur-xl transition duration-300",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <nav className="grid gap-1">
          {items.map((item) => (
            <TransitionLink
              className="rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </TransitionLink>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <ThemeToggle />
          <PremiumButton
            href="/admin/design-system"
            size="md"
            variant="primary"
          >
            Design system
          </PremiumButton>
        </div>
      </div>
    </div>
  );
}
