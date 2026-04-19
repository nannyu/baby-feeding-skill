import type Database from "better-sqlite3";
import type { DataBundle } from "./config/load-data.js";
import { loadDataBundle } from "./config/load-data.js";
import { openAndMigrate, type OpenDatabaseOptions } from "./storage/database.js";

export type BabyFeedingRuntime = {
  db: Database.Database;
  data: DataBundle;
};

export function createRuntime(options: OpenDatabaseOptions = {}): BabyFeedingRuntime {
  const db = openAndMigrate(options);
  const data = loadDataBundle(import.meta.url);
  return { db, data };
}
