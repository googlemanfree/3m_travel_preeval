import { describe, expect, it } from "vitest";
import {
  buildSourceFingerprint,
  displayNameParts,
  documentTypeLabel,
  findLeakedContactSignals,
  formatDisplayName,
  normalizeDocumentTypeKey,
  SynthesisContentSchema,
  type SynthesisContent,
} from "../shared/candidateSynthesisSheet";
import { buildDocumentRefs, type DossierDocumentRow } from "./services/candidateSynthesisStructure";

const sampleContent = (overrides: Partial<SynthesisContent> = {}): SynthesisContent =>
  SynthesisContentSchema.parse({
    displayFirstName: "Aïcha",
    displayLastInitial: "N",
    profileTitle: "Gestionnaire logistique",
    residenceCountry: "Cameroun",
    residenceCity: "Douala",
    targetDestination: "Canada",
    targetProcedure: "Études",
    summary: "Gestionnaire logistique avec expérience en suivi d’expéditions.",
    experiences: [{ role: "Gestionnaire", employer: "TRANSCAM SA", period: "2018-2022" }],
    education: { degree: "Licence logistique", institution: "Université de Douala", year: "2017" },
    skills: ["Logistique", "SAGE"],
    languages: [{ language: "Français", level: "C1" }],
    documents: [
      { type: "cv", label: "CV", status: "verified", source: "candidate", uploadedAt: "2026-01-01T00:00:00.000Z" },
    ],
    missing: [],
    dossierReference: "3M-42",
    generatedAtLabel: "10/10/2026",
    ...overrides,
  });

describe("fiche synthèse — identité externe", () => {
  it("masque le nom de famille en initiale uniquement", () => {
    expect(displayNameParts("Aïcha Nkolo")).toEqual({ firstName: "Aïcha", lastInitial: "N" });
    expect(formatDisplayName("Aïcha", "N")).toBe("Aïcha N.");
  });

  it("détecte les fuites de coordonnées avant diffusion", () => {
    expect(findLeakedContactSignals(sampleContent({ summary: "Contact aicha@mail.com pour plus" }))).toContain("adresse e-mail");
    expect(findLeakedContactSignals(sampleContent({ summary: "Joignable au +237 690 00 00 00" }))).toContain("numéro de téléphone");
    expect(findLeakedContactSignals(sampleContent())).toEqual([]);
  });
});

describe("fiche synthèse — structure automatique des pièces", () => {
  it("normalise les types FR/EN et regroupe passeport / passport", () => {
    expect(normalizeDocumentTypeKey("Passeport")).toBe("passeport");
    expect(documentTypeLabel("passport")).toBe("Passeport");
    expect(documentTypeLabel("diploma")).toBe("Diplôme");
    expect(documentTypeLabel("proof_of_residence")).toBe("Justificatif de domicile");

    const docs: DossierDocumentRow[] = [
      { id: 1, type: "passeport", status: "verified", source: "candidate", uploadedAt: "2026-01-01T10:00:00.000Z" },
      { id: 2, type: "passport", status: "pending", source: "agency", uploadedAt: "2026-01-02T10:00:00.000Z" },
      { id: 3, type: "cv", status: "uploaded", source: "candidate", uploadedAt: "2026-01-01T09:00:00.000Z" },
      { id: 4, type: "diploma", status: "verified", source: "admin", uploadedAt: "2026-01-03T10:00:00.000Z" },
    ];
    const refs = buildDocumentRefs(docs);
    expect(refs).toHaveLength(3);
    const passport = refs.find((ref) => ref.label === "Passeport");
    expect(passport?.status).toBe("pending");
    expect(passport?.source).toBe("agency");
    expect(refs.find((ref) => ref.label === "Diplôme")?.status).toBe("verified");
    expect(refs.map((ref) => ref.label).sort()).toEqual(["CV", "Diplôme", "Passeport"]);
  });

  it("change l’empreinte dès qu’une pièce ou son statut change", () => {
    const base = buildSourceFingerprint({
      cvUrl: "/cv.pdf",
      avatarUrl: null,
      documents: [{ id: 1, type: "cv", status: "uploaded", updatedAt: "2026-01-01T00:00:00.000Z" }],
    });
    const afterVerify = buildSourceFingerprint({
      cvUrl: "/cv.pdf",
      avatarUrl: null,
      documents: [{ id: 1, type: "cv", status: "verified", updatedAt: "2026-01-01T00:00:00.000Z" }],
    });
    const afterAdd = buildSourceFingerprint({
      cvUrl: "/cv.pdf",
      avatarUrl: null,
      documents: [
        { id: 1, type: "cv", status: "uploaded", updatedAt: "2026-01-01T00:00:00.000Z" },
        { id: 2, type: "passeport", status: "pending", updatedAt: "2026-01-02T00:00:00.000Z" },
      ],
    });
    expect(base).not.toEqual(afterVerify);
    expect(base).not.toEqual(afterAdd);
  });
});

describe("fiche synthèse — wiring dépôt", () => {
  it("restructure après dépôt candidat, admin, agence et changement de statut", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(process.cwd());
    const candidateRouter = readFileSync(join(root, "server/routers/candidate.ts"), "utf8");
    const candidateUpload = readFileSync(join(root, "server/routers/candidateUpload.ts"), "utf8");
    const adminRouter = readFileSync(join(root, "server/routers/admin.ts"), "utf8");
    const agencyUpload = readFileSync(join(root, "server/routers/agencyDossierUpload.ts"), "utf8");
    const agencyDocs = readFileSync(join(root, "server/routers/agencyDossierDocuments.ts"), "utf8");
    const employerPortal = readFileSync(join(root, "client/src/pages/EmployerPortal.tsx"), "utf8");

    expect(candidateRouter).toContain("restructureSynthesisAfterDocumentChange");
    expect(candidateRouter).toContain("scheduleSynthesisRestructure");
    expect(candidateUpload).toContain("scheduleSynthesisRestructure");
    expect(adminRouter).toContain("restructureSynthesisAfterDocumentChange");
    expect(adminRouter).toContain("scheduleSynthesisRestructure");
    expect(agencyUpload).toContain("restructureSynthesisForAgencyDossier");
    expect(agencyDocs).toContain("restructureSynthesisForAgencyDossier");
    expect(employerPortal).toContain("PartnerSynthesisDownloadButton");
    expect(employerPortal).toContain("uiLanguage");
    expect(employerPortal).not.toMatch(/language=\{language === "en"/);
  });
});
