import { describe, expect, it } from "vitest";
import {
  animationDuration,
  animationScale,
  isAnimationPreference,
  type AnimationPreference,
} from "../shared/animationPreferences";

describe("animation preferences", () => {
  it("accepts only supported preferences", () => {
    expect(isAnimationPreference("normal")).toBe(true);
    expect(isAnimationPreference("fast")).toBe(true);
    expect(isAnimationPreference("off")).toBe(true);
    expect(isAnimationPreference("slow")).toBe(false);
    expect(isAnimationPreference(null)).toBe(false);
  });

  it("maps preferences to predictable motion settings", () => {
    const cases: Array<[AnimationPreference, number, number]> = [
      ["normal", 220, 1],
      ["fast", 120, 0.7],
      ["off", 0, 0],
    ];

    for (const [preference, duration, scale] of cases) {
      expect(animationDuration(preference)).toBe(duration);
      expect(animationScale(preference)).toBe(scale);
    }
  });
});
