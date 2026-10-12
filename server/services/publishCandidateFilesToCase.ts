/**
 * Miroir des pièces déposées par le candidat (candidate_files) vers case_documents,
 * pour aligner le coffre opérationnel avec le centre documentaire client.
 * Idempotent : ne republie pas un fichier déjà présent (même fileKey ou même nom+type).
 * Ne crée pas de dossier opérationnel : synchronise seulement s’il en existe déjà un.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { candidateFiles, candidates } from "../../drizzle/schema";
import {
  caseActivityLogs,
  caseDocuments,
  cases,
  documentRequirements,
} from "../../drizzle/caseTrackingSchema";
import type { getDb } from "../db";
import { fileKeyFromDocumentUrl } from "./publishAgencyDocumentsToCase";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const CANDIDATE_TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  passeport: "Passeport",
  diplome: "Diplôme",
  releve_notes: "Relevés de notes",
  photo: "Photo d’identité",
  justificatif_domicile: "Justificatif de domicile",
  extrait_naissance: "Acte de naissance",
  casier_judiciaire: "Casier judiciaire",
  justificatif_paiement: "Justificatif de paiement",
  document_remis_main_propre: "Document remis en main propre",
  autre: "Autre pièce",
};

export function candidateFileDisplayType(fileType: string, fileName?: string | null): string {
  const key = String(fileType || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const fromName = String(fileName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (fromName.includes("passeport") || fromName.includes("passport")) return "Passeport";
  if (/(^|[^a-z])cv([^a-z]|$)/.test(fromName) || fromName.includes("curriculum")) return "CV";
  if (fromName.includes("diplome") || fromName.includes("diploma") || fromName.includes("licence")) return "Diplôme";
  if (key && key !== "autre" && CANDIDATE_TYPE_LABELS[key]) return CANDIDATE_TYPE_LABELS[key];
  if (CANDIDATE_TYPE_LABELS[key]) return CANDIDATE_TYPE_LABELS[key];
  const cleaned = String(fileType || "").replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Pièce candidat";
}

export function mapCandidateFileStatusToReviewStatus(
  status: string | null | undefined,
): "received" | "pending" | "approved" | "rejected" {
  const value = String(status || "").toLowerCase();
  if (value === "verified" || value === "approved") return "approved";
  if (value === "rejected" || value === "refuse") return "rejected";
  if (value === "pending") return "pending";
  return "received";
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function requirementMatchesDocument(requirementType: string, documentType: string): boolean {
  const left = fold(requirementType);
  const right = fold(documentType);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  const tokens = right.split(" ").filter((token) => token.length >= 3);
  return tokens.length > 0 && tokens.every((token) => left.includes(token));
}

/** Choisit le dossier opérationnel actif du candidat (préfère 3M-AGN / hors EVAL). */
export function pickOperationalCaseForCandidate<T extends {
  id: number;
  caseNumber: string;
  updatedAt?: Date | string | null;
  currentStatus?: string | null;
}>(rows: readonly T[]): T | null {
  if (!rows.length) return null;
  const open = rows.filter((row) => !/closed|cancelled|annul|archive/i.test(String(row.currentStatus || "")));
  const pool = open.length ? open : [...rows];
  const preferred = pool.filter((row) => !String(row.caseNumber).toUpperCase().startsWith("EVAL-"));
  const ranked = (preferred.length ? preferred : pool).slice().sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  return ranked[0] ?? null;
}

export type PublishCandidateFilesResult = {
  caseId: number | null;
  caseNumber: string | null;
  candidateId: number;
  published: number;
  skipped: number;
  totalSelected: number;
  reason?: "no_case" | "no_files" | "ok";
};

/**
 * Publie les candidate_files vers case_documents du dossier opérationnel existant.
 * Sans dossier cases lié : no-op (reason: no_case) — ne crée pas de dossier.
 */
