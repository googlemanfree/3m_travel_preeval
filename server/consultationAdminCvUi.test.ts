import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildConsultationPdfFilename, buildConsultationSummaryLines } from "../client/src/lib/consultationPdf";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "client/src/pages/AdminConsultationRequests.tsx"), "utf8");

describe("interface admin de consultation CV", () => {
  it("expose une recherche rapide sur les informations du CV", () => {
    expect(source).toContain('id="consultation-cv-search"');
    expect(source).toContain("searchQuery.trim().toLocaleLowerCase");
    expect(source).toContain("item.fullName, item.email, item.targetCountry, item.cvFileName");
    expect(source).toContain("visibleItems.map");
  });

  it("affiche un état de chargement accessible pour ouvrir et télécharger le CV", () => {
    expect(source).toContain("loadingCvId");
    expect(source).toContain('aria-busy={loadingCvId === item.id}');
    expect(source).toContain("Ouverture…");
    expect(source).toContain("downloadCv(item)");
  });

  it("propose l'export PDF du résumé depuis la liste et le détail", () => {
    expect(source).toContain("exportConsultationSummaryPdf");
    expect(source).toContain("Exporter le résumé PDF");
    expect(source).toContain("Résumé PDF");
    expect(source).toContain("Génération…");
  });
});

describe("résumé PDF de consultation", () => {
  it("construit un nom de fichier sûr et daté", () => {
    expect(buildConsultationPdfFilename("Aïcha N / CV final", new Date("2026-10-05T00:00:00Z"))).toBe("resume_consultation_Aïcha_N_CV_final_2026-10-05.pdf");
  });

  it("prépare les informations administratives sans perdre la note optionnelle", () => {
    expect(buildConsultationSummaryLines({
      candidateName: "Aïcha N",
      email: "aicha@example.com",
      phone: "+237 600 000 000",
      targetCountry: "Canada",
      status: "À valider",
      report: "Résumé",
      fileName: "cv-aicha.pdf",
    })).toEqual([
      "Candidat : Aïcha N",
      "Email : aicha@example.com",
      "Téléphone : +237 600 000 000",
      "Destination : Canada",
      "Statut : À valider",
      "CV analysé : cv-aicha.pdf",
    ]);
  });
});
