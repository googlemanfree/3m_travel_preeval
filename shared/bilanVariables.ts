/**
 * Variables du bilan et générateur de tableau de scores. L'administrateur écrit {{montant}}, {{nom}}… dans le modèle ;
 * elles sont remplacées par les données du dossier à l'aperçu, à la validation, à l'envoi, à l'impression. Une variable inconnue
 * ou sans valeur reste visible : le contrôle « zone à compléter » bloque alors la validation (jamais d'envoi avec un trou).
 */

import { proposedOpeningFee } from "./openingFee";
import { firstName } from "./remoteSupport";

export const BILAN_VARIABLE_NAMES = ["nom", "prenom", "reference", "destination", "visa", "montant", "date", "score"] as const;
export type BilanVariableName = (typeof BILAN_VARIABLE_NAMES)[number];
export type BilanVariableValues = Partial<Record<BilanVariableName, string | number | null | undefined>>;

export const BILAN_VARIABLE_LABELS: Record<BilanVariableName, string> = {
  nom: "Nom complet du candidat",
  prenom: "Prénom",
  reference: "Référence du dossier",
  destination: "Destination",
  visa: "Type de visa / projet",
  montant: "Frais d'ouverture du dossier (selon le profil)",
  date: "Date du jour",
  score: "Score global",
};

/** Valeurs d'un dossier. Le montant est celui du dossier ; à défaut, le montant proposé pour ce type de visa (jamais un 0). */
export function bilanVariablesFrom(input: { fullName: string; dossierNumber?: string | null; destination?: string | null; visaLabel?: string | null; visaType?: string | null; paymentAmount?: number | null; score?: number | null; now?: Date }): BilanVariableValues {
  const amount = typeof input.paymentAmount === "number" && input.paymentAmount > 0 ? input.paymentAmount : proposedOpeningFee(input.visaLabel ?? input.visaType);
  const reference = input.dossierNumber && !input.dossierNumber.startsWith("EVAL-DRAFT-") ? input.dossierNumber : null;
  return {
    nom: input.fullName,
    prenom: firstName(input.fullName),
    reference,
    destination: input.destination ?? null,
    visa: input.visaLabel ?? input.visaType ?? null,
    montant: formatAmount(amount),
    date: (input.now ?? new Date()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    score: typeof input.score === "number" && input.score > 0 ? `${Math.round(input.score)} / 100` : null,
  };
}

/** « 100 000 » avec des espaces ordinaires (lisible partout, y compris dans les PDF et les e-mails). */
export const formatAmount = (amount: number): string => String(Math.trunc(Math.abs(amount))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Remplace {{variable}} (casse et espaces libres) ; les valeurs sont échappées, donc sans effet sur le HTML. */
export function resolveBilanVariables(content: string, values: BilanVariableValues): string {
  return String(content ?? "").replace(/\{\{\s*([A-Za-zéèÉÈ_]{2,20})\s*\}\}/g, (match, rawName: string) => {
    const name = rawName.toLowerCase().replace(/é|è/g, "e") as BilanVariableName;
    if (!(BILAN_VARIABLE_NAMES as readonly string[]).includes(name)) return match;
    const value = values[name];
    if (value === null || value === undefined || String(value).trim() === "") return match;
    return escapeHtml(String(value).trim());
  });
}

export type ScoreRow = { label: string; score: number; max: number };

/** Les huit critères du modèle de préévaluation (total sur 100) ; les libellés se modifient avant insertion. */
export const STANDARD_SCORE_CRITERIA: ReadonlyArray<{ label: string; max: number }> = [
  { label: "Formation et qualification", max: 15 },
  { label: "Expérience et compétences", max: 20 },
  { label: "Employabilité dans le pays visé", max: 15 },
  { label: "Langues", max: 15 },
  { label: "Cohérence du projet", max: 5 },
  { label: "Identité et conformité", max: 10 },
  { label: "Dossier documentaire", max: 10 },
  { label: "Capacité financière renseignée", max: 10 },
];

const clamp = (score: number, max: number) => Math.min(Math.max(Number.isFinite(score) ? Math.round(score) : 0, 0), max);

export function scoreTotals(rows: ScoreRow[]): { total: number; max: number } {
  return rows.reduce((sum, row) => ({ total: sum.total + clamp(row.score, row.max), max: sum.max + row.max }), { total: 0, max: 0 });
}

const WIDTH = 52;
const leader = (label: string, value: string) => `${label} ${".".repeat(Math.max(4, WIDTH - label.length - value.length - 2))} ${value}`;

/** Texte au format du modèle (lignes à points + trait + note globale) : le convertisseur en fait un tableau de scores. */
export function buildScoreText(rows: ScoreRow[]): string {
  const lines = rows.filter((row) => row.label.trim() && row.max > 0).map((row) => leader(row.label.trim(), `${clamp(row.score, row.max)} / ${row.max}`));
  const { total, max } = scoreTotals(rows.filter((row) => row.label.trim() && row.max > 0));
  return [...lines, "─".repeat(WIDTH), leader("NOTE GLOBALE", `${total} / ${max}`)].join("\n");
}
