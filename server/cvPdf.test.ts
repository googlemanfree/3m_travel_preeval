import { describe, expect, it, vi } from "vitest";
import type { CvDraft, CvIdentity } from "../shared/cvDraft";
import { cvPdfFileName, renderCvPdf } from "../client/src/lib/cvPdf";

const identity: CvIdentity = { fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237600000000", city: "Yaoundé", nationality: "Camerounaise" };
const emptyDraft: CvDraft = { headline: null, summary: null, experiences: [], education: [], skills: [], languages: [], certifications: [], missing: [] };
const draft: CvDraft = {
  headline: "Gestionnaire logistique",
  summary: "Gestionnaire logistique avec quatre années d’expérience.",
  experiences: [{ role: "Gestionnaire logistique", employer: "TRANSCAM SA", location: "Douala", start: "2018", end: "2022", bullets: ["Suivi des expéditions", "Gestion des stocks"] }],
  education: [{ degree: "Licence en logistique", institution: "Université de Douala", year: "2017", details: null }],
  skills: ["Logistique", "Excel"],
  languages: [{ language: "Anglais", level: "B2" }],
  certifications: ["SAGE Paie"],
  missing: [],
};

async function render(input: { draft: CvDraft; language?: "fr" | "en"; includeContact?: boolean }) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const text = vi.spyOn(pdf, "text");
  renderCvPdf(pdf, { identity, draft: input.draft, language: input.language ?? "fr", includeContact: input.includeContact ?? false });
  const printed = text.mock.calls.map((call) => String(call[0])).join("\n");
  return { pdf, printed };
}

describe("export PDF du CV (back-office)", () => {
  it("imprime le nom, les sections et le contenu du brouillon relu, avec les libellés de la langue choisie", async () => {
    const fr = await render({ draft });
    for (const expected of ["Aïcha Nkolo", "Gestionnaire logistique", "TRANSCAM SA", "2018 – 2022", "Licence en logistique", "Anglais : B2", "SAGE Paie", "EXPÉRIENCE PROFESSIONNELLE", "FORMATION"]) {
      expect(fr.printed, expected).toContain(expected);
    }
    const en = await render({ draft, language: "en" });
    expect(en.printed).toContain("PROFESSIONAL EXPERIENCE");
    expect(en.printed).toContain("EDUCATION");
  });

  it("les coordonnées du dossier ne sont imprimées que si l'administrateur les inclut", async () => {
    const without = await render({ draft });
    expect(without.printed).not.toContain("aicha@example.com");
    expect(without.printed).not.toContain("+237600000000");
    const withContact = await render({ draft, includeContact: true });
    expect(withContact.printed).toContain("aicha@example.com");
    expect(withContact.printed).toContain("Yaoundé");
  });

  it("n'invente rien : un brouillon vide n'imprime que le nom, sans aucune section", async () => {
    const { printed } = await render({ draft: emptyDraft });
    expect(printed).toContain("Aïcha Nkolo");
    expect(printed).not.toMatch(/EXPÉRIENCE|FORMATION|COMPÉTENCES|LANGUES|CERTIFICATIONS|PROFIL/);
  });

  it("ne imprime pas les puces, blocs ni lignes vides laissés pendant l'édition", async () => {
    const edited: CvDraft = {
      ...draft,
      experiences: [{ ...draft.experiences[0], bullets: ["Suivi des expéditions", "", "   "] }, { role: "", employer: "", location: null, start: null, end: null, bullets: [""] }],
      education: [{ degree: "", institution: null, year: null, details: null }],
      skills: ["Logistique", "", " "],
      certifications: ["", "SAGE Paie"],
    };
    const { printed } = await render({ draft: edited });
    expect(printed).not.toMatch(/•\s*$/m);
    expect(printed).toContain("Suivi des expéditions");
    expect(printed).not.toContain("FORMATION");
    expect(printed.match(/SAGE Paie/g)).toHaveLength(1);
  });

  it("un CV long passe sur plusieurs pages au lieu de déborder", async () => {
    const many: CvDraft = { ...draft, experiences: Array.from({ length: 12 }, (_, i) => ({ ...draft.experiences[0], employer: `Employeur ${i}`, bullets: Array.from({ length: 6 }, (_, j) => `Réalisation numéro ${j} avec un texte assez long pour passer à la ligne dans la colonne du CV, ${i}`) })) };
    const { pdf } = await render({ draft: many });
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("nom de fichier sûr, sans accents ni caractères spéciaux", () => {
    expect(cvPdfFileName("Aïcha Nkolo")).toBe("CV_Aicha_Nkolo.pdf");
    expect(cvPdfFileName("  ../../etc/passwd ")).toBe("CV_etc_passwd.pdf");
    expect(cvPdfFileName("")).toBe("CV_candidat.pdf");
  });
});
