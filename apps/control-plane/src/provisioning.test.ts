import { describe, expect, it } from "vitest";

import {
  tenantProvisioningSummarySchema,
  type ProvisioningJobStatus,
  type ProvisioningStep,
  type TenantPlan,
  type TenantProvisioningSummary,
  type TenantStatus,
} from "@tailoros/schemas";

import {
  createTenantSignup,
  processTenantProvisionEnvelope,
  retryTenantProvisioning,
  TenantSlugConflictError,
  type AuditLogInput,
  type ControlPlaneStore,
  type DatabaseRegistryInput,
  type ProvisioningRuntimeConfig,
  type QueueProducer,
  type SignupReservationInput,
  type WorkerRegistryInput,
} from "./provisioning";

const fixedNow = new Date("2026-07-05T10:00:00.000Z");

const request = {
  shopName: "Sri Raja Tailors",
  city: "Madurai",
  ownerName: "Raja Raman",
  ownerMobile: "+91 98765 43210",
  ownerEmail: "owner@sriraja.example",
  preferredSlug: "sri-raja-tailors",
  plan: "pilot" as TenantPlan,
  turnstileToken: "test_turnstile_valid_token",
};

describe("control-plane provisioning service", () => {
  it("creates one tenant and one queue message for repeated idempotency keys", async () => {
    const store = new InMemoryControlPlaneStore();
    const queue = new InMemoryQueueProducer();

    const first = await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });
    const second = await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });

    expect(first.reusedExistingRequest).toBe(false);
    expect(second.reusedExistingRequest).toBe(true);
    expect(second.tenantId).toBe(first.tenantId);
    expect(store.size).toBe(1);
    expect(queue.messages).toHaveLength(1);
  });

  it("records duplicate slug conflicts before creating another tenant", async () => {
    const store = new InMemoryControlPlaneStore();
    const queue = new InMemoryQueueProducer();

    await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });

    await expect(
      createTenantSignup({
        request: {
          ...request,
          ownerEmail: "second@sriraja.example",
        },
        idempotencyKey: "tenant:sri-raja:second-signup",
        store,
        queue,
        now: fixedNow,
      }),
    ).rejects.toBeInstanceOf(TenantSlugConflictError);
  });

  it("runs the simulated queue lifecycle to active with registry metadata", async () => {
    const store = new InMemoryControlPlaneStore();
    const queue = new InMemoryQueueProducer();
    const signup = await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });

    await processTenantProvisionEnvelope({
      envelopeBody: queue.messages[0],
      store,
      queue,
      config: createConfig({ tenantSchemaVersion: 3 }),
      now: fixedNow,
    });

    const summary = await store.findSummaryByTenantId(signup.tenantId);
    expect(summary?.status).toBe("active");
    expect(summary?.schemaVersion).toBe(3);
    expect(summary?.d1DatabaseId).toBe(`local-d1-${signup.tenantId}`);
    expect(summary?.workerStatus).toBe("healthy");
    expect(summary?.attempts).toBe(1);
  });

  it("records the failing provisioning step for recovery", async () => {
    const store = new InMemoryControlPlaneStore();
    const queue = new InMemoryQueueProducer();
    const signup = await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });

    await expect(
      processTenantProvisionEnvelope({
        envelopeBody: queue.messages[0],
        store,
        queue,
        config: createConfig({ failureStep: "failed_seed" }),
        now: fixedNow,
      }),
    ).rejects.toThrow("Provisioning failed at failed_seed");

    const summary = await store.findSummaryByTenantId(signup.tenantId);
    expect(summary?.status).toBe("failed_seed");
    expect(summary?.jobStatus).toBe("failed");
    expect(summary?.provisioningStep).toBe("failed_seed");
    expect(summary?.lastError).toContain("failed_seed");
  });

  it("requeues recoverable failed tenants without creating a duplicate tenant", async () => {
    const store = new InMemoryControlPlaneStore();
    const queue = new InMemoryQueueProducer();
    const signup = await createTenantSignup({
      request,
      idempotencyKey: "tenant:sri-raja:signup",
      store,
      queue,
      now: fixedNow,
    });

    await expect(
      processTenantProvisionEnvelope({
        envelopeBody: queue.messages[0],
        store,
        queue,
        config: createConfig({ failureStep: "failed_db_create" }),
        now: fixedNow,
      }),
    ).rejects.toThrow("failed_db_create");

    const retry = await retryTenantProvisioning({
      tenantId: signup.tenantId,
      store,
      queue,
      now: fixedNow,
    });

    const summary = await store.findSummaryByTenantId(signup.tenantId);
    expect(retry?.status).toBe("provisioning_pending");
    expect(summary?.status).toBe("provisioning_pending");
    expect(store.size).toBe(1);
    expect(queue.messages).toHaveLength(2);
  });
});

