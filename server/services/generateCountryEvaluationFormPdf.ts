/**
 * PDF d’évaluation préliminaire — structure alignée sur Formulaire_evaluation_Canada_3M
 * (5 sections) avec champs adaptés au profil pays (langues, reconnaissance, liens locaux).
 */

import { jsPDF } from "jspdf";
import type { CountryEvaluationFormTemplate } from "../../shared/countryEvaluationForms";

function header(doc: jsPDF, template: CountryEvaluationFormTemplate, pageLabel: string, pageNum: number, total: number) {
  doc.setFillColor(15, 45, 91);
  doc.rect(0, 0, 210, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3M TRAVEL AGENCY", 14, 10);
  doc.setFontSize(10);
  doc.text(`ÉVALUATION PRÉLIMINAIRE — ${template.countryLabel.toUpperCase()}`, 14, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(pageLabel, 14, 23);
  doc.text(`${pageNum} / ${total}`, 190, 23, { align: "right" });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text("À compléter clairement. Indiquez « Sans objet » si nécessaire. | www.3mtravelagency.com | Confidentiel", 14, 32);
}

function footer(doc: jsPDF) {
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Évaluation indicative 3M TRAVEL AGENCY — Yaoundé · Ottawa — sans garantie d’admissibilité, d’invitation ou de visa.",
    14,
    290,
  );
}

function boxField(doc: jsPDF, label: string, y: number, height = 14): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(label, 16, y);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y + 2, 182, height, 1.5, 1.5, "FD");
  return y + height + 8;
}

function sectionBanner(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(14, y, 182, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, 18, y + 6);
  return y + 14;
}

