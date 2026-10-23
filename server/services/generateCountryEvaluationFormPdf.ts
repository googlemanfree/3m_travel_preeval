/**
 * PDF d’évaluation préliminaire — structure alignée sur Formulaire_evaluation_Canada_3M
 * (5 parties) avec champs adaptés au profil pays (langues, reconnaissance, liens locaux).
 * Mis en page sur le papier à en-tête officiel : la pagination est automatique (aucun champ n'est coupé en bas de page).
 */

import { jsPDF } from "jspdf";
import type { CountryEvaluationFormTemplate } from "../../shared/countryEvaluationForms";
import { applyLetterhead, letterheadLayout, serviceFocusLabel, type LetterheadOptions } from "../../shared/brandLetterhead";

type Cursor = { y: number };
const LAYOUT = letterheadLayout({ documentKind: "x" });

/** Passe à la page suivante quand il ne reste pas assez de place ; l'en-tête compact est peint à la fin par applyLetterhead. */
function room(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed <= LAYOUT.contentBottom) return;
  doc.addPage();
  cursor.y = LAYOUT.nextPageTop;
}

function partTitle(doc: jsPDF, cursor: Cursor, title: string): void {
  room(doc, cursor, 40);
  doc.setTextColor(23, 55, 94);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(title, 18, cursor.y);
  doc.setDrawColor(43, 108, 184);
  doc.setLineWidth(0.6);
  doc.line(18, cursor.y + 2, 46, cursor.y + 2);
  cursor.y += 9;
}

function boxField(doc: jsPDF, cursor: Cursor, label: string, height = 14): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(label, 170) as string[];
  room(doc, cursor, lines.length * 3.6 + height + 6);
  doc.setTextColor(30, 41, 59);
  doc.text(lines, 19, cursor.y);
  const top = cursor.y + (lines.length - 1) * 3.6 + 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, top, 174, height, 1.5, 1.5, "FD");
  cursor.y = top + height + 6;
}

