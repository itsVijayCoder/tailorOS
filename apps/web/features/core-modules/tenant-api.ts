import type {
  ApiResponse,
  AuditLogRead,
  CustomerContactRead,
  CustomerTimelineEvent,
  MeasurementTemplateRead,
  MeasurementVersionRead,
  NotificationLogRead,
  OrderRead,
  PaymentLedgerRead,
  ProductionTaskRead,
  SearchTenantDomainResponse,
  TenantDashboardRead,
  TenantSettingsRead,
  TodayReportRead,
} from "@tailoros/schemas";
import { cookies } from "next/headers";

import {
  defaultShopSlug,
  localDevToken,
  SESSION_COOKIE,
  SHOP_SLUG_COOKIE,
  tenantApiBaseUrlForSlug,
} from "@/features/auth/session";

export type TenantApiState<T> =
  | {
      data: T;
      error: null;
      source: "tenant-api";
    }
  | {
      data: T;
      error: string;
      source: "offline";
    };

export async function readDashboard(): Promise<
  TenantApiState<{ dashboard: TenantDashboardRead }>
> {
  return tenantGet("/dashboard", { dashboard: emptyDashboard() });
}

export async function readCustomers(
  query?: string,
): Promise<TenantApiState<{ customers: CustomerContactRead[] }>> {
  const params = new URLSearchParams({ limit: "30" });
  if (query) params.set("q", query);
  return tenantGet(`/customers/search?${params}`, { customers: [] });
}

export async function readCustomerTimeline(
  contactId: string,
): Promise<TenantApiState<{ timeline: CustomerTimelineEvent[] }>> {
  return tenantGet(`/customers/${contactId}/timeline`, { timeline: [] });
}

export async function readMeasurementTemplates(): Promise<
  TenantApiState<{ templates: MeasurementTemplateRead[] }>
> {
  return tenantGet("/measurements/templates", { templates: [] });
}

export async function readMeasurements(): Promise<
  TenantApiState<{ measurements: MeasurementVersionRead[] }>
> {
  return tenantGet("/measurements?limit=100", { measurements: [] });
}

export async function readOrders(): Promise<
  TenantApiState<{ orders: OrderRead[] }>
> {
  return tenantGet("/orders?limit=100", { orders: [] });
}

export async function readPayments(): Promise<
  TenantApiState<{ payments: PaymentLedgerRead[] }>
> {
  return tenantGet("/payments?limit=100", { payments: [] });
}

export async function readProductionTasks(): Promise<
  TenantApiState<{ tasks: ProductionTaskRead[] }>
> {
  return tenantGet("/production/tasks?limit=100", { tasks: [] });
}

export async function readReportToday(
  date?: string,
): Promise<TenantApiState<{ report: TodayReportRead }>> {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  return tenantGet(`/reports/today${suffix}`, { report: emptyReport() });
}

export async function readSettings(): Promise<
  TenantApiState<{ settings: TenantSettingsRead }>
> {
  return tenantGet("/settings", { settings: emptySettings() });
}

export async function readNotifications(): Promise<
  TenantApiState<{ logs: NotificationLogRead[] }>
> {
  return tenantGet("/notifications?failures=true", { logs: [] });
}

export async function readAuditLogs(): Promise<
  TenantApiState<{ logs: AuditLogRead[] }>
> {
  return tenantGet("/audit-logs", { logs: [] });
}

export async function searchTenant(
  query: string,
): Promise<TenantApiState<SearchTenantDomainResponse>> {
  const params = new URLSearchParams({ limit: "10", q: query });
  return tenantGet(`/search?${params}`, {
    meta: {
      elapsedMs: 0,
      latencyBudgetMs: null,
      minLengthSatisfied: query.trim().length >= 2,
      normalizedQuery: query.trim().toLowerCase(),
      queryKind: query.trim().length >= 2 ? "text" : "empty",
      rawQuery: query,
      resultCount: 0,
      strategy: "none",
    },
    results: [],
  });
}

