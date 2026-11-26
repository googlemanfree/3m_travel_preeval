/**
 * Livraison automatique du formulaire d’évaluation préliminaire à chaque candidat inscrit
 * pour CHACUN des pays qu’il a choisis (jusqu’à 3), en plus de l’évaluation déjà remplie en ligne.
 *
 * Déclencheurs : confirmation de l’adresse e-mail, changement des pays favoris, et rattrapage
 * administrateur pour les comptes existants. Idempotent : un e-mail réussi par candidat et par pays.
 */

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { candidates } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { parsePreferredDestinations } from "../../shared/candidateDestinationOptions";
import { resolveCountryEvaluationForm } from "../../shared/countryEvaluationForms";
import type { getDb } from "../db";
import { deliverCountryEvaluationForm } from "./deliverCountryEvaluationForm";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const COUNTRY_FORM_NOTIFICATION_TYPE = "country_evaluation_form";
export const MAX_COUNTRY_FORMS_PER_CANDIDATE = 3;

/** Anciennes catégories larges qui désignent un seul pays précis (les autres n’ont pas de pays connu). */
const LEGACY_SINGLE_COUNTRY_CATEGORY: Record<string, string> = {
  canada: "Canada",
  luxembourg: "Luxembourg",
  pologne: "Pologne",
};

export type CandidateForCountryForms = {
  id: number;
  email: string;
  fullName: string;
  preferredDestinations?: string | null;
  destination?: string | null;
};

/** Pays distincts (par formulaire) à livrer pour un candidat, dans l’ordre de préférence. */
export function countryFormTargetsForCandidate(
  candidate: Pick<CandidateForCountryForms, "preferredDestinations" | "destination">,
): Array<{ destination: string; countryLabel: string; notificationTitle: string }> {
  let names = parsePreferredDestinations(candidate.preferredDestinations ?? null);
  if (names.length === 0) {
    const legacy = LEGACY_SINGLE_COUNTRY_CATEGORY[String(candidate.destination ?? "").trim().toLowerCase()];
    if (legacy) names = [legacy];
  }
  const seen = new Set<string>();
  const targets: Array<{ destination: string; countryLabel: string; notificationTitle: string }> = [];
  for (const name of names) {
    const template = resolveCountryEvaluationForm(name);
    if (!template || seen.has(template.countryKey)) continue;
    seen.add(template.countryKey);
    targets.push({ destination: name, countryLabel: template.countryLabel, notificationTitle: template.notificationTitle });
    if (targets.length >= MAX_COUNTRY_FORMS_PER_CANDIDATE) break;
  }
  return targets;
}

export type CandidateCountryFormsSummary = {
  candidateId: number;
  countries: string[];
  emailsSent: number;
  failed: number;
};

/** Livre (e-mail + PDF + coffre + notification) le formulaire de chaque pays choisi non encore envoyé. */
export async function deliverCountryFormsForCandidate(
  db: Db,
  candidate: CandidateForCountryForms,
): Promise<CandidateCountryFormsSummary> {
  const summary: CandidateCountryFormsSummary = { candidateId: candidate.id, countries: [], emailsSent: 0, failed: 0 };
  for (const target of countryFormTargetsForCandidate(candidate)) {
    try {
      const result = await deliverCountryEvaluationForm(db, {
        destination: target.destination,
        email: candidate.email,
        fullName: candidate.fullName,
        candidateId: candidate.id,
        sendEmail: true,
      });
      if (!result.delivered) continue;
      summary.countries.push(target.countryLabel);
      if (result.emailSent) summary.emailsSent += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(`[candidateCountryForms] ${target.countryLabel} (candidat ${candidate.id}):`, error);
    }
  }
  return summary;
}

/** Version « ne jamais bloquer le parcours » pour les mutations candidat. */
export async function deliverCountryFormsForCandidateSafely(db: Db, candidate: CandidateForCountryForms): Promise<void> {
  try {
    await deliverCountryFormsForCandidate(db, candidate);
  } catch (error) {
    console.error("[candidateCountryForms] livraison automatique non effectuée:", error);
  }
}

export type CountryFormsBackfillResult = {
  dryRun: boolean;
  candidatesScanned: number;
  candidatesPending: number;
  formsPending: number;
  candidatesProcessed: number;
  emailsSent: number;
  failed: number;
  remaining: number;
};

/**
 * Rattrapage des comptes existants (confirmés, non archivés) : envoie les formulaires manquants.
 * `dryRun` ne fait que compter. `limit` borne le nombre de candidats traités par appel.
 */
export async function backfillCountryFormsForRegisteredCandidates(
  db: Db,
  options: { dryRun: boolean; limit?: number },
): Promise<CountryFormsBackfillResult> {
  const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
  const rows = await db
    .select({
      id: candidates.id,
      email: candidates.email,
      fullName: candidates.fullName,
      preferredDestinations: candidates.preferredDestinations,
      destination: candidates.destination,
    })
    .from(candidates)
    .where(and(eq(candidates.emailVerified, true), isNull(candidates.deletedAt)));

  const sent = await db
    .select({ candidateId: clientNotifications.candidateId, title: clientNotifications.title })
    .from(clientNotifications)
    .where(and(eq(clientNotifications.type, COUNTRY_FORM_NOTIFICATION_TYPE), isNotNull(clientNotifications.emailSentAt)));
  const sentTitles = new Map<number, Set<string>>();
  for (const row of sent) {
    const set = sentTitles.get(row.candidateId) ?? new Set<string>();
    set.add(row.title);
    sentTitles.set(row.candidateId, set);
  }

  const pending = rows
    .map((row) => {
      const done = sentTitles.get(row.id);
      const missing = countryFormTargetsForCandidate(row).filter((target) => !done?.has(target.notificationTitle));
      return { row, missing };
    })
    .filter((entry) => entry.missing.length > 0);

  const result: CountryFormsBackfillResult = {
    dryRun: options.dryRun,
    candidatesScanned: rows.length,
    candidatesPending: pending.length,
    formsPending: pending.reduce((total, entry) => total + entry.missing.length, 0),
    candidatesProcessed: 0,
    emailsSent: 0,
    failed: 0,
    remaining: pending.length,
  };
  if (options.dryRun) return result;

  for (const entry of pending.slice(0, limit)) {
    const summary = await deliverCountryFormsForCandidate(db, entry.row);
    result.candidatesProcessed += 1;
    result.emailsSent += summary.emailsSent;
    result.failed += summary.failed;
  }
  result.remaining = Math.max(0, pending.length - result.candidatesProcessed);
  return result;
}
