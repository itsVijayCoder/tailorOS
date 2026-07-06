import { Hono } from "hono";

import {
  createInternalJsonRequest,
  createErrorHandler,
  createNotFoundHandler,
  getRequestId,
  jsonError,
  jsonSuccess,
  requestIdMiddleware,
} from "@tailoros/worker-runtime";

import type { ApiGatewayEnv } from "./env";
import {
  canDispatchTenant,
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

app.notFound(createNotFoundHandler<ApiGatewayEnv>());
app.onError(createErrorHandler<ApiGatewayEnv>());
