/**
 * Automatisation Vague 1 — après frais d’ouverture confirmés (CinetPay ou admin) :
 * - validation admin-compatible (paymentValidatedAt/By)
 * - pack reçu + Protocole N°01
 * - purge miroir EVAL-AG → référence 3M si dossier agence lié
 */

import { and, eq, isNull } from "drizzle-orm";
import { agencyDossiers, applications, candidates } from "../../drizzle/schema";
import { isActiveDossierReference } from "../../shared/caseReference";
import { parseEvalAgencyShellId } from "../../shared/evalAgencyShell";
import type { getDb } from "../db";
import { ensureAgencyActiveReference } from "./canonicalizeActiveDossier";
import { sendReceiptAndProtocol, type PaymentReference } from "./paymentPackage";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const CINETPAY_VALIDATOR = "CinetPay";

export type OpeningPaymentAutomationResult = {
  packageSent: boolean;
  packageAlreadySent: boolean;
  packageError: string | null;
  evalPurged: number;
  canonical: string | null;
};

/** Après confirmation paiement : reçu+protocole + purge EVAL si miroir. */
export async function runOpeningPaymentAutomation(
  db: Db,
  reference: PaymentReference,
  adminEmail: string,
): Promise<OpeningPaymentAutomationResult> {
  const actor = (adminEmail || CINETPAY_VALIDATOR).trim() || CINETPAY_VALIDATOR;
  let packageSent = false;
  let packageAlreadySent = false;
  let packageError: string | null = null;
  try {
    const pack = await sendReceiptAndProtocol(db, reference, { email: actor });
    packageSent = pack.sent;
    packageAlreadySent = pack.alreadySent;
  } catch (error) {
    packageError = error instanceof Error ? error.message : "Pack reçu + protocole non envoyé.";
    console.error("[openingPaymentAutomation] pack failed", { reference, error });
  }

  let evalPurged = 0;
  let canonical: string | null = null;
  try {
    if (reference.source === "agency") {
      const [agencyRow] = await db
        .select({ email: agencyDossiers.email })
        .from(agencyDossiers)
        .where(and(eq(agencyDossiers.id, reference.id), isNull(agencyDossiers.deletedAt)))
        .limit(1);
      if (agencyRow?.email) {
        const result = await ensureAgencyActiveReference(db, {
          agencyDossierId: reference.id,
          email: agencyRow.email,
          adminEmail: actor,
        });
        evalPurged = result.purged;
        canonical = result.canonical;
      }
    } else {
      const [app] = await db
        .select({
          dossierNumber: applications.dossierNumber,
          email: applications.email,
          candidateId: applications.candidateId,
        })
        .from(applications)
        .where(eq(applications.id, reference.id))
        .limit(1);
      if (app) {
        const shellId = parseEvalAgencyShellId(app.dossierNumber);
        if (shellId != null) {
          const result = await ensureAgencyActiveReference(db, {
            agencyDossierId: shellId,
            email: app.email,
            adminEmail: actor,
          });
          evalPurged = result.purged;
          canonical = result.canonical;
        } else if (app.candidateId && isActiveDossierReference(app.dossierNumber)) {
          try {
            await db
              .update(candidates)
              .set({ activeDossierNumber: app.dossierNumber })
              .where(and(eq(candidates.id, app.candidateId), isNull(candidates.deletedAt)));
            canonical = app.dossierNumber;
          } catch (error) {
            console.warn("[openingPaymentAutomation] activeDossierNumber skip", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("[openingPaymentAutomation] EVAL purge failed", { reference, error });
  }

  return { packageSent, packageAlreadySent, packageError, evalPurged, canonical };
}

/**
 * Première transition CinetPay PENDING → SUCCESS déjà écrite en base :
 * complète paymentValidated* si manquant, puis pack + purge EVAL.
 */
export async function finalizeOnlineOpeningPaymentAfterCinetPay(
  db: Db,
  applicationId: number,
): Promise<OpeningPaymentAutomationResult & { validated: boolean }> {
  const now = new Date();
  const [app] = await db
    .select({
      paymentStatus: applications.paymentStatus,
      paymentAmount: applications.paymentAmount,
      paymentConfirmedAmount: applications.paymentConfirmedAmount,
      paymentExpectedAmount: applications.paymentExpectedAmount,
      paymentValidatedAt: applications.paymentValidatedAt,
      paymentValidatedBy: applications.paymentValidatedBy,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!app || app.paymentStatus !== "SUCCESS") {
    return {
      packageSent: false,
      packageAlreadySent: false,
      packageError: "Paiement non confirmé.",
      evalPurged: 0,
      canonical: null,
      validated: false,
    };
  }

  const patch: {
    paymentValidatedAt?: Date;
    paymentValidatedBy?: string;
    paymentConfirmedAmount?: number;
    paymentExpectedAmount?: number;
  } = {};
  if (!app.paymentValidatedAt) patch.paymentValidatedAt = now;
  if (!app.paymentValidatedBy?.trim()) patch.paymentValidatedBy = CINETPAY_VALIDATOR;
  if (app.paymentConfirmedAmount == null && app.paymentAmount != null) {
    patch.paymentConfirmedAmount = app.paymentAmount;
  }
  if (app.paymentExpectedAmount == null && app.paymentAmount != null) {
    patch.paymentExpectedAmount = app.paymentAmount;
  }
  if (Object.keys(patch).length > 0) {
    await db.update(applications).set(patch).where(eq(applications.id, applicationId));
  }

  const automation = await runOpeningPaymentAutomation(
    db,
    { source: "online", id: applicationId },
    CINETPAY_VALIDATOR,
  );

  // Vague 2 : si le compte lié est prêt (évaluation + paiement), activer COMPTE → 3M.
  try {
    const [app] = await db
      .select({ candidateId: applications.candidateId, email: applications.email })
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);
    if (app?.candidateId) {
      const { activateReadyPreDossier } = await import("./autoActivatePreDossier");
      await activateReadyPreDossier(db, app.candidateId, { actorEmail: CINETPAY_VALIDATOR });
    } else if (app?.email) {
      const [linked] = await db
        .select({ id: candidates.id })
        .from(candidates)
        .where(and(eq(candidates.email, app.email), isNull(candidates.deletedAt)))
        .limit(1);
      if (linked) {
        const { activateReadyPreDossier } = await import("./autoActivatePreDossier");
        await activateReadyPreDossier(db, linked.id, { actorEmail: CINETPAY_VALIDATOR });
      }
    }
  } catch (error) {
    console.warn("[openingPaymentAutomation] auto-activate skip", error);
  }

  return { ...automation, validated: true };
}
