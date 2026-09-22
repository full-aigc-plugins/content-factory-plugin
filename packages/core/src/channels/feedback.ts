import { createHash } from "node:crypto";

type MetricObservation = {
  name: string;
  definition: string;
  numerator: number;
  denominator: number | null;
  windowStart: string;
  windowEnd: string;
  observedAt: string;
  sourceRef: string;
};

type CommentObservation = {
  commentId: string;
  text: string;
  observedAt: string;
  sourceRef: string;
};

type FeedbackInput = {
  authorized: boolean;
  channelId: string;
  currentRecipeRef: string;
  metrics: MetricObservation[];
  comments: CommentObservation[];
};

function stableId(prefix: string, value: unknown): string {
  const digest = createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
  return `${prefix}-${digest.slice(0, 16)}`;
}

function normalizeMetric(channelId: string, observation: MetricObservation) {
  const evaluable = Number.isFinite(observation.numerator)
    && observation.numerator >= 0
    && Number.isFinite(observation.denominator)
    && observation.denominator !== null
    && observation.denominator > 0;

  return {
    metricId: stableId("metric", [
      channelId,
      observation.name,
      observation.definition,
      observation.windowStart,
      observation.windowEnd,
      observation.observedAt,
      observation.sourceRef
    ]),
    channelId,
    name: observation.name,
    definition: observation.definition,
    numerator: observation.numerator,
    denominator: observation.denominator,
    windowStart: observation.windowStart,
    windowEnd: observation.windowEnd,
    value: evaluable ? observation.numerator / observation.denominator! : null,
    status: evaluable ? "observed" as const : "not_evaluable" as const,
    observedAt: observation.observedAt,
    sourceRef: observation.sourceRef
  };
}

function createCommentDraft(channelId: string, observation: CommentObservation) {
  return {
    draftId: stableId("comment-draft", [channelId, observation.commentId, observation.sourceRef]),
    channelId,
    commentId: observation.commentId,
    body: "感谢反馈。我们会核对相关信息后再回复。",
    status: "draft" as const,
    sourceTextTrust: "untrusted" as const,
    observedAt: observation.observedAt,
    sourceRef: observation.sourceRef
  };
}

export function analyzeChannelFeedback(input: FeedbackInput) {
  if (!input.authorized) {
    return {
      status: "blocked" as const,
      reason: "observation-permission-required" as const,
      metrics: [],
      commentDrafts: [],
      recipeProposal: null,
      externalWrites: 0 as const,
      commentsSent: 0 as const,
      recipeUpdated: false as const
    };
  }

  return {
    status: "proposed" as const,
    metrics: input.metrics.map(observation => normalizeMetric(input.channelId, observation)),
    commentDrafts: input.comments.map(observation => createCommentDraft(input.channelId, observation)),
    recipeProposal: {
      status: "proposal-only" as const,
      currentRecipeRef: input.currentRecipeRef,
      proposedRecipeRef: null,
      reasonRefs: [
        ...input.metrics.map(observation => `metric:${observation.name}`),
        ...input.comments.map(observation => `comment:${observation.commentId}`)
      ]
    },
    externalWrites: 0 as const,
    commentsSent: 0 as const,
    recipeUpdated: false as const
  };
}
