import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { ContentFactoryError } from "../errors.ts";
import type { WorkspaceStore } from "../workspace/store.ts";
import type { WorkflowEvent, WorkflowEventType } from "./events.ts";

export type WorkflowRunStatus = "pending" | "running" | "succeeded" | "cancelled";
export type WorkflowStepStatus = "pending" | "running" | "succeeded";

export type WorkflowStepSpec = {
  stageId: string;
  inputHash: string;
};

export type WorkflowStep = WorkflowStepSpec & {
  runId: string;
  ordinal: number;
  status: WorkflowStepStatus;
  outputSha256: string | null;
  evidenceRefs: string[];
  externalCalls: number;
};

export type WorkflowRun = {
  runId: string;
  status: WorkflowRunStatus;
  createdAt: string;
  externalCalls: number;
};

export class WorkflowRunner {
  #store: WorkspaceStore;
  #db: DatabaseSync;
  #closed = false;

  constructor(store: WorkspaceStore) {
    this.#store = store;
    this.#db = new DatabaseSync(path.join(store.stateDir, "workspace.db"));
    this.#db.exec("PRAGMA foreign_keys = ON");
  }

  createRun(input: { runId: string; steps: WorkflowStepSpec[] }): WorkflowRun {
    if (!input.runId || input.steps.length === 0) {
      throw new ContentFactoryError({
        code: "WORKFLOW_INVALID",
        message: "workflow run requires an id and at least one step",
        retryable: false
      });
    }
    const stageIds = new Set(input.steps.map(step => step.stageId));
    if (stageIds.size !== input.steps.length) {
      throw new ContentFactoryError({
        code: "WORKFLOW_DUPLICATE_STAGE",
        message: "workflow stage ids must be unique",
        retryable: false
      });
    }

    const now = new Date().toISOString();
    this.#transaction(() => {
      this.#db.prepare(`
        INSERT INTO workflow_runs (run_id, status, created_at)
        VALUES (?, 'pending', ?)
      `).run(input.runId, now);
      const insert = this.#db.prepare(`
        INSERT INTO workflow_steps
          (run_id, stage_id, ordinal, status, input_hash, evidence_json, external_calls)
        VALUES (?, ?, ?, 'pending', ?, '[]', 0)
      `);
      input.steps.forEach((step, index) => {
        insert.run(input.runId, step.stageId, index, step.inputHash);
      });
      this.#appendEvent(input.runId, "run.created", null, { stepCount: input.steps.length });
    });
    return this.getRun(input.runId)!;
  }

  next(runId: string): WorkflowStep | null {
    const run = this.getRun(runId);
    if (!run || run.status === "cancelled" || run.status === "succeeded") return null;

    const existing = this.#rowToStep(this.#db.prepare(`
      SELECT * FROM workflow_steps
      WHERE run_id = ? AND status = 'running'
      ORDER BY ordinal LIMIT 1
    `).get(runId));
    if (existing) return existing;

    let selected: WorkflowStep | null = null;
    this.#transaction(() => {
      const row = this.#db.prepare(`
        SELECT * FROM workflow_steps
        WHERE run_id = ? AND status = 'pending'
        ORDER BY ordinal LIMIT 1
      `).get(runId);
      const pending = this.#rowToStep(row);
      if (!pending) return;
      this.#db.prepare(`
        UPDATE workflow_steps SET status = 'running'
        WHERE run_id = ? AND stage_id = ? AND status = 'pending'
      `).run(runId, pending.stageId);
      this.#db.prepare(`
        UPDATE workflow_runs SET status = 'running'
        WHERE run_id = ? AND status = 'pending'
      `).run(runId);
      this.#appendEvent(runId, "step.started", pending.stageId, {
        inputHash: pending.inputHash
      });
      selected = { ...pending, status: "running" };
    });
    return selected;
  }

  submit(
    runId: string,
    stageId: string,
    input: { outputSha256: string; evidenceRefs: string[]; externalCalls: number }
  ): { status: "succeeded" | "ignored_cancelled" } {
    const run = this.getRun(runId);
    if (!run) {
      throw new ContentFactoryError({
        code: "WORKFLOW_RUN_NOT_FOUND",
        message: "workflow run does not exist",
        retryable: false
      });
    }
    if (run.status === "cancelled") {
      this.#transaction(() => {
        this.#appendEvent(runId, "step.late_ignored", stageId, {
          outputSha256: input.outputSha256
        });
      });
      return { status: "ignored_cancelled" };
    }
    if (!this.#store.getObjectRecord(input.outputSha256)) {
      throw new ContentFactoryError({
        code: "WORKFLOW_OUTPUT_MISSING",
        message: "workflow output must exist in the immutable object store",
        retryable: false,
        details: { outputSha256: input.outputSha256 }
      });
    }

    this.#transaction(() => {
      const step = this.getStep(runId, stageId);
      if (!step || step.status !== "running") {
        throw new ContentFactoryError({
          code: "WORKFLOW_STEP_NOT_RUNNING",
          message: "only a running step can accept output",
          retryable: false
        });
      }
      this.#db.prepare(`
        UPDATE workflow_steps
        SET status = 'succeeded', output_sha256 = ?, evidence_json = ?, external_calls = ?
        WHERE run_id = ? AND stage_id = ?
      `).run(
        input.outputSha256,
        JSON.stringify(input.evidenceRefs),
        input.externalCalls,
        runId,
        stageId
      );
      this.#appendEvent(runId, "step.succeeded", stageId, {
        outputSha256: input.outputSha256,
        evidenceRefs: input.evidenceRefs,
        externalCalls: input.externalCalls
      });

      const remaining = this.#db.prepare(`
        SELECT COUNT(*) AS count FROM workflow_steps
        WHERE run_id = ? AND status != 'succeeded'
      `).get(runId) as { count: number };
      if (Number(remaining.count) === 0) {
        this.#db.prepare("UPDATE workflow_runs SET status = 'succeeded' WHERE run_id = ?")
          .run(runId);
        this.#appendEvent(runId, "run.succeeded", null, {});
      }
    });
    return { status: "succeeded" };
  }

  cancel(runId: string, reason: string): void {
    const run = this.getRun(runId);
    if (!run || run.status === "cancelled" || run.status === "succeeded") return;
    this.#transaction(() => {
      const now = new Date().toISOString();
      this.#db.prepare(`
        UPDATE workflow_runs
        SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?
        WHERE run_id = ?
      `).run(now, reason, runId);
      this.#appendEvent(runId, "run.cancelled", null, { reason });
    });
  }

  getRun(runId: string): WorkflowRun | null {
    const row = this.#db.prepare(`
      SELECT r.run_id, r.status, r.created_at,
             COALESCE(SUM(s.external_calls), 0) AS external_calls
      FROM workflow_runs r
      LEFT JOIN workflow_steps s ON s.run_id = r.run_id
      WHERE r.run_id = ?
      GROUP BY r.run_id, r.status, r.created_at
    `).get(runId) as {
      run_id: string; status: WorkflowRunStatus; created_at: string; external_calls: number;
    } | undefined;
    return row ? {
      runId: row.run_id,
      status: row.status,
      createdAt: row.created_at,
      externalCalls: Number(row.external_calls)
    } : null;
  }

  getStep(runId: string, stageId: string): WorkflowStep | null {
    return this.#rowToStep(this.#db.prepare(`
      SELECT * FROM workflow_steps WHERE run_id = ? AND stage_id = ?
    `).get(runId, stageId));
  }

  events(runId: string): WorkflowEvent[] {
    const rows = this.#db.prepare(`
      SELECT run_id, sequence, type, stage_id, payload_json, created_at
      FROM workflow_events WHERE run_id = ? ORDER BY sequence
    `).all(runId) as Array<{
      run_id: string; sequence: number; type: WorkflowEventType;
      stage_id: string | null; payload_json: string; created_at: string;
    }>;
    return rows.map(row => ({
      runId: row.run_id,
      sequence: Number(row.sequence),
      type: row.type,
      stageId: row.stage_id,
      payload: JSON.parse(row.payload_json) as Record<string, unknown>,
      createdAt: row.created_at
    }));
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#db.close();
  }

  #appendEvent(
    runId: string,
    type: WorkflowEventType,
    stageId: string | null,
    payload: Record<string, unknown>
  ): void {
    const row = this.#db.prepare(`
      SELECT COALESCE(MAX(sequence), 0) + 1 AS next_sequence
      FROM workflow_events WHERE run_id = ?
    `).get(runId) as { next_sequence: number };
    this.#db.prepare(`
      INSERT INTO workflow_events
        (run_id, sequence, type, stage_id, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      runId,
      Number(row.next_sequence),
      type,
      stageId,
      JSON.stringify(payload),
      new Date().toISOString()
    );
  }

  #transaction(work: () => void): void {
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      work();
      this.#db.exec("COMMIT");
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch {}
      throw error;
    }
  }

  #rowToStep(row: unknown): WorkflowStep | null {
    if (!row || typeof row !== "object") return null;
    const value = row as {
      run_id: string; stage_id: string; ordinal: number; status: WorkflowStepStatus;
      input_hash: string; output_sha256: string | null; evidence_json: string; external_calls: number;
    };
    return {
      runId: value.run_id,
      stageId: value.stage_id,
      ordinal: Number(value.ordinal),
      status: value.status,
      inputHash: value.input_hash,
      outputSha256: value.output_sha256,
      evidenceRefs: JSON.parse(value.evidence_json) as string[],
      externalCalls: Number(value.external_calls)
    };
  }
}
