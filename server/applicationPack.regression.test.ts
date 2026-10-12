import { describe, expect, it } from "vitest";
import {
  ApplicationPackSchema,
  buildApplicationReadiness,
  classifySupportingDocument,
  draftHasMinimumContent,
  parseApplicationPack,
  supportingFactsFromDocuments,
  writeApplicationPackJson,
} from "../shared/applicationPack";
import type { CvDraft } from "../shared/cvDraft";
import { buildCvPrompt } from "./services/cvDraftGenerator";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const draft: CvDraft = {
  headline: "Logisticien",
  summary: "Profil logistique.",
  experiences: [{ role: "Logisticien", employer: "TRANSCAM", location: null, start: "2018", end: "2022", bullets: ["Suivi"] }],
  education: [{ degree: "Licence", institution: "UDM", year: "2017", details: null }],
  skills: ["Logistique"],
  languages: [{ language: "Français", level: "C1" }],
  certifications: [],
  missing: [],
};

describe("application pack — documents fournis + candidature", () => {
  it("classe et déduplique les pièces utiles au CV", () => {
    expect(classifySupportingDocument("Diplômes et relevés")).toBe("diploma");
    expect(classifySupportingDocument("Attestation employeur")).toBe("experience");
    expect(classifySupportingDocument("IELTS Academic")).toBe("language");
    const facts = supportingFactsFromDocuments([
      { documentType: "CV", fileName: "cv.pdf", status: "received" },
      { documentType: "Diplôme", documentName: "Licence.pdf", verificationStatus: "verified" },
      { documentType: "Diplôme", documentName: "Licence.pdf", status: "received" },
      { documentType: "Casier", fileName: "x.pdf", verificationStatus: "rejected" },
    ]);
    expect(facts.map((f) => f.kind)).toEqual(["cv", "diploma"]);
  });

  it("calcule la préparation candidat et le style recommandé Canada", () => {
    const pack = ApplicationPackSchema.parse({
      releasedAt: "2026-10-12T12:00:00.000Z",
      releasedBy: "agent@3mtravelagency.com",
      style: "canada",
      language: "fr",
      includeContact: true,
      targetRole: "Logisticien",
      draft,
      motivationLetter: "Madame, Monsieur…",
    });
    const readiness = buildApplicationReadiness({
      destination: "Canada",
      hasCvFile: true,
      documents: [
        { documentType: "CV", status: "received" },
        { documentType: "Diplôme", status: "received" },
        { documentType: "Attestation emploi", status: "received" },
      ],
      pack,
    });
    expect(readiness.recommendedStyle).toBe("canada");
    expect(readiness.readyToApply).toBe(true);
    expect(readiness.score).toBeGreaterThanOrEqual(80);
    expect(draftHasMinimumContent(draft)).toBe(true);
  });

  it("persiste le pack dans projectDetailsJson sans écraser les consentements", () => {
    const base = JSON.stringify({ preparatoryAnalysisConsent: true, preparatoryCvAnalysisConsent: true });
    const pack = ApplicationPackSchema.parse({
      releasedAt: "2026-10-12T12:00:00.000Z",
      releasedBy: "agent@3mtravelagency.com",
      style: "europe",
      language: "fr",
      includeContact: false,
      draft,
      motivationLetter: null,
    });
    const written = writeApplicationPackJson(base, pack);
    expect(parseApplicationPack(written)?.style).toBe("europe");
    expect(JSON.parse(written).preparatoryCvAnalysisConsent).toBe(true);
    expect(parseApplicationPack(writeApplicationPackJson(written, null))).toBeNull();
  });

  it("inclut les documents fournis et le poste visé dans le prompt CV", () => {
    const prompt = buildCvPrompt({
      style: "canada",
      language: "fr",
      cvText: "CV texte",
      destination: "Canada",
      targetRole: "Logisticien entrepôt",
      supportingFacts: ["Diplôme — Licence", "Attestation employeur"],
    });
    expect(prompt).toContain("<supporting_documents>");
    expect(prompt).toContain("Diplôme — Licence");
    expect(prompt).toContain("Poste / métier visé");
    expect(prompt).toContain("candidature internationale");
  });

  it("branche client + admin + placement style destination", () => {
    const root = resolve(import.meta.dirname, "..");
    const read = (path: string) => readFileSync(resolve(root, path), "utf8");
    expect(read("client/src/components/ClientApplicationPackPanel.tsx")).toContain("Pack pour postuler");
    expect(read("client/src/components/CvDraftPanel.tsx")).toContain("Publier pour le candidat");
    expect(read("client/src/pages/EvaluationSpace.tsx")).toContain("ClientApplicationPackPanel");
    expect(read("server/routers/candidate.ts")).toContain("getApplicationPack");
    expect(read("server/routers/placementPortal.ts")).toContain("styleForCountry(evaluation.destinationCountry");
  });
});
