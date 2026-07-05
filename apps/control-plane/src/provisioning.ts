import { createStableId } from "@tailoros/core";
import {
  createQueueEnvelope,
  idempotencyKeySchema,
  queueEnvelopeSchema,
  tenantProvisionQueuePayloadSchema,
  type CreateTenantProvisioningResponse,
  type CreateTenantRequest,
  type ProvisioningJobStatus,
  type ProvisioningStep,
  type RetryTenantProvisioningResponse,
  type TenantPlan,
  type TenantProvisioningSummary,
  type TenantStatus,
} from "@tailoros/schemas";

export type ControlPlaneStore = {
  findSummaryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<TenantProvisioningSummary | null>;
  findSummaryByTenantId(
    tenantId: string,
  ): Promise<TenantProvisioningSummary | null>;
  listSummaries(limit: number): Promise<TenantProvisioningSummary[]>;
  createSignupReservation(
    input: SignupReservationInput,
  ): Promise<TenantProvisioningSummary>;
  recordProvisioningAttempt(input: {
    tenantId: string;
    now: string;
  }): Promise<void>;
  markProvisioningProgress(input: {
    tenantId: string;
    tenantStatus: TenantStatus;
    jobStatus: ProvisioningJobStatus;
    step: ProvisioningStep;
    now: string;
    lastError: string | null;
  }): Promise<void>;
  upsertDatabaseRegistry(input: DatabaseRegistryInput): Promise<void>;
  upsertWorkerRegistry(input: WorkerRegistryInput): Promise<void>;
  recordAudit(input: AuditLogInput): Promise<void>;
};

export type QueueProducer = {
  send(message: unknown, options?: QueueSendOptions): Promise<unknown>;
};

export type SignupReservationInput = {
  tenantId: string;
  tenantCode: string;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  timezone: string;
  status: TenantStatus;
  planCode: TenantPlan;
  ownerName: string;
  ownerMobile: string;
  ownerEmail: string;
  jobId: string;
  jobType: "tenant.provision";
  jobStatus: ProvisioningJobStatus;
  step: ProvisioningStep;
  idempotencyKey: string;
  now: string;
};

export type DatabaseRegistryInput = {
  id: string;
  tenantId: string;
  d1DatabaseName: string;
  d1DatabaseId: string | null;
  primaryLocationHint: string;
  readReplicationMode: string;
  schemaVersion: number;
  status: string;
  now: string;
};

export type WorkerRegistryInput = {
  id: string;
  tenantId: string;
  workerName: string;
  dispatchNamespace: string | null;
  status: string;
  lastHealthStatus: string | null;
  lastHealthCheckedAt: string | null;
  now: string;
};

export type AuditLogInput = {
  id: string;
  tenantId: string | null;
  actorType: "system" | "platform_admin" | "queue";
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  reasonCode: string | null;
  summary: string;
  metadataJson: string | null;
  createdAt: string;
};

export type ProvisioningRuntimeConfig = {
  environment: string;
  mode: ProvisioningMode;
  cfAccountId: string;
  cfApiToken: string;
  tenantSchemaVersion: number;
  primaryLocationHint: string;
  readReplicationMode: string;
  dispatchNamespace: string | null;
  fetcher: typeof fetch;
  failureStep?: ProvisioningStep;
};

export type ProvisioningMode = "simulated" | "manual" | "automated";

export class TenantSlugConflictError extends Error {
  constructor(slug: string) {
    super(`Tenant slug '${slug}' is already reserved.`);
    this.name = "TenantSlugConflictError";
  }
}

export class ProvisioningQueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvisioningQueueError";
  }
}

export class ProvisioningStepError extends Error {
  readonly step: ProvisioningStep;

  constructor(step: ProvisioningStep, message: string) {
    super(message);
    this.name = "ProvisioningStepError";
    this.step = step;
  }
}

