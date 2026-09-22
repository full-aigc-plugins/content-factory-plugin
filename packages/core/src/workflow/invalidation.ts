import {
  evaluateDetectionFreshness,
  type DetectionBinding
} from "../detection/freshness.ts";

export type DetectionInvalidationPlan = {
  detectionReusable: boolean;
  approvalReusable: boolean;
  deliveryReviewRequired: boolean;
  reasons: string[];
  todos: Array<"redetect" | "review-detection" | "review-delivery">;
};

export function planDetectionInvalidation(input: {
  binding: DetectionBinding;
  current: DetectionBinding;
  now: string;
}): DetectionInvalidationPlan {
  const freshness = evaluateDetectionFreshness(input);
  const todos: DetectionInvalidationPlan["todos"] = [];
  if (!freshness.detectionReusable) {
    todos.push("redetect", "review-detection", "review-delivery");
  } else if (freshness.deliveryReviewRequired) {
    todos.push("review-delivery");
  }
  return {
    detectionReusable: freshness.detectionReusable,
    approvalReusable: freshness.detectionReusable,
    deliveryReviewRequired: freshness.deliveryReviewRequired,
    reasons: [...freshness.reasons],
    todos
  };
}
