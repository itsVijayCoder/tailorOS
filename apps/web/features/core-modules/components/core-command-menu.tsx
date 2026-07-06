"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Command,
  FileText,
  MessageCircleWarning,
  ReceiptText,
  Search,
  UsersRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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

import { searchPilotRecords } from "../data";
import type { CommandSearchResult, SearchEntityType } from "../types";

const iconByType: Record<SearchEntityType, typeof UsersRound> = {
  customer: UsersRound,
  family: UsersRound,
  message: MessageCircleWarning,
  order: FileText,
  receipt: ReceiptText,
};

export function CoreCommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemo(() => searchPilotRecords(query), [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Open command search"
        className={cn(buttonVariants({ variant: "secondary" }))}
      >
        <Search aria-hidden className="size-4" />
        <span className="hidden sm:inline">Command search</span>
        <span className="ml-1 hidden rounded-full border border-hairline bg-page px-2 py-0.5 text-[11px] font-semibold text-ink-muted lg:inline">
          Ctrl K
        </span>
      </DialogTrigger>
      <DialogContent className="gap-4 sm:max-w-2xl" size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command aria-hidden className="size-5 text-accent" />
            TailorOS command search
          </DialogTitle>
          <DialogDescription>
            Search mobile, customer code, order code, receipt code, garment, or
            WhatsApp failure reason. Exact identity matches stay first.
          </DialogDescription>
        </DialogHeader>
        <SearchField
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try 09876543210, CUS-MDU-000231, ORD-MDU-000421..."
          value={query}
        />
        <div className="grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
          {results.length > 0 ? (
            results.map((result) => (
              <CommandResult
                key={`${result.entityType}:${result.id}`}
                onSelect={() => setOpen(false)}
                result={result}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-hairline bg-surface p-5 text-sm leading-6 text-ink-muted">
              {query.trim().length >= 2
                ? "No pilot fixture match. In production this falls through to tenant-local D1 exact indexes and FTS."
                : "Type at least two characters to search pilot data."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandResult({
  onSelect,
  result,
}: {
  onSelect: () => void;
  result: CommandSearchResult;
}) {
  const Icon = iconByType[result.entityType];

  return (
    <Link
      className="group grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-hairline bg-surface p-3 text-left transition duration-200 ease-premium hover:border-border-accent hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
      href={result.href}
      onClick={onSelect}
    >
      <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page text-accent">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {result.eyebrow}
        </span>
        <strong className="mt-1 block truncate font-ui text-sm font-semibold text-ink-display">
          {result.title}
        </strong>
        <span className="mt-1 block text-sm leading-5 text-ink-muted">
          {result.description}
        </span>
      </span>
    </Link>
  );
}
