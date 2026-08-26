import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("premium page transitions", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/components/PageTransition.tsx"), "utf8");

  it("uses the shared animation preference and reduced-motion contract", () => {
    expect(source).toContain("useAnimationPreferences");
    expect(source).toContain('preference === "fast"');
    expect(source).toContain("prefersReducedMotion || !animationsEnabled");
    expect(source).toContain('transition={motionDisabled ? { duration: 0 }');
  });

  it("keeps transitions limited to opacity and transform", () => {
    expect(source).toContain("opacity: 0, y: 8");
    expect(source).toContain("opacity: 0, y: -8");
    expect(source).toContain("will-change-[opacity,transform]");
  });
});

export {};
