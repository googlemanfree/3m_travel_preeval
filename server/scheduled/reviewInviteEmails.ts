/**
 * Invitation automatique par e-mail à donner un avis, pour les clients dont le visa est accordé : mêmes candidats, la même
 * marque « déjà invité » (`agencySettings` clé `review_invited:<key>`) et le même lien que l'outil manuel de l'admin
 * (`AdminReviewsToInvite`) — un client invité automatiquement disparaît aussi de la liste manuelle, jamais les deux à la fois.
 * Lancée par la même tâche quotidienne que les relances de documents et de vols.
 * Aucun avis n'est jamais fabriqué : ce module ne fait qu'inviter à en déposer un, positif ou critique, avec l'accord de
 * publication du client et après modération (voir shared/reviewInviteTargets.ts et le formulaire /avis).
 */
import { and, eq, isNull, like } from "drizzle-orm";
import { agencyDossiers, agencySettings, applications, customerReviews } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import { REVIEW_INVITED_KEY_PREFIX, pickClientsToInvite, reviewInvitedKey, reviewServiceFor, type InviteCandidate } from "../../shared/reviewInviteTargets";
import { buildReviewInviteUrl } from "../../client/src/lib/reviewInvitation";
import { sendEmail } from "../_core/email";
import type { getDb } from "../db";
import { reminderOptOutKey } from "../services/documentReminders";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** Laisse le temps à un conseiller de recontacter le client de vive voix avant qu'un e-mail automatique ne parte. */
export const REVIEW_INVITE_MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000;
/** Plafond par passage : un envoi mesuré, jamais une rafale sur un gros arriéré de dossiers approuvés. */
export const REVIEW_INVITE_DAILY_CAP = 15;

export type ReviewInviteOutcome = { key: string; email: string; sent: boolean; reason: "sent" | "opted_out" | "invalid_email" | "error" };
export type ReviewInvitePlanItem = { candidate: InviteCandidate; action: "send" | "opted_out" | "invalid_email" };

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isValidEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

export function buildReviewInviteEmail(input: { firstName: string; url: string }): { subject: string; html: string } {
  const greeting = input.firstName ? `Bonjour ${esc(input.firstName)}` : "Bonjour";
  return {
    subject: `Votre avis compte pour nous — ${COMPANY_PROFILE.publicName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172554">
<h2 style="margin:0 0 12px;color:#1d4ed8">Un avis, en quelques minutes</h2>
<p style="margin:0 0 12px">${greeting},</p>
<p style="margin:0 0 12px">Merci d'avoir fait confiance à ${esc(COMPANY_PROFILE.publicName)}. Votre avis nous aide à nous améliorer et éclaire les personnes qui préparent un projet comme le vôtre : positif ou critique, il est le bienvenu.</p>
<p style="margin:0 0 20px"><a href="${esc(input.url)}" style="display:inline-block;background:#f59e0b;color:#1e293b;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Laisser mon avis</a></p>
<p style="margin:0;font-size:13px;color:#475569">Il n'est publié qu'avec votre accord, sous le nom d'affichage de votre choix (prénom, initiales ou nom complet), et seulement après vérification par notre équipe.</p>
</div>`,
  };
}

/**
 * Décide, sans rien écrire ni envoyer, ce qu'il faut faire de chaque candidat déjà sélectionné par `pickClientsToInvite` :
 * adresse invalide, opt-out (même liste que les relances de documents), ou envoi. Ne retient que les dossiers approuvés
 * depuis au moins `REVIEW_INVITE_MIN_AGE_MS`, les plus anciens en attente d'abord, plafonnés à `REVIEW_INVITE_DAILY_CAP`.
 */
export function planReviewInvites(candidates: InviteCandidate[], optedOutEmails: Set<string>, now: Date, cap = REVIEW_INVITE_DAILY_CAP): ReviewInvitePlanItem[] {
  const ready = candidates
    .filter((candidate) => !candidate.approvedAt || now.getTime() - candidate.approvedAt.getTime() >= REVIEW_INVITE_MIN_AGE_MS)
    .sort((left, right) => (left.approvedAt?.getTime() ?? 0) - (right.approvedAt?.getTime() ?? 0))
    .slice(0, cap);
  return ready.map((candidate) => {
    const email = candidate.email.trim().toLowerCase();
    if (!isValidEmail(email)) return { candidate, action: "invalid_email" as const };
    if (optedOutEmails.has(email)) return { candidate, action: "opted_out" as const };
    return { candidate, action: "send" as const };
  });
}

