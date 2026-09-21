export type EditIntensity = "light" | "standard" | "deep";

export type EditPolicy = {
  maxAutomaticRounds: number;
  defaultIntensity: EditIntensity;
  forbidDetectorEvasion: true;
  forbidFabricatedExperience: true;
  forbidTextObfuscation: true;
};

export const DEFAULT_EDIT_POLICY: EditPolicy = {
  maxAutomaticRounds: 2,
  defaultIntensity: "standard",
  forbidDetectorEvasion: true,
  forbidFabricatedExperience: true,
  forbidTextObfuscation: true
};

export function automaticEditAllowed(
  round: number,
  policy: EditPolicy = DEFAULT_EDIT_POLICY
): boolean {
  return Number.isInteger(round) && round >= 0 && round < policy.maxAutomaticRounds;
}
