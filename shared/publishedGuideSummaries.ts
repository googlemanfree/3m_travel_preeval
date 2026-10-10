/**
 * Résumés dynamiques des guides PDF publiés — même contenu structuré pour
 * l’admin, l’espace client, /guide-procedures et les fiches pays.
 * Dérivé du traitement publié (étapes + documents + portail), pas d’invention
 * hors catalogue.
 */

import {
  publishedProcedureKindLabel,
  resolvePublishedProcedureTreatment,
  type PublishedProcedureKind,
  type PublishedProcedureTreatment,
} from "./publishedProcedureTreatment";
import { procedures107Complete } from "../client/src/data/procedures107Complete";

export type PublishedGuideSummary = {
  headline: string;
  audienceLine: string;
  overview: string;
  stepHighlights: string[];
  keyDocuments: string[];
  officialPortalLabel: string;
  officialPortalUrl: string;
  pdfTitle: string;
  pdfUrl: string;
  country: string;
  visaKind: PublishedProcedureKind;
  visaLabel: string;
  procedureId: string;
};

const fold = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function portalLabelFromUrl(url: string, country: string): string {
  const key = fold(url);
  if (/canada\.ca|ircc/.test(key)) return "IRCC / Canada.ca";
  if (/guichet\.public\.lu|adem\.public\.lu/.test(key)) return "Guichet.lu / ADEM";
  if (/france-visas|diplomatie\.gouv/.test(key)) return "France-Visas";
  if (/make-it-in-germany|auswaertiges/.test(key)) return "Make it in Germany / AA";
  if (/gov\.uk/.test(key)) return "GOV.UK";
  if (/homeaffairs\.gov/.test(key)) return "Home Affairs (AU)";
  if (/immigration\.govt\.nz/.test(key)) return "Immigration New Zealand";
  return `Portail officiel · ${country}`;
}

function overviewFor(treatment: PublishedProcedureTreatment): string {
  const visa = publishedProcedureKindLabel(treatment.visaKind).toLowerCase();
  const stepCount = treatment.countrySteps.length;
  const docs = treatment.documents.length;
  const base =
    `Résumé opérationnel du guide « ${treatment.guideTitle} » pour ${treatment.country} (${visa}) : `
    + `${stepCount} étape(s) pays/visa et ${docs || "plusieurs"} pièce(s) de référence. `;
  if (fold(treatment.country).includes("canada") && treatment.visaKind === "travail") {
    return `${base}Le parcours couvre le profil, l’offre d’emploi, l’EIMT/LMIA le cas échéant, la demande IRCC, la biométrie et l’arrivée.`;
  }
  if (fold(treatment.country).includes("canada") && treatment.visaKind === "etudes") {
    return `${base}Le parcours couvre le projet d’études, l’admission DLI, le CAQ si Québec, les fonds, la demande IRCC et l’arrivée.`;
  }
  if (fold(treatment.country).includes("luxembourg") && treatment.visaKind === "travail") {
    return `${base}Le parcours couvre l’employeur, la déclaration ADEM, l’autorisation de séjour salarié, le visa D et l’arrivée.`;
  }
  if (fold(treatment.country).includes("luxembourg") && treatment.visaKind === "etudes") {
    return `${base}Le parcours couvre l’admission, les moyens, l’autorisation de séjour étudiant, le visa D et les formalités d’arrivée.`;
  }
  return `${base}Chaque étape doit être confirmée sur le portail institutionnel avant dépôt.`;
}

/** Construit le résumé publié à partir d’un traitement déjà résolu. */
export function buildPublishedGuideSummary(
  treatment: PublishedProcedureTreatment,
): PublishedGuideSummary {
  const visaLabel = publishedProcedureKindLabel(treatment.visaKind);
  const catalogue = procedures107Complete.find((item) => item.id === treatment.procedureId);
  const catalogueHint = catalogue?.description?.trim();
  return {
    headline: `${treatment.country} · ${visaLabel}`,
    audienceLine: `Même guide pour l’administration et l’espace candidat — programme ${treatment.programLabel}.`,
    overview: catalogueHint
      ? `${overviewFor(treatment)} ${catalogueHint}`
      : overviewFor(treatment),
    stepHighlights: treatment.countrySteps.slice(0, 6).map((step) => step.label),
    keyDocuments: Array.from(new Set(treatment.documents)).slice(0, 8),
    officialPortalLabel: portalLabelFromUrl(treatment.officialSourceUrl, treatment.country),
    officialPortalUrl: treatment.officialSourceUrl,
    pdfTitle: treatment.guideTitle,
    pdfUrl: treatment.pdfUrl,
    country: treatment.country,
    visaKind: treatment.visaKind,
    visaLabel,
    procedureId: treatment.procedureId,
  };
}

/** Résout pays + visa puis renvoie le résumé (null si aucune fiche). */
export function resolvePublishedGuideSummary(
  destination?: string | null,
  visaType?: string | null,
  procedureLabel?: string | null,
): PublishedGuideSummary | null {
  const treatment = resolvePublishedProcedureTreatment(destination, visaType, procedureLabel);
  if (!treatment) return null;
  return buildPublishedGuideSummary(treatment);
}

/** Résumé court pour une ressource PDF du guide (par id ou pays/catégorie). */
export function summarizePdfResource(input: {
  country: string;
  category: string;
  title: string;
  url: string;
}): PublishedGuideSummary | null {
  const kind =
    input.category === "etudes" || input.category === "visiteur" || input.category === "travail"
      ? input.category
      : /etud/i.test(input.title)
        ? "etudes"
        : /visit|touris/i.test(input.title)
          ? "visiteur"
          : "travail";
  const summary = resolvePublishedGuideSummary(input.country.split("/")[0].trim(), kind);
  if (!summary) return null;
  return {
    ...summary,
    pdfTitle: input.title || summary.pdfTitle,
    pdfUrl: input.url || summary.pdfUrl,
  };
}
