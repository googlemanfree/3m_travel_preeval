import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pageSource = readFileSync(resolve(process.cwd(), "client/src/pages/Tourism.tsx"), "utf8");

describe("formulaire Tourisme", () => {
  it("commence sans destination imposée et présente un libellé de saisie neutre", () => {
    expect(pageSource).toContain('destination: candidate?.destination || "",');
    expect(pageSource).toContain('placeholder="Ville et pays de destination"');
  });
});
