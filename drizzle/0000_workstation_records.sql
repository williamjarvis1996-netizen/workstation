CREATE TABLE workstation_records (
  user_id TEXT NOT NULL,
  bucket TEXT NOT NULL,
  record_key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, bucket, record_key)
);