function sectionBanner(doc: jsPDF, cursor: Cursor, title: string): void {
  room(doc, cursor, 32);
  doc.setFillColor(43, 108, 184);
  doc.roundedRect(18, cursor.y, 174, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(title, 22, cursor.y + 5.6);
  cursor.y += 13;
}

function paragraph(doc: jsPDF, cursor: Cursor, text: string, options: { x?: number; width?: number; lineHeight?: number; gap?: number } = {}): void {
  const x = options.x ?? 18;
  const lineHeight = options.lineHeight ?? 4;
  const lines = doc.splitTextToSize(text, options.width ?? 174) as string[];
  for (const line of lines) {
    room(doc, cursor, lineHeight);
    doc.text(line, x, cursor.y);
    cursor.y += lineHeight;
  }
  cursor.y += options.gap ?? 1.5;
}

export function generateCountryEvaluationFormPdf(template: CountryEvaluationFormTemplate, logo?: { dataUri: string; format: "PNG" | "JPEG" } | null): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const profile = template.profile;
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: `Évaluation préliminaire — ${template.countryLabel}`,
    subject: "Formulaire à compléter · Confidentiel",
    serviceFocus: serviceFocusLabel("visa", template.countryLabel),
  };
  const cursor: Cursor = { y: letterheadLayout(letterhead).firstPageTop + 2 };

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  paragraph(doc, cursor, template.purpose);
  paragraph(doc, cursor, "À compléter clairement. Indiquez « Sans objet » si nécessaire.", { gap: 2 });
  if (profile) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(30, 64, 175);
    paragraph(doc, cursor, `Cadre de référence : ${profile.authorityHint}`, { gap: 4 });
  }

  // ── 1. Identité, famille, études ──
  partTitle(doc, cursor, "1. IDENTITÉ, FAMILLE ET ÉTUDES");
  sectionBanner(doc, cursor, "IDENTITÉ");
  boxField(doc, cursor, "Nom de référence ou initiales du client :", 10);
  boxField(doc, cursor, "Nom complet :", 10);
  boxField(doc, cursor, "Date de naissance (JJ/MM/AAAA) et âge :", 10);
  boxField(doc, cursor, "Nationalité(s) et pays de résidence :", 10);
  boxField(doc, cursor, "E-mail / WhatsApp :", 10);

  sectionBanner(doc, cursor, "SITUATION FAMILIALE");
  boxField(doc, cursor, "Situation : célibataire / marié(e) / conjoint(e) de fait / autre :", 10);
  boxField(doc, cursor, "Nombre d’enfants et âges :", 10);
  boxField(doc, cursor, "Le conjoint et les enfants accompagneront-ils le candidat ? Précisez :", 12);

  sectionBanner(doc, cursor, "ÉTUDES");
  boxField(doc, cursor, "Diplôme le plus élevé et spécialité :", 10);
  boxField(doc, cursor, "Pays, établissement, année d’obtention et durée des études :", 10);
  boxField(
    doc,
    cursor,
    profile
      ? `Évaluation / reconnaissance déjà réalisée ? (${profile.diplomaRecognitionHint})`
      : "Évaluation déjà réalisée ? Organisme, date et résultat exact :",
    16,
  );
  boxField(doc, cursor, "Autres diplômes pertinents (intitulé, durée, année) :", 12);

  // ── 2. Expérience ──
  partTitle(doc, cursor, "2. EXPÉRIENCE PROFESSIONNELLE");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  paragraph(doc, cursor, "Du plus récent au plus ancien. Indiquez salarié / indépendant et si le poste était rémunéré.", { gap: 3 });
  for (let i = 1; i <= 3; i += 1) {
    sectionBanner(doc, cursor, `EMPLOI ${i}`);
    boxField(doc, cursor, "Intitulé du poste, employeur et pays :", 10);
    boxField(doc, cursor, "Dates début / fin ; heures par semaine ; salarié ou indépendant ; rémunéré ?", 10);
    boxField(doc, cursor, "Principales tâches réellement exercées :", 22);
  }

  // ── 3. Langues et liens ──
  partTitle(doc, cursor, `3. LANGUES ET LIENS AVEC ${template.countryLabel.toUpperCase()}`);
  sectionBanner(doc, cursor, "LANGUES");
  boxField(doc, cursor, profile ? `Niveau estimé : ${profile.languageFocus} :` : "Niveau estimé — langues du pays / anglais / français :", 10);
  boxField(
    doc,
    cursor,
    profile ? `Tests officiels (ex. ${profile.languageTestsHint}) — nom, date, n° de rapport :` : "Tests officiels — nom, date, numéro de rapport :",
    14,
  );
  boxField(doc, cursor, "Résultats par compétence : compréhension orale / écrite ; expression orale / écrite :", 16);

  sectionBanner(doc, cursor, `LIENS AVEC ${template.countryLabel.toUpperCase()}`);
  const linkHints = profile?.localLinksHints ?? [
    "Études ou travail déjà effectués dans ce pays",
    "Famille ou réseau sur place",
    "Offre d’emploi, admission, ou hébergement",
    "Zone / région souhaitée",
  ];
  for (const hint of linkHints) boxField(doc, cursor, `${hint} :`, 12);

  // ── 4. Budget, historique, conjoint ──
  partTitle(doc, cursor, "4. BUDGET, HISTORIQUE ET CONJOINT");
  sectionBanner(doc, cursor, "BUDGET ET HISTORIQUE");
  boxField(
    doc,
    cursor,
    profile ? `Fonds disponibles, devise (${profile.fundsCurrencyHint}) et origine des fonds :` : "Fonds disponibles, devise et origine des fonds :",
    12,
  );
  boxField(doc, cursor, "Refus de visa : pays, date et motif (ou aucun) :", 12);
  boxField(doc, cursor, `Demandes en cours pour ${template.countryLabel} : type, date et état (ou aucun) :`, 12);
  boxField(doc, cursor, "Éléments particuliers à signaler :", 14);

  sectionBanner(doc, cursor, "CONJOINT — remplir si applicable");
  boxField(doc, cursor, "Âge, nationalité et profession du conjoint :", 10);
  boxField(doc, cursor, "Diplômes : intitulés, durée et pays d’obtention :", 10);
  boxField(doc, cursor, "Expérience professionnelle : postes, pays et durées :", 12);
  boxField(doc, cursor, "Langues : niveaux ; tests, dates et résultats :", 12);
  boxField(doc, cursor, "Évaluation / reconnaissance des diplômes du conjoint :", 12);

  // ── 5. Objectif, documents, déclaration ──
  partTitle(doc, cursor, "5. OBJECTIF ET VALIDATION DES INFORMATIONS");
  sectionBanner(doc, cursor, "OBJECTIF");
  boxField(doc, cursor, profile ? `Objectif : ${profile.objectiveOptions} :` : "Objectif : résidence / travail / études / autre :", 12);
  boxField(doc, cursor, "Autres options à examiner et délai souhaité :", 12);
  boxField(doc, cursor, "Informations complémentaires ou précisions utiles :", 14);

  sectionBanner(doc, cursor, "DOCUMENTS À TRANSMETTRE SI DISPONIBLES");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const docs = profile?.priorityDocuments ?? [
    "CV à jour ; diplômes et relevés de notes",
    "Résultats des tests linguistiques ; attestations d’emploi détaillées",
    "Décisions de refus antérieures et documents utiles au projet",
  ];
  for (const item of docs) paragraph(doc, cursor, `• ${item}`, { x: 19, width: 170, lineHeight: 4.2, gap: 1.2 });
  cursor.y += 3;

  sectionBanner(doc, cursor, "DÉCLARATION DU CLIENT");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  for (const line of [
    "Je confirme que les renseignements fournis sont exacts à ma connaissance.",
    "J’autorise 3M Travel Agency à les examiner pour cette évaluation préliminaire.",
    "Ne pas inscrire de numéro de passeport ni de données bancaires sur ce formulaire.",
  ]) paragraph(doc, cursor, line, { x: 19, lineHeight: 4.4, gap: 0.8 });
  cursor.y += 3;
  boxField(doc, cursor, "Je confirme la déclaration ci-dessus (oui) :", 10);
  boxField(doc, cursor, "Nom du déclarant :", 10);
  boxField(doc, cursor, "Date (JJ/MM/AAAA) :", 10);

  cursor.y += 2;
  sectionBanner(doc, cursor, "INSTRUCTIONS");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  for (const step of template.instructions) paragraph(doc, cursor, `• ${step}`, { x: 19, width: 170, lineHeight: 4.2, gap: 1.6 });

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  paragraph(doc, cursor, "Évaluation indicative 3M TRAVEL AGENCY — sans garantie d’admissibilité, d’invitation ou de visa.", { gap: 0 });

  applyLetterhead(doc, letterhead);
  return Buffer.from(doc.output("arraybuffer"));
}
