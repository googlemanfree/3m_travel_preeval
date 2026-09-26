import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("messages envoyés aux candidats : pas de délai de contact promis sans engagement réel", () => {
  it("aucun « vous contactera sous 24h » dans les e-mails et messages de bienvenue", () => {
    for (const file of ["server/emailService.ts", "server/routers/candidate.ts", "server/routers/profileEvaluation.ts", "server/routers/adminCandidateManagement.ts"]) {
      expect(read(file), file).not.toMatch(/contactera[^.`]{0,40}sous 24 ?h/i);
    }
  });
});
