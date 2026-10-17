import { and, eq, isNull, like, sql } from "drizzle-orm";
import { agencyDossierHistory, agencyDossiers, applications, candidates } from "../../drizzle/schema";
import { agencyDossierReference, isActiveDossierReference } from "../../shared/caseReference";
import { parseEvalAgencyShellId } from "../../shared/evalAgencyShell";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

const PURGE_REASON = (canonical: string) =>
  `Miroir EVAL-AG absorbé automatiquement dans le dossier actif ${canonical}. Un seul dossier actif (3M-AGN).`;

/**
 * Soft-delete le miroir EVAL-AG-{id} et pose activeDossierNumber = 3M-AGN-{id}.
 * Sans destruction des pièces : le dossier agence reste la référence de travail.
 */
export async function purgeEvalAgencyShell(
  db: Db,
  input: {
    agencyDossierId: number;
    adminEmail?: string | null;
    candidateEmail?: string | null;
  },
): Promise<{ purgedApplicationIds: number[]; canonical: string; activeDossierUpdated: boolean }> {
  const agencyDossierId = Math.trunc(input.agencyDossierId);
  const canonical = agencyDossierReference(agencyDossierId);
  const evalCode = `EVAL-AG-${agencyDossierId}`;
  const actor = (input.adminEmail || "system").slice(0, 320);

  const shells = await db
    .select({
      id: applications.id,
      candidateId: applications.candidateId,
      email: applications.email,
      dossierNumber: applications.dossierNumber,
    })
    .from(applications)
    .where(and(eq(applications.dossierNumber, evalCode), isNull(applications.deletedAt)))
    .limit(20);

  const purgedApplicationIds: number[] = [];
  for (const shell of shells) {
    await db
      .update(applications)
      .set({
        deletedAt: new Date(),
        deletedBy: actor,
        deletionReason: PURGE_REASON(canonical),
      })
      .where(eq(applications.id, shell.id));
    purgedApplicationIds.push(shell.id);
  }

  let activeDossierUpdated = false;
  const email = (input.candidateEmail || shells[0]?.email || "").trim();
  // activeDossierNumber (migration 0079) : ne jamais faire échouer la lecture admin
  // si la colonne n’est pas encore déployée sur l’environnement cible.
  try {
    if (email) {
      await db
        .update(candidates)
        .set({ activeDossierNumber: canonical })
        .where(and(sql`LOWER(${candidates.email}) = LOWER(${email})`, isNull(candidates.deletedAt)));
      activeDossierUpdated = true;
    } else if (shells[0]?.candidateId) {
      await db
        .update(candidates)
        .set({ activeDossierNumber: canonical })
        .where(eq(candidates.id, shells[0].candidateId));
      activeDossierUpdated = true;
    }
  } catch (error) {
    console.warn("[purgeEvalAgencyShell] activeDossierNumber non mis à jour:", error instanceof Error ? error.message : error);
  }

  try {
    await db.insert(agencyDossierHistory).values({
      dossierId: agencyDossierId,
      action: "reference_canonicalized",
      changedBy: actor,
      oldValue: evalCode,
      newValue: canonical,
      details: purgedApplicationIds.length
        ? `Suppression miroir EVAL (${purgedApplicationIds.length}) · référence active ${canonical}`
        : `Référence active confirmée ${canonical}`,
    });
  } catch {
    // Historique non bloquant.
  }

  return { purgedApplicationIds, canonical, activeDossierUpdated };
}

