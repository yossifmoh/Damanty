-- Damanty PWA Production Schema (Neon Serverless PostgreSQL)

CREATE TABLE IF NOT EXISTS vault_devices (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  brand TEXT NOT NULL,
  brand_ar TEXT,
  category TEXT,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  model TEXT,
  serial TEXT NOT NULL,
  purchase_date TEXT,
  expiry_date TEXT,
  remaining_pct INTEGER DEFAULT 100,
  days_left INTEGER DEFAULT 1095,
  warranty_years INTEGER DEFAULT 3,
  hotline TEXT,
  authorized_group_en TEXT,
  authorized_group_ar TEXT,
  retailer_en TEXT,
  retailer_ar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_devices_user ON vault_devices(user_key);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES vault_devices(id) ON DELETE CASCADE,
  user_key TEXT NOT NULL,
  log_date TEXT,
  title_en TEXT,
  title_ar TEXT,
  part_en TEXT,
  part_ar TEXT,
  cost_egp INTEGER DEFAULT 0,
  covered_by_warranty BOOLEAN DEFAULT FALSE,
  tech_center_en TEXT,
  tech_center_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_device ON maintenance_logs(device_id);

CREATE TABLE IF NOT EXISTS receipt_proofs (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES vault_devices(id) ON DELETE CASCADE,
  user_key TEXT NOT NULL,
  title TEXT,
  doc_type TEXT,
  sha256 TEXT NOT NULL,
  captured_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_device ON receipt_proofs(device_id);