export function resolveIdempotencyKey(input: {
  headerValue: string | null;
  request: CreateTenantRequest;
}) {
  if (input.headerValue) {
    const parsed = idempotencyKeySchema.safeParse(input.headerValue);

    if (!parsed.success) {
      return {
        ok: false as const,
        message: parsed.error.issues.map((issue) => issue.message).join(" "),
      };
    }

    return { ok: true as const, value: parsed.data };
  }

  const emailSegment = input.request.ownerEmail
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 56);

  return {
    ok: true as const,
    value: `tenant-signup:${input.request.preferredSlug}:${emailSegment}`,
  };
}

export async function createTenantSignup(input: {
  request: CreateTenantRequest;
  idempotencyKey: string;
  store: ControlPlaneStore;
  queue: QueueProducer;
  now?: Date;
}): Promise<CreateTenantProvisioningResponse> {
  const now = toIso(input.now);
  const existing = await input.store.findSummaryByIdempotencyKey(
    input.idempotencyKey,
  );

  if (existing?.jobId) {
    return {
      tenantId: existing.tenantId,
      slug: existing.slug,
      status: existing.status,
      queuedJobId: existing.jobId,
      provisioningUrl: `/admin/tenants/${existing.tenantId}`,
      reusedExistingRequest: true,
    };
  }

  const tenantId = createTenantId();
  const jobId = createStableId({ prefix: "JOB" }).replace("JOB-", "job_");
  const tenantCode = createTenantCode(input.request.preferredSlug);

  const summary = await input.store.createSignupReservation({
    tenantId,
    tenantCode,
    slug: input.request.preferredSlug,
    businessName: input.request.shopName,
    city: input.request.city,
    state: "Tamil Nadu",
    timezone: "Asia/Kolkata",
    status: "provisioning_pending",
    planCode: input.request.plan,
    ownerName: input.request.ownerName,
    ownerMobile: input.request.ownerMobile,
    ownerEmail: input.request.ownerEmail,
    jobId,
    jobType: "tenant.provision",
    jobStatus: "queued",
    step: "requested",
    idempotencyKey: input.idempotencyKey,
    now,
  });

  const envelope = createQueueEnvelope({
    type: "tenant.provision",
    version: 1,
    id: jobId,
    idempotencyKey: input.idempotencyKey,
    payload: {
      tenantId,
      preferredSlug: input.request.preferredSlug,
      plan: input.request.plan,
    },
    createdAt: now,
  });

  try {
    await input.queue.send(envelope, { contentType: "json" });
  } catch (error) {
    await input.store.markProvisioningProgress({
      tenantId,
      tenantStatus: "needs_manual_review",
      jobStatus: "needs_manual_review",
      step: "needs_manual_review",
      now,
      lastError: stringifyError(error),
    });
    throw new ProvisioningQueueError(
      "Tenant provisioning queue is unavailable.",
    );
  }

  return {
    tenantId: summary.tenantId,
    slug: summary.slug,
    status: summary.status,
    queuedJobId: jobId,
    provisioningUrl: `/admin/tenants/${summary.tenantId}`,
    reusedExistingRequest: false,
  };
}

export async function retryTenantProvisioning(input: {
  tenantId: string;
  store: ControlPlaneStore;
  queue: QueueProducer;
  now?: Date;
}): Promise<RetryTenantProvisioningResponse | null> {
  const summary = await input.store.findSummaryByTenantId(input.tenantId);

  if (!summary?.jobId || !summary.idempotencyKey) {
    return null;
  }

  if (!isRecoverableProvisioningState(summary.status)) {
    return null;
  }

  const now = toIso(input.now);
  const envelope = createQueueEnvelope({
    type: "tenant.provision",
    version: 1,
    id: createStableId({ prefix: "JOB" }).replace("JOB-", "job_"),
    idempotencyKey: summary.idempotencyKey,
    payload: {
      tenantId: summary.tenantId,
      preferredSlug: summary.slug,
      plan: summary.planCode,
    },
    createdAt: now,
  });

  await input.store.markProvisioningProgress({
    tenantId: summary.tenantId,
    tenantStatus: "provisioning_pending",
    jobStatus: "retrying",
    step: "requested",
    now,
    lastError: null,
  });
  await input.queue.send(envelope, { contentType: "json" });

  return {
    tenantId: summary.tenantId,
    status: "provisioning_pending",
    queuedJobId: envelope.id,
    provisioningStep: "requested",
  };
}

