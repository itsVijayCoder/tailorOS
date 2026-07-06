import { describe, expect, it } from "vitest";
import { Hono } from "hono";

import {
  createErrorHandler,
  createNotFoundHandler,
  jsonSuccess,
  requestIdMiddleware,
  type RequestVariables,
} from "./http";
import {
  buildHealthPayload,
  createLogEntry,
  createReleaseVersion,
  evaluateReleaseAlerts,
  logWorkerEvent,
  readRuntimeMetadata,
  summarizeReleaseReadiness,
} from "./observability";

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

  it("creates queryable JSON logs with release metadata and tenant context", () => {
    const metadata = readRuntimeMetadata(
      {
        ENVIRONMENT: "staging",
        RELEASE_VERSION: "2026.07.06.1",
        SERVICE_NAME: "tenant-api",
      },
      { worker: "fallback" },
    );
    const entry = createLogEntry({
      context: {
        entityId: "ORD-MDU-000421",
        entityType: "order",
        requestId: "req_test_log",
        route: "POST /v1/orders",
        tenantId: "ten_mdu_001",
        userId: "usr_counter_01",
      },
      d1RowsRead: 12,
      d1RowsWritten: 7,
      durationMs: 42,
      event: "order.created",
      level: "info",
      message: "Order created.",
      metadata,
      now: new Date("2026-07-06T10:00:00.000Z"),
    });

    expect(entry).toMatchObject({
      d1RowsRead: 12,
      d1RowsWritten: 7,
      durationMs: 42,
      environment: "staging",
      entityId: "ORD-MDU-000421",
      entityType: "order",
      event: "order.created",
      requestId: "req_test_log",
      tenantId: "ten_mdu_001",
      timestamp: "2026-07-06T10:00:00.000Z",
      version: "2026.07.06.1",
      worker: "tenant-api",
    });
  });

  it("writes warning and error entries through the matching console severity", () => {
    const lines: string[] = [];
    const logger = {
      debug: (line: string) => lines.push(`debug:${line}`),
      error: (line: string) => lines.push(`error:${line}`),
      info: (line: string) => lines.push(`info:${line}`),
      log: (line: string) => lines.push(`log:${line}`),
      warn: (line: string) => lines.push(`warn:${line}`),
    };

    logWorkerEvent(
      createLogEntry({
        event: "queue.dlq",
        level: "warn",
        message: "WhatsApp queue has DLQ items.",
        metadata: {
          environment: "production",
          version: "2026.07.06.2",
          worker: "whatsapp-consumer",
        },
        now: new Date("2026-07-06T11:00:00.000Z"),
      }),
      logger,
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]?.startsWith("warn:")).toBe(true);
    expect(JSON.parse(lines[0]?.replace("warn:", "") ?? "{}")).toMatchObject({
      event: "queue.dlq",
      level: "warn",
      worker: "whatsapp-consumer",
    });
  });

  it("derives release versions, health payloads, alerts, and readiness summary", () => {
    expect(
      createReleaseVersion({
        date: "2026-07-06",
        sequence: 3,
        sha: "abcdef123456",
      }),
    ).toBe("2026.07.06.3+abcdef1");

    const checks = [
      {
        evidence: "All tenant DBs are on schema v1.",
        id: "tenant-schema",
        label: "Tenant schema",
        passed: true,
      },
      {
        evidence: "wa-send-dlq has 1 item.",
        id: "wa-dlq",
        label: "WhatsApp DLQ",
        passed: false,
      },
    ];

    expect(summarizeReleaseReadiness(checks)).toMatchObject({
      passed: 1,
      ready: false,
      total: 2,
    });
    expect(
      buildHealthPayload({
        boundary: "messaging-queues",
        checks,
        metadata: {
          environment: "production",
          version: "2026.07.06.3",
          worker: "whatsapp-consumer",
        },
        now: new Date("2026-07-06T12:00:00.000Z"),
      }),
    ).toMatchObject({
      checkedAt: "2026-07-06T12:00:00.000Z",
      service: "whatsapp-consumer",
      status: "degraded",
    });
    expect(
      evaluateReleaseAlerts({
        apiErrorRatePct: 2.4,
        queueDlqCount: 1,
        searchP95Ms: 520,
        tenantProvisioningFailures: 1,
        webhookInvalidSignatureCount: 7,
      }).map((alert) => alert.id),
    ).toEqual([
      "api-error-rate",
      "tenant-search-p95",
      "queue-dlq",
      "tenant-provisioning-failure",
      "webhook-invalid-signature",
    ]);
  });
});