export async function publishCandidateFilesToCase(
  db: Db,
  input: {
    candidateId: number;
    fileIds?: number[];
    actorAdminId?: number | null;
    actorRole?: "candidate" | "admin" | "system";
  },
): Promise<PublishCandidateFilesResult> {
  const [candidate] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(eq(candidates.id, input.candidateId))
    .limit(1);
  if (!candidate) {
    return {
      caseId: null,
      caseNumber: null,
      candidateId: input.candidateId,
      published: 0,
      skipped: 0,
      totalSelected: 0,
      reason: "no_files",
    };
  }

  const caseRows = await db
    .select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      updatedAt: cases.updatedAt,
      currentStatus: cases.currentStatus,
      candidateId: cases.candidateId,
    })
    .from(cases)
    .where(eq(cases.candidateId, input.candidateId))
    .orderBy(desc(cases.updatedAt))
    .limit(50);

  const operational = pickOperationalCaseForCandidate(caseRows);
  if (!operational) {
    return {
      caseId: null,
      caseNumber: null,
      candidateId: input.candidateId,
      published: 0,
      skipped: 0,
      totalSelected: 0,
      reason: "no_case",
    };
  }

  const fileFilter = input.fileIds?.length
    ? and(eq(candidateFiles.candidateId, input.candidateId), inArray(candidateFiles.id, input.fileIds))
    : eq(candidateFiles.candidateId, input.candidateId);

  const files = await db
    .select()
    .from(candidateFiles)
    .where(fileFilter)
    .orderBy(desc(candidateFiles.uploadedAt));

  if (!files.length) {
    return {
      caseId: operational.id,
      caseNumber: operational.caseNumber,
      candidateId: input.candidateId,
      published: 0,
      skipped: 0,
      totalSelected: 0,
      reason: "no_files",
    };
  }

  const existing = await db
    .select({
      id: caseDocuments.id,
      fileName: caseDocuments.fileName,
      fileKey: caseDocuments.fileKey,
      documentType: caseDocuments.documentType,
    })
    .from(caseDocuments)
    .where(eq(caseDocuments.caseId, operational.id));

  const existingKeys = new Set(existing.map((item) => String(item.fileKey || "").trim()).filter(Boolean));
  const existingNames = new Set(
    existing.map((item) => `${fold(item.documentType)}::${fold(item.fileName)}`),
  );

  const requirements = await db
    .select()
    .from(documentRequirements)
    .where(eq(documentRequirements.caseId, operational.id));

  let published = 0;
  let skipped = 0;

  for (const file of files) {
    const displayType = candidateFileDisplayType(file.fileType, file.fileName);
    const fileKey = (file.fileKey && String(file.fileKey).trim()) || fileKeyFromDocumentUrl(file.fileUrl);
    const nameKey = `${fold(displayType)}::${fold(file.fileName)}`;
    if ((fileKey && existingKeys.has(fileKey)) || existingNames.has(nameKey)) {
      skipped += 1;
      continue;
    }

    const reviewStatus = mapCandidateFileStatusToReviewStatus(file.status);
    const versionRows = existing.filter((item) => fold(item.documentType) === fold(displayType));
    await db.insert(caseDocuments).values({
      caseId: operational.id,
      candidateId: input.candidateId,
      documentType: displayType,
      fileName: file.fileName,
      fileKey,
      mimeType: file.mimeType ?? null,
      fileSizeBytes: file.fileSizeBytes ?? null,
      uploadedByRole: "candidate",
      reviewStatus,
      reviewNote: file.correctionComment
        || "Document déposé par le candidat et synchronisé dans le coffre du dossier.",
      versionNo: versionRows.length + 1,
      uploadedAt: file.uploadedAt ?? new Date(),
      reviewedAt: reviewStatus === "approved" || reviewStatus === "rejected" ? new Date() : null,
    });

    if (fileKey) existingKeys.add(fileKey);
    existingNames.add(nameKey);
    existing.push({ id: 0, fileName: file.fileName, fileKey, documentType: displayType });
    published += 1;

    const matchedRequirement = requirements.find(
      (requirement) =>
        requirement.status !== "approved"
        && requirement.status !== "waived"
        && requirementMatchesDocument(requirement.documentType, displayType),
    );
    if (matchedRequirement) {
      const nextStatus = reviewStatus === "approved" ? "approved" : reviewStatus === "rejected" ? "rejected" : "received";
      await db
        .update(documentRequirements)
        .set({
          status: nextStatus,
          validatedAt: nextStatus === "approved" ? new Date() : null,
          rejectedAt: nextStatus === "rejected" ? new Date() : null,
        })
        .where(eq(documentRequirements.id, matchedRequirement.id));
      matchedRequirement.status = nextStatus;
    }
  }

  if (published > 0) {
    await db.insert(caseActivityLogs).values({
      caseId: operational.id,
      actorRole: input.actorRole === "admin" ? "admin" : input.actorRole === "system" ? "system" : "candidate",
      actorId: input.actorAdminId ?? null,
      actionType: "candidate_files_published_to_case",
      entityType: "candidate_file",
      entityId: input.fileIds?.length === 1 ? String(input.fileIds[0]) : String(input.candidateId),
      description: `${published} document(s) candidat synchronisé(s) vers le coffre (${operational.caseNumber}).`,
    });
  }

  return {
    caseId: operational.id,
    caseNumber: operational.caseNumber,
    candidateId: input.candidateId,
    published,
    skipped,
    totalSelected: files.length,
    reason: "ok",
  };
}
