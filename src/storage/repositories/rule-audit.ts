import type Database from "better-sqlite3";

export type RuleAuditDecision = "allow" | "block" | "adjust";

export function insertRuleAuditEntries(
  db: Database.Database,
  entries: Array<{
    audit_id: string;
    plan_id: string;
    baby_id: string;
    rule_group: string;
    rule_key: string;
    decision: RuleAuditDecision;
    reason: string;
  }>,
): void {
  if (entries.length === 0) return;
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(
    `
    INSERT INTO rule_audit_log (audit_id, plan_id, baby_id, rule_group, rule_key, decision, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  );
  const tx = db.transaction(() => {
    for (const e of entries) {
      stmt.run(e.audit_id, e.plan_id, e.baby_id, e.rule_group, e.rule_key, e.decision, e.reason, createdAt);
    }
  });
  tx();
}
