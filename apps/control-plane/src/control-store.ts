import {
  tenantProvisioningSummarySchema,
  type TenantProvisioningSummary,
} from "@tailoros/schemas";

import {
  TenantSlugConflictError,
  type AuditLogInput,
  type ControlPlaneStore,
  type DatabaseRegistryInput,
  type OwnerAccessInput,
  type OwnerAccessRecord,
  type SignupReservationInput,
  type WorkerRegistryInput,
} from "./provisioning";

type SummaryRow = {
  tenantId: string;
  tenantCode: string;
  slug: string;
  businessName: string;
  city: string | null;
  state: string | null;
  timezone: string;
  status: string;
  planCode: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerMobile: string | null;
  jobId: string | null;
  jobStatus: string | null;
  provisioningStep: string | null;
  attempts: number | null;
  lastError: string | null;
  idempotencyKey: string | null;
  d1DatabaseName: string | null;
  d1DatabaseId: string | null;
  primaryLocationHint: string | null;
  readReplicationMode: string | null;
  schemaVersion: number | null;
  workerName: string | null;
  workerStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthIdentityRow = {
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  tenantStatus: string;
  userId: string;
  displayName: string;
  email: string;
  userStatus: string;
  passwordHash: string | null;
  membershipId: string;
  membershipStatus: string;
  role: string;
};

export type SetupTokenIdentityRow = AuthIdentityRow & {
  sessionId: string;
  sessionStatus: string;
  sessionExpiresAt: string;
};

export type PasswordResetIdentityRow = AuthIdentityRow & {
  resetId: string;
  resetStatus: string;
  resetExpiresAt: string;
};

const summarySelect = `
SELECT
  t.id AS tenantId,
  t.tenant_code AS tenantCode,
  t.slug AS slug,
  t.business_name AS businessName,
  t.city AS city,
  t.state AS state,
  t.timezone AS timezone,
  t.status AS status,
  t.plan_code AS planCode,
  t.owner_name AS ownerName,
  t.owner_email AS ownerEmail,
  t.owner_mobile AS ownerMobile,
  j.id AS jobId,
  j.status AS jobStatus,
  j.step AS provisioningStep,
  j.attempts AS attempts,
  j.last_error AS lastError,
  j.idempotency_key AS idempotencyKey,
  d.d1_database_name AS d1DatabaseName,
  d.d1_database_id AS d1DatabaseId,
  d.primary_location_hint AS primaryLocationHint,
  d.read_replication_mode AS readReplicationMode,
  d.schema_version AS schemaVersion,
  w.worker_name AS workerName,
  w.status AS workerStatus,
  t.created_at AS createdAt,
  t.updated_at AS updatedAt
FROM tenants t
LEFT JOIN provisioning_jobs j
  ON j.tenant_id = t.id AND j.job_type = 'tenant.provision'
LEFT JOIN tenant_database_registry d
  ON d.tenant_id = t.id
LEFT JOIN tenant_worker_registry w
  ON w.tenant_id = t.id
`;

export class D1ControlPlaneStore implements ControlPlaneStore {
  constructor(private readonly db: D1Database) {}

  async findSummaryByIdempotencyKey(idempotencyKey: string) {
    const row = await this.db
      .prepare(
        `${summarySelect}
WHERE j.idempotency_key = ?
LIMIT 1`,
      )
      .bind(idempotencyKey)
      .first<SummaryRow>();

    return row ? parseSummaryRow(row) : null;
  }

  async findSummaryByTenantId(tenantId: string) {
    const row = await this.db
      .prepare(
        `${summarySelect}
WHERE t.id = ?
LIMIT 1`,
      )
      .bind(tenantId)
      .first<SummaryRow>();

    return row ? parseSummaryRow(row) : null;
  }

  async listSummaries(limit: number) {
    const result = await this.db
      .prepare(
        `${summarySelect}
ORDER BY t.created_at DESC
LIMIT ?`,
      )
      .bind(limit)
      .all<SummaryRow>();

    return result.results.map((row) => parseSummaryRow(row));
  }

  async findAuthIdentityBySlugAndEmail(input: { slug: string; email: string }) {
    return this.db
      .prepare(
        `SELECT
          t.id AS tenantId,
          t.slug AS tenantSlug,
          t.business_name AS businessName,
          t.status AS tenantStatus,
          u.id AS userId,
          u.display_name AS displayName,
          u.email AS email,
          u.status AS userStatus,
          u.password_hash AS passwordHash,
          m.id AS membershipId,
          m.status AS membershipStatus,
          m.role AS role
        FROM tenants t
        INNER JOIN memberships m ON m.tenant_id = t.id
        INNER JOIN users u ON u.id = m.user_id
        WHERE t.slug = ?
          AND lower(u.email) = lower(?)
        LIMIT 1`,
      )
      .bind(input.slug, input.email)
      .first<AuthIdentityRow>();
  }

  async findAuthIdentityBySetupToken(input: {
    slug: string;
    email: string;
    tokenHash: string;
  }) {
    return this.db
      .prepare(
        `SELECT
          t.id AS tenantId,
          t.slug AS tenantSlug,
          t.business_name AS businessName,
          t.status AS tenantStatus,
          u.id AS userId,
          u.display_name AS displayName,
          u.email AS email,
          u.status AS userStatus,
          u.password_hash AS passwordHash,
          m.id AS membershipId,
          m.status AS membershipStatus,
          m.role AS role,
          s.id AS sessionId,
          s.status AS sessionStatus,
          s.expires_at AS sessionExpiresAt
        FROM staff_sessions s
        INNER JOIN users u ON u.id = s.user_id
        INNER JOIN memberships m ON m.user_id = u.id
        INNER JOIN tenants t ON t.id = m.tenant_id
        WHERE t.slug = ?
          AND lower(u.email) = lower(?)
          AND s.session_token_hash = ?
        LIMIT 1`,
      )
      .bind(input.slug, input.email, input.tokenHash)
      .first<SetupTokenIdentityRow>();
  }

  async createStaffSession(input: {
    sessionId: string;
    userId: string;
    sessionTokenHash: string;
    expiresAt: string;
    now: string;
  }) {
    await this.db
      .prepare(
        `INSERT INTO staff_sessions (
          id,
          user_id,
          session_token_hash,
          status,
          expires_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
      )
      .bind(
        input.sessionId,
        input.userId,
        input.sessionTokenHash,
        input.expiresAt,
        input.now,
        input.now,
      )
      .run();
  }

  async setUserPassword(input: {
    userId: string;
    passwordHash: string;
    now: string;
  }) {
    await this.db
      .prepare(
        `UPDATE users
        SET password_hash = ?,
            password_updated_at = ?,
            updated_at = ?
        WHERE id = ?`,
      )
      .bind(input.passwordHash, input.now, input.now, input.userId)
      .run();
  }

  async revokeStaffSession(input: { sessionId: string; now: string }) {
    await this.db
      .prepare(
        `UPDATE staff_sessions
        SET status = 'revoked',
            updated_at = ?
        WHERE id = ?`,
      )
      .bind(input.now, input.sessionId)
      .run();
  }

  async createPasswordResetToken(input: {
    id: string;
    userId: string;
    tenantId: string;
    tokenHash: string;
    expiresAt: string;
    now: string;
  }) {
    await this.db
      .prepare(
        `INSERT INTO password_reset_tokens (
          id,
          user_id,
          tenant_id,
          token_hash,
          status,
          expires_at,
          created_at,
          used_at
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, NULL)`,
      )
      .bind(
        input.id,
        input.userId,
        input.tenantId,
        input.tokenHash,
        input.expiresAt,
        input.now,
      )
      .run();
  }

  async findPasswordResetIdentityByTokenHash(tokenHash: string) {
    return this.db
      .prepare(
        `SELECT
          t.id AS tenantId,
          t.slug AS tenantSlug,
          t.business_name AS businessName,
          t.status AS tenantStatus,
          u.id AS userId,
          u.display_name AS displayName,
          u.email AS email,
          u.status AS userStatus,
          u.password_hash AS passwordHash,
          m.id AS membershipId,
          m.status AS membershipStatus,
          m.role AS role,
          p.id AS resetId,
          p.status AS resetStatus,
          p.expires_at AS resetExpiresAt
        FROM password_reset_tokens p
        INNER JOIN users u ON u.id = p.user_id
        INNER JOIN tenants t ON t.id = p.tenant_id
        INNER JOIN memberships m ON m.user_id = u.id AND m.tenant_id = t.id
        WHERE p.token_hash = ?
        LIMIT 1`,
      )
      .bind(tokenHash)
      .first<PasswordResetIdentityRow>();
  }

  async markPasswordResetTokenUsed(input: { resetId: string; now: string }) {
    await this.db
      .prepare(
        `UPDATE password_reset_tokens
        SET status = 'used',
            used_at = ?
        WHERE id = ?`,
      )
      .bind(input.now, input.resetId)
      .run();
  }

  async createSignupReservation(input: SignupReservationInput) {
    try {
      await this.db.batch([
        this.db
          .prepare(
            `INSERT INTO tenants (
              id,
              tenant_code,
              slug,
              business_name,
              city,
              state,
              timezone,
              status,
              plan_code,
              owner_name,
              owner_mobile,
              owner_email,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            input.tenantId,
            input.tenantCode,
            input.slug,
            input.businessName,
            input.city,
            input.state,
            input.timezone,
            input.status,
            input.planCode,
            input.ownerName,
            input.ownerMobile,
            input.ownerEmail,
            input.now,
            input.now,
          ),
        this.db
          .prepare(
            `INSERT INTO provisioning_jobs (
              id,
              tenant_id,
              job_type,
              status,
              step,
              attempts,
              last_error,
              idempotency_key,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)`,
          )
          .bind(
            input.jobId,
            input.tenantId,
            input.jobType,
            input.jobStatus,
            input.step,
            input.idempotencyKey,
            input.now,
            input.now,
          ),
        this.db
          .prepare(
            `INSERT INTO platform_audit_logs (
              id,
              tenant_id,
              actor_type,
              actor_id,
              action,
              target_type,
              target_id,
              reason_code,
              summary,
              metadata_json,
              created_at
            ) VALUES (?, ?, 'system', NULL, 'tenant.signup_requested', 'tenant', ?, NULL, ?, ?, ?)`,
          )
          .bind(
            `AUD-${input.jobId}`,
            input.tenantId,
            input.tenantId,
            "Tenant signup accepted and provisioning job queued.",
            JSON.stringify({
              slug: input.slug,
              planCode: input.planCode,
            }),
            input.now,
          ),
      ]);
    } catch (error) {
      const existing = await this.findSummaryByIdempotencyKey(
        input.idempotencyKey,
      );

      if (existing) {
        return existing;
      }

      if (isUniqueConstraintError(error)) {
        throw new TenantSlugConflictError(input.slug);
      }

      throw error;
    }

    const created = await this.findSummaryByTenantId(input.tenantId);

    if (!created) {
      throw new Error("Tenant reservation was not readable after insert.");
    }

    return created;
  }

  async createOwnerAccess(input: OwnerAccessInput) {
    const existingUser = await this.db
      .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .bind(input.email)
      .first<{ id: string }>();
    const userId = existingUser?.id ?? input.userId;

    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO users (
            id,
            display_name,
            email,
            primary_mobile_e164,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, 'active', ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            display_name = excluded.display_name,
            primary_mobile_e164 = excluded.primary_mobile_e164,
            status = 'active',
            updated_at = excluded.updated_at`,
        )
        .bind(
          userId,
          input.displayName,
          input.email,
          input.mobileE164,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO memberships (
            id,
            tenant_id,
            user_id,
            role,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, 'owner', 'active', ?, ?)
          ON CONFLICT(tenant_id, user_id) DO UPDATE SET
            role = 'owner',
            status = 'active',
            updated_at = excluded.updated_at`,
        )
        .bind(input.membershipId, input.tenantId, userId, input.now, input.now),
      this.db
        .prepare(
          `INSERT INTO staff_sessions (
            id,
            user_id,
            session_token_hash,
            status,
            expires_at,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        )
        .bind(
          input.sessionId,
          userId,
          input.sessionTokenHash,
          input.sessionExpiresAt,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO platform_audit_logs (
            id,
            tenant_id,
            actor_type,
            actor_id,
            action,
            target_type,
            target_id,
            reason_code,
            summary,
            metadata_json,
            created_at
          ) VALUES (?, ?, 'platform_admin', NULL, 'tenant.owner_access_created', 'user', ?, 'super_admin_onboarding', ?, ?, ?)`,
        )
        .bind(
          `AUD-${input.sessionId}`,
          input.tenantId,
          userId,
          "Owner access setup token issued by platform admin.",
          JSON.stringify({ membershipId: input.membershipId }),
          input.now,
        ),
    ]);

    return {
      email: input.email,
      expiresAt: input.sessionExpiresAt,
      membershipId: input.membershipId,
      role: "owner",
      sessionId: input.sessionId,
      userId,
    } satisfies OwnerAccessRecord;
  }

  async recordProvisioningAttempt(input: { tenantId: string; now: string }) {
    await this.db
      .prepare(
        `UPDATE provisioning_jobs
SET attempts = attempts + 1,
    status = 'running',
    updated_at = ?
WHERE tenant_id = ? AND job_type = 'tenant.provision'`,
      )
      .bind(input.now, input.tenantId)
      .run();
  }

  async markProvisioningProgress(input: {
    tenantId: string;
    tenantStatus: string;
    jobStatus: string;
    step: string;
    now: string;
    lastError: string | null;
  }) {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE tenants
SET status = ?,
    updated_at = ?
WHERE id = ?`,
        )
        .bind(input.tenantStatus, input.now, input.tenantId),
      this.db
        .prepare(
          `UPDATE provisioning_jobs
SET status = ?,
    step = ?,
    last_error = ?,
    updated_at = ?
WHERE tenant_id = ? AND job_type = 'tenant.provision'`,
        )
        .bind(
          input.jobStatus,
          input.step,
          input.lastError,
          input.now,
          input.tenantId,
        ),
    ]);
  }

  async upsertDatabaseRegistry(input: DatabaseRegistryInput) {
    await this.db
      .prepare(
        `INSERT INTO tenant_database_registry (
          id,
          tenant_id,
          d1_database_name,
          d1_database_id,
          primary_location_hint,
          read_replication_mode,
          schema_version,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(tenant_id) DO UPDATE SET
  d1_database_name = excluded.d1_database_name,
  d1_database_id = excluded.d1_database_id,
  primary_location_hint = excluded.primary_location_hint,
  read_replication_mode = excluded.read_replication_mode,
  schema_version = excluded.schema_version,
  status = excluded.status,
  updated_at = excluded.updated_at`,
      )
      .bind(
        input.id,
        input.tenantId,
        input.d1DatabaseName,
        input.d1DatabaseId,
        input.primaryLocationHint,
        input.readReplicationMode,
        input.schemaVersion,
        input.status,
        input.now,
        input.now,
      )
      .run();
  }

  async upsertWorkerRegistry(input: WorkerRegistryInput) {
    await this.db
      .prepare(
        `INSERT INTO tenant_worker_registry (
          id,
          tenant_id,
          worker_name,
          dispatch_namespace,
          status,
          last_health_status,
          last_health_checked_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(tenant_id) DO UPDATE SET
  worker_name = excluded.worker_name,
  dispatch_namespace = excluded.dispatch_namespace,
  status = excluded.status,
  last_health_status = excluded.last_health_status,
  last_health_checked_at = excluded.last_health_checked_at,
  updated_at = excluded.updated_at`,
      )
      .bind(
        input.id,
        input.tenantId,
        input.workerName,
        input.dispatchNamespace,
        input.status,
        input.lastHealthStatus,
        input.lastHealthCheckedAt,
        input.now,
        input.now,
      )
      .run();
  }

  async recordAudit(input: AuditLogInput) {
    await this.db
      .prepare(
        `INSERT INTO platform_audit_logs (
          id,
          tenant_id,
          actor_type,
          actor_id,
          action,
          target_type,
          target_id,
          reason_code,
          summary,
          metadata_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.tenantId,
        input.actorType,
        input.actorId,
        input.action,
        input.targetType,
        input.targetId,
        input.reasonCode,
        input.summary,
        input.metadataJson,
        input.createdAt,
      )
      .run();
  }
}

function parseSummaryRow(row: SummaryRow): TenantProvisioningSummary {
  return tenantProvisioningSummarySchema.parse({
    ...row,
    attempts: row.attempts ?? 0,
  });
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Error && error.message.toLowerCase().includes("unique")
  );
}
