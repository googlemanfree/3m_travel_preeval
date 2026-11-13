import { and, desc, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { clientDocuments, evaluations } from "../../drizzle/schema";
import { documentIntake } from "../../drizzle/documentIntakeSchema";
import { storageKeyFromStoredUrl } from "../../shared/storedFileUrl";
import { checklistFor, checklistSummary, computeChecklist, type ChecklistDocument, type ChecklistItem, type IntakeSummary } from "../../shared/documentChecklist";
import { getDb } from "../db";
import { loadStoredCvBuffer } from "./cvTextLoader";
import { inspectDocument, type IntakeResult } from "./documentIntake";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type IntakeRow = typeof documentIntake.$inferSelect;

const DDL = `CREATE TABLE IF NOT EXISTS document_intake (
  id INT AUTO_INCREMENT PRIMARY KEY, source VARCHAR(20) NOT NULL, refId INT NOT NULL, evaluationId INT NOT NULL, documentType VARCHAR(40) NOT NULL, fileName VARCHAR(255) NOT NULL,
  fileKey VARCHAR(512) NULL, sha256 VARCHAR(64) NOT NULL, sizeBytes INT NOT NULL, pages INT NULL, textChars INT NOT NULL DEFAULT 0, kind VARCHAR(16) NOT NULL, status VARCHAR(16) NOT NULL,
  issuesJson TEXT NULL, expiresOn VARCHAR(10) NULL, verification VARCHAR(16) NOT NULL DEFAULT 'non_verifie', verificationNote TEXT NULL, verifiedBy VARCHAR(320) NULL, verifiedAt TIMESTAMP NULL,
  duplicateOf INT NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_document_intake_evaluation (evaluationId, id), KEY idx_document_intake_sha (sha256), KEY idx_document_intake_ref (source, refId)
)`;
let ensured = false;
export async function ensureDocumentIntakeTable(db: Db): Promise<void> {
  if (ensured) return;
  await db.execute(sql.raw(DDL));
  ensured = true;
}
export const resetDocumentIntakeGuardForTests = () => { ensured = false; };

const visionEnabled = () => process.env.BILAN_AUTO_VISION_ENABLED === "true";

export type RecordInput = { source: "evaluation_cv" | "client_document"; refId: number; evaluationId: number; documentType: string; fileName: string; fileKey: string | null; result: IntakeResult; expiresOn?: string | null };

/** Enregistre le contrôle d'un document et repère un doublon (même empreinte déjà reçue pour cette évaluation). */
export async function recordIntake(db: Db, input: RecordInput): Promise<{ id: number; duplicateOf: number | null }> {
  await ensureDocumentIntakeTable(db);
  const [same] = await db.select({ id: documentIntake.id }).from(documentIntake).where(and(eq(documentIntake.evaluationId, input.evaluationId), eq(documentIntake.sha256, input.result.sha256))).orderBy(documentIntake.id).limit(1);
  const duplicateOf = same?.id ?? null;
  const inserted = await db.insert(documentIntake).values({
    source: input.source, refId: input.refId, evaluationId: input.evaluationId, documentType: input.documentType, fileName: input.fileName.slice(0, 255), fileKey: input.fileKey?.slice(0, 512) ?? null,
    sha256: input.result.sha256, sizeBytes: input.result.sizeBytes, pages: input.result.pages, textChars: input.result.textChars, kind: input.result.kind, status: input.result.status,
    issuesJson: JSON.stringify(input.result.issues), expiresOn: input.expiresOn ?? null, duplicateOf,
  }).$returningId();
  return { id: inserted[0].id, duplicateOf };
}

/** Contrôle puis enregistre un fichier qui vient d'être déposé ; ne lève jamais (le dépôt lui-même ne doit pas échouer à cause du contrôle). */
export async function inspectAndRecord(input: Omit<RecordInput, "result"> & { bytes: Uint8Array }): Promise<{ status: IntakeResult["status"]; message: string; duplicate: boolean; readableForAutomation: boolean } | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await inspectDocument(Buffer.from(input.bytes), { visionEnabled: visionEnabled() });
    const { duplicateOf } = await recordIntake(db, { ...input, result });
    return { status: result.status, message: result.candidateMessage + (duplicateOf ? " Ce fichier est identique à un document déjà reçu pour votre dossier." : ""), duplicate: duplicateOf !== null, readableForAutomation: result.readableForAutomation };
  } catch (error) {
    console.warn("[documentIntake] contrôle à la réception impossible :", error instanceof Error ? error.message : error);
    return null;
  }
}

const toSummary = (row: IntakeRow | undefined): IntakeSummary => (row ? { status: row.status as "lisible" | "texte_absent" | "invalide", expiresOn: row.expiresOn, verification: row.verification as "non_verifie" | "verifie" | "a_remplacer", verificationNote: row.verificationNote, duplicateOf: row.duplicateOf } : null);

