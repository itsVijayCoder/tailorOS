PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tenant_schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_json TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_contacts (
  id TEXT PRIMARY KEY,
  primary_mobile_e164 TEXT NOT NULL,
  primary_mobile_national TEXT NOT NULL,
  whatsapp_mobile_e164 TEXT,
  whatsapp_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp_opt_in IN (0, 1)),
  address_json TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_mobile
  ON customer_contacts(primary_mobile_e164);

CREATE TABLE IF NOT EXISTS contact_phone_history (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES customer_contacts(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  phone_national TEXT NOT NULL,
  phone_kind TEXT NOT NULL CHECK (phone_kind IN ('primary', 'whatsapp', 'alternate')),
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_phone_history_phone
  ON contact_phone_history(phone_e164, valid_to);

CREATE INDEX IF NOT EXISTS idx_contact_phone_history_contact
  ON contact_phone_history(contact_id, valid_from);

CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  customer_code TEXT NOT NULL UNIQUE,
  contact_id TEXT NOT NULL REFERENCES customer_contacts(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  search_name TEXT NOT NULL,
  relation_label TEXT,
  gender_context TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_contact
  ON customer_profiles(contact_id, is_active);

CREATE INDEX IF NOT EXISTS idx_profiles_search_name
  ON customer_profiles(search_name);

CREATE TABLE IF NOT EXISTS garment_types (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  measurement_schema_json TEXT NOT NULL,
  default_expected_days INTEGER NOT NULL DEFAULT 7,
  default_price_paise INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_garment_types_active
  ON garment_types(is_active, display_name);

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  mobile_e164 TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'counter_staff', 'measurement_taker', 'tailor', 'cutter', 'cashier', 'viewer', 'platform_support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role_status
  ON staff_profiles(role, status);

CREATE TABLE IF NOT EXISTS tenant_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_by_user_id TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS measurement_profiles (
  id TEXT PRIMARY KEY,
  customer_profile_id TEXT NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  garment_type_code TEXT NOT NULL REFERENCES garment_types(code),
  display_name TEXT NOT NULL,
  current_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(customer_profile_id, garment_type_code, display_name)
);

CREATE INDEX IF NOT EXISTS idx_measurement_profiles_customer
  ON measurement_profiles(customer_profile_id, garment_type_code);

CREATE TABLE IF NOT EXISTS measurement_versions (
  id TEXT PRIMARY KEY,
  measurement_profile_id TEXT NOT NULL REFERENCES measurement_profiles(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL CHECK (version_no >= 1),
  values_json TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'inch' CHECK (unit IN ('inch', 'cm')),
  fit_notes TEXT,
  reason TEXT NOT NULL,
  captured_by_user_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  UNIQUE(measurement_profile_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_measurement_versions_profile
  ON measurement_versions(measurement_profile_id, version_no DESC);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size INTEGER CHECK (byte_size IS NULL OR byte_size >= 0),
  purpose TEXT NOT NULL,
  metadata_json TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner
  ON media_assets(owner_type, owner_id, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  contact_id TEXT NOT NULL REFERENCES customer_contacts(id),
  customer_profile_id TEXT NOT NULL REFERENCES customer_profiles(id),
  current_status TEXT NOT NULL,
  order_date TEXT NOT NULL,
  trial_date TEXT,
  promised_delivery_date TEXT,
  subtotal_paise INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_paise >= 0),
  discount_paise INTEGER NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
  final_total_paise INTEGER NOT NULL DEFAULT 0 CHECK (final_total_paise >= 0),
  balance_due_paise INTEGER NOT NULL DEFAULT 0 CHECK (balance_due_paise >= 0),
  notes TEXT,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_contact_status
  ON orders(contact_id, current_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_orders_customer_date
  ON orders(customer_profile_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_delivery
  ON orders(current_status, promised_delivery_date);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  garment_type_code TEXT NOT NULL REFERENCES garment_types(code),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  item_status TEXT NOT NULL,
  price_paise INTEGER NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
  assigned_staff_user_id TEXT,
  promised_delivery_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_id, item_status);

CREATE INDEX IF NOT EXISTS idx_order_items_status_due
  ON order_items(item_status, promised_delivery_date);

CREATE TABLE IF NOT EXISTS production_tasks (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  assigned_staff_user_id TEXT,
  task_status TEXT NOT NULL,
  due_date TEXT,
  delay_reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_production_tasks_staff_status
  ON production_tasks(assigned_staff_user_id, task_status, due_date);

CREATE TABLE IF NOT EXISTS alteration_logs (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  requested_change TEXT NOT NULL,
  trial_note TEXT,
  chargeable INTEGER NOT NULL DEFAULT 0 CHECK (chargeable IN (0, 1)),
  status TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alteration_logs_item
  ON alteration_logs(order_item_id, created_at);

CREATE TABLE IF NOT EXISTS order_measurement_snapshots (
  id TEXT PRIMARY KEY,
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  source_measurement_version_id TEXT REFERENCES measurement_versions(id),
  values_json TEXT NOT NULL,
  override_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_measurement_snapshots_item
  ON order_measurement_snapshots(order_item_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise <> 0),
  mode TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('advance', 'balance', 'refund', 'correction')),
  reference TEXT,
  reason TEXT,
  recorded_by_user_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payments(order_id, recorded_at);

CREATE INDEX IF NOT EXISTS idx_payments_kind_recorded
  ON payments(kind, recorded_at);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  receipt_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'partial', 'paid', 'void')),
  paid_paise INTEGER NOT NULL DEFAULT 0,
  balance_due_paise INTEGER NOT NULL DEFAULT 0 CHECK (balance_due_paise >= 0),
  share_token_hash TEXT,
  share_token_expires_at TEXT,
  issued_by_user_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  void_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_status_updated
  ON receipts(status, updated_at);

CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  customer_profile_id TEXT REFERENCES customer_profiles(id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES customer_contacts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  recipient_mobile_e164 TEXT,
  template_purpose TEXT,
  status TEXT NOT NULL,
  failure_reason TEXT,
  connector_message_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_order
  ON notification_logs(order_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notification_logs_contact
  ON notification_logs(contact_id, created_at);

CREATE TABLE IF NOT EXISTS wa_messages (
  id TEXT PRIMARY KEY,
  notification_log_id TEXT REFERENCES notification_logs(id) ON DELETE SET NULL,
  provider_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  normalized_status TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_messages_provider
  ON wa_messages(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS wa_webhook_events (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT,
  provider_message_id TEXT,
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  raw_payload_r2_key TEXT,
  payload_json TEXT,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_webhook_events_message
  ON wa_webhook_events(provider_message_id, received_at);

CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processed', 'failed')),
  created_at TEXT NOT NULL,
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_status_created
  ON outbox_events(status, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'support')),
  actor_user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT,
  before_json TEXT,
  after_json TEXT,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_created
  ON audit_logs(entity_type, entity_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs(action, created_at);

CREATE TABLE IF NOT EXISTS search_docs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  search_text TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_search_docs_entity
  ON search_docs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS search_projection (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  mobile_e164 TEXT,
  customer_code TEXT,
  order_code TEXT,
  receipt_code TEXT,
  status TEXT,
  delivery_date TEXT,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_search_projection_entity
  ON search_projection(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_search_projection_mobile
  ON search_projection(mobile_e164);

CREATE INDEX IF NOT EXISTS idx_search_projection_customer_code
  ON search_projection(customer_code);

CREATE INDEX IF NOT EXISTS idx_search_projection_order_code
  ON search_projection(order_code);

CREATE INDEX IF NOT EXISTS idx_search_projection_receipt_code
  ON search_projection(receipt_code);

CREATE INDEX IF NOT EXISTS idx_search_projection_status_date
  ON search_projection(status, delivery_date);

CREATE VIRTUAL TABLE IF NOT EXISTS search_docs_fts
  USING fts5(entity_id UNINDEXED, title, subtitle, search_text);

INSERT OR IGNORE INTO garment_types (
  code,
  display_name,
  measurement_schema_json,
  default_expected_days,
  default_price_paise,
  created_at,
  updated_at
) VALUES
  ('blouse', 'Blouse', '{"fields":["chest","waist","shoulder","sleeve","length"]}', 7, 150000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('petticoat', 'Petticoat', '{"fields":["waist","hip","length"]}', 5, 90000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('salwar_kurta', 'Salwar / Kurta', '{"fields":["chest","waist","hip","shoulder","sleeve","kurta_length","bottom_length"]}', 8, 180000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('shirt', 'Shirt', '{"fields":["chest","waist","shoulder","sleeve","length","collar"]}', 6, 140000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('pant', 'Pant', '{"fields":["waist","hip","inseam","outseam","thigh","bottom"]}', 6, 160000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('uniform', 'Uniform', '{"fields":["chest","waist","shoulder","sleeve","length"]}', 10, 220000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('sari_fall', 'Sari fall and pico', '{"fields":["length"]}', 2, 35000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('alteration', 'Alteration', '{"fields":["note"]}', 3, 50000, '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z');

INSERT OR IGNORE INTO staff_profiles (
  user_id,
  display_name,
  email,
  mobile_e164,
  role,
  status,
  created_at,
  updated_at
) VALUES
  ('usr_owner_01', 'Raja Raman', 'owner@sriraja.example.com', '+919876543210', 'owner', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('usr_manager_01', 'Lakshmi Raja', 'manager@sriraja.example.com', '+919876543211', 'manager', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('usr_counter_01', 'Counter Staff', 'counter@sriraja.example.com', '+919876543212', 'counter_staff', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('usr_measure_01', 'Measurement Staff', 'measure@sriraja.example.com', '+919876543213', 'measurement_taker', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('usr_tailor_01', 'Tailor One', 'tailor@sriraja.example.com', '+919876543214', 'tailor', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z'),
  ('usr_cashier_01', 'Cashier One', 'cashier@sriraja.example.com', '+919876543215', 'cashier', 'active', '2026-07-05T00:00:00.000Z', '2026-07-05T00:00:00.000Z');

INSERT OR IGNORE INTO tenant_settings (
  key,
  value_json,
  updated_by_user_id,
  updated_at
) VALUES (
  'receipt_branding',
  '{"shopName":"Sri Raja Tailors","city":"Madurai","footerNote":"Thank you. Please bring this receipt for pickup."}',
  'usr_owner_01',
  '2026-07-05T00:00:00.000Z'
);

INSERT OR IGNORE INTO tenant_schema_migrations (
  version,
  name,
  applied_at
) VALUES (
  1,
  'tenant_domain_model',
  '2026-07-05T00:00:00.000Z'
);
