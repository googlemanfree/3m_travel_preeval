/**
 * Utilitaire de génération de PDF pour les rapports d'évaluation Luxembourg
 * Génère un PDF (Buffer) pour l'envoi par e-mail, sur le papier à en-tête officiel de l'agence.
 */

import jsPDF from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../shared/brandLetterhead";
import { loadBrandLogoSync } from "./utils/brandLogo";

export interface LuxembourgEvaluationData {
  fullName: string;
  email: string;
  jobTitle: string;
  yearsExperience: number;
  scoreFormation: number;
  scoreExperience: number;
  scoreFrancais: number;
  scoreAnglais: number;
  scoreSecteur: number;
  scoreCompetences: number;
  scoreBonus: number;
  scoreTotal: number;
  statusLabel: string;
  recommendationText: string;
}

const NAVY: [number, number, number] = [23, 55, 94];
const BLUE: [number, number, number] = [43, 108, 184];
const INK: [number, number, number] = [31, 41, 55];

export function generateLuxembourgPDF(data: LuxembourgEvaluationData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logo = loadBrandLogoSync();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Rapport d'évaluation — Luxembourg",
    recipient: data.fullName,
    subject: data.jobTitle,
    serviceFocus: "Visa travail · Luxembourg",
  };
  const layout = letterheadLayout(letterhead);
  const left = layout.marginLeft;
  const width = layout.contentWidth;
  const right = layout.marginRight;
  let y = layout.firstPageTop + 2;

  const ensure = (needed: number) => {
    if (y + needed <= layout.contentBottom) return;
    doc.addPage();
    y = layout.nextPageTop;
  };
  const heading = (title: string) => {
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...NAVY);
    doc.text(title, left, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
  };

  heading("Informations du candidat");
  doc.setFontSize(10);
  for (const line of [`Nom : ${data.fullName}`, `E-mail : ${data.email}`, `Poste : ${data.jobTitle}`, `Expérience : ${data.yearsExperience} ans`]) {
    ensure(6);
    doc.text(line, left, y);
    y += 6;
  }
  y += 5;

  heading("Score d'éligibilité");
  ensure(32);
  doc.setFillColor(238, 244, 250);
  doc.roundedRect(left, y, width, 28, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...BLUE);
  doc.text(`${data.scoreTotal}/100`, left + 30, y + 18, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(...statusColor(data.statusLabel));
  doc.text(plainStatus(data.statusLabel), left + 62, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  y += 38;

  heading("Détail des points");
  doc.setFontSize(9.5);
  const rows: Array<[string, number]> = [
    ["Formation académique", data.scoreFormation],
    ["Expérience professionnelle", data.scoreExperience],
    ["Français", data.scoreFrancais],
    ["Anglais", data.scoreAnglais],
    ["Secteur professionnel", data.scoreSecteur],
    ["Compétences", data.scoreCompetences],
    ["Bonus soft skills", data.scoreBonus],
  ];
  rows.forEach(([label, points], index) => {
    ensure(7);
    if (index % 2 === 0) {
      doc.setFillColor(244, 248, 252);
      doc.rect(left, y - 4.2, width, 6.4, "F");
    }
    doc.text(label, left + 3, y);
    doc.text(`${points} pts`, right - 3, y, { align: "right" });
    y += 6.4;
  });
  y += 6;

  heading("Critères d'éligibilité");
  const criteria = [
    { label: "Très éligible", range: "80 à 100 points", description: "Excellent profil pour le Luxembourg" },
    { label: "Éligible", range: "70 à 79 points", description: "Bon profil, admission probable" },
    { label: "Modérément éligible", range: "60 à 69 points", description: "Profil acceptable, amélioration recommandée" },
    { label: "Non éligible", range: "moins de 60 points", description: "Profil insuffisant, destinations alternatives proposées" },
  ];
  for (const item of criteria) {
    ensure(11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(item.label, left + 3, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${item.range})`, left + 52, y);
    doc.setTextColor(...INK);
    doc.setFontSize(9);
    doc.text(item.description, left + 3, y + 4.4);
    y += 10.5;
  }
  y += 4;

  heading("Recommandations personnalisées");
  doc.setFontSize(9.5);
  for (const line of doc.splitTextToSize(data.recommendationText, width - 4) as string[]) {
    ensure(5);
    doc.text(line, left + 2, y);
    y += 5;
  }
  y += 6;

  ensure(14);
  doc.setFillColor(...NAVY);
  doc.roundedRect(left, y, width, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Prochaines étapes", left + 4, y + 5.4);
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  const nextSteps = [
    "1. Contactez notre équipe via WhatsApp pour discuter de votre profil",
    "2. Préparez vos documents (diplômes, certificats de travail, tests de langue)",
    "3. Ouvrez votre dossier (frais selon votre profil, confirmés avant paiement)",
    "4. Soumettez vos documents pour vérification",
    "5. Recevez votre rapport d'admissibilité complet",
  ];
  for (const step of nextSteps) {
    ensure(6);
    doc.text(step, left + 2, y);
    y += 6;
  }

  applyLetterhead(doc, letterhead);
  return Buffer.from(doc.output("arraybuffer"));
}

/** Les emojis du libellé ne sont pas imprimables en Helvetica : seul le texte est conservé. */
function plainStatus(status: string): string {
  return status.replace(/[^A-Za-z0-9\u00C0-\u00FF\s'’\-—·]/g, "").replace(/\s+/g, " ").trim();
}

function statusColor(status: string): [number, number, number] {
  if (/non[-\s]/i.test(status)) return [190, 18, 60];
  if (status.includes("Très Éligible")) return [4, 120, 87];
  if (status.includes("Modérément")) return [180, 83, 9];
  if (status.includes("Éligible")) return [29, 78, 216];
  return [190, 18, 60];
}
