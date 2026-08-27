import { describe, expect, it } from "vitest";
import { generateDossierCode } from "./utils/generateDossierCode";

describe("generateDossierCode", () => {
  it("préserve le préfixe lisible et différencie les références successives", () => {
    const first = generateDossierCode();
    const second = generateDossierCode();

    expect(first).toMatch(/^#3M-\d{8}-\d{4}-[A-F0-9]{6}$/);
    expect(second).toMatch(/^#3M-\d{8}-\d{4}-[A-F0-9]{6}$/);
    expect(second).not.toBe(first);
  });
});