async function loadCandidates(db: Db): Promise<InviteCandidate[]> {
  const online = await db.select().from(applications).where(and(eq(applications.dossierStatus, "visa_approuve"), isNull(applications.deletedAt))).limit(500);
  const agency = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.status, "approuve"), isNull(agencyDossiers.deletedAt))).limit(500);
  const invited = await db.select({ settingKey: agencySettings.settingKey }).from(agencySettings).where(like(agencySettings.settingKey, `${REVIEW_INVITED_KEY_PREFIX}%`)).limit(5000);
  const reviewers = await db.select({ email: customerReviews.email }).from(customerReviews).limit(5000);
  const candidates: InviteCandidate[] = [
    ...online.map((row) => ({ key: `online_${row.id}`, email: row.email, fullName: row.fullName, phone: row.whatsappNumber ?? "", destination: row.destination ?? "", visaType: row.visaType ?? "", approvedAt: row.lastStatusUpdateAt ?? row.updatedAt ?? null })),
    ...agency.map((row) => ({ key: `agency_${row.id}`, email: row.email, fullName: row.fullName, phone: row.phone ?? "", destination: row.destination ?? "", visaType: row.visaType ?? "", approvedAt: row.lastStatusChangeAt ?? row.updatedAt ?? null })),
  ];
  return pickClientsToInvite(candidates, new Set(invited.map((row) => row.settingKey)), new Set(reviewers.map((row) => row.email.trim().toLowerCase())));
}

async function loadOptedOutEmails(db: Db, candidates: InviteCandidate[]): Promise<Set<string>> {
  const optedOut = new Set<string>();
  const emails = Array.from(new Set(candidates.map((candidate) => candidate.email.trim().toLowerCase())));
  for (const email of emails) {
    const [row] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, reminderOptOutKey(email))).limit(1);
    if (row) optedOut.add(email);
  }
  return optedOut;
}

async function markInvited(db: Db, key: string, note: string) {
  const settingKey = reviewInvitedKey(key);
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, settingKey)).limit(1);
  if (!existing) await db.insert(agencySettings).values({ settingKey, settingValue: note });
}

export async function runReviewInviteEmails(db: Db, options: { dryRun?: boolean; now?: Date } = {}): Promise<ReviewInviteOutcome[]> {
  const now = options.now ?? new Date();
  const picked = await loadCandidates(db);
  const optedOutEmails = options.dryRun ? new Set<string>() : await loadOptedOutEmails(db, picked);
  const plan = planReviewInvites(picked, optedOutEmails, now);

  const outcomes: ReviewInviteOutcome[] = [];
  for (const { candidate, action } of plan) {
    const email = candidate.email.trim().toLowerCase();
    if (action !== "send") {
      outcomes.push({ key: candidate.key, email, sent: false, reason: action });
      continue;
    }
    if (options.dryRun) {
      outcomes.push({ key: candidate.key, email, sent: false, reason: "sent" });
      continue;
    }
    try {
      const firstName = candidate.fullName.trim().split(/\s+/)[0] ?? "";
      const url = buildReviewInviteUrl({ serviceType: reviewServiceFor(candidate.visaType), destinationCountry: candidate.destination });
      const mail = buildReviewInviteEmail({ firstName, url });
      await sendEmail({ to: email, subject: mail.subject, html: mail.html });
      await markInvited(db, candidate.key, `${now.toISOString()} · e-mail automatique`);
      outcomes.push({ key: candidate.key, email, sent: true, reason: "sent" });
    } catch (error) {
      console.error("[ReviewInviteEmails] envoi impossible", { key: candidate.key, error });
      outcomes.push({ key: candidate.key, email, sent: false, reason: "error" });
    }
  }
  return outcomes;
}
