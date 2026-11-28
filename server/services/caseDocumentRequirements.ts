/**
 * Pièces visibles dès leur réception, sans validation préalable.
 *
 * Une pièce déposée par le candidat (espace client) ou remise en agence est enregistrée dans le coffre du dossier (case_documents). L'écran
 * « Pièces du dossier » (administration) et le suivi du candidat s'appuient sur la liste des pièces du dossier (document_requirements) :
 * une pièce qui ne correspond à aucune ligne y restait invisible tant qu'un administrateur ne la synchronisait pas à la main.
 * Cette fonction (idempotente) rattache chaque pièce à une ligne : la ligne existante, ou une nouvelle ligne « hors checklist » au statut
 * « reçue ». Une pièce reçue reste visible et utilisable ; l'administrateur peut la rejeter en cas de problème, jamais l'inverse.
 */

import { and, desc, eq } from "drizzle-orm";
import { caseDocuments, documentRequirements } from "../../drizzle/caseTrackingSchema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const fold = (value: string): string => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Même règle de rapprochement que les services de publication (type de pièce demandé ↔ type de pièce reçue). */
export function requirementMatchesDocumentType(requirementType: string, documentType: string): boolean {
  const left = fold(requirementType);
  const right = fold(documentType);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const tokens = right.split(" ").filter((token) => token.length >= 3);
  return tokens.length > 0 && tokens.every((token) => left.includes(token));
}

export type RequirementStatusValue = "pending" | "received" | "approved" | "rejected" | "waived";

/** Statut de la ligne selon la pièce la plus récente : reçue (visible) par défaut, validée ou rejetée si l'équipe a tranché. */
export function requirementStatusForDocument(reviewStatus: string | null | undefined): RequirementStatusValue {
  const value = String(reviewStatus ?? "").toLowerCase();
  if (value === "approved") return "approved";
  if (value === "rejected" || value === "correction_required") return "rejected";
  return "received";
}

export type EnsureRequirementsResult = { created: number; promoted: number };

export async function ensureRequirementsForDocuments(db: Db, caseId: number): Promise<EnsureRequirementsResult> {
  const documents = await db
    .select({
      id: caseDocuments.id,
      documentType: caseDocuments.documentType,
      reviewStatus: caseDocuments.reviewStatus,
      uploadedAt: caseDocuments.uploadedAt,
    })
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, caseId))
    .orderBy(desc(caseDocuments.uploadedAt), desc(caseDocuments.id))
    .limit(300);
  if (documents.length === 0) return { created: 0, promoted: 0 };

  const requirements = await db.select().from(documentRequirements).where(eq(documentRequirements.caseId, caseId));

  // Une pièce (la plus récente) par type de document.
  const latestByType = new Map<string, (typeof documents)[number]>();
  for (const document of documents) {
    const key = fold(document.documentType);
    if (key && !latestByType.has(key)) latestByType.set(key, document);
  }

  let created = 0;
  let promoted = 0;
  for (const document of Array.from(latestByType.values())) {
    const matched = requirements.find((requirement) => requirement.status !== "waived" && requirementMatchesDocumentType(requirement.documentType, document.documentType));
    const status = requirementStatusForDocument(document.reviewStatus);
    if (!matched) {
      await db.insert(documentRequirements).values({
        caseId,
        documentType: document.documentType.slice(0, 100),
        isRequired: false,
        status,
        adminComment: "Pièce reçue : visible sans validation préalable, à rejeter en cas de problème.",
        validatedAt: status === "approved" ? new Date() : null,
        rejectedAt: status === "rejected" ? new Date() : null,
      });
      created += 1;
      continue;
    }
    // Une pièce « à fournir » dont le fichier est déjà là devient « reçue » : elle ne doit plus être réclamée au candidat.
    if (matched.status === "pending" && status !== "rejected") {
      await db.update(documentRequirements).set({
        status,
        validatedAt: status === "approved" ? new Date() : null,
      }).where(and(eq(documentRequirements.id, matched.id), eq(documentRequirements.status, "pending")));
      promoted += 1;
    }
  }
  return { created, promoted };
}
