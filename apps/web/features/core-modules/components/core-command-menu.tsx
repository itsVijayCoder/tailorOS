"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock3,
  Command,
  DatabaseZap,
  FileText,
  MessageCircleWarning,
  ReceiptText,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

import type {
  CommandSearchMeta,
  CommandSearchResponse,
  CommandSearchResult,
  SearchEntityType,
} from "../types";

const recentSearchKey = "tailoros-command-search-recent-v1";
const maxRecentResults = 5;

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
  const [isSearching, setIsSearching] = useState(false);
  const [response, setResponse] = useState<CommandSearchResponse>(() =>
    createEmptyResponse(""),
  );
  const [recentResults, setRecentResults] =
    useState<readonly CommandSearchResult[]>(readRecentResults);
  const latestRequestId = useRef(0);

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

  useEffect(() => {
    if (!open) {
      return;
    }

    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;
    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      setIsSearching(true);

      searchCommandRecordsAsync(query, controller.signal)
        .then((nextResponse) => {
          if (
            requestId !== latestRequestId.current ||
            controller.signal.aborted
          ) {
            return;
          }

          setResponse(nextResponse);

          if (nextResponse.results.length > 0) {
            setRecentResults((current) => {
              const next = mergeRecentResults(nextResponse.results, current);
              writeRecentResults(next);
              return next;
            });
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            void error;
            setResponse(createEmptyResponse(query));
          }
        })
        .finally(() => {
          if (requestId === latestRequestId.current) {
            setIsSearching(false);
          }
        });
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query]);

  const showRecent =
    !response.meta.minLengthSatisfied &&
    recentResults.length > 0 &&
    query.trim().length < 2;
  const visibleResults = showRecent ? recentResults : response.results;

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
      <DialogContent className="gap-4 sm:max-w-3xl" size="lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="signal">
              <DatabaseZap aria-hidden className="size-3.5" />
              Exact indexes first
            </Badge>
            <Badge variant="neutral">
              <Clock3 aria-hidden className="size-3.5" />
              {formatBudget(response.meta)}
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-2">
            <Command aria-hidden className="size-5 text-accent" />
            TailorOS command search
          </DialogTitle>
          <DialogDescription>
            Search mobile, customer code, order code, receipt code, garment, or
            WhatsApp evidence. The UI mirrors the tenant-local D1 strategy.
          </DialogDescription>
        </DialogHeader>

        <SearchField
          autoFocus
          isLoading={isSearching}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try 98765, CUS-MDU-000231, ORD-MDU-000421, today delivery..."
          value={query}
        />

        <SearchTelemetry isSearching={isSearching} meta={response.meta} />

        <div
          aria-live="polite"
          className="grid max-h-[24rem] gap-2 overflow-y-auto pr-1"
        >
          {visibleResults.length > 0 ? (
            <>
              {showRecent ? (
                <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Recent results
                </p>
              ) : null}
              {visibleResults.map((result) => (
                <CommandResult
                  key={`${result.entityType}:${result.id}`}
                  onSelect={() => setOpen(false)}
                  result={result}
                />
              ))}
            </>
          ) : (
            <CommandEmptyState meta={response.meta} query={query} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchTelemetry({
  isSearching,
  meta,
}: {
  isSearching: boolean;
  meta: CommandSearchMeta;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-hairline bg-surface p-3 text-xs text-ink-muted sm:grid-cols-3">
      <span>
        <strong className="text-ink-display">Strategy:</strong>{" "}
        {humanizeStrategy(meta.strategy)}
      </span>
      <span>
        <strong className="text-ink-display">Results:</strong>{" "}
        {isSearching ? "Searching" : meta.resultCount}
      </span>
      <span>
        <strong className="text-ink-display">Round trip:</strong>{" "}
        {isSearching ? "..." : `${meta.elapsedMs}ms`}
      </span>
    </div>
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
      className="group grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 rounded-lg border border-hairline bg-surface p-3 text-left transition duration-200 ease-premium hover:-translate-y-0.5 hover:border-border-accent hover:bg-accent-faded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
      href={result.href}
      onClick={onSelect}
    >
      <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page text-accent transition duration-200 ease-premium group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground motion-reduce:transition-none">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {result.eyebrow}
          </span>
          <span className="rounded-full border border-hairline bg-page px-2 py-0.5 text-[11px] font-semibold uppercase text-ink-muted">
            {result.hitType}
          </span>
        </span>
        <strong className="mt-1 block truncate font-ui text-sm font-semibold text-ink-display">
          {result.title}
        </strong>
        <span className="mt-1 block text-sm leading-5 text-ink-muted">
          {result.description}
        </span>
        <span className="mt-2 block text-xs text-ink-muted">
          Matched on {result.matchedOn}
        </span>
      </span>
    </Link>
  );
}

function CommandEmptyState({
  meta,
  query,
}: {
  meta: CommandSearchMeta;
  query: string;
}) {
  const shortQuery = query.trim().length < 2;

  return (
    <div className="rounded-lg border border-dashed border-hairline bg-surface p-5 text-sm leading-6 text-ink-muted">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-lg border border-hairline bg-page text-accent">
          {shortQuery ? (
            <Sparkles aria-hidden className="size-4" />
          ) : (
            <Search aria-hidden className="size-4" />
          )}
        </span>
        <div>
          <strong className="block font-ui text-sm text-ink-display">
            {shortQuery ? "Type at least two characters" : "No tenant match"}
          </strong>
          <p className="mt-1">
            {shortQuery
              ? "One-character searches stay idle so the counter flow does not waste backend work."
              : `No result for "${meta.rawQuery}". Production search would still return the same empty state with request metadata.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function createEmptyResponse(rawQuery: string): CommandSearchResponse {
  return {
    results: [],
    meta: {
      elapsedMs: 0,
      latencyBudgetMs: null,
      minLengthSatisfied: rawQuery.trim().length >= 2,
      normalizedQuery: rawQuery.trim().toLowerCase(),
      queryKind: rawQuery.trim().length >= 2 ? "text" : "empty",
      rawQuery,
      resultCount: 0,
      source: "tenant-api",
      strategy: "none",
    },
  };
}

async function searchCommandRecordsAsync(
  query: string,
  signal: AbortSignal,
): Promise<CommandSearchResponse> {
  if (query.trim().length < 2) {
    return createEmptyResponse(query);
  }

  const response = await fetch(
    `/api/shop/search?q=${encodeURIComponent(query)}`,
    { signal },
  );

  if (!response.ok) {
    return createEmptyResponse(query);
  }

  return (await response.json()) as CommandSearchResponse;
}

function formatBudget(meta: CommandSearchMeta) {
  return meta.latencyBudgetMs ? `<${meta.latencyBudgetMs}ms target` : "Idle";
}

function humanizeStrategy(strategy: CommandSearchMeta["strategy"]) {
  return strategy.replaceAll("_", " ");
}

function readRecentResults(): readonly CommandSearchResult[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(recentSearchKey) ?? "[]",
    ) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCommandSearchResult).slice(0, maxRecentResults);
  } catch {
    return [];
  }
}

function writeRecentResults(results: readonly CommandSearchResult[]) {
  try {
    window.localStorage.setItem(recentSearchKey, JSON.stringify(results));
  } catch {
    // Recent search cache is a convenience only.
  }
}

function mergeRecentResults(
  nextResults: readonly CommandSearchResult[],
  currentResults: readonly CommandSearchResult[],
) {
  const seen = new Set<string>();
  const merged: CommandSearchResult[] = [];

  for (const result of [...nextResults, ...currentResults]) {
    const key = `${result.entityType}:${result.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(result);
    }

    if (merged.length === maxRecentResults) {
      break;
    }
  }

  return merged;
}

function isCommandSearchResult(value: unknown): value is CommandSearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.entityType === "string" &&
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.href === "string" &&
    typeof candidate.description === "string"
  );
}
