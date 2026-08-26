import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("navigation Canada", () => {
  it("relie le CTA du simulateur aux parcours détaillés réels", () => {
    const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Canada.tsx"), "utf8");
    const simulator = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/CanadaScoreSimulator.tsx"), "utf8");
    expect(page).toContain('id="voies-canada"');
    expect(simulator).toContain('href="#voies-canada"');
    expect(page).toContain('React.lazy');
  });
});
