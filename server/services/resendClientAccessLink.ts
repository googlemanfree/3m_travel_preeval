/**
 * Renvoi admin du lien d’accès espace client (définition / reset mot de passe 48 h).
 * N’écrit aucun statut de dossier — tokens candidats + e-mail / WhatsApp / audit seulement.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { agencyDossiers, applications, candidates, paymentAuditLogs } from "../../drizzle/schema";
import { issuePasswordResetToken } from "../routers/candidate";
import type { getDb } from "../db";
import { sendClientAccessInviteEmail } from "./clientAccessInviteEmail";
import { buildSetPasswordAccessUrl, ensureAgencyClientAccess } from "./ensureAgencyClientAccess";
import { notifyClientAccessLinkWhatsApp } from "./clientWhatsAppNotify";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ResendClientAccessResult = {
  success: true;
  candidateId: number;
  email: string;
  dossierNumber: string;
  emailSent: boolean;
  whatsappSent: boolean;
  whatsappSkippedReason: string | null;
  createdAccount: boolean;
};

/**
 * Émet un nouveau token 48 h et envoie e-mail (+ WhatsApp au mieux).
 * Accepte account_N | online_N | agency_N.
 */
export async function resendClientAccessLink(
  db: Db,
  input: {
    candidateId: string;
    adminEmail: string;
    adminName?: string;
  },
): Promise<ResendClientAccessResult> {
  const adminName = input.adminName || input.adminEmail || "Administrateur";
  const adminEmail = input.adminEmail || "";

  let email = "";
  let fullName = "";
  let phone: string | null = null;
  let dossierNumber = "";
  let candidateRowId: number | null = null;
  let createdAccount = false;

  const accountMatch = /^account_(\d+)$/.exec(input.candidateId.trim());
  const onlineMatch = /^online_(\d+)$/.exec(input.candidateId.trim());
  const agencyMatch = /^agency_(\d+)$/.exec(input.candidateId.trim());

  if (accountMatch) {
    const id = Number(accountMatch[1]);
    const [row] = await db
      .select({
        id: candidates.id,
        email: candidates.email,
        fullName: candidates.fullName,
        phone: candidates.phone,
        activeDossierNumber: candidates.activeDossierNumber,
      })
      .from(candidates)
      .where(and(eq(candidates.id, id), isNull(candidates.deletedAt)))
      .limit(1);
    if (!row) throw new Error("Compte candidat introuvable.");
    candidateRowId = row.id;
    email = row.email;
    fullName = row.fullName;
    phone = row.phone;
    dossierNumber = row.activeDossierNumber || `COMPTE-${String(row.id).padStart(5, "0")}`;
  } else if (onlineMatch) {
    const id = Number(onlineMatch[1]);
    const [app] = await db
      .select({
        id: applications.id,
        email: applications.email,
        fullName: applications.fullName,
        dossierNumber: applications.dossierNumber,
        whatsappNumber: applications.whatsappNumber,
      })
      .from(applications)
      .where(and(eq(applications.id, id), isNull(applications.deletedAt)))
      .limit(1);
    if (!app?.email) throw new Error("Dossier en ligne introuvable.");
    email = app.email.trim().toLowerCase();
    fullName = app.fullName;
    phone = app.whatsappNumber || null;
    dossierNumber = app.dossierNumber;
    const [linked] = await db
      .select({ id: candidates.id, phone: candidates.phone, fullName: candidates.fullName })
      .from(candidates)
      .where(and(sql`LOWER(TRIM(${candidates.email})) = ${email}`, isNull(candidates.deletedAt)))
      .limit(1);
    if (!linked) throw new Error("Aucun compte espace client n’est lié à ce dossier. Créez d’abord le compte.");
    candidateRowId = linked.id;
    if (!phone) phone = linked.phone;
    if (!fullName) fullName = linked.fullName;
  } else if (agencyMatch) {
    const id = Number(agencyMatch[1]);
    const [dossier] = await db
      .select({
        id: agencyDossiers.id,
        email: agencyDossiers.email,
        fullName: agencyDossiers.fullName,
        phone: agencyDossiers.phone,
        destination: agencyDossiers.destination,
        visaType: agencyDossiers.visaType,
      })
      .from(agencyDossiers)
      .where(and(eq(agencyDossiers.id, id), isNull(agencyDossiers.deletedAt)))
      .limit(1);
    if (!dossier?.email) throw new Error("Dossier agence introuvable.");
    email = dossier.email.trim().toLowerCase();
    fullName = dossier.fullName;
    phone = dossier.phone || null;
    dossierNumber = `3M-AGN-${String(dossier.id).padStart(4, "0")}`;
    const [linked] = await db
      .select({ id: candidates.id, phone: candidates.phone })
      .from(candidates)
      .where(and(sql`LOWER(TRIM(${candidates.email})) = ${email}`, isNull(candidates.deletedAt)))
      .limit(1);
    if (!linked) {
      const access = await ensureAgencyClientAccess(db, {
        email,
        fullName,
        phone,
        destinationCoarse: dossier.destination || null,
        visaType: dossier.visaType || null,
        dossierNumber,
        sendInviteEmail: false,
      });
      candidateRowId = access.candidateId;
      createdAccount = access.created;
    } else {
      candidateRowId = linked.id;
      if (!phone) phone = linked.phone;
    }
  } else {
    throw new Error("Identifiant candidat invalide (account_, online_ ou agency_ requis).");
  }

  if (!candidateRowId || !email) throw new Error("Compte client introuvable pour ce renvoi.");

  // Anti-spam : 60 s entre deux renvois d’accès pour le même e-mail.
  const [recent] = await db
    .select({ createdAt: paymentAuditLogs.createdAt })
    .from(paymentAuditLogs)
    .where(and(
      eq(paymentAuditLogs.candidateEmail, email),
      eq(paymentAuditLogs.action, "client_access_link_resent"),
    ))
    .orderBy(desc(paymentAuditLogs.createdAt))
    .limit(1);
  if (recent?.createdAt && Date.now() - new Date(recent.createdAt).getTime() < 60_000) {
    throw new Error("Veuillez patienter 60 secondes entre chaque renvoi d’accès.");
  }

  const { rawToken, tokenHash } = issuePasswordResetToken();
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await db.update(candidates).set({
    passwordResetToken: tokenHash,
    passwordResetExpiresAt: expires,
  }).where(eq(candidates.id, candidateRowId));

  const setPasswordUrl = buildSetPasswordAccessUrl(rawToken, dossierNumber);
  let emailSent = false;
  try {
    await sendClientAccessInviteEmail({
      email,
      fullName,
      dossierNumber,
      setPasswordUrl,
      isResend: true,
    });
    emailSent = true;
  } catch (error) {
    console.error("[resendClientAccessLink] email failed", { email, error });
    throw new Error("Le lien d’accès n’a pas pu être envoyé par e-mail. Vérifiez le service e-mail.");
  }

  await db.insert(paymentAuditLogs).values({
    adminName,
    adminEmail,
    action: "client_access_link_resent",
    paymentId: candidateRowId,
    candidateEmail: email,
    amount: "",
    details: `Lien d’accès espace client renvoyé pour ${dossierNumber} (${email}). Valable 48 h.${createdAccount ? " Compte créé à cette occasion." : ""}`,
  });

  let whatsappSent = false;
  let whatsappSkippedReason: string | null = null;
  try {
    const wa = await notifyClientAccessLinkWhatsApp({
      phone,
      candidateName: fullName,
      dossierNumber,
      accessUrl: setPasswordUrl,
    });
    whatsappSent = wa.sent;
    whatsappSkippedReason = wa.sent ? null : (wa.error || "WhatsApp non envoyé");
    if (wa.sent) {
      await db.insert(paymentAuditLogs).values({
        adminName,
        adminEmail,
        action: "client_access_link_whatsapp",
        paymentId: candidateRowId,
        candidateEmail: email,
        amount: "",
        details: `WhatsApp lien d’accès envoyé pour ${dossierNumber}${wa.phoneE164 ? ` → ${wa.phoneE164}` : ""}.`,
      });
    }
  } catch (error) {
    console.warn("[resendClientAccessLink] WhatsApp skipped", error);
    whatsappSkippedReason = error instanceof Error ? error.message : "Notification ignorée";
  }

  return {
    success: true,
    candidateId: candidateRowId,
    email,
    dossierNumber,
    emailSent,
    whatsappSent,
    whatsappSkippedReason,
    createdAccount,
  };
}
