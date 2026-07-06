import { tenantSlugSchema, type TenantStatus } from "@tailoros/schemas";

export type ResolvedTenantDispatch = {
  tenantId: string;
  tenantCode: string;
  slug: string;
  status: TenantStatus;
  workerName: string | null;
  workerStatus: string | null;
};

type TenantDispatchRow = {
  tenantId: string;
  tenantCode: string;
  slug: string;
  status: TenantStatus;
  workerName: string | null;
  workerStatus: string | null;
};

export async function resolveTenantForDispatch(input: {
  db: D1Database;
  slug: string;
}): Promise<ResolvedTenantDispatch | null> {
  const parsed = tenantSlugSchema.safeParse(input.slug);

  if (!parsed.success) {
    return null;
  }

  const row = await input.db
    .prepare(
      `SELECT
        t.id AS tenantId,
        t.tenant_code AS tenantCode,
        t.slug AS slug,
        t.status AS status,
        w.worker_name AS workerName,
        w.status AS workerStatus
      FROM tenants t
      LEFT JOIN tenant_worker_registry w ON w.tenant_id = t.id
      WHERE t.slug = ?
      LIMIT 1`,
    )
    .bind(parsed.data)
    .first<TenantDispatchRow>();

  return row ?? null;
}

export function canDispatchTenant(tenant: ResolvedTenantDispatch) {
  return (
    tenant.status === "active" &&
    tenant.workerName !== null &&
    tenant.workerStatus === "healthy"
  );
}
