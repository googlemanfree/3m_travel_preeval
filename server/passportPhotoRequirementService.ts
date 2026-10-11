import { and, desc, eq } from "drizzle-orm";
import { candidateMessages, candidates, clientNotifications } from "../drizzle/schema";
import {
  PASSPORT_PHOTO_PROFILE_ACTION_URL,
  PASSPORT_PHOTO_REQUEST_BODY,
  PASSPORT_PHOTO_REQUEST_TITLE,
  isPassportPhotoRequestReason,
  requiresPassportPhotoUpload,
} from "../shared/passportPhotoRequirement";
import { sendEmail as sendGenericEmail } from "./_core/email";

type Db = NonNullable<Awaited<ReturnType<typeof import("./db").getDb>>>;

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[character] ?? character);
}

/**
 * Marque le compte pour dépôt photo type passeport (remplace la photo de profil).
 * Envoie e-mail + notification espace client si demandé.
 */
export async function flagPassportPhotoRequirement(
  db: Db,
  input: {
    candidateId: number;
    email: string;
    fullName: string;
    currentReason?: string | null;
    sendEmail?: boolean;
    customReason?: string | null;
  },
): Promise<{ flagged: boolean; emailSent: boolean; notificationCreated: boolean }> {
  const reason = input.customReason?.trim() || PASSPORT_PHOTO_REQUEST_BODY;
  const alreadyFlagged = isPassportPhotoRequestReason(input.currentReason) && !input.customReason?.trim();
  if (!alreadyFlagged) {
    await db
      .update(candidates)
      .set({
        avatarVerificationStatus: "pending",
        avatarVerificationReason: reason,
        avatarVerifiedAt: null,
      })
      .where(eq(candidates.id, input.candidateId));
  }

  const [existingNotification] = await db
    .select({ id: clientNotifications.id })
    .from(clientNotifications)
    .where(
      and(
        eq(clientNotifications.candidateId, input.candidateId),
        eq(clientNotifications.type, "passport_photo_request"),
        eq(clientNotifications.isRead, false),
      ),
    )
    .orderBy(desc(clientNotifications.createdAt))
    .limit(1);

  let notificationCreated = false;
  let notificationId = existingNotification?.id ?? 0;
  if (!existingNotification) {
    const inserted = await db.insert(clientNotifications).values({
      candidateId: input.candidateId,
      type: "passport_photo_request",
      title: PASSPORT_PHOTO_REQUEST_TITLE,
      body: reason,
      actionUrl: PASSPORT_PHOTO_PROFILE_ACTION_URL,
      isRead: false,
    });
    notificationId = Number((inserted as any)[0]?.insertId || 0);
    notificationCreated = true;
    await db.insert(candidateMessages).values({
      candidateId: input.candidateId,
      notificationId: notificationId || null,
      senderRole: "advisor",
      content: `${PASSPORT_PHOTO_REQUEST_TITLE}\n\n${reason}`,
      isRead: false,
    });
  }

  let emailSent = false;
  if (input.sendEmail) {
    try {
      await sendGenericEmail({
        to: input.email,
        subject: `${PASSPORT_PHOTO_REQUEST_TITLE} — 3M TRAVEL AGENCY`,
        html: `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;max-width:640px">
<p>Bonjour ${escapeHtml(input.fullName)},</p>
<p>${escapeHtml(reason)}</p>
<p>Connectez-vous à votre <a href="${PASSPORT_PHOTO_PROFILE_ACTION_URL}">espace candidat → Profil</a> pour déposer la photo. Elle remplacera automatiquement votre photo de profil.</p>
<p style="color:#64748b;font-size:13px">3M TRAVEL AGENCY — espaces employeur et agences de placement</p>
</div>`,
      });
      emailSent = true;
    } catch (error) {
      console.error("[flagPassportPhotoRequirement] email failed", error);
    }
  }

  return { flagged: true, emailSent, notificationCreated };
}

/** Backfill silencieux pour dossiers travail déjà actifs (pas d’e-mail à chaque visite). */
export async function ensurePassportPhotoRequirementForActiveWorkDossier(
  db: Db,
  candidate: {
    id: number;
    email: string;
    fullName: string;
    dossierStatus?: string | null;
    visaType?: string | null;
    avatarVerificationReason?: string | null;
  },
  options?: { hasAgencyDossier?: boolean; projectType?: string | null },
): Promise<{ required: boolean }> {
  const required = requiresPassportPhotoUpload({
    dossierStatus: candidate.dossierStatus,
    hasAgencyDossier: options?.hasAgencyDossier,
    visaType: candidate.visaType,
    projectType: options?.projectType,
    avatarVerificationReason: candidate.avatarVerificationReason,
  });
  if (!required) return { required: false };

  await flagPassportPhotoRequirement(db, {
    candidateId: candidate.id,
    email: candidate.email,
    fullName: candidate.fullName,
    currentReason: candidate.avatarVerificationReason,
    sendEmail: false,
  });
  return { required: true };
}
