/**
 * Génère un PDF d’évaluation préliminaire structuré (pays hors Canada).
 * Aligné sur les sections du Formulaire_evaluation_Canada_3M : identité, famille,
 * études, emplois, langues, liens destination, budget, objectif, déclaration.
 */

import { jsPDF } from "jspdf";
import type { CountryEvaluationFormTemplate } from "../../shared/countryEvaluationForms";

function lineField(doc: jsPDF, label: string, x: number, y: number, width: number): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(label, x, y);
  doc.setDrawColor(148, 163, 184);
  doc.line(x, y + 3.5, x + width, y + 3.5);
  return y + 12;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(14, y - 5, 182, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, 18, y);
  return y + 12;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need < 285) return y;
  doc.addPage();
  return 20;
}

export function generateCountryEvaluationFormPdf(template: CountryEvaluationFormTemplate): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const country = template.countryLabel;

  doc.setFillColor(15, 45, 91);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("3M TRAVEL AGENCY", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(template.formTitle, 14, 20);
  doc.setFontSize(8);
  doc.text("Formulaire remplissable / imprimable — évaluation préliminaire (indicatif)", 14, 25);

  let y = 36;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  const purposeLines = doc.splitTextToSize(template.purpose, 182);
  doc.text(purposeLines, 14, y);
  y += purposeLines.length * 4 + 6;

  y = sectionTitle(doc, "1. Identité du candidat", y);
  y = lineField(doc, "Nom complet", 14, y, 182);
  y = lineField(doc, "Date de naissance (JJ/MM/AAAA) / âge", 14, y, 88);
  y = lineField(doc, "Nationalité(s)", 108, y - 12, 88);
  y = lineField(doc, "Pays / ville de résidence", 14, y, 88);
  y = lineField(doc, "E-mail", 108, y - 12, 88);
  y = lineField(doc, "WhatsApp / téléphone", 14, y, 182);

  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "2. Situation familiale", y);
  y = lineField(doc, "Statut marital", 14, y, 88);
  y = lineField(doc, "Nombre d’enfants / âges", 108, y - 12, 88);
  y = lineField(doc, "Personnes à charge accompagneront-elles le projet ? (oui / non / à préciser)", 14, y, 182);

  y = ensureSpace(doc, y, 50);
  y = sectionTitle(doc, "3. Études et diplômes", y);
  y = lineField(doc, "Diplôme le plus élevé et spécialité", 14, y, 182);
  y = lineField(doc, "Établissement / pays / année / durée", 14, y, 182);
  y = lineField(doc, "Autres diplômes", 14, y, 182);
  y = lineField(doc, "Évaluation / reconnaissance des diplômes (organisme, date, résultat) — si applicable", 14, y, 182);

  y = ensureSpace(doc, y, 70);
  y = sectionTitle(doc, "4. Expérience professionnelle (3 emplois max., du plus récent)", y);
  for (let i = 1; i <= 3; i += 1) {
    y = ensureSpace(doc, y, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text(`Emploi ${i}`, 14, y);
    y += 6;
    y = lineField(doc, "Intitulé / employeur", 14, y, 182);
    y = lineField(doc, "Pays / dates (début → fin ou « présent ») / heures par semaine", 14, y, 182);
    y = lineField(doc, "Principales tâches réellement exercées", 14, y, 182);
  }

  y = ensureSpace(doc, y, 45);
  y = sectionTitle(doc, "5. Langues", y);
  y = lineField(doc, "Niveau estimé — langue(s) du pays / anglais / français", 14, y, 182);
  y = lineField(doc, "Tests officiels (nom, date, notes) — si déjà passés", 14, y, 182);

  y = ensureSpace(doc, y, 45);
  y = sectionTitle(doc, `6. Liens avec ${country}`, y);
  y = lineField(doc, "Études ou travail déjà effectués dans ce pays", 14, y, 182);
  y = lineField(doc, "Famille / réseau sur place (lien, ville, statut)", 14, y, 182);
  y = lineField(doc, "Offre d’emploi, admission, ou province / région ciblée", 14, y, 182);

  y = ensureSpace(doc, y, 45);
  y = sectionTitle(doc, "7. Budget et historique", y);
  y = lineField(doc, "Fonds disponibles (montant, devise, origine)", 14, y, 182);
  y = lineField(doc, "Refus de visa antérieurs (pays, date, motif) — ou « aucun »", 14, y, 182);
  y = lineField(doc, "Demandes en cours pour cette destination — ou « aucun »", 14, y, 182);

  y = ensureSpace(doc, y, 50);
  y = sectionTitle(doc, "8. Objectif et déclaration", y);
  y = lineField(doc, "Objectif (résidence / travail / études / autre) et délai souhaité", 14, y, 182);
  y = lineField(doc, "Informations complémentaires utiles au conseiller", 14, y, 182);
  y += 2;
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Je confirme que les renseignements fournis sont exacts à ma connaissance et j’autorise 3M TRAVEL AGENCY à les examiner pour cette évaluation préliminaire. Ne pas inscrire de numéro de passeport ni de données bancaires.",
    14,
    y,
    { maxWidth: 182 },
  );
  y += 14;
  y = lineField(doc, "Nom du déclarant / date / signature", 14, y, 182);

  y = ensureSpace(doc, y, 40);
  y = sectionTitle(doc, "9. Instructions (à conserver)", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  for (const step of template.instructions) {
    y = ensureSpace(doc, y, 12);
    const lines = doc.splitTextToSize(`• ${step}`, 182);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 3;
  }

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Document indicatif 3M TRAVEL AGENCY — Yaoundé · Ottawa · hello@3mtravelagency.com — sans garantie de visa, d’admission ou d’emploi.",
    14,
    290,
  );

  return Buffer.from(doc.output("arraybuffer"));
}
