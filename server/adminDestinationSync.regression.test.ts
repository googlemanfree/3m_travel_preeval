import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("admin destination synchronization contract", () => {
  it("updates the source dossier and operational case with admin authentication", () => {
    const source = read("server/routers/admin.ts");
    expect(source).toContain("updateCandidateDestination: publicProcedure");
    expect(source).toContain("countryTarget: input.destination.trim()");
    expect(source).toContain("actionType: \"destination_updated\"");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("exposes the destination synchronization action in Candidate360", () => {
    const source = read("client/src/components/Candidate360Workspace.tsx");
    expect(source).toContain("updateCandidateDestination");
    expect(source).toContain("Synchroniser la destination");
    expect(source).toContain("Confirmer la modification de destination");
  });
});
