export type WorkflowEventType =
  | "run.created"
  | "step.started"
  | "step.succeeded"
  | "run.succeeded"
  | "run.cancelled"
  | "step.late_ignored";

export type WorkflowEvent = {
  runId: string;
  sequence: number;
  type: WorkflowEventType;
  stageId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};
