/**
 * Crée (si besoin) le dossier opérationnel et ensemence la checklist
 * pays + procédure immédiatement à l’activation / import.
 */

import { eq } from "drizzle-orm";
import { agencyDossiers, applications, candidates } from "../../drizzle/schema";
import { caseActivityLogs, cases, documentRequirements } from "../../drizzle/caseTrackingSchema";
import { buildCountryProcedureDocumentChecklist } from "../../shared/countryProcedureChecklist";
import { agencyDossierReference } from "../../shared/caseReference";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function ensureAgencyOperationalCase(
  db: Db,
  agencyDossierId: number,
): Promise<{ id: number; caseNumber: string }> {
  const [existing] = await db.select().from(cases).where(eq(cases.legacyAgencyDossierId, agencyDossierId)).limit(1);
  if (existing) return { id: existing.id, caseNumber: existing.caseNumber };

  const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, agencyDossierId)).limit(1);
  if (!dossier) throw new Error(`Dossier agence #${agencyDossierId} introuvable pour seed checklist.`);
  const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
  const caseNumber = agencyDossierReference(agencyDossierId);
  await db.insert(cases).values({
    caseNumber,
    candidateId: candidate?.id ?? null,
    legacyAgencyDossierId: dossier.id,
    sourceChannel: "agency_manual",
    countryTarget: dossier.destination,
    caseType: "integral",
    visaType: dossier.visaType,
    currentStatus: dossier.status,
    openedAt: dossier.createdAt,
  });
  const [created] = await db.select().from(cases).where(eq(cases.legacyAgencyDossierId, agencyDossierId)).limit(1);
  if (!created) throw new Error(`Création case opérationnelle impossible pour agence #${agencyDossierId}.`);
  return { id: created.id, caseNumber: created.caseNumber };
}

async function ensureOnlineOperationalCase(
  db: Db,
  applicationId: number,
): Promise<{ id: number; caseNumber: string }> {
  const [existing] = await db.select().from(cases).where(eq(cases.legacyApplicationId, applicationId)).limit(1);
  if (existing) return { id: existing.id, caseNumber: existing.caseNumber };
  const [application] = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
  if (!application) throw new Error(`Dossier en ligne #${applicationId} introuvable pour seed checklist.`);
  await db.insert(cases).values({
    caseNumber: application.dossierNumber,
    candidateId: application.candidateId,
    legacyApplicationId: application.id,
    sourceChannel: "online",
    countryTarget: application.destination,
    caseType: application.formulaChosen,
    visaType: application.visaType,
    currentStatus: application.dossierStatus,
    openedAt: application.createdAt,
  });
  const [created] = await db.select().from(cases).where(eq(cases.legacyApplicationId, applicationId)).limit(1);
  if (!created) throw new Error(`Création case opérationnelle impossible pour online #${applicationId}.`);
  return { id: created.id, caseNumber: created.caseNumber };
}

/** Ensème la checklist pays+procédure ; n’écrase jamais les exigences déjà présentes. */
export async function seedCountryProcedureChecklist(
  db: Db,
  input: {
    source: "agency" | "online";
    id: number;
    destination: string;
    visaType: string;
    actorAdminId?: number | null;
  },
): Promise<{ caseId: number; added: number; label: string }> {
  const operational = input.source === "agency"
    ? await ensureAgencyOperationalCase(db, input.id)
    : await ensureOnlineOperationalCase(db, input.id);

  // Met à jour pays/visa sur le case pour aligner le pilotage dynamique.
  await db.update(cases).set({
    countryTarget: input.destination,
    visaType: input.visaType,
  }).where(eq(cases.id, operational.id));

  const template = buildCountryProcedureDocumentChecklist({
    destination: input.destination,
    procedureType: input.visaType,
  });
  const existing = await db.select({ documentType: documentRequirements.documentType })
    .from(documentRequirements)
    .where(eq(documentRequirements.caseId, operational.id));
  const existingTypes = new Set(existing.map((item) => item.documentType.toLowerCase()));
  const missing = template.documents.filter((item) => !existingTypes.has(item.documentType.toLowerCase()));
  if (missing.length) {
    await db.insert(documentRequirements).values(missing.map((item) => ({
      caseId: operational.id,
      documentType: item.documentType,
      isRequired: true,
      status: "pending" as const,
      adminComment: item.comment,
    })));
  }
  await db.insert(caseActivityLogs).values({
    caseId: operational.id,
    actorRole: "admin",
    actorId: input.actorAdminId ?? null,
    actionType: "procedure_checklist_seeded",
    entityType: "document_requirement",
    description: `Checklist auto ${template.label} · ${input.destination} : ${missing.length} pièce(s) ajoutée(s) à la création du dossier.`,
  });
  return { caseId: operational.id, added: missing.length, label: template.label };
}
