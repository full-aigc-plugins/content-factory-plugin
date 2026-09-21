import type { ContentRunMode } from "../application/dispatch.ts";
import type { PlatformContext } from "./context.ts";
import {
  resolveChannelRecipe,
  type ChannelRegistry
} from "./registry.ts";

const MODE_STAGES: Record<Exclude<ContentRunMode, "full">, string[]> = {
  edit: ["edit", "fact-check", "review"],
  format: ["format", "review"],
  detect: ["detect", "review"],
  repurpose: ["repurpose", "fact-check", "format", "review"],
  deliver: ["delivery-preflight", "approval", "deliver", "delivery-verify"]
};

function isReviewStage(stage: string): boolean {
  return stage === "review" || stage.endsWith("-review");
}

function completeFullStages(recipeStages: readonly string[]): string[] {
  const terminalReviews = recipeStages.filter(isReviewStage);
  const contentStages = recipeStages.filter(
    stage => !isReviewStage(stage) && stage !== "edit" && stage !== "format"
  );
  return [
    ...contentStages,
    "edit",
    "format",
    ...(terminalReviews.length > 0 ? terminalReviews : ["review"])
  ];
}

export type RoutingDecision =
  | {
    status: "resolved";
    inputHash: string;
    taskKind: string;
    profileRef: string;
    recipeRef: string;
    stages: string[];
    selectedBindings: string[];
    rejectedBindings: Array<{ bindingId: string; reason: string }>;
  }
  | {
    status: "blocked";
    reasons: string[];
    stages: [];
    selectedBindings: [];
    rejectedBindings: [];
  }
  | {
    status: "needs_clarification";
    reasons: string[];
    stages: [];
    selectedBindings: [];
    rejectedBindings: [];
  };

export function selectContentRecipe(input: {
  context: PlatformContext;
  registry: ChannelRegistry;
  mode: ContentRunMode;
  taskKind: string;
  inputHash: string;
}): RoutingDecision {
  const intent = input.context.channelIntent;
  if (intent.resolutionState === "needs_clarification" || intent.channelId === null) {
    return {
      status: "needs_clarification",
      reasons: [...intent.resolutionEvidence],
      stages: [],
      selectedBindings: [],
      rejectedBindings: []
    };
  }
  if (intent.formatId === null) {
    return {
      status: "needs_clarification",
      reasons: ["format-missing"],
      stages: [],
      selectedBindings: [],
      rejectedBindings: []
    };
  }

  const resolved = resolveChannelRecipe(input.registry, {
    channelId: intent.channelId,
    formatId: intent.formatId,
    requestedAction: intent.requestedAction ?? undefined
  });
  if (resolved.status !== "resolved") {
    return {
      status: "blocked",
      reasons: [resolved.reason],
      stages: [],
      selectedBindings: [],
      rejectedBindings: []
    };
  }
  const stages = input.mode === "full"
    ? completeFullStages(resolved.recipe.stages)
    : [...MODE_STAGES[input.mode]];
  return {
    status: "resolved",
    inputHash: input.inputHash,
    taskKind: input.taskKind,
    profileRef: `${resolved.profile.id}@${resolved.profile.revision}`,
    recipeRef: `${resolved.recipe.channelId}/${resolved.recipe.formatId}@${resolved.recipe.revision}`,
    stages,
    selectedBindings: [],
    rejectedBindings: []
  };
}
