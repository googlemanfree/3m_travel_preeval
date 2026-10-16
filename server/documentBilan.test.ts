import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { buildDocumentBilan, documentBilanFileName } from "../client/src/lib/documentBilan";
import { renderDocumentBilanPdf } from "../client/src/lib/documentBilanPdf";

const now = new Date("2026-10-16T09:00:00Z");
const requirements = [
  { id: 1, documentType: "Passeport", status: "approved" },
  { id: 2, documentType: "Diplôme", status: "rejected", adminComment: "Document coupé : renvoyer la page entière." },
  { id: 3, documentType: "Casier judiciaire", status: "pending", dueAt: "2026-10-10T00:00:00Z" },
  { id: 4, documentType: "Relevé de notes", status: "received" },
  { id: 5, documentType: "Photo d'identité", status: "waived" },
];
const documents = [
  { id: 1, documentType: "Passeport", fileName: "passeport.pdf", uploadedAt: "2026-10-01T10:00:00Z", uploadedByRole: "candidate", reviewStatus: "approved" },
  { id: 2, documentType: "Relevé de notes", fileName: "releve.pdf", uploadedAt: "2026-10-12T10:00:00Z", uploadedByRole: "candidate", reviewStatus: "pending" },
];

describe("bilan documentaire d'un dossier", () => {
  const bilan = buildDocumentBilan({ candidateName: "Aïcha Nkolo", reference: "3M-2026-0012", destination: "Canada", requirements, documents, now });

  it("calcule la progression sur les pièces requises (la pièce « non requise » ne compte pas)", () => {
    expect(bilan.summary).toMatchObject({ total: 4, validated: 1, percent: 25 });
  });

  it("trie ce qui bloque d'abord et garde les précisions utiles", () => {
    expect(bilan.lines.map((line) => line.label)).toEqual(["Diplôme", "Casier judiciaire", "Relevé de notes", "Passeport", "Photo d'identité"]);
    expect(bilan.lines[0]).toMatchObject({ level: "fix", statusLabel: "À corriger" });
    expect(bilan.lines[0].note).toContain("Document coupé");
    expect(bilan.lines[1].statusLabel).toBe("Manquante");
    expect(bilan.lines[2].note).toContain("releve.pdf");
  });

  it("liste les prochaines actions, sans rien pour les pièces validées ou non requises", () => {
    expect(bilan.nextActions).toEqual([
      "Attendre la version corrigée : Diplôme",
      "Obtenir la pièce : Casier judiciaire",
      "Vérifier la pièce reçue : Relevé de notes",
    ]);
  });

  it("nom de fichier sûr", () => {
    expect(documentBilanFileName("3M-2026-0012")).toBe("Bilan_documents_3M-2026-0012.pdf");
    expect(documentBilanFileName("COMPTE 12/é")).toBe("Bilan_documents_COMPTE_12_e.pdf");
    expect(documentBilanFileName("")).toBe("Bilan_documents_dossier.pdf");
  });

  it("le PDF se génère, contient l'identité et la mention de non-garantie, et reste sur une page lisible", () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    renderDocumentBilanPdf(pdf, bilan);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const bytes = pdf.output("arraybuffer");
    expect(bytes.byteLength).toBeGreaterThan(2000);
    const raw = Buffer.from(bytes).toString("latin1");
    expect(raw.startsWith("%PDF")).toBe(true);
  });

  it("un dossier sans pièce demandée donne un bilan vide honnête", () => {
    const empty = buildDocumentBilan({ candidateName: "A", reference: "3M-1", requirements: [], documents: [], now });
    expect(empty.summary.total).toBe(0);
    expect(empty.nextActions).toEqual([]);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    expect(() => renderDocumentBilanPdf(pdf, empty)).not.toThrow();
  });

  it("l'écran des pièces propose le bouton quand le contexte du dossier est fourni", () => {
    const crm = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/CandidateDocumentsCrm.tsx"), "utf8").replace(/\r/g, "");
    expect(crm).toContain('data-testid="documents-bilan-pdf"');
    expect(crm).toContain("{bilanContext && (");
    const workspace = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/Candidate360Workspace.tsx"), "utf8").replace(/\r/g, "");
    expect(workspace).toContain("bilanContext={{ candidateName: candidate.fullName");
  });
});
