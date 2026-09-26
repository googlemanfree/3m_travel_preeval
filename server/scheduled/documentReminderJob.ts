/**
 * Relances automatiques des pièces manquantes.
 * Endpoint : POST /api/scheduled/document-reminders (secret de tâche planifiée requis), corps facultatif {"dryRun": true}
 * pour n'envoyer aucun e-mail et obtenir seulement la liste de ce qui serait envoyé.
 * Cron conseillé : une fois par jour, en fin de matinée (heure du Cameroun) — 0 0 10 * * *
 * Désinscription : GET /api/reminders/stop?e=<e-mail>&t=<jeton signé>
 */
import type { Request, Response } from "express";
import { and, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { agencyDossierDocuments, agencyDossiers, agencySettings, applications, candidateFiles, candidates, clientDocuments, emailDeliveryLogs, evaluations } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import { summarizeChecklist, type ChecklistDocument } from "../../client/src/lib/documentChecklist";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { REMINDER_SUBJECT_PREFIX, buildDocumentReminderEmail, planReminder, reminderOptOutKey, signReminderStopToken, verifyReminderStopToken } from "../services/documentReminders";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ReminderOutcome = { email: string; stage: number; missing: number; replace: number; sent: boolean; error?: string };

const secret = () => process.env.JWT_SECRET || "";
const siteUrl = () => (process.env.SITE_URL || COMPANY_PROFILE.website || "https://www.3mtravelagency.com").replace(/\/+$/, "");

const latest = (...dates: Array<Date | null | undefined>): Date => dates.filter((date): date is Date => date instanceof Date).reduce((a, b) => (a > b ? a : b), new Date(0));

const parseDestinations = (value: string | null | undefined): string[] => {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [];
  }
};

export type CandidateAssessment = {
  candidate: typeof candidates.$inferSelect;
  email: string;
  summary: ReturnType<typeof summarizeChecklist>;
  lastActivityAt: Date;
  remindersSinceActivity: number;
  lastReminderAt: Date | null;
  optedOut: boolean;
};

/** Candidats à suivre : compte vérifié et non supprimé, à l'étape « documents » ou avec un dossier payé qui attend ses pièces. */
export async function loadCandidatesAwaitingDocuments(db: Db, limit = 500) {
  const waiting = await db.select({ email: applications.email }).from(applications).where(and(inArray(applications.dossierStatus, ["paye", "en_attente_documents"]), isNull(applications.deletedAt))).limit(2000);
  const waitingEmails = Array.from(new Set(waiting.map((row) => row.email.trim().toLowerCase())));
  const rows = await db.select().from(candidates).where(and(isNull(candidates.deletedAt), eq(candidates.emailVerified, true))).limit(5000);
  return rows.filter((candidate) => candidate.emailVerified && !candidate.deletedAt && (candidate.dossierStatus === "documents" || waitingEmails.includes(candidate.email.trim().toLowerCase()))).slice(0, limit);
}

/** Où en est ce candidat : pièces manquantes de sa checklist (pays x visa), dernière activité, relances déjà reçues. */
export async function assessCandidate(db: Db, candidate: typeof candidates.$inferSelect): Promise<CandidateAssessment> {
  const email = candidate.email.trim().toLowerCase();
  const [optOut] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, reminderOptOutKey(email))).limit(1);
  const files = await db.select({ fileType: candidateFiles.fileType, fileName: candidateFiles.fileName, status: candidateFiles.status, uploadedAt: candidateFiles.uploadedAt }).from(candidateFiles).where(eq(candidateFiles.candidateId, candidate.id));
  const agencyRows = await db.select({ id: agencyDossiers.id }).from(agencyDossiers).where(eq(agencyDossiers.email, candidate.email)).limit(5);
  const agencyDocs = agencyRows.length ? await db.select({ documentType: agencyDossierDocuments.documentType, documentName: agencyDossierDocuments.documentName, verificationStatus: agencyDossierDocuments.verificationStatus, createdAt: agencyDossierDocuments.createdAt }).from(agencyDossierDocuments).where(inArray(agencyDossierDocuments.dossierId, agencyRows.map((row) => row.id))) : [];
  const clientDocs = await db.select({ documentType: clientDocuments.documentType, documentName: clientDocuments.documentName, verificationStatus: clientDocuments.verificationStatus, uploadedAt: clientDocuments.uploadedAt }).from(clientDocuments).where(eq(clientDocuments.candidateEmail, candidate.email));
  const [evaluation] = await db.select({ projectType: evaluations.projectType }).from(evaluations).where(eq(evaluations.email, candidate.email)).orderBy(desc(evaluations.createdAt)).limit(1);

  const documents: ChecklistDocument[] = [
    ...files.map((file) => ({ documentType: file.fileType, documentName: file.fileName, status: file.status })),
    ...agencyDocs.map((doc) => ({ documentType: doc.documentType, documentName: doc.documentName, verificationStatus: doc.verificationStatus })),
    ...clientDocs.map((doc) => ({ documentType: doc.documentType, documentName: doc.documentName, verificationStatus: doc.verificationStatus === "approved" ? "verified" : doc.verificationStatus })),
  ];
  const destination = parseDestinations(candidate.preferredDestinations)[0] || candidate.destination;
  const summary = summarizeChecklist(destination, evaluation?.projectType, documents);
  const lastActivityAt = latest(candidate.lastLoginAt, candidate.createdAt, ...files.map((file) => file.uploadedAt), ...agencyDocs.map((doc) => doc.createdAt), ...clientDocs.map((doc) => doc.uploadedAt));
  const sentLogs = await db.select({ createdAt: emailDeliveryLogs.createdAt }).from(emailDeliveryLogs).where(and(eq(emailDeliveryLogs.recipientEmail, email), like(emailDeliveryLogs.subject, `${REMINDER_SUBJECT_PREFIX}%`), eq(emailDeliveryLogs.status, "sent"))).orderBy(desc(emailDeliveryLogs.createdAt)).limit(10);
  return { candidate, email, summary, lastActivityAt, remindersSinceActivity: sentLogs.filter((log) => log.createdAt > lastActivityAt).length, lastReminderAt: sentLogs[0]?.createdAt ?? null, optedOut: Boolean(optOut) };
}

