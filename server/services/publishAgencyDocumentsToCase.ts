/**
 * Publie les documents scannés / remis en agence vers le dossier opérationnel
 * (case_documents) pour qu’ils soient visibles dans l’espace client
 * (CaseDocumentsPanel + checklist dynamique pays × visa).
 */

import { desc, eq, sql } from "drizzle-orm";
import {
  agencyDossierDocuments,
  agencyDossiers,
  agencyDossierHistory,
  candidates,
} from "../../drizzle/schema";
import {
  caseActivityLogs,
  caseDocuments,
  cases,
  clientNotifications,
  documentRequirements,
} from "../../drizzle/caseTrackingSchema";
import { agencyDossierReference } from "../../shared/caseReference";
import { buildCountryProcedureDocumentChecklist } from "../../shared/countryProcedureChecklist";
import type { getDb } from "../db";
import { notifyAgencyDocumentsPublishedWhatsApp } from "./clientWhatsAppNotify";
import { seedCountryProcedureChecklist } from "./seedCountryProcedureCase";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const AGENCY_TYPE_LABELS: Record<string, string> = {
  passport: "Passeport",
  passeport: "Passeport",
  cv: "CV",
  diploma: "Diplôme",
  diplome: "Diplôme",
  birth_certificate: "Acte de naissance",
  extrait_naissance: "Acte de naissance",
  employment_contract: "Contrat de travail",
  bank_statement: "Relevé bancaire",
  proof_of_residence: "Justificatif de domicile",
  justificatif_domicile: "Justificatif de domicile",
  insurance: "Assurance",
  photo: "Photo d’identité",
  releve_notes: "Relevés de notes",
  casier_judiciaire: "Casier judiciaire",
  justificatif_paiement: "Justificatif de paiement",
  document_remis_main_propre: "Document remis en main propre",
  decharge_remise_main_propre: "Décharge de remise",
  other: "Autre pièce",
  autre: "Autre pièce",
};

export function agencyDocumentDisplayType(documentType: string, documentName?: string | null): string {
  const key = String(documentType || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const fromName = String(documentName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (fromName.includes("passeport") || fromName.includes("passport")) return "Passeport";
  if (/(^|[^a-z])cv([^a-z]|$)/.test(fromName) || fromName.includes("curriculum")) return "CV";
  if (fromName.includes("diplome") || fromName.includes("diploma") || fromName.includes("licence")) return "Diplôme";
  if (key && key !== "other" && key !== "autre" && AGENCY_TYPE_LABELS[key]) return AGENCY_TYPE_LABELS[key];
  if (AGENCY_TYPE_LABELS[key]) return AGENCY_TYPE_LABELS[key];
  const cleaned = String(documentType || "").replace(/[_-]+/g, " ").trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "Pièce agence";
}

/** Extrait la clé de stockage depuis une URL `/manus-storage/...` ou un chemin relatif. */
export function fileKeyFromDocumentUrl(documentUrl: string | null | undefined): string | null {
  const raw = String(documentUrl || "").trim();
  if (!raw) return null;
  const marker = "/manus-storage/";
  const idx = raw.indexOf(marker);
  if (idx >= 0) return decodeURIComponent(raw.slice(idx + marker.length).split("?")[0] || "").trim() || null;
  if (raw.startsWith("agency-dossiers/") || raw.startsWith("case-documents/") || raw.startsWith("admin-documents/")) {
    return raw.split("?")[0];
  }
  return null;
}

export function mapAgencyVerificationToReviewStatus(
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

export function parseDocumentsReceivedList(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,;\n|/]+/)
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter((item) => item.length >= 2 && item.length <= 100),
    ),
  ).slice(0, 30);
}

