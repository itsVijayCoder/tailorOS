import { Hono } from "hono";
import type { Context } from "hono";

import {
  createInternalJsonRequest,
  createErrorHandler,
  createNotFoundHandler,
  getRequestId,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";
import type { SecurityPermission } from "@tailoros/core";

import type { ApiGatewayEnv } from "./env";
import {
  authorizeGatewayTenantRequest,
  extractBearerToken,
  resolveTenantSession,
  type TenantSessionContext,
} from "./auth";
import {
  canDispatchTenant,
  type ResolvedTenantDispatch,
  resolveTenantForDispatch,
} from "./tenant-resolution";

export const app = new Hono<ApiGatewayEnv>();

app.use("*", requestIdMiddleware());

app.get("/health", (c) =>
  jsonSuccess(c, {
    service: "api-gateway",
    boundary: "public-api",
    status: "ok",
  }),
);

app.get("/v1/internal/whatsapp/health", async (c) => {
  const response = await c.env.WHATSAPP_CONNECTOR.fetch(
    createInternalJsonRequest({
      path: "/health",
      method: "GET",
      requestId: getRequestId(c),
    }),
  );

  if (!response.ok) {
    return jsonError(c, {
      code: "SERVICE_UNAVAILABLE",
      message: "WhatsApp connector health check failed.",
      status: 503,
    });
  }

  const connectorHealth = (await response.json()) as unknown;
  return jsonSuccess(c, { connectorHealth });
});

app.get("/v1/tenant/:slug/health", async (c) => {
  const tenantSlug = c.req.param("slug");
  c.set("tenantSlug", tenantSlug);

  const tenant = await resolveTenantForDispatch({
    db: c.env.CONTROL_DB,
    slug: tenantSlug,
  });

  if (!tenant) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant was not found.",
      status: 404,
    });
  }

  if (!canDispatchTenant(tenant)) {
    return jsonError(c, {
      code: "FORBIDDEN",
      message: "Tenant is not active for dispatch.",
      status: 403,
    });
  }

  const response = await c.env.TENANT_API.fetch(
    createInternalJsonRequest({
      path: `/internal/tenants/${tenantSlug}/health`,
      method: "GET",
      requestId: getRequestId(c),
    }),
  );

  if (!response.ok) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant API is unavailable for the resolved tenant.",
      status: 404,
    });
  }

  const tenantHealth = (await response.json()) as unknown;
  return jsonSuccess(c, { tenantSlug, tenantHealth });
});

app.all("/v1/tenant/:slug/*", async (c) => {
  const tenantSlug = c.req.param("slug");
  c.set("tenantSlug", tenantSlug);

  const tenant = await resolveTenantForDispatch({
    db: c.env.CONTROL_DB,
    slug: tenantSlug,
  });

  if (!tenant) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant was not found.",
      status: 404,
    });
  }

  if (!canDispatchTenant(tenant)) {
    return jsonError(c, {
      code: "FORBIDDEN",
      message: "Tenant is not active for dispatch.",
      status: 403,
    });
  }

  const requestUrl = new URL(c.req.url);
  const tenantPrefix = `/v1/tenant/${tenantSlug}`;
  const tenantPath = requestUrl.pathname.slice(tenantPrefix.length);
  const method = c.req.method.toUpperCase();
  const bodyText =
    method === "GET" || method === "HEAD" ? undefined : await c.req.text();
  const permission = resolveTenantPermission({
    method,
    tenantPath,
    ...(bodyText !== undefined ? { bodyText } : {}),
  });

  if (!permission) {
    return jsonError(c, {
      code: "NOT_FOUND",
      message: "Tenant route was not found.",
      status: 404,
    });
  }

  const session = await requireTenantSession(c, tenant, permission);

  if (session instanceof Response) {
    return session;
  }

  const headers: Record<string, string> = {
    "x-internal-service": "tailoros",
    "x-request-id": getRequestId(c),
    "x-shop-code": tenant.tenantCode,
    "x-tailoros-role": session.role,
    "x-tailoros-tenant-id": tenant.tenantId,
    "x-tailoros-user-id": session.userId,
  };
  const contentType = c.req.header("content-type");

  if (contentType && bodyText !== undefined) {
    headers["content-type"] = contentType;
  }

  const upstreamUrl = new URL(
    `/v1${tenantPath}${requestUrl.search}`,
    "https://internal.tailoros",
  );
  const upstream = new Request(upstreamUrl, {
    method,
    headers,
    ...(bodyText !== undefined ? { body: bodyText } : {}),
  });

  return c.env.TENANT_API.fetch(upstream);
});

