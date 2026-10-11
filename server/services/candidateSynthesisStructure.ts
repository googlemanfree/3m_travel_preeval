/**
 * Structure automatique de la fiche de synthèse à partir des pièces du dossier.
 * Appelé après chaque dépôt candidat / admin / agence — sans appel modèle.
 */

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  agencyDossierDocuments,
  agencyDossiers,
  candidateFiles,
  candidates,
  candidateSynthesisEvents,
  candidateSynthesisSheets,
  evaluations,
} from "../../drizzle/schema";
import {
  buildSourceFingerprint,
  displayNameParts,
  documentTypeLabel,
  SynthesisContentSchema,
  type SynthesisContent,
  type SynthesisDocumentRef,
} from "../../shared/candidateSynthesisSheet";
import { getDb } from "../db";

export type DossierDocumentRow = {
  id: number;
  type: string;
  status: string;
  source: "candidate" | "agency" | "admin";
  uploadedAt: Date | string | null;
  fileUrl?: string | null;
};

function mapFileStatus(status: string): SynthesisDocumentRef["status"] {
  if (status === "verified" || status === "approved") return "verified";
  if (status === "rejected") return "rejected";
  if (status === "pending") return "pending";
  return "uploaded";
}

export function buildDocumentRefs(docs: DossierDocumentRow[]): SynthesisDocumentRef[] {
  // Une entrée par type normalisé (la plus récente), pour une fiche lisible côté employeur / agence.
  const byType = new Map<string, DossierDocumentRow>();
  for (const doc of docs) {
    const key = documentTypeLabel(doc.type); // regroupe passeport/passport, cv/resume, etc.
    const existing = byType.get(key);
    if (!existing) {
      byType.set(key, doc);
      continue;
    }
    const existingTime = existing.uploadedAt ? new Date(existing.uploadedAt).getTime() : 0;
    const nextTime = doc.uploadedAt ? new Date(doc.uploadedAt).getTime() : 0;
    if (nextTime >= existingTime) byType.set(key, doc);
  }
  return Array.from(byType.values())
    .sort((a, b) => documentTypeLabel(a.type).localeCompare(documentTypeLabel(b.type), "fr"))
    .map((doc) => ({
      type: doc.type,
      label: documentTypeLabel(doc.type),
      status: mapFileStatus(doc.status),
      source: doc.source,
      uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : null,
    }));
}

/** Déclenchement fire-and-forget après dépôt / changement de statut. */
export function scheduleSynthesisRestructure(candidateId: number | null | undefined, context: string): void {
  if (!candidateId || !Number.isFinite(candidateId) || candidateId <= 0) return;
  void restructureSynthesisAfterDocumentChange(candidateId).catch((error) =>
    console.error(`[synthesis] restructure ${context}`, error),
  );
}

/** Résout le candidat lié à un dossier agence (e-mail) puis restructure la fiche. */
export async function restructureSynthesisForAgencyDossier(dossierId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const [dossier] = await db
    .select({ email: agencyDossiers.email })
    .from(agencyDossiers)
    .where(eq(agencyDossiers.id, dossierId))
    .limit(1);
  if (!dossier?.email) return;
  const email = dossier.email.trim().toLowerCase();
  const [candidate] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(sql`LOWER(TRIM(${candidates.email})) = ${email}`)
    .limit(1);
  if (candidate?.id) await restructureSynthesisAfterDocumentChange(candidate.id);
}

export async function loadDossierDocuments(candidateId: number): Promise<DossierDocumentRow[]> {
  const db = await getDb();
  if (!db) return [];
  const files = await db
    .select({
      id: candidateFiles.id,
      type: candidateFiles.fileType,
      status: candidateFiles.status,
      uploadedAt: candidateFiles.uploadedAt,
      fileUrl: candidateFiles.fileUrl,
    })
    .from(candidateFiles)
    .where(eq(candidateFiles.candidateId, candidateId))
    .orderBy(desc(candidateFiles.uploadedAt))
    .limit(200);

  const [candidateRow] = await db
    .select({ email: candidates.email })
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);
  const dossiers = candidateRow?.email
    ? await db
        .select({ id: agencyDossiers.id })
        .from(agencyDossiers)
        .where(eq(agencyDossiers.email, candidateRow.email))
        .limit(20)
    : [];
  const dossierIds = dossiers.map((row) => row.id);
  const agencyDocs = dossierIds.length
    ? await db
        .select({
          id: agencyDossierDocuments.id,
          type: agencyDossierDocuments.documentType,
          status: agencyDossierDocuments.verificationStatus,
          uploadedAt: agencyDossierDocuments.createdAt,
          fileUrl: agencyDossierDocuments.documentUrl,
          source: agencyDossierDocuments.source,
        })
        .from(agencyDossierDocuments)
        .where(inArray(agencyDossierDocuments.dossierId, dossierIds))
        .orderBy(desc(agencyDossierDocuments.createdAt))
        .limit(200)
    : [];

  return [
    ...files.map((file) => ({
      id: file.id,
      type: file.type,
      status: file.status,
      source: "candidate" as const,
      uploadedAt: file.uploadedAt,
      fileUrl: file.fileUrl,
    })),
    ...agencyDocs.map((doc) => ({
      id: 1_000_000 + doc.id,
      type: doc.type,
      status: doc.status || "pending",
      source: (doc.source === "admin_upload" ? "admin" : "agency") as "admin" | "agency",
      uploadedAt: doc.uploadedAt,
      fileUrl: doc.fileUrl,
    })),
  ];
}

