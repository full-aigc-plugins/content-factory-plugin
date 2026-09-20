export type StageStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "blocked"
  | "cancelled";

export type StageRequest<TInput = unknown> = {
  runId: string;
  stageId: string;
  input: TInput;
  inputRefs: string[];
  consentRefs: string[];
  budgetRef?: string;
};

export type StageResult<TOutput = unknown> = {
  stageId: string;
  status: StageStatus;
  output?: TOutput;
  outputRefs: string[];
  evidenceRefs: string[];
  externalCalls: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export interface StagePort<TInput = unknown, TOutput = unknown> {
  execute(request: StageRequest<TInput>): Promise<StageResult<TOutput>>;
}
