/**
 * Copie le CV soumis à l’évaluation vers les documents du compte / dossier agence
 * lorsqu’il n’y en a pas encore — pour que Candidate360 et le pré-dossier le voient
 * sans recherche manuelle.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { agencyDossiers, candidateFiles, evaluations } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type SyncEvaluationCvResult = {
  synced: boolean;
  source: "evaluation" | null;
  fileUrl: string | null;
  fileName: string | null;
  candidateFileInserted: boolean;
  agencyDossierUpdated: boolean;
};

export async function syncEvaluationCvToCandidate(
  db: Db,
  input: {
    email: string;
    candidateId: number;
    agencyDossierId?: number | null;
  },
): Promise<SyncEvaluationCvResult> {
  const email = input.email.trim();
  const empty: SyncEvaluationCvResult = {
    synced: false,
    source: null,
    fileUrl: null,
    fileName: null,
    candidateFileInserted: false,
    agencyDossierUpdated: false,
  };
  if (!email || !input.candidateId) return empty;

  const [evalCv] = await db
    .select({
      cvFileUrl: evaluations.cvFileUrl,
      cvFileName: evaluations.cvFileName,
    })
    .from(evaluations)
    .where(and(sql`LOWER(${evaluations.email}) = LOWER(${email})`, sql`${evaluations.cvFileUrl} IS NOT NULL`, sql`TRIM(${evaluations.cvFileUrl}) <> ''`))
    .orderBy(desc(evaluations.createdAt))
    .limit(1);

  if (!evalCv?.cvFileUrl?.trim()) return empty;

  const fileUrl = evalCv.cvFileUrl.trim();
  const fileName = (evalCv.cvFileName || "CV_evaluation.pdf").trim();
  let candidateFileInserted = false;
  let agencyDossierUpdated = false;

  const [existingCv] = await db
    .select({ id: candidateFiles.id })
    .from(candidateFiles)
    .where(and(eq(candidateFiles.candidateId, input.candidateId), eq(candidateFiles.fileType, "cv")))
    .limit(1);

  if (!existingCv) {
    const fileKey = fileUrl.startsWith("/manus-storage/")
      ? fileUrl.slice("/manus-storage/".length)
      : `cv-uploads/synced-evaluation-${input.candidateId}-${Date.now()}`;
    await db.insert(candidateFiles).values({
      candidateId: input.candidateId,
      fileType: "cv",
      fileName,
      fileUrl,
      fileKey,
      status: "uploaded",
    });
    candidateFileInserted = true;
  }

  if (input.agencyDossierId) {
    const [dossier] = await db
      .select({ id: agencyDossiers.id, cvFileUrl: agencyDossiers.cvFileUrl })
      .from(agencyDossiers)
      .where(eq(agencyDossiers.id, input.agencyDossierId))
      .limit(1);
    if (dossier && !dossier.cvFileUrl?.trim()) {
      await db
        .update(agencyDossiers)
        .set({ cvFileUrl: fileUrl, cvFileName: fileName })
        .where(eq(agencyDossiers.id, input.agencyDossierId));
      agencyDossierUpdated = true;
    }
  }

  return {
    synced: candidateFileInserted || agencyDossierUpdated,
    source: "evaluation",
    fileUrl,
    fileName,
    candidateFileInserted,
    agencyDossierUpdated,
  };
}
