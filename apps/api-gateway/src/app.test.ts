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
});

function createEnvWithTenant(row: ResolvedTenantDispatch | null) {
  const calls = { tenantApi: 0 };
  const env = {
    CONTROL_DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => row,
        }),
      }),
    },
    TENANT_API: {
      fetch: async () => {
        calls.tenantApi += 1;
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
