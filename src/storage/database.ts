import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { MIGRATION_001_SQL } from "./migrations/001_init.js";

function defaultDbPath(): string {
  const fromEnv = process.env.BABY_FEEDING_DB_PATH;
  if (fromEnv && fromEnv.trim()) return path.resolve(fromEnv.trim());
  return path.resolve(process.cwd(), "data", "baby-feeding.sqlite");
}

export type OpenDatabaseOptions = {
  dbPath?: string;
};

export function openDatabase(options: OpenDatabaseOptions = {}): Database.Database {
  const dbPath = options.dbPath ?? defaultDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function runMigrations(db: Database.Database): void {
  db.exec(MIGRATION_001_SQL);
}

export function openAndMigrate(options: OpenDatabaseOptions = {}): Database.Database {
  const db = openDatabase(options);
  runMigrations(db);
  return db;
}