async function ensureAgencyCaseWithCandidate(
  db: Db,
  agencyDossierId: number,
): Promise<{
  id: number;
  caseNumber: string;
  candidateId: number | null;
  destination: string | null;
  visaType: string | null;
  fullName: string;
  phone: string | null;
  email: string;
}> {
  const [dossier] = await db.select().from(agencyDossiers).where(eq(agencyDossiers.id, agencyDossierId)).limit(1);
  if (!dossier) throw new Error(`Dossier agence #${agencyDossierId} introuvable.`);

  const [candidate] = await db
    .select({ id: candidates.id, phone: candidates.phone })
    .from(candidates)
    .where(sql`LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${dossier.email}))`)
    .limit(1);

  let [operational] = await db
    .select()
    .from(cases)
    .where(eq(cases.legacyAgencyDossierId, agencyDossierId))
    .limit(1);

  if (!operational) {
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
    [operational] = await db
      .select()
      .from(cases)
      .where(eq(cases.legacyAgencyDossierId, agencyDossierId))
      .limit(1);
    if (!operational) throw new Error(`Création du dossier opérationnel impossible pour agence #${agencyDossierId}.`);
  } else if (candidate?.id && operational.candidateId !== candidate.id) {
    await db.update(cases).set({ candidateId: candidate.id }).where(eq(cases.id, operational.id));
    operational = { ...operational, candidateId: candidate.id };
  }

  return {
    id: operational.id,
    caseNumber: operational.caseNumber,
    candidateId: operational.candidateId ?? candidate?.id ?? null,
    destination: dossier.destination,
    visaType: dossier.visaType,
    fullName: dossier.fullName,
    phone: dossier.phone || candidate?.phone || null,
    email: dossier.email,
  };
}

export type PublishAgencyDocumentsResult = {
  caseId: number;
  caseNumber: string;
  candidateId: number | null;
  published: number;
  skipped: number;
  totalScanned: number;
  checklistAdded: number;
  checklistLabel: string;
  whatsappSent: boolean;
};

/**
 * Miroir des pièces agency_dossier_documents → case_documents + alignement checklist.
 * Idempotent : ne republie pas un fichier déjà présent (même fileKey ou même nom+type).
 */
