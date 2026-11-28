import { and, eq, isNull } from "drizzle-orm";
import { agencyDossiers, applications } from "../../drizzle/schema";
import { parseEvalAgencyShellId } from "../../shared/evalAgencyShell";
import { ensureAgencyActiveReference } from "./canonicalizeActiveDossier";
import { promoteOnlineApplicationToActiveNumber } from "./promotePaidReference";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

type PaymentSource = "online" | "agency";

/**
 * Normalise une référence COMPTE/EVAL vers 3M uniquement après que l'appelant
 * a confirmé le paiement d'ouverture. L'opération est idempotente et best-effort:
 * une erreur de référence ne doit jamais annuler la confirmation financière.
 */
export async function normalizeAfterOpeningPayment(
  db: Db,
  input: {
    source: PaymentSource;
    dossierId: number;
    candidateEmail?: string | null;
    adminEmail?: string | null;
  },
): Promise<{ normalized: boolean; canonical?: string; purged: number; reason?: string }> {
  if (input.source === "agency") {
    const [dossier] = await db
      .select({ id: agencyDossiers.id, email: agencyDossiers.email })
      .from(agencyDossiers)
      .where(and(eq(agencyDossiers.id, input.dossierId), isNull(agencyDossiers.deletedAt)))
      .limit(1);
    if (!dossier) return { normalized: false, purged: 0, reason: "agency_not_found" };

    const result = await ensureAgencyActiveReference(db, {
      agencyDossierId: dossier.id,
      email: input.candidateEmail || dossier.email,
      adminEmail: input.adminEmail,
    });
    return { normalized: true, canonical: result.canonical, purged: result.purged };
  }

  const [application] = await db
    .select({ dossierNumber: applications.dossierNumber, email: applications.email })
    .from(applications)
    .where(and(eq(applications.id, input.dossierId), isNull(applications.deletedAt)))
    .limit(1);
  if (!application) return { normalized: false, purged: 0, reason: "application_not_found" };

  const agencyDossierId = parseEvalAgencyShellId(application.dossierNumber);
  if (agencyDossierId == null) {
    // Demande en ligne portant « COMPTE-… » : le paiement vient d'être confirmé, elle reçoit son numéro 3M-… définitif.
    const promotion = await promoteOnlineApplicationToActiveNumber(db, input.dossierId, input.adminEmail || "system");
    if (promotion.promoted) return { normalized: true, canonical: promotion.to, purged: 0 };
    return { normalized: false, purged: 0, reason: "not_eval_agency_shell" };
  }

  const result = await ensureAgencyActiveReference(db, {
    agencyDossierId,
    email: input.candidateEmail || application.email,
    adminEmail: input.adminEmail,
  });
  return { normalized: true, canonical: result.canonical, purged: result.purged };
}
