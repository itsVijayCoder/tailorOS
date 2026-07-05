import { describe, expect, it } from "vitest";

import { createApiSuccess } from "@tailoros/schemas";

import { app } from "./app";

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
});