export type DocumentView = ChecklistDocument & { source: "evaluation_cv" | "client_document"; intakeId: number | null; kind: string | null; pages: number | null; sizeBytes: number | null; sha256: string | null; issues: string[] };

/** Pièces d'une évaluation (CV de l'évaluation + documents déposés) avec leur contrôle le plus récent. */
export async function loadDocuments(db: Db, evaluationId: number): Promise<DocumentView[]> {
  await ensureDocumentIntakeTable(db);
  const intakes = await db.select().from(documentIntake).where(eq(documentIntake.evaluationId, evaluationId)).orderBy(desc(documentIntake.id));
  const latestFor = (source: string, refId: number) => intakes.find((row) => row.source === source && row.refId === refId);
  const docs = await db.select().from(clientDocuments).where(eq(clientDocuments.evaluationId, evaluationId));
  const [ev] = await db.select({ cvFileUrl: evaluations.cvFileUrl, cvFileName: evaluations.cvFileName, createdAt: evaluations.createdAt }).from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  const views: DocumentView[] = docs.filter((row) => row.documentType !== "cv").map((row) => {
    const intake = latestFor("client_document", row.id);
    return { id: row.id, documentType: row.documentType, name: row.documentName, uploadedAt: row.uploadedAt, intake: toSummary(intake), source: "client_document", intakeId: intake?.id ?? null, kind: intake?.kind ?? null, pages: intake?.pages ?? null, sizeBytes: intake?.sizeBytes ?? row.fileSize ?? null, sha256: intake?.sha256 ?? null, issues: intake?.issuesJson ? JSON.parse(intake.issuesJson) : [] };
  });
  if (ev?.cvFileUrl?.trim()) {
    const intake = latestFor("evaluation_cv", evaluationId);
    views.push({ id: -evaluationId, documentType: "cv", name: ev.cvFileName ?? "CV", uploadedAt: intake?.createdAt ?? ev.createdAt, intake: toSummary(intake), source: "evaluation_cv", intakeId: intake?.id ?? null, kind: intake?.kind ?? null, pages: intake?.pages ?? null, sizeBytes: intake?.sizeBytes ?? null, sha256: intake?.sha256 ?? null, issues: intake?.issuesJson ? JSON.parse(intake.issuesJson) : [] });
  }
  return views;
}

export async function checklistFor_(db: Db, evaluationId: number, now: Date = new Date()): Promise<{ items: ChecklistItem[]; projectKind: string; documents: DocumentView[] } | null> {
  const [ev] = await db.select({ projectType: evaluations.projectType, visaType: evaluations.visaType }).from(evaluations).where(eq(evaluations.id, evaluationId)).limit(1);
  if (!ev) return null;
  const projectKind = checklistFor(ev.projectType, ev.visaType);
  const documents = await loadDocuments(db, evaluationId);
  return { items: computeChecklist(projectKind, documents, now), projectKind, documents };
}

export type OverviewFilter = "a_mettre_a_jour" | "manquant" | "doublon" | "non_controle" | "tous";

export async function overview(db: Db, filter: OverviewFilter, search: string | undefined, now: Date = new Date()) {
  const evals = await db.select({ id: evaluations.id, referenceCode: evaluations.referenceCode, fullName: evaluations.fullName, email: evaluations.email }).from(evaluations).orderBy(desc(evaluations.id)).limit(300);
  const rows = [];
  const counts = { a_mettre_a_jour: 0, manquant: 0, doublon: 0, non_controle: 0, tous: 0 };
  for (const ev of evals) {
    const checklist = await checklistFor_(db, ev.id, now);
    if (!checklist) continue;
    const summary = checklistSummary(checklist.items);
    const uncontrolled = checklist.documents.filter((doc) => !doc.intake).length;
    const flags = { a_mettre_a_jour: summary.toUpdate > 0, manquant: summary.missing > 0, doublon: summary.duplicates > 0, non_controle: uncontrolled > 0 };
    counts.tous += 1;
    for (const key of ["a_mettre_a_jour", "manquant", "doublon", "non_controle"] as const) if (flags[key]) counts[key] += 1;
    if (filter !== "tous" && !flags[filter]) continue;
    const needle = search?.toLowerCase();
    if (needle && !`${ev.fullName} ${ev.email} ${ev.referenceCode ?? ""}`.toLowerCase().includes(needle)) continue;
    rows.push({ evaluationId: ev.id, referenceCode: ev.referenceCode, fullName: ev.fullName, email: ev.email, projectKind: checklist.projectKind, summary, uncontrolled, problems: checklist.items.filter((item) => item.status === "a_mettre_a_jour").map((item) => `${item.label} : ${item.reason}`) });
  }
  return { counts, rows: rows.slice(0, 100) };
}

