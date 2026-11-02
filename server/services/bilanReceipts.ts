import { evaluationDisplayReference } from "../../shared/evaluationReference";
import { and, eq, isNull } from "drizzle-orm";
import { adminNotifications, applications } from "../../drizzle/schema";
import { BRAND, escapeBrandHtml, renderBrandedEmailHtml } from "../../shared/brandLetterhead";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

/** E-mail interne à la boîte de l'agence : accusé d'envoi du bilan, puis avis de consultation. Jamais bloquant : l'événement a déjà eu lieu. */
export async function mailAgency(input: { subject: string; title: string; lines: Array<[string, string]>; reference?: string | null }): Promise<boolean> {
  try {
    const rows = input.lines.map(([label, value]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #e3edf5;font:12px Arial,Helvetica,sans-serif;color:#64748b;width:38%">${escapeBrandHtml(label)}</td><td style="padding:6px 10px;border-bottom:1px solid #e3edf5;font:600 14px 'Segoe UI',Calibri,Arial,sans-serif;color:#17375e">${escapeBrandHtml(value)}</td></tr>`).join("");
    const html = renderBrandedEmailHtml({
      title: input.title,
      reference: input.reference ?? null,
      preheader: input.subject,
      bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #d5e3ee">${rows}</table><p style="margin:14px 0 0;font:13px/1.6 Arial,Helvetica,sans-serif;color:#475569">Message interne de suivi : il n'est pas envoyé au candidat.</p>`,
    });
    await sendEmail({ to: BRAND.email, subject: input.subject, html });
    return true;
  } catch (error) {
    console.warn("[bilan-receipts] e-mail agence non envoyé :", error instanceof Error ? error.message : error);
    return false;
  }
}

const when = (date: Date) => date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Douala" });

/** Accusé d'envoi par e-mail à l'agence, au même moment que l'envoi au candidat (l'alerte dans l'administration est créée par l'envoi lui-même). */
export async function acknowledgeBilanSent(input: { fullName: string; email: string; dossierNumber: string; destination?: string | null; kindLabel: string; sentBy: string }): Promise<boolean> {
  const at = new Date();
  return mailAgency({
    subject: `Accusé d'envoi — bilan de ${input.fullName} (${input.dossierNumber})`,
    title: "Accusé de réception : bilan envoyé",
    reference: input.dossierNumber,
    lines: [
      ["Candidat", input.fullName],
      ["E-mail du candidat", input.email],
      ["Dossier", input.dossierNumber],
      ["Destination", input.destination || "Non précisée"],
      ["Type de bilan", input.kindLabel],
      ["Envoyé le", when(at)],
      ["Envoyé par", input.sentBy],
      ["Canaux", "Espace client + e-mail avec PDF"],
    ],
  });
}

/**
 * Première consultation du bilan (ouverture de l'e-mail ou lecture dans l'espace client) : enregistrée UNE seule fois, puis alerte dans l'administration
 * et e-mail à l'agence. Renvoie vrai uniquement pour la première consultation (jamais de doublon, même avec plusieurs requêtes simultanées).
 */
export async function recordBilanViewed(db: Db, applicationId: number, via: "e-mail" | "espace client"): Promise<boolean> {
  const now = new Date();
  const result = await db.update(applications).set({ evaluationReportViewedAt: now, updatedAt: now }).where(and(eq(applications.id, applicationId), isNull(applications.evaluationReportViewedAt)));
  const header = Array.isArray(result) ? result[0] : result;
  if (Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0) < 1) return false;
  const [application] = await db.select({ fullName: applications.fullName, email: applications.email, dossierNumber: applications.dossierNumber, destination: applications.destination, candidateId: applications.candidateId, paymentStatus: applications.paymentStatus, dossierStatus: applications.dossierStatus }).from(applications).where(eq(applications.id, applicationId)).limit(1);
  if (!application) return true;
  const reference = evaluationDisplayReference(application) ?? "sans référence";
  try {
    await db.insert(adminNotifications).values({
      type: "new_evaluation",
      title: "Bilan consulté par le candidat",
      message: `${application.fullName} (${reference}) a consulté son bilan le ${when(now)} (${via === "e-mail" ? "ouverture de l'e-mail : peut aussi être un aperçu automatique de la messagerie" : "lecture dans l'espace client"}).`.slice(0, 1000),
      relatedId: `evaluation_viewed:${applicationId}`,
      targetAdminType: null,
      isRead: false,
    });
  } catch { /* l'e-mail agence reste tenté */ }
  await mailAgency({
    subject: `Bilan consulté — ${application.fullName} (${reference})`,
    title: "Le candidat a consulté son bilan",
    reference,
    lines: [
      ["Candidat", application.fullName],
      ["Référence", reference],
      ["Destination", application.destination || "Non précisée"],
      ["Consulté le", when(now)],
      ["Par", via === "e-mail" ? "Ouverture de l'e-mail (peut être un aperçu automatique)" : "Lecture dans l'espace client"],
    ],
  });
  return true;
}
