import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("public hero coherence", () => {
  it("ServicePageShell : marque hero, sans aside carte", () => {
    const shell = read("client/src/components/ServicePageShell.tsx");
    expect(shell).toContain('const BRAND = "3M TRAVEL AGENCY"');
    expect(shell).toContain("min-h-[88svh]");
    expect(shell).toContain("bg-amber-500");
    expect(shell).not.toContain("Une orientation, pas une promesse");
    expect(shell).not.toContain("lg:grid-cols-[1.2fr_.8fr]");
    expect(shell).not.toContain("ShieldCheck");
  });

  it("PremiumCoverImage expose la source mobile via picture", () => {
    const cover = read("client/src/components/PremiumCoverImage.tsx");
    expect(cover).toContain("<picture>");
    expect(cover).toContain("max-width: 767px");
    expect(cover).toContain("visual.mobile");
    expect(cover).toContain("localFallback");
  });

  it("VisaEtudes : hero marque-first sans illustration inset ni emoji", () => {
    const visa = read("client/src/pages/VisaEtudes.tsx");
    expect(visa).toContain("3M TRAVEL AGENCY");
    expect(visa).toContain("Visa études — partez étudier à l’étranger");
    expect(visa).toContain("min-h-[88svh]");
    expect(visa).not.toContain("StudyAbroadIllustration");
    expect(visa).not.toContain("flag:");
    expect(visa).not.toContain("🇨🇦");
    expect(visa).toContain("destinations-etudes");
  });
});
