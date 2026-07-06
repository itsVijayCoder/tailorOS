import { normalizeSearchText } from "./domain";
import { normalizeIndianMobile } from "./phone";

export const tenantSearchLatencyBudgetsMs = {
  code: 50,
  mobile: 80,
  shortcut: 120,
  fts: 150,
} as const;

export type TenantSearchQueryKind =
  | "empty"
  | "mobile"
  | "customer_code"
  | "order_code"
  | "receipt_code"
  | "shortcut"
  | "text";

export type TenantSearchStrategy =
  | "none"
  | "indexed_mobile_prefix"
  | "indexed_code_exact"
  | "indexed_status_date"
  | "fts_prefix";

export type TenantSearchShortcut =
  | {
      name: "today_delivery";
      deliveryDate: string;
    }
  | {
      name: "overdue_delivery";
      beforeDate: string;
    };

export type ParsedTenantSearchQuery = Readonly<{
  rawQuery: string;
  normalizedText: string;
  kind: TenantSearchQueryKind;
  strategy: TenantSearchStrategy;
  minLengthSatisfied: boolean;
  latencyBudgetMs: number | null;
  value: string;
  mobileE164: string | null;
  mobileE164Prefix: string | null;
  code: string | null;
  ftsQuery: string;
  shortcut: TenantSearchShortcut | null;
}>;

const codePattern = /^(ORD|CUS|RCP|RCT)(?:-[A-Z0-9]+)+$/;

export function parseTenantSearchQuery(
  rawQuery: string,
  options: { todayIsoDate?: string } = {},
): ParsedTenantSearchQuery {
  const trimmed = rawQuery.trim();
  const normalizedText = normalizeSearchText(trimmed);
  const todayIsoDate =
    options.todayIsoDate ?? new Date().toISOString().slice(0, 10);

  if (normalizedText.length === 0) {
    return createParsedQuery({
      rawQuery,
      normalizedText,
      kind: "empty",
      strategy: "none",
      minLengthSatisfied: false,
    });
  }

  const shortcut = parseShortcut(normalizedText, todayIsoDate);
  if (shortcut) {
    return createParsedQuery({
      rawQuery,
      normalizedText,
      kind: "shortcut",
      strategy: "indexed_status_date",
      minLengthSatisfied: true,
      latencyBudgetMs: tenantSearchLatencyBudgetsMs.shortcut,
      shortcut,
      value: normalizedText,
    });
  }

  const mobilePrefix = parseMobilePrefix(trimmed);
  if (mobilePrefix) {
    return createParsedQuery({
      rawQuery,
      normalizedText,
      kind: "mobile",
      strategy: "indexed_mobile_prefix",
      minLengthSatisfied: true,
      latencyBudgetMs: tenantSearchLatencyBudgetsMs.mobile,
      mobileE164: mobilePrefix.isComplete ? mobilePrefix.e164Prefix : null,
      mobileE164Prefix: mobilePrefix.e164Prefix,
      value: mobilePrefix.e164Prefix,
    });
  }

  const compactUppercase = trimmed.toUpperCase().replace(/\s+/g, "");
  if (codePattern.test(compactUppercase)) {
    const prefix = compactUppercase.slice(0, 3);
    const kind =
      prefix === "ORD"
        ? "order_code"
        : prefix === "CUS"
          ? "customer_code"
          : "receipt_code";

    return createParsedQuery({
      rawQuery,
      normalizedText,
      kind,
      strategy: "indexed_code_exact",
      minLengthSatisfied: true,
      latencyBudgetMs: tenantSearchLatencyBudgetsMs.code,
      code: compactUppercase,
      value: compactUppercase,
    });
  }

  const minLengthSatisfied = normalizedText.length >= 2;
  return createParsedQuery({
    rawQuery,
    normalizedText,
    kind: minLengthSatisfied ? "text" : "empty",
    strategy: minLengthSatisfied ? "fts_prefix" : "none",
    minLengthSatisfied,
    latencyBudgetMs: minLengthSatisfied
      ? tenantSearchLatencyBudgetsMs.fts
      : null,
    ftsQuery: minLengthSatisfied ? createFtsPrefixQuery(normalizedText) : "",
    value: normalizedText,
  });
}

export function createFtsPrefixQuery(normalizedText: string): string {
  return normalizedText
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => `${token}*`)
    .join(" ");
}

function parseShortcut(
  normalizedText: string,
  todayIsoDate: string,
): TenantSearchShortcut | null {
  if (
    normalizedText === "today" ||
    normalizedText === "today delivery" ||
    normalizedText === "delivery today" ||
    normalizedText === "due today"
  ) {
    return { name: "today_delivery", deliveryDate: todayIsoDate };
  }

  if (
    normalizedText === "overdue" ||
    normalizedText === "overdue delivery" ||
    normalizedText === "late delivery"
  ) {
    return { name: "overdue_delivery", beforeDate: todayIsoDate };
  }

  return null;
}

function parseMobilePrefix(
  input: string,
): { e164Prefix: string; isComplete: boolean } | null {
  try {
    const mobile = normalizeIndianMobile(input);
    return { e164Prefix: mobile.e164, isComplete: true };
  } catch {
    let digits = input.replace(/\D/g, "");

    if (digits.startsWith("0091")) {
      digits = digits.slice(4);
    }

    if (digits.length === 11 && digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    if (digits.length > 10 && digits.startsWith("91")) {
      digits = digits.slice(2);
    }

    if (/^[6-9]\d{1,9}$/.test(digits)) {
      return { e164Prefix: `+91${digits}`, isComplete: digits.length === 10 };
    }
  }

  return null;
}

function createParsedQuery(
  input: Partial<ParsedTenantSearchQuery> &
    Pick<
      ParsedTenantSearchQuery,
      "kind" | "minLengthSatisfied" | "normalizedText" | "rawQuery" | "strategy"
    >,
): ParsedTenantSearchQuery {
  return {
    rawQuery: input.rawQuery,
    normalizedText: input.normalizedText,
    kind: input.kind,
    strategy: input.strategy,
    minLengthSatisfied: input.minLengthSatisfied,
    latencyBudgetMs: input.latencyBudgetMs ?? null,
    value: input.value ?? "",
    mobileE164: input.mobileE164 ?? null,
    mobileE164Prefix: input.mobileE164Prefix ?? null,
    code: input.code ?? null,
    ftsQuery: input.ftsQuery ?? "",
    shortcut: input.shortcut ?? null,
  };
}
