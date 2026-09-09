import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "server/routers/adminCandidateManagement.ts"), "utf8");

describe("Validation hors ligne agence", () => {
  it("normalise les e-mails lors du rattachement agence/compte", () => {
    expect(source).toContain("LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${dossier.email}))");
    expect(source).toContain("LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${application.email}))");
  });

  it("conserve une validation traçable sur le dossier agence si le compte candidat manque", () => {
    expect(source).toContain('if (!candidate && reference?.source !== "agency")');
    expect(source).toContain('if (reference?.source === "agency")');
    expect(source).toContain("candidateLinked: Boolean(candidate)");
  });
});
