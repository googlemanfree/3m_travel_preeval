import { and, asc, eq, isNull } from "drizzle-orm";
import { candidateFiles, candidates } from "../../drizzle/schema";
import { getDb } from "../db";
import { resolveClientDocumentUrl } from "./resolveClientDocumentUrl";
import { buildZip, uniqueZipNames, type ZipEntry } from "./zipStore";

export const EXPORT_MAX_FILES = 60;
export const EXPORT_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const EXPORT_MAX_TOTAL_BYTES = 150 * 1024 * 1024;

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  passeport: "Passeport",
  diplome: "Diplome",
  releve_notes: "Releve_de_notes",
  photo: "Photo",
  justificatif_domicile: "Justificatif_de_domicile",
  extrait_naissance: "Acte_de_naissance",
  casier_judiciaire: "Casier_judiciaire",
  justificatif_paiement: "Justificatif_de_paiement",
  document_remis_main_propre: "Document_remis_en_agence",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = { uploaded: "à vérifier", verified: "validée", rejected: "rejetée" };

export type ExportFileRow = {
  id: number;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  status: string;
  rejectionReason: string | null;
  uploadedAt: Date;
};

export type ExportSkip = { fileName: string; reason: string };

export type DossierExportResult = {
  zip: Buffer;
  fileName: string;
  included: number;
  skipped: ExportSkip[];
};

const asciiSlug = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");

/** Nom d'une pièce dans l'archive : « Passeport_validee_passeport.pdf » (catégorie + statut + nom d'origine). */
export function exportEntryName(row: Pick<ExportFileRow, "fileType" | "fileName" | "status">): string {
  const type = TYPE_LABELS[row.fileType] ?? asciiSlug(row.fileType) ?? "Document";
  const status = asciiSlug(STATUS_LABELS[row.status] ?? row.status);
  return `${type}_${status}_${asciiSlug(row.fileName) || "fichier"}`;
}

/** Index lisible placé à la racine : ce qui est inclus, ce qui ne l'est pas et pourquoi. */
export function buildExportIndex(input: { candidateName: string; reference: string; generatedAt: Date; rows: ExportFileRow[]; names: string[]; skipped: ExportSkip[] }): string {
  const lines = [
    "3M TRAVEL AGENCY — Export des pièces du dossier",
    `Candidat : ${input.candidateName}`,
    `Référence : ${input.reference}`,
    `Établi le : ${input.generatedAt.toISOString().slice(0, 10)}`,
    "Document confidentiel : à usage interne et pour la transmission autorisée par le candidat.",
    "",
    `Pièces incluses (${input.names.length}) :`,
    ...input.rows
      .filter((_, index) => input.names[index])
      .map((row, index) => `- ${input.names[index]} | ${TYPE_LABELS[row.fileType] ?? row.fileType} | ${STATUS_LABELS[row.status] ?? row.status} | déposée le ${row.uploadedAt.toISOString().slice(0, 10)}${row.rejectionReason && row.status === "rejected" ? ` | motif : ${row.rejectionReason.replace(/\s+/g, " ").slice(0, 200)}` : ""}`),
  ];
  if (input.skipped.length > 0) {
    lines.push("", `Pièces non incluses (${input.skipped.length}) :`, ...input.skipped.map((item) => `- ${item.fileName} : ${item.reason}`));
  }
  return lines.join("\n") + "\n";
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; arrayBuffer: () => Promise<ArrayBuffer>; headers?: { get: (name: string) => string | null } }>;

/**
 * Construit l'archive des pièces d'un candidat (hors pièces rejetées si `includeRejected` est faux).
 * Les limites (nombre, taille d'une pièce, taille totale) protègent le serveur : ce qui dépasse est listé comme non inclus.
 */
export async function buildDossierExport(
  input: { candidateId: number; includeRejected?: boolean; now?: Date },
  deps: { fetcher?: Fetcher; resolveUrl?: (url: string) => Promise<string> } = {},
): Promise<DossierExportResult | null> {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [candidate] = await db
    .select({ id: candidates.id, fullName: candidates.fullName, activeDossierNumber: candidates.activeDossierNumber })
    .from(candidates)
    .where(and(eq(candidates.id, input.candidateId), isNull(candidates.deletedAt)))
    .limit(1);
  if (!candidate) return null;

  const allRows = (await db
    .select({ id: candidateFiles.id, fileType: candidateFiles.fileType, fileName: candidateFiles.fileName, fileUrl: candidateFiles.fileUrl, fileKey: candidateFiles.fileKey, status: candidateFiles.status, rejectionReason: candidateFiles.rejectionReason, uploadedAt: candidateFiles.uploadedAt })
    .from(candidateFiles)
    .where(eq(candidateFiles.candidateId, input.candidateId))
    .orderBy(asc(candidateFiles.fileType), asc(candidateFiles.uploadedAt))
    .limit(500)) as ExportFileRow[];

  const skipped: ExportSkip[] = [];
  const wanted = allRows.filter((row) => {
    if (row.status === "rejected" && !input.includeRejected) {
      skipped.push({ fileName: row.fileName, reason: "pièce rejetée (non incluse par défaut)" });
      return false;
    }
    return true;
  });

  const fetcher = deps.fetcher ?? ((url: string) => fetch(url));
  const resolveUrl = deps.resolveUrl ?? resolveClientDocumentUrl;
  const now = input.now ?? new Date();
  const included: ExportFileRow[] = [];
  const contents: Buffer[] = [];
  let total = 0;
  for (const row of wanted) {
    if (included.length >= EXPORT_MAX_FILES) {
      skipped.push({ fileName: row.fileName, reason: `limite de ${EXPORT_MAX_FILES} pièces atteinte` });
      continue;
    }
    try {
      const url = await resolveUrl(row.fileKey || row.fileUrl);
      if (!/^https?:\/\//i.test(url)) {
        skipped.push({ fileName: row.fileName, reason: "fichier non récupérable depuis le stockage" });
        continue;
      }
      const response = await fetcher(url);
      if (!response.ok) {
        skipped.push({ fileName: row.fileName, reason: `stockage indisponible (${response.status})` });
        continue;
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > EXPORT_MAX_FILE_BYTES) {
        skipped.push({ fileName: row.fileName, reason: "fichier trop volumineux pour l'export" });
        continue;
      }
      if (total + bytes.length > EXPORT_MAX_TOTAL_BYTES) {
        skipped.push({ fileName: row.fileName, reason: "taille totale maximale de l'export atteinte" });
        continue;
      }
      total += bytes.length;
      included.push(row);
      contents.push(bytes);
    } catch {
      skipped.push({ fileName: row.fileName, reason: "erreur de lecture du fichier" });
    }
  }

  const names = uniqueZipNames(included.map((row) => exportEntryName(row)));
  const reference = candidate.activeDossierNumber || `COMPTE-${candidate.id}`;
  const entries: ZipEntry[] = [
    { name: "LISEZ-MOI.txt", data: Buffer.from(buildExportIndex({ candidateName: candidate.fullName, reference, generatedAt: now, rows: included, names, skipped }), "utf8"), modifiedAt: now },
    ...included.map((row, index) => ({ name: names[index], data: contents[index], modifiedAt: row.uploadedAt })),
  ];
  return {
    zip: buildZip(entries),
    fileName: `Dossier_${asciiSlug(reference) || candidate.id}_pieces.zip`,
    included: included.length,
    skipped,
  };
}
