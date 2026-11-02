import { describe, expect, it } from "vitest";
import { ADMIN_MESSAGE_TEMPLATES, buildWhatsAppRelance, fillAdminTemplate, templateForStage } from "../shared/adminOpsToolkit";
import { findForbiddenTerms } from "../shared/evaluationValidation";
import { missingPiecesForCandidate } from "./services/relanceMissingPieces";

const VARS = { name: "Awa Diop", reference: "COMPTE-00012", destination: "Allemagne", visaType: "Visa études" };

describe("modèles de relance améliorés", () => {
  it("chaque modèle se remplit sans accolade restante, sans promesse de résultat ni montant imposé", () => {
    for (const template of ADMIN_MESSAGE_TEMPLATES) {
      const filled = fillAdminTemplate(template, VARS);
      for (const text of [filled.subject, filled.body, filled.short]) {
        expect(text, template.id).not.toMatch(/\{[a-zA-Z]+\}/);
        expect(findForbiddenTerms(text), template.id).toEqual([]);
        expect(text, template.id).not.toMatch(/\b\d{2,3}[ .]?000\s?(?:XAF|FCFA|F)\b/i);
      }
      expect(filled.body, template.id).toContain("Cordialement");
    }
  });

  it("les relances d'action sont en étapes numérotées avec un lien direct et une ligne d'aide", () => {
    for (const id of ["cv_missing", "conversion_open_dossier", "documents_pending", "phone_update", "payment_proof_unclear"] as const) {
      const body = fillAdminTemplate(templateForStage(id), VARS).body;
      expect(body, id).toMatch(/1\. /);
      expect(body, id).toContain("https://www.3mtravelagency.com/mon-espace");
    }
    // la photo : liste de consignes plutôt que des étapes
    expect(fillAdminTemplate(templateForStage("passport_photo_missing"), VARS).body).toContain("• de face");
    expect(fillAdminTemplate(templateForStage("cv_missing"), VARS).body).toContain("Répondez simplement à ce message");
  });

  it("couvre téléphone, photo, preuve illisible, passeport et rendez-vous", () => {
    const ids = ADMIN_MESSAGE_TEMPLATES.map((template) => template.id);
    for (const id of ["phone_update", "passport_photo_missing", "passport_validity", "payment_proof_unclear", "appointment_followup"]) expect(ids).toContain(id);
    expect(ADMIN_MESSAGE_TEMPLATES[ADMIN_MESSAGE_TEMPLATES.length - 1].id).toBe("generic");
  });

  it("insère la liste exacte des pièces manquantes, et rien quand il n'y en a pas", () => {
    const withItems = fillAdminTemplate(templateForStage("documents_pending", "etudes"), { ...VARS, missingItems: ["Passeport valide", "Relevés de notes"] });
    expect(withItems.body).toContain("Pièces encore attendues :\n• Passeport valide\n• Relevés de notes");
    expect(withItems.short).toContain("Attendu : Passeport valide, Relevés de notes.");
    const without = fillAdminTemplate(templateForStage("documents_pending", "etudes"), VARS);
    expect(without.body).not.toContain("Pièces encore attendues");
    expect(without.body).not.toMatch(/\n{3,}/);
  });

  it("WhatsApp reçoit la version courte (un seul lien), pas le corps complet", () => {
    const url = buildWhatsAppRelance({ phone: "698104832", name: "Awa", reference: "COMPTE-00012", stage: "cv_missing" })!;
    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text.length).toBeLessThan(420);
    expect((text.match(/https:\/\//g) ?? []).length).toBe(1);
  });

  it("l'évaluation visiteur ou études ne réclame plus de CV : le formulaire suffit", () => {
    const visiteur = fillAdminTemplate(templateForStage("evaluation_missing", "tourisme"), VARS).body;
    expect(visiteur).toContain("sans CV");
    const etudes = fillAdminTemplate(templateForStage("evaluation_missing", "etudes"), VARS).body;
    expect(etudes).toContain("sans CV obligatoire");
    expect(etudes.toLowerCase()).not.toContain("cv actualisé");
  });
});

/** Base minimale : 1re requête = dernière évaluation, 2e = fichiers déposés. */
function fakeDb(projectDetailsJson: string | null, files: Array<{ fileType: string; fileName: string }>) {
  let call = 0;
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => (projectDetailsJson ? [{ projectDetailsJson }] : []), then: undefined };
  const filesChain: any = { from: () => filesChain, where: async () => files };
  return { select: () => (call++ === 0 ? chain : filesChain) };
}

describe("pièces manquantes d'un candidat", () => {
  const candidate = { id: 7, email: "awa@example.com" };

  it("retire les pièces déjà déposées et garde les autres", async () => {
    const details = JSON.stringify({ programId: "etudes-cursus", programFamily: "study_degree" });
    const all = await missingPiecesForCandidate(fakeDb(details, []), candidate);
    expect(all.length).toBeGreaterThan(1);
    const withPassport = await missingPiecesForCandidate(fakeDb(details, [{ fileType: "passeport", fileName: "mon-passeport.pdf" }]), candidate);
    expect(withPassport.length).toBeLessThan(all.length);
  });

  it("renvoie [] sans évaluation, sans programme ou en cas d'erreur", async () => {
    expect(await missingPiecesForCandidate(fakeDb(null, []), candidate)).toEqual([]);
    expect(await missingPiecesForCandidate(fakeDb(JSON.stringify({ programId: "etudes-orientation" }), []), candidate)).toEqual([]);
    expect(await missingPiecesForCandidate({ select: () => { throw new Error("db"); } }, candidate)).toEqual([]);
  });
});
