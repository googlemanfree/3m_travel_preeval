import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers/unifiedRequests.ts"), "utf8");

describe("Synchronisation du formulaire candidat vers le dossier admin", () => {
  it("conserve les champs métier sans copier de secrets", () => {
    expect(source).toContain("function buildCandidateFormSnapshot");
    expect(source).toContain("destination: candidate.destination ?? null");
    expect(source).toContain("visaType: candidate.visaType ?? null");
    expect(source).toContain("sourceFormSnapshot: buildCandidateFormSnapshot(candidate)");
    expect(source).not.toContain("passwordHash: candidate.passwordHash");
    expect(source).not.toContain("verificationToken: candidate.verificationToken");
  });
});