function emptyShell(input: {
  fullName: string;
  city?: string | null;
  nationality?: string | null;
  destination?: string | null;
  visaType?: string | null;
  dossierReference: string;
  documents: SynthesisDocumentRef[];
}): SynthesisContent {
  const { firstName, lastInitial } = displayNameParts(input.fullName);
  return SynthesisContentSchema.parse({
    displayFirstName: firstName,
    displayLastInitial: lastInitial || "X",
    profileTitle: null,
    residenceCountry: input.nationality ?? null,
    residenceCity: input.city ?? null,
    targetDestination: input.destination ?? null,
    targetProcedure: input.visaType ?? null,
    summary: null,
    experiences: [],
    education: null,
    skills: [],
    languages: [],
    documents: input.documents,
    missing: input.documents.length ? [] : ["Aucune pièce justificative déposée dans le dossier"],
    dossierReference: input.dossierReference,
    generatedAtLabel: new Date().toLocaleDateString("fr-FR"),
  });
}

function mergeDocumentsIntoContent(content: SynthesisContent, documents: SynthesisDocumentRef[]): SynthesisContent {
  const next = {
    ...content,
    documents,
    generatedAtLabel: new Date().toLocaleDateString("fr-FR"),
    missing: content.missing.filter((item) => !/pièce justificative/i.test(item)),
  };
  if (!documents.length && !next.missing.some((item) => /pièce/i.test(item))) {
    next.missing = [...next.missing, "Aucune pièce justificative déposée dans le dossier"];
  }
  return SynthesisContentSchema.parse(next);
}

/**
 * Après chaque ajout / modification de pièce : met à jour la structure documentaire
 * et repasse une fiche validée en « à revalider » si l’empreinte change.
 */