export async function tenantPost<T>(
  path: string,
  body: unknown,
  fallback: T,
): Promise<TenantApiState<T>> {
  return tenantWrite("POST", path, body, fallback);
}

export async function tenantPatch<T>(
  path: string,
  body: unknown,
  fallback: T,
): Promise<TenantApiState<T>> {
  return tenantWrite("PATCH", path, body, fallback);
}

export async function tenantDelete<T>(
  path: string,
  fallback: T,
): Promise<TenantApiState<T>> {
  return tenantWrite("DELETE", path, undefined, fallback);
}

async function tenantWrite<T>(
  method: "DELETE" | "PATCH" | "POST",
  path: string,
  body: unknown,
  fallback: T,
): Promise<TenantApiState<T>> {
  const { baseUrl, token } = await tenantApiContext();

  if (!baseUrl || !token) {
    return {
      data: fallback,
      error: "Tenant API base URL or session token is not configured.",
      source: "offline",
    };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      method,
    });
    const responseBody = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !responseBody.ok) {
      return {
        data: fallback,
        error: responseBody.ok
          ? `Tenant API returned HTTP ${response.status}.`
          : responseBody.error.message,
        source: "offline",
      };
    }

    return { data: responseBody.data, error: null, source: "tenant-api" };
  } catch (error) {
    return {
      data: fallback,
      error: error instanceof Error ? error.message : "Tenant API failed.",
      source: "offline",
    };
  }
}

export async function tenantGet<T>(
  path: string,
  fallback: T,
): Promise<TenantApiState<T>> {
  const { baseUrl, token } = await tenantApiContext();

  if (!baseUrl || !token) {
    return {
      data: fallback,
      error: "Tenant API base URL or session token is not configured.",
      source: "offline",
    };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const body = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !body.ok) {
      return {
        data: fallback,
        error: body.ok
          ? `Tenant API returned HTTP ${response.status}.`
          : body.error.message,
        source: "offline",
      };
    }

    return { data: body.data, error: null, source: "tenant-api" };
  } catch (error) {
    return {
      data: fallback,
      error: error instanceof Error ? error.message : "Tenant API failed.",
      source: "offline",
    };
  }
}

async function tenantApiContext() {
  const cookieStore = await cookies();
  const shopSlug =
    cookieStore.get(SHOP_SLUG_COOKIE)?.value ||
    process.env.TAILOROS_SHOP_SLUG ||
    (process.env.NODE_ENV === "production" ? "" : defaultShopSlug);
  const token =
    cookieStore.get(SESSION_COOKIE)?.value ||
    process.env.TAILOROS_SESSION_TOKEN ||
    (process.env.NODE_ENV === "production" ? "" : localDevToken);
  const configuredBaseUrl = process.env.TAILOROS_API_BASE_URL?.replace(
    /\/$/,
    "",
  );

  return {
    baseUrl:
      configuredBaseUrl || (shopSlug ? tenantApiBaseUrlForSlug(shopSlug) : ""),
    token,
  };
}

function emptyDashboard(): TenantDashboardRead {
  return {
    notificationFailures: [],
    ordersDueToday: [],
    paymentDueOrders: [],
    productionTasks: [],
    report: emptyReport(),
  };
}

function emptyReport(): TodayReportRead {
  return {
    activeOrderCount: 0,
    balanceDuePaise: 0,
    collectedPaise: 0,
    correctionCount: 0,
    date: new Date().toISOString().slice(0, 10),
    dueTodayCount: 0,
    overdueCount: 0,
    partialDeliveryCount: 0,
    pendingOutboxCount: 0,
    readyForPickupCount: 0,
    whatsappBlockedCount: 0,
  };
}

function emptySettings(): TenantSettingsRead {
  return {
    garmentTemplates: [],
    receiptBranding: {
      city: null,
      footerNote: null,
      shopName: "TailorOS Shop",
    },
    staff: [],
  };
}
