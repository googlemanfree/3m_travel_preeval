/**
 * Simulateur de budget de mobilité. Le site ne propose AUCUN montant : le candidat saisit les siens (devis, sites officiels). Le calcul se fait
 * sur l'appareil, devise par devise (jamais de conversion inventée), et distingue ce qui sera dépensé de ce qui doit seulement être justifié.
 */

export type BudgetLine = { id: string; label: string; help: string; kind: "spend" | "monthly" | "proof" };

export const BUDGET_LINES: ReadonlyArray<BudgetLine> = [
  { id: "visa", label: "Frais de visa ou de permis", help: "Montant publié par l'autorité du pays, à relever sur son site officiel.", kind: "spend" },
  { id: "dossier", label: "Frais d'ouverture et de traitement du dossier", help: "Montant confirmé par écrit par votre conseiller avant tout paiement.", kind: "spend" },
  { id: "translation", label: "Traductions, légalisations, apostilles", help: "Selon le nombre de documents et le pays : demandez un devis.", kind: "spend" },
  { id: "medical", label: "Examens médicaux et vaccins", help: "Si le pays ou le projet l'exige.", kind: "spend" },
  { id: "language", label: "Test de langue", help: "Si le projet l'exige : tarif du centre d'examen.", kind: "spend" },
  { id: "insurance", label: "Assurance voyage ou santé", help: "Selon la durée et le pays.", kind: "spend" },
  { id: "ticket", label: "Billet d'avion", help: "Aller simple ou aller-retour selon votre projet.", kind: "spend" },
  { id: "housing", label: "Logement à l'arrivée (dépôt, premières semaines)", help: "Dépôt de garantie et premiers loyers.", kind: "spend" },
  { id: "living", label: "Frais de vie par mois (loyer, repas, transports)", help: "Multiplié par le nombre de mois choisi ci-dessous.", kind: "monthly" },
  { id: "funds", label: "Fonds à justifier (preuve de ressources)", help: "Somme à présenter à l'autorité : elle n'est pas dépensée, mais doit être disponible.", kind: "proof" },
];

export const BUDGET_CURRENCIES = ["XAF", "EUR", "CAD", "USD", "GBP"] as const;
export type BudgetEntry = { amount: number; currency: string };
export type BudgetInput = { entries: Record<string, BudgetEntry | undefined>; months: number };
export type BudgetTotals = { spend: Record<string, number>; proof: Record<string, number> };

const cleanCurrency = (value: string) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);

/** Totaux par devise. Un montant négatif, vide ou illisible compte pour zéro ; le nombre de mois est borné de 1 à 60. */
export function computeBudget(input: BudgetInput): BudgetTotals {
  const months = Math.min(Math.max(Math.trunc(Number(input.months) || 1), 1), 60);
  const totals: BudgetTotals = { spend: {}, proof: {} };
  for (const line of BUDGET_LINES) {
    const entry = input.entries[line.id];
    const amount = Number(entry?.amount);
    const currency = cleanCurrency(entry?.currency ?? "");
    if (!entry || !Number.isFinite(amount) || amount <= 0 || currency.length !== 3) continue;
    const value = line.kind === "monthly" ? amount * months : amount;
    const bucket = line.kind === "proof" ? totals.proof : totals.spend;
    bucket[currency] = Math.round(((bucket[currency] ?? 0) + value) * 100) / 100;
  }
  return totals;
}

export const formatAmountPlain = (amount: number, currency: string): string => `${String(Math.round(amount * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency}`;

export function formatTotals(bucket: Record<string, number>): string {
  const parts = Object.entries(bucket).map(([currency, amount]) => formatAmountPlain(amount, currency));
  return parts.length ? parts.join(" + ") : "—";
}
