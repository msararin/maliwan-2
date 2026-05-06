-- D1 schema draft placeholder for Maliwan 2.0.

CREATE TABLE IF NOT EXISTS households (
  household_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS household_members (
  member_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  UNIQUE (household_id, member_id)
);

CREATE TABLE IF NOT EXISTS line_identities (
  line_user_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  UNIQUE (line_user_id),
  FOREIGN KEY (household_id, member_id) REFERENCES household_members (household_id, member_id)
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  medication_schedule_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  time TEXT,
  note TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (household_id, member_id) REFERENCES household_members (household_id, member_id)
);

CREATE TABLE IF NOT EXISTS medication_logs (
  medication_log_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  line_user_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (household_id, member_id) REFERENCES household_members (household_id, member_id),
  FOREIGN KEY (line_user_id) REFERENCES line_identities (line_user_id)
);
