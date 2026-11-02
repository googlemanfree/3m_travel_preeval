import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isEvaluationCompleteForJustificatifs } from "../shared/registrationInfoRequest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("demande justificatifs — après évaluation, envoi pro", () => {
  it("bloque l’envoi serveur tant que l’évaluation n’est pas terminée", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("isEvaluationCompleteForJustificatifs");
    expect(router).toContain("PRECONDITION_FAILED");
    expect(router).toContain("après l’évaluation");
    expect(router).toContain("buildRegistrationInfoClientSpaceContent");
    expect(router).toContain("justificatifs_info_request_sent");
    expect(isEvaluationCompleteForJustificatifs({ evaluationDeclarationStatus: "not_declared" })).toBe(false);
  });

  it("désactive le bouton admin avant évaluation et active après", () => {
    const profile = read("client/src/components/AdminRegistrationProfile.tsx");
    expect(profile).toContain("evaluationCompleted");
    expect(profile).toContain("registration-justificatifs-gate");
    expect(profile).toContain("!evaluationCompleted");
    expect(profile).toContain("disabled={isRequestingInfo || !primaryDestination || !visaType || !evaluationCompleted}");

    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("evaluationCompleted={Boolean(");
    expect(dashboard).toContain("evaluationDeclarationStatus === \"validated\"");
  });

  it("expose l’horodatage d’envoi sur la fiche candidat", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("registrationInfoRequestSentAt");
    expect(admin).toContain("registration_info_request");
  });
});
