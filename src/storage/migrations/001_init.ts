export const MIGRATION_001_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS baby_profile (
  baby_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  dob TEXT NOT NULL,
  weight_kg REAL,
  teething_status TEXT,
  allergy_risk TEXT NOT NULL,
  feeding_method TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_baby_profile_active ON baby_profile(active);

CREATE TABLE IF NOT EXISTS food_status (
  baby_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  status TEXT NOT NULL,
  last_try_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (baby_id, food_id),
  FOREIGN KEY (baby_id) REFERENCES baby_profile(baby_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_food_status_baby_status ON food_status(baby_id, status);

CREATE TABLE IF NOT EXISTS food_trial (
  trial_id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  tried_at TEXT NOT NULL,
  first_time_flag INTEGER NOT NULL,
  reaction TEXT,
  severity TEXT NOT NULL,
  liked_score INTEGER,
  stool_note TEXT,
  gi_note TEXT,
  note TEXT,
  FOREIGN KEY (baby_id) REFERENCES baby_profile(baby_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_food_trial_baby_tried ON food_trial(baby_id, tried_at DESC);

CREATE TABLE IF NOT EXISTS meal_plan (
  plan_id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  source_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (baby_id) REFERENCES baby_profile(baby_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_baby_week ON meal_plan(baby_id, week_start);

CREATE TABLE IF NOT EXISTS meal_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  texture TEXT NOT NULL,
  is_new_food INTEGER NOT NULL,
  watch_points TEXT NOT NULL,
  instructions TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES meal_plan(plan_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meal_item_plan_date ON meal_item(plan_id, date);

CREATE TABLE IF NOT EXISTS shopping_list (
  list_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  items TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES meal_plan(plan_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integration_task (
  task_id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL,
  target TEXT NOT NULL,
  payload TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (baby_id) REFERENCES baby_profile(baby_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rule_audit_log (
  audit_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  baby_id TEXT NOT NULL,
  rule_group TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES meal_plan(plan_id) ON DELETE CASCADE,
  FOREIGN KEY (baby_id) REFERENCES baby_profile(baby_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rule_audit_plan_group ON rule_audit_log(plan_id, rule_group);
`.trim();