export async function publishAgencyDocumentsToCase(
  db: Db,
  input: {
    agencyDossierId: number;
    actorAdminId?: number | null;
    actorEmail?: string | null;
    documentIds?: number[];
    notify?: boolean;
  },
): Promise<PublishAgencyDocumentsResult> {
  const operational = await ensureAgencyCaseWithCandidate(db, input.agencyDossierId);

  let checklistAdded = 0;
  let checklistLabel = "Procédure standard";
  try {
    const seeded = await seedCountryProcedureChecklist(db, {
      source: "agency",
      id: input.agencyDossierId,
      destination: operational.destination || "Général",
      visaType: operational.visaType || "Autre",
      actorAdminId: input.actorAdminId ?? null,
    });
    checklistAdded = seeded.added;
    checklistLabel = seeded.label;
  } catch (error) {
    console.error("[publishAgencyDocumentsToCase] seed checklist:", error);
  }

  const scanned = await db
    .select()
    .from(agencyDossierDocuments)
    .where(eq(agencyDossierDocuments.dossierId, input.agencyDossierId))
    .orderBy(desc(agencyDossierDocuments.createdAt));

  const selected = input.documentIds?.length
    ? scanned.filter((doc) => input.documentIds!.includes(doc.id))
    : scanned;

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

  for (const doc of selected) {
    const displayType = agencyDocumentDisplayType(doc.documentType, doc.documentName);
    const fileKey = fileKeyFromDocumentUrl(doc.documentUrl);
    const nameKey = `${fold(displayType)}::${fold(doc.documentName)}`;
    if ((fileKey && existingKeys.has(fileKey)) || existingNames.has(nameKey)) {
      skipped += 1;
      continue;
    }

    const reviewStatus = mapAgencyVerificationToReviewStatus(doc.verificationStatus);
    const versionRows = existing.filter((item) => fold(item.documentType) === fold(displayType));
    await db.insert(caseDocuments).values({
      caseId: operational.id,
      candidateId: operational.candidateId,
      documentType: displayType,
      fileName: doc.documentName,
      fileKey,
      mimeType: null,
      fileSizeBytes: doc.fileSize ?? null,
      uploadedByRole: doc.source === "admin_upload" ? "admin" : "agency",
      reviewStatus,
      reviewNote: doc.verificationComment
        || (doc.source === "agency_scan"
          ? "Document scanné en agence et publié dans l’espace client."
          : "Document remis en agence et publié dans l’espace client."),
      versionNo: versionRows.length + 1,
      uploadedAt: doc.createdAt ?? new Date(),
      reviewedAt: reviewStatus === "approved" || reviewStatus === "rejected" ? new Date() : null,
    });

    if (fileKey) existingKeys.add(fileKey);
    existingNames.add(nameKey);
    existing.push({ id: 0, fileName: doc.documentName, fileKey, documentType: displayType });
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

  let whatsappSent = false;
  if (published > 0) {
    await db.insert(caseActivityLogs).values({
      caseId: operational.id,
      actorRole: "admin",
      actorId: input.actorAdminId ?? null,
      actionType: "agency_documents_published_to_client",
      entityType: "agency_dossier",
      entityId: String(input.agencyDossierId),
      description: `${published} document(s) scanné(s) en agence publié(s) dans l’espace client (${operational.caseNumber}) · checklist ${checklistLabel}.`,
    });
    await db.insert(agencyDossierHistory).values({
      dossierId: input.agencyDossierId,
      action: "documents_published_to_client",
      changedBy: input.actorEmail || "admin",
      oldValue: null,
      newValue: JSON.stringify({ published, skipped, caseNumber: operational.caseNumber }),
      details: "Documents scannés envoyés vers l’espace client",
    });

    if (input.notify !== false) {
      if (operational.candidateId) {
        try {
          await db.insert(clientNotifications).values({
            candidateId: operational.candidateId,
            caseId: operational.id,
            type: "agency_documents_published",
            title: published === 1
              ? "Un document remis en agence est disponible"
              : `${published} documents remis en agence sont disponibles`,
            body: published === 1
              ? "Votre conseiller a publié dans votre espace un document scanné lors de votre passage en agence. Consultez l’onglet Documents."
              : `Votre conseiller a publié ${published} documents scannés lors de votre passage en agence. Consultez l’onglet Documents.`,
            actionUrl: "/mon-espace?section=documents",
            isRead: false,
          });
        } catch (error) {
          console.warn("[publishAgencyDocumentsToCase] notification:", error instanceof Error ? error.message : error);
        }
      }

      const whatsapp = await notifyAgencyDocumentsPublishedWhatsApp({
        phone: operational.phone,
        candidateName: operational.fullName,
        documentCount: published,
        dossierNumber: operational.caseNumber,
      });
      whatsappSent = whatsapp.sent;
      if (whatsapp.attempted && !whatsapp.sent) {
        console.warn("[publishAgencyDocumentsToCase] WhatsApp:", whatsapp.error);
      } else if (whatsapp.sent) {
        try {
          await db.insert(caseActivityLogs).values({
            caseId: operational.id,
            actorRole: "system",
            actorId: null,
            actionType: "whatsapp_documents_published",
            entityType: "agency_dossier",
            entityId: String(input.agencyDossierId),
            description: `WhatsApp envoyé (${whatsapp.phoneE164}) : documents publiés dans l’espace client.`,
          });
        } catch {
          /* journal non bloquant */
        }
      }
    }
  }

  return {
    caseId: operational.id,
    caseNumber: operational.caseNumber,
    candidateId: operational.candidateId,
    published,
    skipped,
    totalScanned: selected.length,
    checklistAdded,
    checklistLabel,
    whatsappSent,
  };
}

/** Aperçu checklist pays × visa pour l’UI admin (sans I/O). */
export function previewCountryVisaChecklist(input: {
  destination?: string | null;
  visaType?: string | null;
  documentsReceived?: string | null;
}) {
  return buildCountryProcedureDocumentChecklist({
    destination: input.destination,
    procedureType: input.visaType,
    customDocuments: parseDocumentsReceivedList(input.documentsReceived),
  });
}
