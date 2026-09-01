import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin agency document upload", () => {
  it("uses the complete candidate directory for upload targets", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminDocumentsManagement.tsx"), "utf8");
    expect(source).toContain("trpc.admin.listCandidates.useQuery");
    expect(source).toContain("candidateDirectory?.candidates");
    expect(source).not.toContain("documents.filter((document) => document.candidateId)");
  });

  it("keeps the server upload bound to an authenticated candidate id", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("where(eq(candidates.id, input.candidateId))");
    expect(source).toContain("storagePut(`admin-documents/");
  });
});