app.notFound(createNotFoundHandler<ApiGatewayEnv>());
app.onError(createErrorHandler<ApiGatewayEnv>());

async function requireTenantSession(
  c: Context<ApiGatewayEnv>,
  tenant: ResolvedTenantDispatch,
  permission: SecurityPermission,
): Promise<TenantSessionContext | Response> {
  const authorization = c.req.header("authorization");
  const cookie = c.req.header("cookie");
  const token = extractBearerToken({
    ...(authorization ? { authorization } : {}),
    ...(cookie ? { cookie } : {}),
  });

  if (!token) {
    return jsonError(c, {
      code: "UNAUTHORIZED",
      message: "A staff session is required.",
      status: 401,
    });
  }

  const session = await resolveTenantSession({
    db: c.env.CONTROL_DB,
    tenantId: tenant.tenantId,
    token,
  });

  if (!session) {
    return jsonError(c, {
      code: "UNAUTHORIZED",
      message: "Staff session is invalid or expired.",
      status: 401,
    });
  }

  const decision = authorizeGatewayTenantRequest({
    tenant,
    session,
    permission,
  });

  if (!decision.allowed) {
    return jsonError(c, {
      code: "FORBIDDEN",
      message: `Permission denied: ${decision.reason}.`,
      status: 403,
    });
  }

  return session;
}

function resolveTenantPermission(input: {
  method: string;
  tenantPath: string;
  bodyText?: string;
}): SecurityPermission | null {
  const path = input.tenantPath || "/";

  if (input.method === "GET") {
    if (path.startsWith("/dashboard")) return "dashboard.read";
    if (path.startsWith("/search")) return "customers.read";
    if (path.startsWith("/customers")) return "customers.read";
    if (path.startsWith("/measurements")) return "measurements.read";
    if (path.startsWith("/orders")) return "orders.read";
    if (path.startsWith("/payments")) return "payments.record";
    if (path.startsWith("/production")) return "production.update";
    if (path.startsWith("/reports")) return "reports.read";
    if (path.startsWith("/settings")) return "settings.manage";
    if (path.startsWith("/notifications")) return "integrations.manage";
    if (path.startsWith("/audit-logs")) return "audit.read";
    if (path.startsWith("/receipts")) return "receipts.issue_link";
  }

  if (input.method === "POST") {
    if (path === "/contacts") return "customers.write";
    if (path === "/measurements") return "measurements.write";
    if (path === "/orders") return "orders.write";
    if (/^\/orders\/[^/]+\/payments$/.test(path)) {
      return paymentMutationPermission(input.bodyText);
    }
    if (/^\/orders\/[^/]+\/status$/.test(path)) return "orders.write";
    if (path.endsWith("/transition-preview")) return "orders.read";
  }

  if (input.method === "PATCH") {
    if (path.startsWith("/production/tasks/")) return "production.update";
  }

  return null;
}

function paymentMutationPermission(bodyText?: string): SecurityPermission {
  if (!bodyText) {
    return "payments.record";
  }

  try {
    const body = JSON.parse(bodyText) as { kind?: unknown };
    return body.kind === "correction" || body.kind === "refund"
      ? "payments.correct"
      : "payments.record";
  } catch {
    return "payments.record";
  }
}
