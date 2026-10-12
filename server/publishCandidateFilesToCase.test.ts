import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  candidateFileDisplayType,
  mapCandidateFileStatusToReviewStatus,
  pickOperationalCaseForCandidate,
  publishCandidateFilesToCase,
} from "./services/publishCandidateFilesToCase";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("publishCandidateFilesToCase helpers", () => {
  it("normalise les types candidat vers des libellés coffre lisibles", () => {
    expect(candidateFileDisplayType("passeport")).toBe("Passeport");
    expect(candidateFileDisplayType("cv")).toBe("CV");
    expect(candidateFileDisplayType("diplome")).toBe("Diplôme");
    expect(candidateFileDisplayType("autre", "PASSEPORT_SIEWE.pdf")).toBe("Passeport");
  });

  it("mappe les statuts candidate_files vers reviewStatus", () => {
    expect(mapCandidateFileStatusToReviewStatus("uploaded")).toBe("received");
    expect(mapCandidateFileStatusToReviewStatus("verified")).toBe("approved");
    expect(mapCandidateFileStatusToReviewStatus("rejected")).toBe("rejected");
  });

  it("privilégie un dossier 3M-AGN ouvert plutôt qu’EVAL-", () => {
    const picked = pickOperationalCaseForCandidate([
      { id: 1, caseNumber: "EVAL-99", updatedAt: "2026-10-12T12:00:00.000Z", currentStatus: "documents_review" },
      { id: 2, caseNumber: "3M-AGN-0012", updatedAt: "2026-10-01T12:00:00.000Z", currentStatus: "documents_review" },
      { id: 3, caseNumber: "3M-AGN-0099", updatedAt: "2026-09-01T12:00:00.000Z", currentStatus: "closed" },
    ]);
    expect(picked?.id).toBe(2);
  });
});

describe("publishCandidateFilesToCase — idempotence et no-op", () => {
  it("sans dossier opérationnel : no-op (ne crée pas de case)", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              limit: async () => [{ id: 42 }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: async () => [],
              }),
            }),
          }),
        }),
      insert: vi.fn(),
      update: vi.fn(),
    } as any;

    const result = await publishCandidateFilesToCase(db, { candidateId: 42, fileIds: [7] });
    expect(result).toMatchObject({ reason: "no_case", published: 0, caseId: null });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("ignore un fichier déjà présent (même fileKey)", async () => {
    const values = vi.fn(async () => undefined);
    const insert = vi.fn(() => ({ values }));
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({
          from: () => ({ where: () => ({ limit: async () => [{ id: 42 }] }) }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: async () => [{
                  id: 9,
                  caseNumber: "3M-AGN-0012",
                  updatedAt: "2026-10-12T10:00:00.000Z",
                  currentStatus: "documents_review",
                  candidateId: 42,
                }],
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: async () => [{
                id: 7,
                candidateId: 42,
                fileType: "passeport",
                fileName: "passeport.pdf",
                fileUrl: "/manus-storage/candidates/42/passeport.pdf",
                fileKey: "candidates/42/passeport.pdf",
                fileSizeBytes: 12,
                mimeType: "application/pdf",
                status: "uploaded",
                correctionComment: null,
                uploadedAt: new Date("2026-10-12T11:00:00.000Z"),
              }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: async () => [{
              id: 1,
              fileName: "passeport.pdf",
              fileKey: "candidates/42/passeport.pdf",
              documentType: "Passeport",
            }],
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: async () => [],
          }),
        }),
      insert,
      update: vi.fn(),
    } as any;

    const result = await publishCandidateFilesToCase(db, { candidateId: 42, fileIds: [7] });
    expect(result).toMatchObject({ published: 0, skipped: 1, reason: "ok", caseNumber: "3M-AGN-0012" });
    expect(values).not.toHaveBeenCalled();
  });

  it("publie une nouvelle pièce et aligne une exigence checklist", async () => {
    const values = vi.fn(async () => undefined);
    const insert = vi.fn(() => ({ values }));
    const update = vi.fn(() => ({ set: () => ({ where: async () => undefined }) }));
    const requirement = {
      id: 55,
      documentType: "Passeport valide",
      status: "pending",
    };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({
          from: () => ({ where: () => ({ limit: async () => [{ id: 42 }] }) }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: async () => [{
                  id: 9,
                  caseNumber: "3M-AGN-0012",
                  updatedAt: "2026-10-12T10:00:00.000Z",
                  currentStatus: "documents_review",
                  candidateId: 42,
                }],
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({
            where: () => ({
              orderBy: async () => [{
                id: 7,
                candidateId: 42,
                fileType: "passeport",
                fileName: "passeport-qa.pdf",
                fileUrl: "/manus-storage/candidates/42/passeport-qa.pdf",
                fileKey: "candidates/42/passeport-qa.pdf",
                fileSizeBytes: 2048,
                mimeType: "application/pdf",
                status: "uploaded",
                correctionComment: null,
                uploadedAt: new Date("2026-10-12T11:00:00.000Z"),
              }],
            }),
          }),
        })
        .mockReturnValueOnce({
          from: () => ({ where: async () => [] }),
        })
        .mockReturnValueOnce({
          from: () => ({ where: async () => [requirement] }),
        }),
      insert,
      update,
    } as any;

    const result = await publishCandidateFilesToCase(db, {
      candidateId: 42,
      fileIds: [7],
      actorRole: "candidate",
    });
    expect(result).toMatchObject({ published: 1, skipped: 0, reason: "ok" });
    expect(values).toHaveBeenCalled();
    expect(requirement.status).toBe("received");
  });
});

describe("branchement dépôt candidat + réparation admin", () => {
  it("branche saveDocument et expose la mutation admin de sync", () => {
    const candidate = read("server/routers/candidate.ts");
    const oauth = read("server/routers/oauthUserDashboard.ts");
    const admin = read("server/routers/admin.ts");
    const ui = read("client/src/components/AdminDocumentsByCandidate.tsx");
    const management = read("client/src/components/AdminDocumentsManagement.tsx");
    expect(candidate).toContain("publishCandidateFilesToCase");
    expect(oauth).toContain("publishCandidateFilesToCase");
    expect(admin).toContain("syncCandidateFilesToCase");
    expect(admin).toContain("publishCandidateFilesToCase");
    expect(ui).toContain("sync-candidate-files-to-case");
    expect(management).toContain("syncCandidateFilesToCase");
  });
});