function createConfig(
  overrides: Partial<ProvisioningRuntimeConfig> = {},
): ProvisioningRuntimeConfig {
  const config: ProvisioningRuntimeConfig = {
    environment: "local",
    mode: "simulated",
    cfAccountId: "",
    cfApiToken: "",
    tenantSchemaVersion: 1,
    primaryLocationHint: "apac",
    readReplicationMode: "auto",
    dispatchNamespace: null,
    fetcher: async () => Response.json({ ok: true }),
  };

  return { ...config, ...overrides };
}

class InMemoryQueueProducer implements QueueProducer {
  readonly messages: unknown[] = [];

  async send(message: unknown): Promise<unknown> {
    this.messages.push(message);
    return { ok: true };
  }
}

class InMemoryControlPlaneStore implements ControlPlaneStore {
  private readonly summaries = new Map<string, TenantProvisioningSummary>();
  private readonly idempotency = new Map<string, string>();
  private readonly audits: AuditLogInput[] = [];

  get size() {
    return this.summaries.size;
  }

  async findSummaryByIdempotencyKey(idempotencyKey: string) {
    const tenantId = this.idempotency.get(idempotencyKey);
    return tenantId ? (this.summaries.get(tenantId) ?? null) : null;
  }

  async findSummaryByTenantId(tenantId: string) {
    return this.summaries.get(tenantId) ?? null;
  }

  async listSummaries(limit: number) {
    return [...this.summaries.values()].slice(0, limit);
  }

  async createSignupReservation(input: SignupReservationInput) {
    if ([...this.summaries.values()].some((item) => item.slug === input.slug)) {
      throw new TenantSlugConflictError(input.slug);
    }

    const summary = parseSummary({
      tenantId: input.tenantId,
      tenantCode: input.tenantCode,
      slug: input.slug,
      businessName: input.businessName,
      city: input.city,
      state: input.state,
      timezone: input.timezone,
      status: input.status,
      planCode: input.planCode,
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      ownerMobile: input.ownerMobile,
      jobId: input.jobId,
      jobStatus: input.jobStatus,
      provisioningStep: input.step,
      attempts: 0,
      lastError: null,
      idempotencyKey: input.idempotencyKey,
      d1DatabaseName: null,
      d1DatabaseId: null,
      primaryLocationHint: null,
      readReplicationMode: null,
      schemaVersion: null,
      workerName: null,
      workerStatus: null,
      createdAt: input.now,
      updatedAt: input.now,
    });

    this.summaries.set(input.tenantId, summary);
    this.idempotency.set(input.idempotencyKey, input.tenantId);
    return summary;
  }

  async recordProvisioningAttempt(input: { tenantId: string; now: string }) {
    const current = this.requireSummary(input.tenantId);
    this.summaries.set(
      input.tenantId,
      parseSummary({
        ...current,
        attempts: current.attempts + 1,
        jobStatus: "running",
        updatedAt: input.now,
      }),
    );
  }

  async markProvisioningProgress(input: {
    tenantId: string;
    tenantStatus: TenantStatus;
    jobStatus: ProvisioningJobStatus;
    step: ProvisioningStep;
    now: string;
    lastError: string | null;
  }) {
    const current = this.requireSummary(input.tenantId);
    this.summaries.set(
      input.tenantId,
      parseSummary({
        ...current,
        status: input.tenantStatus,
        jobStatus: input.jobStatus,
        provisioningStep: input.step,
        lastError: input.lastError,
        updatedAt: input.now,
      }),
    );
  }

  async upsertDatabaseRegistry(input: DatabaseRegistryInput) {
    const current = this.requireSummary(input.tenantId);
    this.summaries.set(
      input.tenantId,
      parseSummary({
        ...current,
        d1DatabaseName: input.d1DatabaseName,
        d1DatabaseId: input.d1DatabaseId,
        primaryLocationHint: input.primaryLocationHint,
        readReplicationMode: input.readReplicationMode,
        schemaVersion: input.schemaVersion,
        updatedAt: input.now,
      }),
    );
  }

  async upsertWorkerRegistry(input: WorkerRegistryInput) {
    const current = this.requireSummary(input.tenantId);
    this.summaries.set(
      input.tenantId,
      parseSummary({
        ...current,
        workerName: input.workerName,
        workerStatus: input.status,
        updatedAt: input.now,
      }),
    );
  }

  async recordAudit(input: AuditLogInput) {
    this.audits.push(input);
  }

  private requireSummary(tenantId: string) {
    const summary = this.summaries.get(tenantId);

    if (!summary) {
      throw new Error(`Tenant ${tenantId} was not found.`);
    }

    return summary;
  }
}

function parseSummary(input: unknown) {
  return tenantProvisioningSummarySchema.parse(input);
}
