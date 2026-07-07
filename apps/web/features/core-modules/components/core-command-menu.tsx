"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Command,
  Keyboard,
  Ruler,
  Search,
  ShoppingBag,
  UserRoundPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";
import type { CustomerContactRead } from "@tailoros/schemas";

type ApiState<T> = {
  data: T;
  error: string | null;
  source: "offline" | "tenant-api";
};

const routeShortcuts = [
  {
    href: "/shop/customers/new",
    keys: "Ctrl Alt C",
    label: "New customer",
  },
  {
    href: "/shop/orders/new",
    keys: "Ctrl Alt O",
    label: "New order",
  },
  {
    href: "/shop/measurements/new",
    keys: "Ctrl Alt M",
    label: "New measurement",
  },
] as const;

export function CoreCommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerContactRead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openSearch = useCallback(() => {
    setOpen(true);
  }, []);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const searchPressed =
        key === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey;
      const route = routeForShortcut(event);

      if (!searchPressed && !route) return;

      event.preventDefault();
      if (searchPressed) openSearch();
      if (route) navigate(route);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, openSearch]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        setCustomers(await loadCustomers(query, controller.signal));
      } finally {
        setIsLoading(false);
      }
    }, 140);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  const hasQuery = query.trim().length > 0;
  const resultLabel = useMemo(() => {
    if (!hasQuery) return "Recent customer matches";
    return `${customers.length} customer result${
      customers.length === 1 ? "" : "s"
    }`;
  }, [customers.length, hasQuery]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Search customers"
        className={cn(buttonVariants({ variant: "secondary" }))}
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden sm:inline">Search</span>
        <span className="ml-1 hidden rounded-full border border-hairline bg-page px-2 py-0.5 text-[11px] font-semibold text-ink-muted lg:inline">
          Ctrl K
        </span>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-3xl" size="lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="signal">
              <Command aria-hidden className="size-3.5" />
              Cmd/Ctrl K
            </Badge>
            <Badge variant="neutral">
              <Keyboard aria-hidden className="size-3.5" />
              Search only
            </Badge>
          </div>
          <DialogTitle>Search customers</DialogTitle>
          <DialogDescription>
            Select a customer to open the customer detail page.
          </DialogDescription>
        </DialogHeader>

        <SearchField
          autoFocus
          isLoading={isLoading}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search mobile, customer code, or family name"
          value={query}
        />

        <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {resultLabel}
          </p>
          <Button
            onClick={() => navigate("/shop/search")}
            size="sm"
            type="button"
            variant="ghost"
          >
            Full search
            <ArrowRight aria-hidden className="size-4" />
          </Button>
        </div>

        <div className="grid max-h-[24rem] gap-2 overflow-y-auto pr-1">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <button
                className="grid gap-2 rounded-lg border border-hairline bg-surface p-3 text-left transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                key={customer.contactId}
                onClick={() =>
                  navigate(`/shop/customers/${customer.contactId}`)
                }
                type="button"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <strong className="block text-sm text-ink-display">
                      {customer.profiles
                        .map((profile) => profile.fullName)
                        .join(", ")}
                    </strong>
                    <span className="mt-1 block text-xs text-ink-muted">
                      {customer.primaryMobileE164} ·{" "}
                      {customer.profiles.length} profile
                      {customer.profiles.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="mt-0.5 size-4 text-accent"
                  />
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-hairline bg-surface p-4 text-sm text-ink-muted">
              {hasQuery
                ? "No customer matched this search."
                : "Start typing to search customers."}
            </div>
          )}
        </div>

        <div className="grid gap-2 border-t border-hairline pt-3 sm:grid-cols-3">
          {routeShortcuts.map((shortcut) => (
            <button
              className="grid gap-2 rounded-lg border border-hairline bg-page p-3 text-left text-sm transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
              key={shortcut.href}
              onClick={() => navigate(shortcut.href)}
              type="button"
            >
              <ShortcutIcon href={shortcut.href} />
              <span className="font-semibold text-ink-display">
                {shortcut.label}
              </span>
              <span className="text-xs text-ink-muted">{shortcut.keys}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutIcon({ href }: { href: string }) {
  const className = "size-4";

  if (href.includes("orders")) {
    return <ShoppingBag aria-hidden className={className} />;
  }

  if (href.includes("measurements")) {
    return <Ruler aria-hidden className={className} />;
  }

  return <UserRoundPlus aria-hidden className={className} />;
}

function routeForShortcut(event: KeyboardEvent) {
  if (!event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey) {
    return null;
  }

  const key = event.key.toLowerCase();
  if (key === "c") return "/shop/customers/new";
  if (key === "o") return "/shop/orders/new";
  if (key === "m") return "/shop/measurements/new";
  return null;
}

async function loadCustomers(query: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/shop/customers?q=${encodeURIComponent(query)}`,
    signal ? { signal } : undefined,
  );
  const result = (await response.json()) as ApiState<{
    customers: CustomerContactRead[];
  }>;
  return result.data.customers;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea" ||
    target.isContentEditable
  );
}
