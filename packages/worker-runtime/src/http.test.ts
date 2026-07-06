import { describe, expect, it } from "vitest";
import { Hono } from "hono";

import {
  createErrorHandler,
  createNotFoundHandler,
  jsonSuccess,
  requestIdMiddleware,
  type RequestVariables,
} from "./http";

describe("Worker HTTP runtime", () => {
  it("adds a request ID to health responses", async () => {
    const app = new Hono<{ Variables: RequestVariables }>();
    app.use("*", requestIdMiddleware());
    app.get("/health", (c) => jsonSuccess(c, { service: "test" }));
    app.notFound(createNotFoundHandler());
    app.onError(createErrorHandler());

    const response = await app.request("/health", {
      headers: { "x-request-id": "req_test_001" },
    });
    const body = await response.json();

    expect(response.headers.get("x-request-id")).toBe("req_test_001");
    expect(body).toEqual({
      ok: true,
      data: { service: "test" },
      requestId: "req_test_001",
    });
  });

  it("returns the shared error contract for unknown routes", async () => {
    const app = new Hono<{ Variables: RequestVariables }>();
    app.use("*", requestIdMiddleware());
    app.notFound(createNotFoundHandler());

    const response = await app.request("/missing", {
      headers: { "x-request-id": "req_test_404" },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.requestId).toBe("req_test_404");
  });
});