export async function processTenantProvisionEnvelope(input: {
  envelopeBody: unknown;
  store: ControlPlaneStore;
  queue: QueueProducer;
  config: ProvisioningRuntimeConfig;
  now?: Date;
}): Promise<void> {
  const parsedEnvelope = queueEnvelopeSchema.safeParse(input.envelopeBody);
  const parsedPayload = tenantProvisionQueuePayloadSchema.safeParse(
    parsedEnvelope.success ? parsedEnvelope.data.payload : input.envelopeBody,
  );

  if (!parsedPayload.success) {
    throw new ProvisioningStepError(
      "failed_validation",
      "Tenant provisioning queue payload is invalid.",
    );
  }

  const now = toIso(input.now);
  const tenant = await input.store.findSummaryByTenantId(
    parsedPayload.data.tenantId,
  );

  if (!tenant) {
    throw new ProvisioningStepError(
      "failed_validation",
      `Tenant ${parsedPayload.data.tenantId} does not exist.`,
    );
  }

  if (tenant.status === "active" || tenant.status === "suspended") {
    return;
  }

  await input.store.recordProvisioningAttempt({
    tenantId: tenant.tenantId,
    now,
  });

  try {
    await markStep(input.store, tenant.tenantId, "validating_owner", now);
    maybeFail(input.config, "failed_validation");

    await markStep(input.store, tenant.tenantId, "tenant_reserved", now);

    if (input.config.mode === "manual") {
      await failStep(input.store, {
        tenantId: tenant.tenantId,
        step: "needs_manual_review",
        tenantStatus: "needs_manual_review",
        message:
          "Manual mode is enabled. Create the tenant D1 database, run migrations, register the worker, then retry activation.",
        now,
      });
      return;
    }

    await markStep(input.store, tenant.tenantId, "db_creating", now);
    maybeFail(input.config, "failed_db_create");
    const database = await createTenantDatabase({
      tenant,
      config: input.config,
    });

    await input.store.upsertDatabaseRegistry({
      id: createStableId({ prefix: "TDB" }),
      tenantId: tenant.tenantId,
      d1DatabaseName: database.name,
      d1DatabaseId: database.id,
      primaryLocationHint: input.config.primaryLocationHint,
      readReplicationMode: database.readReplicationMode,
      schemaVersion: 0,
      status: "created",
      now,
    });

    await markStep(input.store, tenant.tenantId, "db_migrating", now);
    maybeFail(input.config, "failed_migration");

    if (input.config.mode === "automated") {
      const migrationEnvelope = createQueueEnvelope({
        type: "tenant.migrate",
        version: 1,
        id: createStableId({ prefix: "JOB" }).replace("JOB-", "job_"),
        idempotencyKey: `tenant:${tenant.tenantId}:migrate:${input.config.tenantSchemaVersion}`,
        payload: {
          tenantId: tenant.tenantId,
          databaseId: database.id,
          targetSchemaVersion: input.config.tenantSchemaVersion,
        },
      });
      await input.queue.send(migrationEnvelope, { contentType: "json" });
      return;
    }

    await input.store.upsertDatabaseRegistry({
      id: createStableId({ prefix: "TDB" }),
      tenantId: tenant.tenantId,
      d1DatabaseName: database.name,
      d1DatabaseId: database.id,
      primaryLocationHint: input.config.primaryLocationHint,
      readReplicationMode: database.readReplicationMode,
      schemaVersion: input.config.tenantSchemaVersion,
      status: "seeded",
      now,
    });

    await markStep(input.store, tenant.tenantId, "defaults_seeding", now);
    maybeFail(input.config, "failed_seed");

    await markStep(input.store, tenant.tenantId, "worker_registering", now);
    maybeFail(input.config, "failed_worker_register");
    await input.store.upsertWorkerRegistry({
      id: createStableId({ prefix: "TWR" }),
      tenantId: tenant.tenantId,
      workerName: `tailoros-tenant-${tenant.slug}`,
      dispatchNamespace: input.config.dispatchNamespace,
      status: "registered",
      lastHealthStatus: null,
      lastHealthCheckedAt: null,
      now,
    });

    await markStep(input.store, tenant.tenantId, "health_checking", now);
    await input.store.upsertWorkerRegistry({
      id: createStableId({ prefix: "TWR" }),
      tenantId: tenant.tenantId,
      workerName: `tailoros-tenant-${tenant.slug}`,
      dispatchNamespace: input.config.dispatchNamespace,
      status: "healthy",
      lastHealthStatus: "ok",
      lastHealthCheckedAt: now,
      now,
    });

    await input.store.markProvisioningProgress({
      tenantId: tenant.tenantId,
      tenantStatus: "active",
      jobStatus: "succeeded",
      step: "active",
      now,
      lastError: null,
    });
    await input.store.recordAudit({
      id: createStableId({ prefix: "AUD" }),
      tenantId: tenant.tenantId,
      actorType: "queue",
      actorId: null,
      action: "tenant.provisioned",
      targetType: "tenant",
      targetId: tenant.tenantId,
      reasonCode: null,
      summary: "Tenant provisioning completed and tenant is active.",
      metadataJson: JSON.stringify({
        mode: input.config.mode,
        schemaVersion: input.config.tenantSchemaVersion,
      }),
      createdAt: now,
    });
  } catch (error) {
    const failure = mapProvisioningFailure(error);
    await failStep(input.store, {
      tenantId: tenant.tenantId,
      step: failure.step,
      tenantStatus: failure.step,
      message: failure.message,
      now,
    });
    throw error;
  }
}

