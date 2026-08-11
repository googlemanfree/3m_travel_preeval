export type AnimationPreference = "normal" | "fast" | "off";

export const ANIMATION_PREFERENCE_KEY = "animation-preference";

export function isAnimationPreference(value: string | null | undefined): value is AnimationPreference {
  return value === "normal" || value === "fast" || value === "off";
}

export function animationDuration(preference: AnimationPreference): number {
  if (preference === "off") return 0;
  return preference === "fast" ? 120 : 220;
}

export function animationScale(preference: AnimationPreference): number {
  if (preference === "off") return 0;
  return preference === "fast" ? 0.7 : 1;
}