export async function restructureSynthesisAfterDocumentChange(candidateId: number): Promise<{
  ok: true;
  sheetId: number | null;
  status: string | null;
  documentsCount: number;
} | { ok: false; error: string }> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Base de données indisponible." };

  const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId)).limit(1);
  if (!candidate) return { ok: false, error: "Candidat introuvable." };

  const docs = await loadDossierDocuments(candidateId);
  const documentRefs = buildDocumentRefs(docs);
  const cvFile = docs.find((doc) => doc.type === "cv");
  const [evaluation] = await db
    .select({ id: evaluations.id, destinationCountry: evaluations.destinationCountry, projectType: evaluations.projectType, cityOfResidence: evaluations.cityOfResidence })
    .from(evaluations)
    .where(eq(evaluations.candidateId, candidateId))
    .orderBy(desc(evaluations.createdAt))
    .limit(1);

  const fingerprint = buildSourceFingerprint({
    cvUrl: cvFile?.fileUrl || evaluation ? "eval-cv" : null,
    avatarUrl: candidate.avatarUrl,
    documents: docs.map((doc) => ({ id: doc.id, type: doc.type, status: doc.status, updatedAt: doc.uploadedAt })),
  });

  const [latest] = await db
    .select()
    .from(candidateSynthesisSheets)
    .where(eq(candidateSynthesisSheets.candidateId, candidateId))
    .orderBy(desc(candidateSynthesisSheets.version), desc(candidateSynthesisSheets.id))
    .limit(1);

  const dossierReference = `3M-${candidateId}`;
  const shell = emptyShell({
    fullName: candidate.fullName,
    city: evaluation?.cityOfResidence || null,
    nationality: candidate.nationality,
    destination: evaluation?.destinationCountry || candidate.destination || null,
    visaType: evaluation?.projectType || candidate.visaType || null,
    dossierReference,
    documents: documentRefs,
  });

  if (!latest) {
    const [inserted] = await db
      .insert(candidateSynthesisSheets)
      .values({
        candidateId,
        version: 1,
        status: "draft",
        draftJson: JSON.stringify(shell),
        contentJson: null,
        sourceFingerprint: fingerprint,
        portraitUrl: candidate.avatarVerificationStatus === "verified" ? candidate.avatarUrl : null,
        missingJson: JSON.stringify(shell.missing),
      })
      .$returningId();
    const sheetId = Number(inserted?.id || 0);
    if (sheetId) {
      await db.insert(candidateSynthesisEvents).values({
        sheetId,
        candidateId,
        actorType: "system",
        actorRef: "document_change",
        action: "auto_structured",
        note: `${documentRefs.length} pièce(s) structurée(s)`,
      });
    }
    return { ok: true, sheetId: sheetId || null, status: "draft", documentsCount: documentRefs.length };
  }

  let draftContent: SynthesisContent = shell;
  try {
    if (latest.draftJson) draftContent = mergeDocumentsIntoContent(SynthesisContentSchema.parse(JSON.parse(latest.draftJson)), documentRefs);
  } catch {
    draftContent = shell;
  }

  let contentJson = latest.contentJson;
  if (latest.contentJson) {
    try {
      const validated = mergeDocumentsIntoContent(SynthesisContentSchema.parse(JSON.parse(latest.contentJson)), documentRefs);
      contentJson = JSON.stringify(validated);
    } catch {
      /* ignore */
    }
  }

  const fingerprintChanged = latest.sourceFingerprint !== fingerprint;
  const nextStatus =
    latest.status === "validated" && fingerprintChanged
      ? "needs_revalidation"
      : latest.status === "validated"
        ? "validated"
        : latest.status === "rejected"
          ? "draft"
          : latest.status === "needs_revalidation"
            ? "needs_revalidation"
            : "draft";

  await db
    .update(candidateSynthesisSheets)
    .set({
      draftJson: JSON.stringify(draftContent),
      contentJson,
      sourceFingerprint: fingerprint,
      portraitUrl: candidate.avatarVerificationStatus === "verified" ? candidate.avatarUrl : latest.portraitUrl,
      missingJson: JSON.stringify(draftContent.missing),
      status: nextStatus,
      validatedAt: nextStatus === "needs_revalidation" ? null : latest.validatedAt,
      validatedByAdminEmail: nextStatus === "needs_revalidation" ? null : latest.validatedByAdminEmail,
    })
    .where(eq(candidateSynthesisSheets.id, latest.id));

  await db.insert(candidateSynthesisEvents).values({
    sheetId: latest.id,
    candidateId,
    actorType: "system",
    actorRef: "document_change",
    action: nextStatus === "needs_revalidation" && latest.status === "validated" ? "needs_revalidation" : "auto_structured",
    note: `${documentRefs.length} pièce(s) · empreinte ${fingerprintChanged ? "modifiée" : "inchangée"}`,
  });

  return { ok: true, sheetId: latest.id, status: nextStatus, documentsCount: documentRefs.length };
}

/** Fiche validée exposable à une organisation (employeur / agence). */
export async function getValidatedSynthesisForOrg(input: {
  organizationId: number;
  candidateId: number;
}): Promise<{ sheetId: number; content: SynthesisContent; portraitUrl: string | null; version: number } | null> {
  const db = await getDb();
  if (!db) return null;

  // Accès uniquement si un profil de placement a été soumis à cette organisation.
  const { placementCandidateProfiles, placementProfileSubmissions, candidateSynthesisShareConsents } = await import("../../drizzle/schema");
  const [consent] = await db
    .select()
    .from(candidateSynthesisShareConsents)
    .where(and(eq(candidateSynthesisShareConsents.candidateId, input.candidateId), eq(candidateSynthesisShareConsents.status, "granted")))
    .limit(1);
  if (!consent) return null;

  const links = await db
    .select({ submissionId: placementProfileSubmissions.id })
    .from(placementProfileSubmissions)
    .innerJoin(placementCandidateProfiles, eq(placementProfileSubmissions.profileId, placementCandidateProfiles.id))
    .where(
      and(
        eq(placementCandidateProfiles.candidateId, input.candidateId),
        eq(placementProfileSubmissions.organizationId, input.organizationId),
        isNull(placementCandidateProfiles.archivedAt),
      ),
    )
    .limit(1);
  if (!links.length) return null;

  const [sheet] = await db
    .select()
    .from(candidateSynthesisSheets)
    .where(and(eq(candidateSynthesisSheets.candidateId, input.candidateId), eq(candidateSynthesisSheets.status, "validated")))
    .orderBy(desc(candidateSynthesisSheets.version))
    .limit(1);
  if (!sheet?.contentJson) return null;
  try {
    const content = SynthesisContentSchema.parse(JSON.parse(sheet.contentJson));
    return { sheetId: sheet.id, content, portraitUrl: sheet.portraitUrl, version: sheet.version };
  } catch {
    return null;
  }
}
