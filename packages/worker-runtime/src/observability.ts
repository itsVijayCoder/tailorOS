export type WorkerLogLevel = "debug" | "info" | "warn" | "error";

export type WorkerRuntimeMetadata = Readonly<{
  environment: string;
  worker: string;
  version: string;
}>;

export type WorkerLogContext = Readonly<{
  requestId?: string;
  tenantId?: string;
  userId?: string;
  route?: string;
  entityType?: string;
  entityId?: string;
  jobId?: string;
  queueName?: string;
}>;

export type WorkerLogEntry = WorkerRuntimeMetadata &
  WorkerLogContext &
  Readonly<{
    timestamp: string;
    level: WorkerLogLevel;
    event: string;
    message: string;
    durationMs?: number;
    d1RowsRead?: number;
    d1RowsWritten?: number;
    statusCode?: number;
    errorName?: string;
    errorMessage?: string;
    details?: Record<string, string | number | boolean | null>;
  }>;

export type AlertSeverity = "info" | "warning" | "critical";

export type ReleaseAlert = Readonly<{
  id: string;
  severity: AlertSeverity;
  title: string;
  action: string;
}>;

export type ReleaseMetricSnapshot = Readonly<{
  apiErrorRatePct: number;
  searchP95Ms: number;
  queueDlqCount: number;
  tenantProvisioningFailures: number;
  webhookInvalidSignatureCount: number;
}>;

export type ReleaseReadinessCheck = Readonly<{
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
}>;

type RuntimeMetadataEnv = Partial<
  Record<"ENVIRONMENT" | "RELEASE_VERSION" | "SERVICE_NAME", string>
>;

type JsonLogger = Pick<Console, "debug" | "error" | "info" | "log" | "warn">;

export function readRuntimeMetadata(
  env: RuntimeMetadataEnv | undefined,
  fallback: { worker: string; version?: string },
): WorkerRuntimeMetadata {
  return {
    environment: env?.ENVIRONMENT?.trim() || "unknown",
    version: env?.RELEASE_VERSION?.trim() || fallback.version || "unversioned",
    worker: env?.SERVICE_NAME?.trim() || fallback.worker,
  };
}

export function createReleaseVersion(input: {
  date: string;
  sequence: number;
  sha?: string;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Release date must use YYYY-MM-DD format.");
  }

  if (!Number.isInteger(input.sequence) || input.sequence < 1) {
    throw new Error("Release sequence must be a positive integer.");
  }

  const base = `${input.date.replaceAll("-", ".")}.${input.sequence}`;
  const sha = input.sha?.trim();

  return sha ? `${base}+${sha.slice(0, 7)}` : base;
}

export function createLogEntry(input: {
  metadata: WorkerRuntimeMetadata;
  level: WorkerLogLevel;
  event: string;
  message: string;
  context?: WorkerLogContext;
  durationMs?: number;
  d1RowsRead?: number;
  d1RowsWritten?: number;
  statusCode?: number;
  error?: unknown;
  details?: Record<string, string | number | boolean | null>;
  now?: Date;
}): WorkerLogEntry {
  const error = normalizeError(input.error);

  return {
    timestamp: (input.now ?? new Date()).toISOString(),
    level: input.level,
    event: input.event,
    message: input.message,
    environment: input.metadata.environment,
    version: input.metadata.version,
    worker: input.metadata.worker,
    ...(input.context?.requestId
      ? { requestId: input.context.requestId }
      : {}),
    ...(input.context?.tenantId ? { tenantId: input.context.tenantId } : {}),
    ...(input.context?.userId ? { userId: input.context.userId } : {}),
    ...(input.context?.route ? { route: input.context.route } : {}),
    ...(input.context?.entityType
      ? { entityType: input.context.entityType }
      : {}),
    ...(input.context?.entityId ? { entityId: input.context.entityId } : {}),
    ...(input.context?.jobId ? { jobId: input.context.jobId } : {}),
    ...(input.context?.queueName ? { queueName: input.context.queueName } : {}),
    ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
    ...(input.d1RowsRead !== undefined ? { d1RowsRead: input.d1RowsRead } : {}),
    ...(input.d1RowsWritten !== undefined
      ? { d1RowsWritten: input.d1RowsWritten }
      : {}),
    ...(input.statusCode !== undefined ? { statusCode: input.statusCode } : {}),
    ...(error ? { errorName: error.name, errorMessage: error.message } : {}),
    ...(input.details ? { details: input.details } : {}),
  };
}

export function logWorkerEvent(
  entry: WorkerLogEntry,
  logger: JsonLogger = console,
) {
  const line = JSON.stringify(entry);

  if (entry.level === "error") {
    logger.error(line);
    return;
  }

  if (entry.level === "warn") {
    logger.warn(line);
    return;
  }

  if (entry.level === "debug") {
    logger.debug(line);
    return;
  }

  logger.log(line);
}

export function buildHealthPayload(input: {
  metadata: WorkerRuntimeMetadata;
  boundary: string;
  checks?: readonly ReleaseReadinessCheck[];
  now?: Date;
}) {
  const checks = input.checks ?? [];
  const status = checks.some((check) => !check.passed) ? "degraded" : "ok";

  return {
    boundary: input.boundary,
    checkedAt: (input.now ?? new Date()).toISOString(),
    checks,
    environment: input.metadata.environment,
    service: input.metadata.worker,
    status,
    version: input.metadata.version,
  } as const;
}

export function evaluateReleaseAlerts(
  metrics: ReleaseMetricSnapshot,
): readonly ReleaseAlert[] {
  const alerts: ReleaseAlert[] = [];

  if (metrics.apiErrorRatePct > 2) {
    alerts.push({
      action: "Check deployment version, request logs, and D1 errors.",
      id: "api-error-rate",
      severity: "critical",
      title: "API error rate is above 2% on critical routes.",
    });
  }

  if (metrics.searchP95Ms > 400) {
    alerts.push({
      action: "Inspect query plan, FTS index freshness, and rows read.",
      id: "tenant-search-p95",
      severity: "warning",
      title: "Tenant search p95 is above 400ms.",
    });
  }

  if (metrics.queueDlqCount > 0) {
    alerts.push({
      action: "Open the queue runbook and classify terminal versus transient failures.",
      id: "queue-dlq",
      severity: "critical",
      title: "Critical queue DLQ contains messages.",
    });
  }

  if (metrics.tenantProvisioningFailures > 0) {
    alerts.push({
      action: "Alert platform admin and put the tenant in retry/manual review.",
      id: "tenant-provisioning-failure",
      severity: "critical",
      title: "Tenant provisioning has production failures.",
    });
  }

  if (metrics.webhookInvalidSignatureCount >= 5) {
    alerts.push({
      action: "Check provider config, abuse signals, and app secret rotation.",
      id: "webhook-invalid-signature",
      severity: "warning",
      title: "Webhook invalid signature count spiked.",
    });
  }

  return alerts;
}

export function summarizeReleaseReadiness(
  checks: readonly ReleaseReadinessCheck[],
) {
  const failed = checks.filter((check) => !check.passed);

  return {
    failed,
    passed: checks.length - failed.length,
    ready: failed.length === 0,
    total: checks.length,
  } as const;
}

function normalizeError(error: unknown) {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }

  return { message: String(error), name: "Error" };
}
