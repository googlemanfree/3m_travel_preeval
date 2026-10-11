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
import type { getDb } from "../db";
import { sendClientAccessInviteEmail } from "./clientAccessInviteEmail";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const CANONICAL = "https://www.3mtravelagency.com";

export function buildSetPasswordAccessUrl(rawToken: string, dossierNumber?: string | null): string {
  const redirect = dossierNumber
    ? `/mon-espace?dossier=${encodeURIComponent(dossierNumber)}`
    : "/mon-espace";
  return `${CANONICAL}/reset-password?token=${encodeURIComponent(rawToken)}&from=${encodeURIComponent(redirect)}`;
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
      await sendClientAccessInviteEmail({
        email,
        fullName: input.fullName,
        dossierNumber: input.dossierNumber,
        setPasswordUrl,
        isResend: false,
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
