/**
 * Repères de frais / délais pour corridors prioritaires, alignés sur les portails
 * institutionnels (vérification affichée le 14 octobre 2026).
 * Les montants hors ce tableau restent indicatifs et renvoient au portail officiel.
 */
export type VerifiedProcedureFee = {
  procedureId: string;
  /** Devise ISO affichée (EUR, CAD…). */
  currency: string;
  /** Libellé court pour l’annuaire / fiche. */
  costLabel: string;
  /** Délai affiché (indicatif, à confirmer). */
  delayLabel: string;
  /** Lien institutionnel prioritaire. */
  officialUrl: string;
  note: string;
};

export const VERIFIED_PROCEDURE_FEES: Record<string, VerifiedProcedureFee> = {
  "france-visiteur": {
    procedureId: "france-visiteur",
    currency: "EUR",
    costLabel: "80 EUR (visa Schengen C adulte — barème UE)",
    delayLabel: "Souvent ~15 jours, jusqu’à 45 selon le dossier",
    officialUrl: "https://france-visas.gouv.fr/visa-de-court-sejour",
    note: "Frais et délais officiels à confirmer sur France-Visas pour votre nationalité (vérifié le 14 octobre 2026).",
  },
  "france-etudes": {
    procedureId: "france-etudes",
    currency: "EUR",
    costLabel: "Selon France-Visas / VLS-TS (souvent ~99 EUR)",
    delayLabel: "Selon Campus France et le consulat",
    officialUrl: "https://france-visas.gouv.fr/etudiant",
    note: "Montant exact et délais varient selon durée et nationalité — confirmez sur France-Visas (vérifié le 14 octobre 2026).",
  },
  "france-travail": {
    procedureId: "france-travail",
    currency: "EUR",
    costLabel: "Selon le titre (souvent 99–180 EUR)",
    delayLabel: "Selon autorisation de travail et consulat",
    officialUrl: "https://france-visas.gouv.fr/activite-salariee",
    note: "Le régime (salarié, temporaire, talent) détermine frais et délais — France-Visas (vérifié le 14 octobre 2026).",
  },
  "canada-travail": {
    procedureId: "canada-travail",
    currency: "CAD",
    costLabel: "155 CAD permis + 85 CAD biométrie (si exigée)",
    delayLabel: "Selon IRCC et le type de permis",
    officialUrl: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada.html",
    note: "Frais IRCC publiés ; EIMT/employeur peuvent s’ajouter — confirmez sur Canada.ca (vérifié le 14 octobre 2026).",
  },
  "canada-etudes": {
    procedureId: "canada-etudes",
    currency: "CAD",
    costLabel: "150 CAD permis d’études + 85 CAD biométrie (si exigée)",
    delayLabel: "Selon IRCC et l’établissement",
    officialUrl: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes.html",
    note: "Frais IRCC publiés ; CAQ (Québec) distinct — confirmez sur Canada.ca (vérifié le 14 octobre 2026).",
  },
  "allemagne-travail": {
    procedureId: "allemagne-travail",
    currency: "EUR",
    costLabel: "75 EUR (visa national D — barème courant)",
    delayLabel: "Souvent 4–8 semaines selon le consulat",
    officialUrl: "https://www.make-it-in-germany.com/fr/visa-sejour/types/travailleurs-qualifies",
    note: "Frais de visa nationaux allemands ; confirmez sur Make it in Germany / Auswärtiges Amt (vérifié le 14 octobre 2026).",
  },
  "allemagne-etudes": {
    procedureId: "allemagne-etudes",
    currency: "EUR",
    costLabel: "75 EUR (visa national D — barème courant)",
    delayLabel: "Souvent 4–8 semaines selon le consulat",
    officialUrl: "https://www.auswaertiges-amt.de/fr/02-entree-sejour/02-etudier-en-allemagne-seite-1281874",
    note: "Frais et délais à confirmer auprès de la mission allemande compétente (vérifié le 14 octobre 2026).",
  },
  "allemagne-visiteur": {
    procedureId: "allemagne-visiteur",
    currency: "EUR",
    costLabel: "80 EUR (visa Schengen C adulte — barème UE)",
    delayLabel: "Souvent ~15 jours, jusqu’à 45 selon le dossier",
    officialUrl: "https://www.auswaertiges-amt.de/fr/02-entree-sejour/01-visabestimmungen-1361042",
    note: "Barème Schengen UE ; confirmez sur le portail allemand (vérifié le 14 octobre 2026).",
  },
  "luxembourg-travail": {
    procedureId: "luxembourg-travail",
    currency: "EUR",
    costLabel: "Selon Guichet.lu / autorisation (souvent ~80 EUR visa)",
    delayLabel: "Selon ADEM et Direction de l’immigration",
    officialUrl: "https://guichet.public.lu/fr/citoyens/immigration/vivre/non-luxembourg/immigration/pays-tiers/salarie.html",
    note: "Autorisation de séjour et visa distincts — confirmez sur Guichet.lu (vérifié le 14 octobre 2026).",
  },
  "luxembourg-visiteur": {
    procedureId: "luxembourg-visiteur",
    currency: "EUR",
    costLabel: "80 EUR (visa Schengen C adulte — barème UE)",
    delayLabel: "Souvent ~15 jours, jusqu’à 45 selon le dossier",
    officialUrl: "https://guichet.public.lu/fr/citoyens/immigration/visite/loisir.html",
    note: "Barème Schengen UE ; confirmez sur Guichet.lu (vérifié le 14 octobre 2026).",
  },
};

export function getVerifiedProcedureFee(procedureId: string): VerifiedProcedureFee | undefined {
  return VERIFIED_PROCEDURE_FEES[procedureId];
}