/** Contrôle les documents déjà reçus avant cette fonction (fichiers relus dans le stockage), par lots. */
export async function backfill(db: Db, limit = 40): Promise<{ inspected: number; unreachable: number; remaining: number }> {
  await ensureDocumentIntakeTable(db);
  const known = await db.select({ source: documentIntake.source, refId: documentIntake.refId }).from(documentIntake);
  const done = (source: string, refId: number) => known.some((row) => row.source === source && row.refId === refId);
  let inspected = 0;
  let unreachable = 0;
  let remaining = 0;
  const docs = await db.select().from(clientDocuments).where(and(sql`${clientDocuments.documentUrl} IS NOT NULL`, sql`${clientDocuments.evaluationId} IS NOT NULL`)).orderBy(desc(clientDocuments.id)).limit(2000);
  for (const row of docs) {
    if (row.documentType === "cv" || done("client_document", row.id)) continue;
    if (inspected + unreachable >= limit) { remaining += 1; continue; }
    const buffer = row.documentUrl ? await loadStoredCvBuffer(row.documentUrl) : null;
    if (!buffer) { unreachable += 1; continue; }
    await recordIntake(db, { source: "client_document", refId: row.id, evaluationId: row.evaluationId, documentType: row.documentType, fileName: row.documentName, fileKey: storageKeyFromStoredUrl(row.documentUrl) ?? row.documentUrl, result: await inspectDocument(buffer, { visionEnabled: visionEnabled() }) });
    inspected += 1;
  }
  const cvs = await db.select({ id: evaluations.id, url: evaluations.cvFileUrl, name: evaluations.cvFileName }).from(evaluations).where(sql`${evaluations.cvFileUrl} IS NOT NULL AND ${evaluations.cvFileUrl} <> ''`).orderBy(desc(evaluations.id)).limit(2000);
  for (const row of cvs) {
    if (done("evaluation_cv", row.id)) continue;
    if (inspected + unreachable >= limit) { remaining += 1; continue; }
    const buffer = row.url ? await loadStoredCvBuffer(row.url) : null;
    if (!buffer) { unreachable += 1; continue; }
    await recordIntake(db, { source: "evaluation_cv", refId: row.id, evaluationId: row.id, documentType: "cv", fileName: row.name ?? "CV", fileKey: storageKeyFromStoredUrl(row.url) ?? row.url, result: await inspectDocument(buffer, { visionEnabled: visionEnabled() }) });
    inspected += 1;
  }
  return { inspected, unreachable, remaining };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function validExpiry(value: string): boolean {
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) return false;
  const year = Number(value.slice(0, 4));
  return year >= 2000 && year <= 2100;
}

export async function setVerification(db: Db, intakeId: number, verification: "non_verifie" | "verifie" | "a_remplacer", note: string | null, admin: string): Promise<boolean> {
  if (verification === "a_remplacer" && (!note || note.trim().length < 5)) throw new Error("Indiquez le motif du remplacement (5 caractères minimum).");
  const result = await db.update(documentIntake).set({ verification, verificationNote: note?.trim() || null, verifiedBy: verification === "non_verifie" ? null : admin, verifiedAt: verification === "non_verifie" ? null : new Date() }).where(eq(documentIntake.id, intakeId));
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number })?.affectedRows ?? 0) > 0;
}

export async function setExpiry(db: Db, intakeId: number, expiresOn: string | null): Promise<boolean> {
  if (expiresOn !== null && !validExpiry(expiresOn)) throw new Error("Date de validité invalide (AAAA-MM-JJ).");
  const result = await db.update(documentIntake).set({ expiresOn }).where(eq(documentIntake.id, intakeId));
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number })?.affectedRows ?? 0) > 0;
}

/** Contrôle à la demande d'un document déjà reçu (bouton « Contrôler maintenant »). */
export async function inspectNow(db: Db, source: "evaluation_cv" | "client_document", refId: number): Promise<{ intakeId: number } | null> {
  await ensureDocumentIntakeTable(db);
  if (source === "client_document") {
    const [row] = await db.select().from(clientDocuments).where(eq(clientDocuments.id, refId)).limit(1);
    const buffer = row?.documentUrl ? await loadStoredCvBuffer(row.documentUrl) : null;
    if (!row || !buffer) return null;
    const recorded = await recordIntake(db, { source, refId, evaluationId: row.evaluationId, documentType: row.documentType, fileName: row.documentName, fileKey: storageKeyFromStoredUrl(row.documentUrl) ?? row.documentUrl, result: await inspectDocument(buffer, { visionEnabled: visionEnabled() }) });
    return { intakeId: recorded.id };
  }
  const [ev] = await db.select({ url: evaluations.cvFileUrl, name: evaluations.cvFileName }).from(evaluations).where(eq(evaluations.id, refId)).limit(1);
  const buffer = ev?.url ? await loadStoredCvBuffer(ev.url) : null;
  if (!ev || !buffer) return null;
  const recorded = await recordIntake(db, { source, refId, evaluationId: refId, documentType: "cv", fileName: ev.name ?? "CV", fileKey: storageKeyFromStoredUrl(ev.url) ?? ev.url, result: await inspectDocument(buffer, { visionEnabled: visionEnabled() }) });
  return { intakeId: recorded.id };
}
