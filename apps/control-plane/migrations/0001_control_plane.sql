PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  tenant_code TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'Tamil Nadu',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  status TEXT NOT NULL,
  plan_code TEXT NOT NULL DEFAULT 'pilot',
  owner_name TEXT,
  owner_mobile TEXT,
  owner_email TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_status_updated
  ON tenants(status, updated_at);

CREATE INDEX IF NOT EXISTS idx_tenants_plan_status
  ON tenants(plan_code, status);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_status
  ON memberships(user_id, status);

CREATE TABLE IF NOT EXISTS tenant_database_registry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  d1_database_name TEXT NOT NULL,
  d1_database_id TEXT,
  primary_location_hint TEXT,
  read_replication_mode TEXT NOT NULL DEFAULT 'disabled',
  schema_version INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tenant_id),
  UNIQUE(d1_database_name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_database_registry_status
  ON tenant_database_registry(status, updated_at);

CREATE TABLE IF NOT EXISTS tenant_worker_registry (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  dispatch_namespace TEXT,
  status TEXT NOT NULL,
  last_health_status TEXT,
  last_health_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(tenant_id),
  UNIQUE(worker_name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_worker_registry_status
  ON tenant_worker_registry(status, updated_at);

CREATE TABLE IF NOT EXISTS provisioning_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,
  step TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_tenant_status
  ON provisioning_jobs(tenant_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_provisioning_jobs_step
  ON provisioning_jobs(step, updated_at);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  reason_code TEXT,
  summary TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_tenant_created
  ON platform_audit_logs(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_platform_audit_logs_action_created
  ON platform_audit_logs(action, created_at);
