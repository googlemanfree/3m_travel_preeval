import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("rattachement bilan agence multi-cas", () => {
  const resolver = readFileSync(resolve(process.cwd(), "server/routers/unifiedRequests.ts"), "utf8");
  const candidate360 = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");

  it("reconnaît un CV agence stocké dans candidate_files", () => {
    expect(resolver).toContain("candidateFiles.fileType, \"cv\"");
    expect(resolver).toContain("candidateFiles.fileUrl");
    expect(resolver).toContain("candidateFiles.status");
    expect(resolver).toContain("agencyDossier.cvFileUrl ?? agencyCvDocument?.documentUrl ?? candidateCvFile?.fileUrl");
  });

  it("privilégie le candidateId avant le fallback e-mail/nom dans Candidate360", () => {
    expect(candidate360).toContain("const agencyCandidateId = candidateRecord?.id ?? null;");
    expect(candidate360).toContain("eq(applications.candidateId, agencyCandidateId)");
    expect(candidate360).toContain("eq(applications.email, email), eq(applications.fullName, sourceRecord.fullName)");
  });
});
