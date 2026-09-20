import type { WorkflowRunner, WorkflowStep } from "./runner.ts";

export function resumeRun(runner: WorkflowRunner, runId: string): WorkflowStep | null {
  return runner.next(runId);
}