export async function runDocumentReminders(db: Db, options: { now?: Date; dryRun?: boolean; limit?: number } = {}): Promise<ReminderOutcome[]> {
  const now = options.now ?? new Date();
  const outcomes: ReminderOutcome[] = [];
  const targets = await loadCandidatesAwaitingDocuments(db, options.limit ?? 500);

  for (const candidate of targets) {
    const email = candidate.email.trim().toLowerCase();
    try {
      const assessment = await assessCandidate(db, candidate);
      const { summary } = assessment;
      const decision = planReminder({ email, fullName: candidate.fullName, lastActivityAt: assessment.lastActivityAt, remindersSinceActivity: assessment.remindersSinceActivity, lastReminderAt: assessment.lastReminderAt, missing: summary.missing, replace: summary.replace, total: summary.total, optedOut: assessment.optedOut }, now);
      if (!decision.due) continue;

      const message = buildDocumentReminderEmail({
        fullName: candidate.fullName,
        stage: decision.stage,
        missing: summary.missing,
        replace: summary.replace,
        total: summary.total,
        firstLabel: summary.firstReplaceLabel ?? summary.firstMissingLabel,
        siteUrl: siteUrl(),
        whatsappNumber: COMPANY_PROFILE.offices.cameroon.whatsappNumber,
        whatsappDisplay: COMPANY_PROFILE.offices.cameroon.whatsappDisplay,
        stopUrl: `${siteUrl()}/api/reminders/stop?e=${encodeURIComponent(email)}&t=${signReminderStopToken(email, secret())}`,
      });
      if (options.dryRun) {
        outcomes.push({ email, stage: decision.stage, missing: summary.missing, replace: summary.replace, sent: false });
        continue;
      }
      await sendEmail({ to: candidate.email, subject: message.subject, html: message.html });
      await db.insert(emailDeliveryLogs).values({ recipientEmail: email, subject: message.subject.slice(0, 255), status: "sent" });
      outcomes.push({ email, stage: decision.stage, missing: summary.missing, replace: summary.replace, sent: true });
    } catch (error) {
      console.error("[DocumentReminders] candidate failed", { candidateId: candidate.id, error });
      outcomes.push({ email, stage: 0, missing: 0, replace: 0, sent: false, error: "échec" });
    }
  }
  return outcomes;
}

export async function handleDocumentReminderJob(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }
    const dryRun = Boolean((req.body as { dryRun?: unknown } | undefined)?.dryRun);
    const outcomes = await runDocumentReminders(db, { dryRun });
    res.json({ dryRun, sent: outcomes.filter((outcome) => outcome.sent).length, planned: dryRun ? outcomes.length : undefined, failed: outcomes.filter((outcome) => outcome.error).length, outcomes: outcomes.map((outcome) => ({ stage: outcome.stage, missing: outcome.missing, replace: outcome.replace, sent: outcome.sent })) });
  } catch (error) {
    console.error("[DocumentReminders] job failed", error);
    res.status(500).json({ error: "Reminder job failed" });
  }
}

/** Page de désinscription : jeton signé requis ; enregistre l'adresse dans les réglages, sans compte ni mot de passe. */
export async function handleReminderStop(req: Request, res: Response): Promise<void> {
  const email = typeof req.query.e === "string" ? req.query.e.trim().toLowerCase() : "";
  const token = typeof req.query.t === "string" ? req.query.t : "";
  const page = (title: string, body: string) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:520px;margin:64px auto;padding:0 20px;color:#172554"><h1 style="font-size:22px">${title}</h1><p>${body}</p><p><a href="${siteUrl()}/mon-espace" style="color:#1d4ed8">Ouvrir mon espace client</a></p></body></html>`;
  if (!email || !verifyReminderStopToken(email, token, secret())) {
    res.status(400).type("html").send(page("Lien invalide", "Ce lien de désinscription n’est pas valide ou a été modifié."));
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const key = reminderOptOutKey(email);
    const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
    if (!existing) await db.insert(agencySettings).values({ settingKey: key, settingValue: new Date().toISOString() });
    res.type("html").send(page("Rappels arrêtés", "Vous ne recevrez plus de rappels automatiques pour vos documents. Votre dossier reste suivi normalement, et vous pouvez envoyer vos pièces à tout moment depuis votre espace client."));
  } catch (error) {
    console.error("[DocumentReminders] stop failed", error);
    res.status(500).type("html").send(page("Une erreur est survenue", "Votre demande n’a pas pu être enregistrée. Écrivez-nous et nous arrêterons les rappels manuellement."));
  }
}