/** Tous les miroirs EVAL-AG dont le dossier agence existe encore. */
export async function purgeAllOrphanEvalAgencyShells(
  db: Db,
  input?: { adminEmail?: string | null; limit?: number },
): Promise<{ processed: number; purged: number; canonicals: string[] }> {
  const limit = Math.min(Math.max(input?.limit ?? 200, 1), 500);
  const shells = await db
    .select({
      id: applications.id,
      dossierNumber: applications.dossierNumber,
      email: applications.email,
    })
    .from(applications)
    .where(and(like(applications.dossierNumber, "EVAL-AG-%"), isNull(applications.deletedAt)))
    .limit(limit);

  let purged = 0;
  const canonicals: string[] = [];
  let skippedUnpaid = 0;
  for (const shell of shells) {
    const agencyId = parseEvalAgencyShellId(shell.dossierNumber);
    if (agencyId == null) continue;
    const [agency] = await db
      .select({ id: agencyDossiers.id, initialPaymentStatus: agencyDossiers.initialPaymentStatus })
      .from(agencyDossiers)
      .where(and(eq(agencyDossiers.id, agencyId), isNull(agencyDossiers.deletedAt)))
      .limit(1);
    if (!agency) continue;
    // Pas de passage COMPTE → 3M sans frais d’ouverture validés.
    if (agency.initialPaymentStatus !== "paid") {
      skippedUnpaid += 1;
      continue;
    }
    const result = await purgeEvalAgencyShell(db, {
      agencyDossierId: agencyId,
      adminEmail: input?.adminEmail,
      candidateEmail: shell.email,
    });
    purged += result.purgedApplicationIds.length;
    canonicals.push(result.canonical);
  }
  return { processed: shells.length, purged, skippedUnpaid, canonicals: Array.from(new Set(canonicals)) };
}

/**
 * Pose / corrige la référence active côté compte (doit être un numéro 3M-…).
 * Optionnellement renomme aussi une application en ligne (hors miroir EVAL déjà purgé).
 */
export async function setAdminActiveDossierReference(
  db: Db,
  input: {
    candidateEmail: string;
    newReference: string;
    adminEmail?: string | null;
    renameOnlineApplicationId?: number | null;
  },
): Promise<{ activeDossierNumber: string; renamedApplication: boolean }> {
  const next = input.newReference.trim().toUpperCase();
  if (!isActiveDossierReference(next)) {
    throw new Error("La référence active doit commencer par 3M- (ex. 3M-AGN-240001).");
  }
  if (next.length > 80) {
    throw new Error("Référence trop longue.");
  }

  try {
    await db
      .update(candidates)
      .set({ activeDossierNumber: next })
      .where(and(sql`LOWER(${candidates.email}) = LOWER(${input.candidateEmail})`, isNull(candidates.deletedAt)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/activeDossierNumber|Unknown column/i.test(message)) {
      throw new Error("La colonne activeDossierNumber est absente. Appliquez la migration 0079_active_dossier_number.sql puis réessayez.");
    }
    throw error;
  }

  let renamedApplication = false;
  if (input.renameOnlineApplicationId && input.renameOnlineApplicationId > 0) {
    const [existing] = await db
      .select({ id: applications.id, dossierNumber: applications.dossierNumber })
      .from(applications)
      .where(
        and(
          eq(applications.dossierNumber, next),
          isNull(applications.deletedAt),
          sql`${applications.id} <> ${input.renameOnlineApplicationId}`,
        ),
      )
      .limit(1);
    if (existing) {
      throw new Error(`La référence ${next} est déjà utilisée par un autre dossier.`);
    }
    await db
      .update(applications)
      .set({ dossierNumber: next })
      .where(
        and(
          eq(applications.id, input.renameOnlineApplicationId),
          isNull(applications.deletedAt),
        ),
      );
    renamedApplication = true;
  }

  return { activeDossierNumber: next, renamedApplication };
}

export async function ensureAgencyActiveReference(
  db: Db,
  input: { agencyDossierId: number; email: string; adminEmail?: string | null },
): Promise<{ canonical: string; purged: number }> {
  const result = await purgeEvalAgencyShell(db, {
    agencyDossierId: input.agencyDossierId,
    candidateEmail: input.email,
    adminEmail: input.adminEmail,
  });
  return { canonical: result.canonical, purged: result.purgedApplicationIds.length };
}
