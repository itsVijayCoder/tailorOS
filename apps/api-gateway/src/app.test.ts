import { describe, expect, it } from "vitest";

import { createApiSuccess } from "@tailoros/schemas";

import { app } from "./app";
import type { ResolvedTenantDispatch } from "./tenant-resolution";

describe("api-gateway Worker", () => {
  it("returns health with a request ID", async () => {
    const response = await app.request(
      "/health",
      { headers: { "x-request-id": "req_api_health" } },
      {} as Env,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req_api_health");
    expect(body).toEqual({
      ok: true,
      data: {
        service: "api-gateway",
        boundary: "public-api",
        status: "ok",
      },
      requestId: "req_api_health",
    });
  });

  it("calls the WhatsApp connector through a service binding", async () => {
    const env = {
      WHATSAPP_CONNECTOR: {
        fetch: async () =>
          Response.json(
            createApiSuccess(
              { service: "whatsapp-connector", status: "ok" },
              "req_connector_mock",
            ),
          ),
      },
    } as unknown as Env;

    const response = await app.request(
      "/v1/internal/whatsapp/health",
      { headers: { "x-request-id": "req_service_binding" } },
      env,
    );
    const body = (await response.json()) as {
      ok: boolean;
      requestId: string;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.requestId).toBe("req_service_binding");
  });

  it("dispatches only active tenants with a healthy worker mapping", async () => {
    const { env, calls } = createEnvWithTenant({
      tenantId: "ten_1234567890abcd",
      tenantCode: "MDU",
      slug: "sri-raja-tailors",
      status: "active",
      workerName: "tailoros-tenant-sri-raja-tailors",
      workerStatus: "healthy",
    });

    const response = await app.request(
      "/v1/tenant/sri-raja-tailors/health",
      { headers: { "x-request-id": "req_tenant_dispatch" } },
      env,
    );
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(calls.tenantApi).toBe(1);
  });

  it("blocks suspended tenants before invoking the tenant API", async () => {
    const { env, calls } = createEnvWithTenant({
      tenantId: "ten_1234567890abcd",
      tenantCode: "MDU",
      slug: "sri-raja-tailors",
      status: "suspended",
      workerName: "tailoros-tenant-sri-raja-tailors",
      workerStatus: "healthy",
    });

    const response = await app.request(
      "/v1/tenant/sri-raja-tailors/health",
      { headers: { "x-request-id": "req_tenant_suspended" } },
      env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(calls.tenantApi).toBe(0);
  });

  it("requires a staff session before proxying tenant data routes", async () => {
    const { env, calls } = createEnvWithTenant({
      tenantId: "ten_1234567890abcd",
      tenantCode: "MDU",
      slug: "sri-raja-tailors",
      status: "active",
      workerName: "tailoros-tenant-sri-raja-tailors",
      workerStatus: "healthy",
    });

    const response = await app.request(
      "/v1/tenant/sri-raja-tailors/orders",
      { headers: { "x-request-id": "req_missing_session" } },
      env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string };
    };

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(calls.tenantApi).toBe(0);
  });

  it("proxies authorized tenant requests with trusted staff context", async () => {
    const { env, calls } = createEnvWithTenant(
      {
        tenantId: "ten_1234567890abcd",
        tenantCode: "MDU",
        slug: "sri-raja-tailors",
        status: "active",
        workerName: "tailoros-tenant-sri-raja-tailors",
        workerStatus: "healthy",
      },
      createSessionRow("owner"),
    );

    const response = await app.request(
      "/v1/tenant/sri-raja-tailors/orders?limit=5",
      {
        headers: {
          authorization: "Bearer local_owner_token",
          "x-request-id": "req_tenant_proxy",
        },
      },
      env,
    );
    const body = (await response.json()) as { ok: boolean };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(calls.tenantApi).toBe(1);
    expect(calls.lastTenantUrl).toBe(
      "https://internal.tailoros/v1/orders?limit=5",
    );
    expect(calls.lastHeaders["x-tailoros-user-id"]).toBe("usr_owner_01");
    expect(calls.lastHeaders["x-tailoros-role"]).toBe("owner");
    expect(calls.lastHeaders["x-shop-code"]).toBe("MDU");
  });

  it("blocks cashier payment corrections at the gateway", async () => {
    const { env, calls } = createEnvWithTenant(
      {
        tenantId: "ten_1234567890abcd",
        tenantCode: "MDU",
        slug: "sri-raja-tailors",
        status: "active",
        workerName: "tailoros-tenant-sri-raja-tailors",
        workerStatus: "healthy",
      },
      createSessionRow("cashier"),
    );

    const response = await app.request(
      "/v1/tenant/sri-raja-tailors/orders/ORD-MDU-001/payments",
      {
        body: JSON.stringify({
          amountPaise: -1000,
          kind: "correction",
          mode: "adjustment",
          recordedByUserId: "usr_cashier_01",
          reason: "Wrong advance entered",
        }),
        headers: {
          authorization: "Bearer cashier_token",
          "content-type": "application/json",
          "x-request-id": "req_cashier_correction",
        },
        method: "POST",
      },
      env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string; message: string };
    };

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toContain("ROLE_FORBIDDEN");
    expect(calls.tenantApi).toBe(0);
  });
});

function createEnvWithTenant(
  row: ResolvedTenantDispatch | null,
  sessionRow: Record<string, unknown> | null = null,
) {
  const calls: {
    tenantApi: number;
    lastTenantUrl: string | null;
    lastHeaders: Record<string, string>;
  } = { tenantApi: 0, lastHeaders: {}, lastTenantUrl: null };
  const env = {
    CONTROL_DB: {
      prepare: (sql: string) => ({
        bind: () => ({
          first: async () =>
            sql.includes("FROM staff_sessions") ? sessionRow : row,
        }),
      }),
    },
    TENANT_API: {
      fetch: async (request: Request) => {
        calls.tenantApi += 1;
        calls.lastTenantUrl = request.url;
        request.headers.forEach((value, key) => {
          calls.lastHeaders[key] = value;
        });
        return Response.json(
          createApiSuccess({ service: "tenant-api", status: "ok" }, "req_mock"),
        );
      },
    },
    WHATSAPP_CONNECTOR: {
      fetch: async () =>
        Response.json(
          createApiSuccess(
            { service: "whatsapp-connector", status: "ok" },
            "req_mock",
          ),
        ),
    },
  } as unknown as Env;

  return { env, calls };
}

function createSessionRow(role: string) {
  return {
    displayName: "Raja Raman",
    email: "owner@sriraja.example.com",
    membershipId: "mem_owner_01",
    membershipStatus: "active",
    membershipTenantId: "ten_1234567890abcd",
    role,
    sessionExpiresAt: "2027-07-06T00:00:00.000Z",
    sessionStatus: "active",
    userId: "usr_owner_01",
    userStatus: "active",
  };
}