export function isRecoverableProvisioningState(status: TenantStatus) {
  return (
    status === "failed_validation" ||
    status === "failed_db_create" ||
    status === "failed_migration" ||
    status === "failed_seed" ||
    status === "failed_worker_register" ||
    status === "needs_manual_review"
  );
}

export function readProvisioningRuntimeConfig(
  env: Env,
  overrides: Partial<ProvisioningRuntimeConfig> = {},
): ProvisioningRuntimeConfig {
  return {
    environment: env.ENVIRONMENT,
    mode: parseProvisioningMode(env.TENANT_PROVISIONING_MODE),
    cfAccountId: env.CF_ACCOUNT_ID,
    cfApiToken: env.CF_API_TOKEN,
    tenantSchemaVersion: Number.parseInt(env.TENANT_SCHEMA_VERSION, 10),
    primaryLocationHint: env.TENANT_DATABASE_PRIMARY_LOCATION,
    readReplicationMode: env.TENANT_DATABASE_READ_REPLICATION_MODE,
    dispatchNamespace: null,
    fetcher: fetch,
    ...overrides,
  };
}

function createTenantId() {
  return createStableId({ prefix: "TEN" })
    .toLowerCase()
    .replace("ten-", "ten_");
}

function createTenantCode(slug: string) {
  const prefix = slug
    .replace(/[^a-z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 8)
    .padEnd(3, "X");
  const suffix = createStableId({ prefix: "TEN" }).split("-").at(-1) ?? "000";

  return `${prefix}-${suffix.slice(0, 6)}`;
}

function toIso(date?: Date) {
  return (date ?? new Date()).toISOString();
}

async function markStep(
  store: ControlPlaneStore,
  tenantId: string,
  step: ProvisioningStep,
  now: string,
) {
  await store.markProvisioningProgress({
    tenantId,
    tenantStatus: step,
    jobStatus: "running",
    step,
    now,
    lastError: null,
  });
}

async function failStep(
  store: ControlPlaneStore,
  input: {
    tenantId: string;
    step: ProvisioningStep;
    tenantStatus: TenantStatus;
    message: string;
    now: string;
  },
) {
  const jobStatus =
    input.tenantStatus === "needs_manual_review"
      ? "needs_manual_review"
      : "failed";

  await store.markProvisioningProgress({
    tenantId: input.tenantId,
    tenantStatus: input.tenantStatus,
    jobStatus,
    step: input.step,
    now: input.now,
    lastError: input.message,
  });
  await store.recordAudit({
    id: createStableId({ prefix: "AUD" }),
    tenantId: input.tenantId,
    actorType: "queue",
    actorId: null,
    action: "tenant.provisioning_failed",
    targetType: "tenant",
    targetId: input.tenantId,
    reasonCode: input.step,
    summary: input.message,
    metadataJson: null,
    createdAt: input.now,
  });
}

function maybeFail(config: ProvisioningRuntimeConfig, step: ProvisioningStep) {
  if (config.failureStep === step) {
    throw new ProvisioningStepError(step, `Provisioning failed at ${step}.`);
  }
}

function mapProvisioningFailure(error: unknown): {
  step: ProvisioningStep;
  message: string;
} {
  if (error instanceof ProvisioningStepError) {
    return { step: error.step, message: error.message };
  }

  return {
    step: "needs_manual_review",
    message: stringifyError(error),
  };
}

function stringifyError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown provisioning error.";
}

