/**
 * Garantit qu’un client importé en agence a un compte espace client
 * et un lien d’accès (connexion ou définition du mot de passe).
 */

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, isNull, sql } from "drizzle-orm";
import { candidates } from "../../drizzle/schema";
import { buildCandidateSpaceAccessUrl } from "./candidateAccessLink";
import { issuePasswordResetToken } from "../routers/candidate";
import { sendEmail as sendGenericEmail } from "../_core/email";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const CANONICAL = "https://www.3mtravelagency.com";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildSetPasswordAccessUrl(rawToken: string, dossierNumber?: string | null): string {
  const redirect = dossierNumber
    ? `/mon-espace?dossier=${encodeURIComponent(dossierNumber)}`
    : "/mon-espace";
  return `${CANONICAL}/reset-password?token=${encodeURIComponent(rawToken)}&from=${encodeURIComponent(redirect)}`;
}

async function sendAgencyAccessInviteEmail(input: {
  email: string;
  fullName: string;
  dossierNumber: string;
  setPasswordUrl: string;
}): Promise<void> {
  await sendGenericEmail({
    to: input.email,
    subject: `Votre espace client ${input.dossierNumber} — 3M TRAVEL AGENCY`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 32px 24px; text-align: center; color: #fff;">
          <h1 style="margin: 0; font-size: 22px;">3M TRAVEL AGENCY</h1>
          <p style="margin: 8px 0 0; color: #bfdbfe; font-size: 13px;">Votre dossier agence est prêt</p>
        </div>
        <div style="padding: 32px 28px; color: #374151;">
          <p>Bonjour <strong>${esc(input.fullName)}</strong>,</p>
          <p>Votre dossier <strong>${esc(input.dossierNumber)}</strong> a été ouvert en agence. Activez votre espace client pour voir vos documents et suivre chaque étape.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${esc(input.setPasswordUrl)}" style="display: inline-block; background: #1E3A8A; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700;">Activer mon espace client</a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">Ce lien est valable 48 heures. Ensuite, utilisez « Mot de passe oublié » sur la page de connexion.</p>
        </div>
      </div>
    `,
  });
}

export type EnsureAgencyClientAccessResult = {
  candidateId: number;
  created: boolean;
  inviteSent: boolean;
  accessUrl: string;
  setPasswordUrl: string | null;
};

/**
 * Crée le compte candidat s’il n’existe pas, envoie un lien pour définir
 * le mot de passe (nouveaux comptes ou comptes sans mot de passe),
 * sinon renvoie le lien de connexion vers le dossier.
 */
export async function ensureAgencyClientAccess(
  db: Db,
  input: {
    email: string;
    fullName: string;
    phone?: string | null;
    destinationCoarse?: string | null;
    visaType?: string | null;
    preferredDestinations?: string[];
    dossierNumber: string;
    sendInviteEmail?: boolean;
  },
): Promise<EnsureAgencyClientAccessResult> {
  const email = input.email.trim().toLowerCase();
  const accessUrl = buildCandidateSpaceAccessUrl(input.dossierNumber);

  const [existing] = await db
    .select({
      id: candidates.id,
      passwordHash: candidates.passwordHash,
      fullName: candidates.fullName,
    })
    .from(candidates)
    .where(and(sql`LOWER(TRIM(${candidates.email})) = ${email}`, isNull(candidates.deletedAt)))
    .limit(1);

  let candidateId = existing?.id ?? 0;
  let created = false;
  let needsPasswordInvite = false;

  if (!existing) {
    const placeholderHash = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
    await db.insert(candidates).values({
      fullName: input.fullName.trim(),
      email,
      passwordHash: placeholderHash,
      phone: input.phone?.trim() || null,
      destination: (input.destinationCoarse as any) || "autre",
      preferredDestinations: JSON.stringify(input.preferredDestinations ?? []),
      visaType: input.visaType || null,
      dossierStatus: "documents",
      emailVerified: true,
      activeDossierNumber: input.dossierNumber,
      activeDossierSetAt: new Date(),
      evaluationDeclarationStatus: "validated",
      evaluationDeclaredAt: new Date(),
      evaluationReviewedAt: new Date(),
      evaluationReviewNote: "Compte ouvert automatiquement lors de l’import du dossier physique en agence.",
    });
    const [createdRow] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(and(eq(candidates.email, email), isNull(candidates.deletedAt)))
      .limit(1);
    if (!createdRow) throw new Error("Création du compte client impossible.");
    candidateId = createdRow.id;
    created = true;
    needsPasswordInvite = true;
  } else {
    needsPasswordInvite = !existing.passwordHash || existing.passwordHash.length < 20;
    const patch: Record<string, unknown> = {
      activeDossierNumber: input.dossierNumber,
      activeDossierSetAt: new Date(),
    };
    if (input.phone?.trim()) patch.phone = input.phone.trim();
    if (input.visaType) patch.visaType = input.visaType;
    if (input.preferredDestinations?.length) patch.preferredDestinations = JSON.stringify(input.preferredDestinations);
    if (input.destinationCoarse) patch.destination = input.destinationCoarse;
    await db.update(candidates).set(patch).where(eq(candidates.id, existing.id));
  }

  let setPasswordUrl: string | null = null;
  let inviteSent = false;

  if (needsPasswordInvite && input.sendInviteEmail !== false) {
    const { rawToken, tokenHash } = issuePasswordResetToken();
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await db.update(candidates).set({
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: expires,
    }).where(eq(candidates.id, candidateId));
    setPasswordUrl = buildSetPasswordAccessUrl(rawToken, input.dossierNumber);
    try {
      await sendAgencyAccessInviteEmail({
        email,
        fullName: input.fullName,
        dossierNumber: input.dossierNumber,
        setPasswordUrl,
      });
      inviteSent = true;
    } catch (error) {
      console.error("[ensureAgencyClientAccess] invite e-mail:", error);
    }
  }

  return {
    candidateId,
    created,
    inviteSent,
    accessUrl,
    setPasswordUrl,
  };
}
