import { nameSimilarity } from "../utils/duplicateDetection";
import { accountReference, agencyDossierReference } from "../../shared/caseReference";

/**
 * Pré-comptes redondants : enregistrements qui ne sont que des pré-dossiers alors que la même personne a déjà un dossier actif.
 * Fonction pure : elle ne lit ni n'écrit rien ; le routeur lui donne les lignes et applique la mise en corbeille (réversible).
 *
 * Règles (prudentes : un compte qui sert à se connecter n'est jamais proposé sur la seule ressemblance d'un nom) :
 *  - « certain » : un pré-dossier agence (statut « nouveau », jamais ouvert) dont l'e-mail est celui d'un dossier actif.
 *  - « probable » : un pré-dossier agence ou un compte sans dossier propre, autre e-mail, mais même téléphone ET nom très proche
 *    d'un dossier actif. À vérifier par un humain avant toute mise en corbeille.
 *  - Un compte dont l'e-mail est celui d'un dossier actif est le COMPTE de cette personne : jamais proposé.
 */

export type PreAccountRow = { id: number; fullName: string; email: string; phone: string | null; createdAt: Date | string | null };
export type PreAgencyDossierRow = PreAccountRow;
export type ActiveDossierRow = { source: "agency" | "online"; id: number; reference: string; fullName: string; email: string; phone: string | null; status: string };

export type RedundantPreAccount = {
  kind: "agency_pre_dossier" | "account";
  id: number;
  reference: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string | null;
  confidence: "certain" | "probable";
  reason: string;
  activeDossierReference: string;
  activeDossierStatus: string;
};

const normalizeEmail = (value: string | null | undefined): string => (value ?? "").trim().toLowerCase();
export const phoneDigits = (value: string | null | undefined): string => (value ?? "").replace(/\D+/g, "");
const iso = (value: Date | string | null | undefined): string | null => (value ? new Date(value).toISOString() : null);

/** Même numéro de téléphone : mêmes 9 derniers chiffres (indicatif pays et 0 initial ignorés), au moins 8 chiffres. */
export function samePhone(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  if (a.length < 8 || b.length < 8) return false;
  return a.slice(-9) === b.slice(-9);
}

export const NAME_SIMILARITY_THRESHOLD = 0.85;

export function findRedundantPreAccounts(input: {
  accounts: PreAccountRow[];
  agencyPreDossiers: PreAgencyDossierRow[];
  activeDossiers: ActiveDossierRow[];
  /** Adresses e-mail des comptes qui possèdent déjà un dossier (en ligne ou agence) : ces comptes ne sont jamais proposés. */
  accountEmailsWithOwnDossier: Iterable<string>;
}): RedundantPreAccount[] {
  const ownDossierEmails = new Set(Array.from(input.accountEmailsWithOwnDossier, normalizeEmail));
  const activeByEmail = new Map<string, ActiveDossierRow>();
  for (const dossier of input.activeDossiers) if (!activeByEmail.has(normalizeEmail(dossier.email))) activeByEmail.set(normalizeEmail(dossier.email), dossier);

  const matchOf = (row: PreAccountRow, allowEmail: boolean): { dossier: ActiveDossierRow; confidence: "certain" | "probable"; reason: string } | null => {
    if (allowEmail) {
      const sameEmail = activeByEmail.get(normalizeEmail(row.email));
      if (sameEmail) return { dossier: sameEmail, confidence: "certain", reason: `Même adresse e-mail que le dossier actif ${sameEmail.reference}.` };
    }
    for (const dossier of input.activeDossiers) {
      if (samePhone(row.phone, dossier.phone) && nameSimilarity(row.fullName, dossier.fullName) >= NAME_SIMILARITY_THRESHOLD) {
        return { dossier, confidence: "probable", reason: `Même téléphone et nom très proche du dossier actif ${dossier.reference} (${dossier.fullName}). À vérifier.` };
      }
    }
    return null;
  };

  const results: RedundantPreAccount[] = [];
  for (const pre of input.agencyPreDossiers) {
    const match = matchOf(pre, true);
    if (!match) continue;
    results.push({ kind: "agency_pre_dossier", id: pre.id, reference: agencyDossierReference(pre.id), fullName: pre.fullName, email: pre.email, phone: pre.phone, createdAt: iso(pre.createdAt), confidence: match.confidence, reason: match.reason, activeDossierReference: match.dossier.reference, activeDossierStatus: match.dossier.status });
  }
  for (const account of input.accounts) {
    // Le compte d'une personne qui a déjà un dossier (même e-mail) est son compte de connexion : hors de portée.
    if (ownDossierEmails.has(normalizeEmail(account.email)) || activeByEmail.has(normalizeEmail(account.email))) continue;
    const match = matchOf(account, false);
    if (!match) continue;
    results.push({ kind: "account", id: account.id, reference: accountReference(account.id), fullName: account.fullName, email: account.email, phone: account.phone, createdAt: iso(account.createdAt), confidence: "probable", reason: match.reason, activeDossierReference: match.dossier.reference, activeDossierStatus: match.dossier.status });
  }
  // Les cas certains d'abord, puis les plus anciens.
  return results.sort((left, right) => (left.confidence === right.confidence ? 0 : left.confidence === "certain" ? -1 : 1) || String(left.createdAt).localeCompare(String(right.createdAt)));
}