function parseProvisioningMode(mode: string): ProvisioningMode {
  if (mode === "manual" || mode === "automated" || mode === "simulated") {
    return mode;
  }

  return "manual";
}

async function createTenantDatabase(input: {
  tenant: TenantProvisioningSummary;
  config: ProvisioningRuntimeConfig;
}): Promise<{
  id: string;
  name: string;
  readReplicationMode: string;
}> {
  const name = `tailoros_tenant_${input.tenant.slug}_${input.tenant.tenantId.replace("ten_", "").slice(0, 8)}`;

  if (input.config.mode === "simulated") {
    return {
      id: `local-d1-${input.tenant.tenantId}`,
      name,
      readReplicationMode: input.config.readReplicationMode,
    };
  }

  if (!input.config.cfAccountId || !input.config.cfApiToken) {
    throw new ProvisioningStepError(
      "failed_db_create",
      "Cloudflare D1 provisioning credentials are not configured.",
    );
  }

  const response = await input.config.fetcher(
    `https://api.cloudflare.com/client/v4/accounts/${input.config.cfAccountId}/d1/database`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.config.cfApiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        primary_location_hint: input.config.primaryLocationHint,
        read_replication: { mode: input.config.readReplicationMode },
      }),
    },
  );

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok || typeof body !== "object" || body === null) {
    throw new ProvisioningStepError(
      "failed_db_create",
      `Cloudflare D1 database creation failed with status ${response.status}.`,
    );
  }

  const result = "result" in body ? body.result : null;

  if (typeof result !== "object" || result === null) {
    throw new ProvisioningStepError(
      "failed_db_create",
      "Cloudflare D1 database creation returned an invalid response.",
    );
  }

  const id = readString(result, "uuid") ?? readString(result, "id");

  if (!id) {
    throw new ProvisioningStepError(
      "failed_db_create",
      "Cloudflare D1 database creation response did not include a database ID.",
    );
  }

  return {
    id,
    name: readString(result, "name") ?? name,
    readReplicationMode: input.config.readReplicationMode,
  };
}

function readString(value: object, key: string) {
  const record = value as Record<string, unknown>;

  if (!(key in record)) {
    return null;
  }

  const field = record[key];
  return typeof field === "string" ? field : null;
}
