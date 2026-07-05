import { describe, expect, it } from "vitest";

import { app } from "./app";

describe("tenant-api-template Worker", () => {
  it("returns health with the shared API envelope", async () => {
    const response = await app.request(
      "/health",
      { headers: { "x-request-id": "req_tenant_health" } },
      {} as Env,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req_tenant_health");
    expect(body).toEqual({
      ok: true,
      data: {
        service: "tenant-api-template",
        boundary: "tenant-plane",
        status: "ok",
      },
      requestId: "req_tenant_health",
    });
  });

  it("rejects invalid contact payloads before touching D1", async () => {
    const response = await app.request(
      "/v1/contacts",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_contact_invalid",
        },
        body: JSON.stringify({
          primaryMobile: "123",
          profiles: [],
          createdByUserId: "usr_counter_01",
        }),
      },
      {} as Env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string; fields: Record<string, string[]> };
      requestId: string;
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields.primaryMobile).toBeDefined();
    expect(body.error.fields.profiles).toBeDefined();
    expect(body.requestId).toBe("req_contact_invalid");
  });

  it("requires reasons for payment corrections at the API boundary", async () => {
    const response = await app.request(
      "/v1/orders/ORD-MDU-100/payments",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req_payment_invalid",
        },
        body: JSON.stringify({
          amountPaise: -10000,
          mode: "adjustment",
          kind: "correction",
          recordedByUserId: "usr_owner_01",
        }),
      },
      {} as Env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string; fields: Record<string, string[]> };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields.reason).toContain(
      "Refunds and payment corrections require a reason.",
    );
  });

  it("validates search query length before D1 search", async () => {
    const response = await app.request(
      "/v1/search?q=m",
      { headers: { "x-request-id": "req_search_short" } },
      {} as Env,
    );
    const body = (await response.json()) as {
      ok: false;
      error: { code: string };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