export function generateCountryEvaluationFormPdf(template: CountryEvaluationFormTemplate): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const profile = template.profile;
  const totalPages = 5;

  // ── Page 1 : Identité, famille, études ──
  header(doc, template, "1. IDENTITÉ, FAMILLE ET ÉTUDES", 1, totalPages);
  let y = 38;
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  const purpose = doc.splitTextToSize(template.purpose, 182);
  doc.text(purpose, 14, y);
  y += purpose.length * 3.8 + 4;
  if (profile) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(30, 64, 175);
    doc.text(doc.splitTextToSize(`Cadre de référence : ${profile.authorityHint}`, 182), 14, y);
    y += 8;
  }

  y = sectionBanner(doc, "IDENTITÉ", y);
  y = boxField(doc, "Nom de référence ou initiales du client :", y, 10);
  y = boxField(doc, "Nom complet :", y, 10);
  y = boxField(doc, "Date de naissance (JJ/MM/AAAA) et âge :", y, 10);
  y = boxField(doc, "Nationalité(s) et pays de résidence :", y, 10);
  y = boxField(doc, "E-mail / WhatsApp :", y, 10);

  y = sectionBanner(doc, "SITUATION FAMILIALE", y);
  y = boxField(doc, "Situation : célibataire / marié(e) / conjoint(e) de fait / autre :", y, 10);
  y = boxField(doc, "Nombre d’enfants et âges :", y, 10);
  y = boxField(doc, "Le conjoint et les enfants accompagneront-ils le candidat ? Précisez :", y, 12);

  y = sectionBanner(doc, "ÉTUDES", y);
  y = boxField(doc, "Diplôme le plus élevé et spécialité :", y, 10);
  y = boxField(doc, "Pays, établissement, année d’obtention et durée des études :", y, 10);
  y = boxField(
    doc,
    profile
      ? `Évaluation / reconnaissance déjà réalisée ? (${profile.diplomaRecognitionHint})`
      : "Évaluation déjà réalisée ? Organisme, date et résultat exact :",
    y,
    16,
  );
  y = boxField(doc, "Autres diplômes pertinents (intitulé, durée, année) :", y, 12);
  footer(doc);

  // ── Page 2 : Expérience ──
  doc.addPage();
  header(doc, template, "2. EXPÉRIENCE PROFESSIONNELLE", 2, totalPages);
  y = 38;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Du plus récent au plus ancien. Indiquez salarié / indépendant et si le poste était rémunéré.", 14, y);
  y += 8;
  for (let i = 1; i <= 3; i += 1) {
    y = sectionBanner(doc, `EMPLOI ${i}`, y);
    y = boxField(doc, "Intitulé du poste, employeur et pays :", y, 10);
    y = boxField(doc, "Dates début / fin ; heures par semaine ; salarié ou indépendant ; rémunéré ?", y, 10);
    y = boxField(doc, "Principales tâches réellement exercées :", y, 22);
  }
  footer(doc);

  // ── Page 3 : Langues et liens ──
  doc.addPage();
  header(doc, template, `3. LANGUES ET LIENS AVEC ${template.countryLabel.toUpperCase()}`, 3, totalPages);
  y = 38;
  y = sectionBanner(doc, "LANGUES", y);
  y = boxField(
    doc,
    profile ? `Niveau estimé : ${profile.languageFocus} :` : "Niveau estimé — langues du pays / anglais / français :",
    y,
    10,
  );
  y = boxField(
    doc,
    profile ? `Tests officiels (ex. ${profile.languageTestsHint}) — nom, date, n° de rapport :` : "Tests officiels — nom, date, numéro de rapport :",
    y,
    14,
  );
  y = boxField(doc, "Résultats par compétence : compréhension orale / écrite ; expression orale / écrite :", y, 16);

  y = sectionBanner(doc, `LIENS AVEC ${template.countryLabel.toUpperCase()}`, y);
  const linkHints = profile?.localLinksHints ?? [
    "Études ou travail déjà effectués dans ce pays",
    "Famille ou réseau sur place",
    "Offre d’emploi, admission, ou hébergement",
    "Zone / région souhaitée",
  ];
  for (const hint of linkHints) {
    y = boxField(doc, `${hint} :`, y, 12);
  }
  footer(doc);

  // ── Page 4 : Budget, historique, conjoint ──
  doc.addPage();
  header(doc, template, "4. BUDGET, HISTORIQUE ET CONJOINT", 4, totalPages);
  y = 38;
  y = sectionBanner(doc, "BUDGET ET HISTORIQUE", y);
  y = boxField(
    doc,
    profile
      ? `Fonds disponibles, devise (${profile.fundsCurrencyHint}) et origine des fonds :`
      : "Fonds disponibles, devise et origine des fonds :",
    y,
    12,
  );
  y = boxField(doc, "Refus de visa : pays, date et motif (ou aucun) :", y, 12);
  y = boxField(doc, `Demandes en cours pour ${template.countryLabel} : type, date et état (ou aucun) :`, y, 12);
  y = boxField(doc, "Éléments particuliers à signaler :", y, 14);

  y = sectionBanner(doc, "CONJOINT — remplir si applicable", y);
  y = boxField(doc, "Âge, nationalité et profession du conjoint :", y, 10);
  y = boxField(doc, "Diplômes : intitulés, durée et pays d’obtention :", y, 10);
  y = boxField(doc, "Expérience professionnelle : postes, pays et durées :", y, 12);
  y = boxField(doc, "Langues : niveaux ; tests, dates et résultats :", y, 12);
  y = boxField(doc, "Évaluation / reconnaissance des diplômes du conjoint :", y, 12);
  footer(doc);

  // ── Page 5 : Objectif, documents, déclaration ──
  doc.addPage();
  header(doc, template, "5. OBJECTIF ET VALIDATION DES INFORMATIONS", 5, totalPages);
  y = 38;
  y = sectionBanner(doc, "OBJECTIF", y);
  y = boxField(
    doc,
    profile ? `Objectif : ${profile.objectiveOptions} :` : "Objectif : résidence / travail / études / autre :",
    y,
    12,
  );
  y = boxField(doc, "Autres options à examiner et délai souhaité :", y, 12);
  y = boxField(doc, "Informations complémentaires ou précisions utiles :", y, 14);

  y = sectionBanner(doc, "DOCUMENTS À TRANSMETTRE SI DISPONIBLES", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const docs = profile?.priorityDocuments ?? [
    "CV à jour ; diplômes et relevés de notes",
    "Résultats des tests linguistiques ; attestations d’emploi détaillées",
    "Décisions de refus antérieures et documents utiles au projet",
  ];
  for (const item of docs) {
    doc.text(`• ${item}`, 16, y, { maxWidth: 178 });
    y += 6;
  }
  y += 4;

  y = sectionBanner(doc, "DÉCLARATION DU CLIENT", y);
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const declaration = [
    "Je confirme que les renseignements fournis sont exacts à ma connaissance.",
    "J’autorise 3M Travel Agency à les examiner pour cette évaluation préliminaire.",
    "Ne pas inscrire de numéro de passeport ni de données bancaires sur ce formulaire.",
  ];
  for (const line of declaration) {
    doc.text(line, 16, y);
    y += 5;
  }
  y += 4;
  y = boxField(doc, "Je confirme la déclaration ci-dessus (oui) :", y, 10);
  y = boxField(doc, "Nom du déclarant :", y, 10);
  y = boxField(doc, "Date (JJ/MM/AAAA) :", y, 10);

  y += 2;
  y = sectionBanner(doc, "INSTRUCTIONS", y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  for (const step of template.instructions) {
    const lines = doc.splitTextToSize(`• ${step}`, 178);
    doc.text(lines, 16, y);
    y += lines.length * 4 + 2;
  }
  footer(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
