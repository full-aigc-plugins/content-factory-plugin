import { ContentFactoryError } from "../errors.ts";

export type ContentRunMode =
  | "full"
  | "edit"
  | "format"
  | "detect"
  | "repurpose"
  | "deliver";

export type ContentDispatchInput = {
  mode: ContentRunMode;
  topic?: string;
  contentRef?: string;
  sourceRefs?: string[];
  channel?: string;
  accountRef?: string;
  locale?: string;
  audience?: string;
  goal?: string;
};

export type ContentBrief = {
  mode: ContentRunMode;
  topic: string | null;
  contentRef: string | null;
  sourceRefs: string[];
  channel: string | null;
  accountRef: string | null;
  locale: string | null;
  audience: string | null;
  goal: string | null;
  missingInputs: string[];
  assumptions: string[];
};

export type PlannedStage = {
  stageId: string;
  required: boolean;
};

export type ContentPlan = {
  brief: ContentBrief;
  stages: PlannedStage[];
};

const ROUTES: Record<ContentRunMode, readonly string[]> = {
  full: [
    "brief",
    "research",
    "outline",
    "write",
    "fact-check",
    "edit",
    "visual-plan",
    "format",
    "review"
  ],
  edit: ["edit", "fact-check", "review"],
  format: ["format", "review"],
  detect: ["detect", "review"],
  repurpose: ["repurpose", "fact-check", "format", "review"],
  deliver: ["delivery-preflight", "approval", "deliver", "delivery-verify"]
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function dispatchContentRequest(input: ContentDispatchInput): ContentPlan {
  if (!(input.mode in ROUTES)) {
    throw new ContentFactoryError({
      code: "CONTENT_MODE_UNSUPPORTED",
      message: "content request mode is unsupported",
      retryable: false,
      details: { mode: input.mode }
    });
  }

  const sourceRefs = (input.sourceRefs ?? []).filter(ref => ref.trim().length > 0);
  const topic = clean(input.topic);
  const contentRef = clean(input.contentRef);
  const channel = clean(input.channel);
  const accountRef = clean(input.accountRef);
  const missingInputs: string[] = [];

  if (input.mode === "full" && !topic && sourceRefs.length === 0) {
    missingInputs.push("topic_or_source");
  }
  if (["edit", "format", "detect", "repurpose", "deliver"].includes(input.mode) && !contentRef) {
    missingInputs.push("content_ref");
  }
  if (input.mode === "deliver" && !channel) {
    missingInputs.push("channel");
  }
  if (input.mode === "deliver" && !accountRef) {
    missingInputs.push("account_ref");
  }

  const brief: ContentBrief = {
    mode: input.mode,
    topic,
    contentRef,
    sourceRefs,
    channel,
    accountRef,
    locale: clean(input.locale),
    audience: clean(input.audience),
    goal: clean(input.goal),
    missingInputs,
    assumptions: []
  };

  return {
    brief,
    stages: ROUTES[input.mode].map(stageId => ({ stageId, required: true }))
  };
}
