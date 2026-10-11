import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeNextStep, countClarificationUploads, type NextStepInput } from "@/lib/nextStep";
import { buildClientSpaceSnapshot, diffClientSpace } from "@/lib/clientSpaceSync";

const root = resolve(import.meta.dirname, "..");
const base: NextStepInput = { evaluationRequired: false, agreementSignatureRequired: false };

describe("checklist & clarifications — priorité espace client", () => {
  it("compte les clarifications à déposer et les priorise avant la checklist générale", () => {
    expect(countClarificationUploads([
      { id: 1, status: "answered", canUpload: true, documentLabel: "Acte de naissance" },
      { id: 2, status: "pending", canUpload: false, documentLabel: "Passeport" },
      { id: 3, status: "answered", hasSubmittedDocument: true, canUpload: false, documentLabel: "CV" },
    ])).toEqual({ count: 1, firstLabel: "Acte de naissance" });

    const step = computeNextStep({
      ...base,
      clarificationUploads: { count: 2, firstLabel: "Casier judiciaire" },
      checklist: { total: 8, missing: 5, replace: 0 },
    });
    expect(step.id).toBe("clarification-upload");
    expect(step.action).toEqual({ kind: "section", section: "documents" });
    expect(step.title).toContain("2 pièces après clarification");
  });

  it("photo passeport après les pièces, avant les notifications", () => {
    expect(computeNextStep({ ...base, passportPhotoRequired: true, unreadNotifications: 3 }).id).toBe("passport-photo");
    expect(computeNextStep({
      ...base,
      passportPhotoRequired: true,
      requirements: [{ id: 1, status: "pending", isRequired: true }],
    }).id).toBe("documents-pending");
  });

  it("annonce les nouveaux documents déposés en agence via clientSpaceSync", () => {
    const previous = buildClientSpaceSnapshot({
      cases: {
        cases: [{ id: 1, currentStatus: "open", caseNumber: "3M-1", documents: [{ id: 10, uploadedByRole: "agency" }] }],
        notifications: [],
      },
    });
    const next = buildClientSpaceSnapshot({
      cases: {
        cases: [{
          id: 1,
          currentStatus: "open",
          caseNumber: "3M-1",
          documents: [
            { id: 10, uploadedByRole: "agency" },
            { id: 11, uploadedByRole: "admin" },
          ],
        }],
        notifications: [],
      },
    });
    const changes = diffClientSpace(previous, next);
    expect(changes.some((change) => change.id.startsWith("agency-docs-"))).toBe(true);
  });

  it("branche EvaluationSpace + navigation notifications / badges", () => {
    const space = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
    const nav = readFileSync(resolve(root, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");
    expect(space).toContain("countClarificationUploads");
    expect(space).toContain("clarificationUploads");
    expect(space).toContain("passportPhotoRequired");
    expect(space).toContain("profileActionCount");
    expect(nav).toContain('section=notifications');
    expect(nav).toContain("client-nav-badge-");
    expect(nav).toContain("clarificationUploadCount");
  });
});
