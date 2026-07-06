CREATE TABLE IF NOT EXISTS product_installations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled', 'suspended')),
  callback_url TEXT,
  allowed_event_types_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, product_code)
);

CREATE TABLE IF NOT EXISTS channel_accounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('meta', 'twilio', '360dialog', 'authkey', 'wati')),
  waba_id TEXT,
  phone_number_id TEXT NOT NULL,
  display_phone_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disabled', 'failed')),
  credential_status TEXT NOT NULL CHECK (credential_status IN ('pending', 'active', 'expired', 'rotating', 'disabled')),
  quality_rating TEXT,
  messaging_limit_tier TEXT,
  token_last_rotated_at TEXT,
  last_health_check_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (provider, phone_number_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_accounts_tenant
  ON channel_accounts(tenant_id, status);

CREATE TABLE IF NOT EXISTS credential_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel_account_id TEXT NOT NULL REFERENCES channel_accounts(id) ON DELETE CASCADE,
  access_token_secret_ref TEXT NOT NULL,
  app_secret_ref TEXT,
  verify_token_hash TEXT,
  token_last_rotated_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'rotating', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_mappings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel_account_id TEXT NOT NULL REFERENCES channel_accounts(id) ON DELETE CASCADE,
  template_purpose TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'ta')),
  provider_template_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utility', 'authentication', 'marketing', 'service')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paused', 'disabled')),
  variable_keys_json TEXT NOT NULL DEFAULT '[]',
  rejection_reason TEXT,
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, channel_account_id, template_purpose, language)
);

CREATE TABLE IF NOT EXISTS contact_consents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_method_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('opted_in', 'opted_out', 'unknown')),
  source TEXT NOT NULL,
  proof_note TEXT,
  captured_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, contact_method_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_consents_phone
  ON contact_consents(tenant_id, phone_e164);

CREATE TABLE IF NOT EXISTS message_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  contact_method_id TEXT NOT NULL,
  recipient_phone_e164 TEXT NOT NULL,
  template_purpose TEXT NOT NULL,
  language TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  channel_account_id TEXT,
  template_mapping_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'accepted', 'sent', 'delivered', 'read', 'failed', 'blocked')),
  blocked_reason TEXT,
  provider_message_id TEXT,
  failure_code TEXT,
  failure_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  requested_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_message_requests_tenant_status
  ON message_requests(tenant_id, status, requested_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_requests_provider
  ON message_requests(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS outbox_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  message_request_id TEXT NOT NULL REFERENCES message_requests(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processed', 'failed')),
  created_at TEXT NOT NULL,
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  provider_message_id TEXT,
  phone_number_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  raw_payload_json TEXT,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_message
  ON webhook_events(provider_message_id, received_at);

CREATE TABLE IF NOT EXISTS conversation_states (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  channel_account_id TEXT NOT NULL,
  wa_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  customer_reference TEXT,
  order_reference TEXT,
  service_window_expires_at TEXT,
  current_intent TEXT,
  assigned_staff_user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'handoff', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, channel_account_id, wa_id)
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  country_code TEXT NOT NULL,
  message_month TEXT NOT NULL,
  category TEXT NOT NULL,
  template_purpose TEXT,
  template_name TEXT,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  blocked_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost_minor INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_ledger_unique_bucket
  ON usage_ledger(
    tenant_id,
    product_code,
    provider,
    country_code,
    message_month,
    category,
    COALESCE(template_purpose, ''),
    COALESCE(template_name, '')
  );

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'support', 'product')),
  actor_id TEXT,
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT,
  reason TEXT,
  summary_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
