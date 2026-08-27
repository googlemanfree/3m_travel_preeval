import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidateRouter = readFileSync(resolve(import.meta.dirname, "routers/candidate.ts"), "utf8");
const verificationPage = readFileSync(resolve(import.meta.dirname, "../client/src/pages/VerifyEmailLink.tsx"), "utf8");
const evaluationForm = readFileSync(resolve(import.meta.dirname, "../client/src/components/SimpleMultiProjectForm.tsx"), "utf8");

describe("orientation après activation", () => {
  it("renvoie la déclaration d’évaluation sans exposer les informations de dossier", () => {
    expect(candidateRouter).toContain("function activationCandidatePayload");
    expect(candidateRouter).toContain("evaluationDeclarationStatus: candidate.evaluationDeclarationStatus");
    expect(candidateRouter).not.toContain("applicationStatusHistory: candidate.applicationStatusHistory");
  });

  it("ouvre une session de 24 heures puis oriente vers l’évaluation seulement si elle manque", () => {
    expect(verificationPage).toContain('const needsEvaluation = candidate?.evaluationDeclarationStatus === "not_declared"');
    expect(verificationPage).toContain('"/evaluation?onboarding=registration"');
    expect(verificationPage).toContain('localStorage.setItem("3m_candidate_session_expires_at"');
  });

  it("préremplit l’évaluation connectée et relie uniquement les portails institutionnels connus", () => {
    const completeEvaluation = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Evaluation.tsx"), "utf8");
    expect(completeEvaluation).toContain("onboardingFromRegistration");
    expect(completeEvaluation).toContain("fullName: candidate?.fullName ?? ''");
    expect(completeEvaluation).toContain("sources institutionnelles");
    expect(evaluationForm).toContain("const officialPortal = officialSourceKey");
  });
});
