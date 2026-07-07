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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  primary_mobile_e164 TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_status_updated
  ON users(status, updated_at);

CREATE TABLE IF NOT EXISTS staff_invites (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by_user_id TEXT NOT NULL,
  accepted_by_user_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_tenant_status
  ON staff_invites(tenant_id, status, expires_at);

CREATE TABLE IF NOT EXISTS staff_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_sessions_user_status
  ON staff_sessions(user_id, status, expires_at);

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

INSERT OR IGNORE INTO tenants (
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
) VALUES (
  'ten_sriraja000001',
  'MDU',
  'sri-raja-tailors',
  'Sri Raja Tailors',
  'Madurai',
  'Tamil Nadu',
  'Asia/Kolkata',
  'active',
  'pilot',
  'Raja Raman',
  '+919876543210',
  'owner@sriraja.example.com',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO tenant_database_registry (
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
) VALUES (
  'tdb_sriraja000001',
  'ten_sriraja000001',
  'tailoros_tenant_local',
  '00000000-0000-0000-0000-000000000002',
  'apac',
  'auto',
  1,
  'active',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO tenant_worker_registry (
  id,
  tenant_id,
  worker_name,
  dispatch_namespace,
  status,
  last_health_status,
  last_health_checked_at,
  created_at,
  updated_at
) VALUES (
  'twr_sriraja000001',
  'ten_sriraja000001',
  'tailoros-tenant-api-template',
  'local',
  'healthy',
  'ok',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO users (
  id,
  display_name,
  email,
  primary_mobile_e164,
  status,
  created_at,
  updated_at
) VALUES (
  'usr_owner_01',
  'Raja Raman',
  'owner@sriraja.example.com',
  '+919876543210',
  'active',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO memberships (
  id,
  tenant_id,
  user_id,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'mem_sriraja_owner_01',
  'ten_sriraja000001',
  'usr_owner_01',
  'owner',
  'active',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO staff_sessions (
  id,
  user_id,
  session_token_hash,
  status,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'ses_local_owner_01',
  'usr_owner_01',
  '2f907be88bb93fc4dd26d2c23eb8095c660fa40a3d8693adf870f09f494caa5d',
  'active',
  '2027-07-06T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z',
  '2026-07-05T00:00:00.000Z'
);
