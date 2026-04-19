import type Database from "better-sqlite3";
import type { AllergyRisk, BabyProfile } from "../../types/baby.js";

function rowToProfile(row: Record<string, unknown>): BabyProfile {
  return {
    baby_id: String(row.baby_id),
    nickname: String(row.nickname),
    dob: String(row.dob),
    weight_kg: row.weight_kg === null || row.weight_kg === undefined ? null : Number(row.weight_kg),
    teething_status: row.teething_status === null || row.teething_status === undefined ? null : String(row.teething_status),
    allergy_risk: row.allergy_risk as AllergyRisk,
    feeding_method: row.feeding_method === null || row.feeding_method === undefined ? null : String(row.feeding_method),
    active: Boolean(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function deactivateAllBabies(db: Database.Database): void {
  db.prepare(`UPDATE baby_profile SET active = 0, updated_at = datetime('now')`).run();
}

export function upsertBabyProfile(
  db: Database.Database,
  input: {
    baby_id: string;
    nickname: string;
    dob: string;
    weight_kg?: number | null;
    teething_status?: string | null;
    allergy_risk: AllergyRisk;
    feeding_method?: string | null;
    make_active: boolean;
  },
): BabyProfile {
  const now = new Date().toISOString();
  const existing = db.prepare(`SELECT baby_id FROM baby_profile WHERE baby_id = ?`).get(input.baby_id) as
    | { baby_id: string }
    | undefined;

  if (input.make_active) {
    deactivateAllBabies(db);
  }

  if (!existing) {
    db.prepare(
      `
      INSERT INTO baby_profile (
        baby_id, nickname, dob, weight_kg, teething_status, allergy_risk, feeding_method, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      input.baby_id,
      input.nickname,
      input.dob,
      input.weight_kg ?? null,
      input.teething_status ?? null,
      input.allergy_risk,
      input.feeding_method ?? null,
      input.make_active ? 1 : 0,
      now,
      now,
    );
  } else {
    db.prepare(
      `
      UPDATE baby_profile SET
        nickname = ?,
        dob = ?,
        weight_kg = ?,
        teething_status = ?,
        allergy_risk = ?,
        feeding_method = ?,
        updated_at = ?
      WHERE baby_id = ?
    `,
    ).run(
      input.nickname,
      input.dob,
      input.weight_kg ?? null,
      input.teething_status ?? null,
      input.allergy_risk,
      input.feeding_method ?? null,
      now,
      input.baby_id,
    );

    if (input.make_active) {
      db.prepare(`UPDATE baby_profile SET active = 1, updated_at = ? WHERE baby_id = ?`).run(now, input.baby_id);
    }
  }

  const row = db.prepare(`SELECT * FROM baby_profile WHERE baby_id = ?`).get(input.baby_id) as Record<string, unknown>;
  return rowToProfile(row);
}

export function getBabyProfile(db: Database.Database, babyId: string): BabyProfile | null {
  const row = db.prepare(`SELECT * FROM baby_profile WHERE baby_id = ?`).get(babyId) as Record<string, unknown> | undefined;
  return row ? rowToProfile(row) : null;
}

export function getActiveBaby(db: Database.Database): BabyProfile | null {
  const row = db.prepare(`SELECT * FROM baby_profile WHERE active = 1 ORDER BY updated_at DESC LIMIT 1`).get() as
    | Record<string, unknown>
    | undefined;
  return row ? rowToProfile(row) : null;
}
