import { and, desc, eq, ne, sql } from "drizzle-orm";
import { candidateFiles, evaluations } from "../../drizzle/schema";
import { documentIsReceived, programChecklistLines } from "../../shared/dynamicForm/clientPlan";

/**
 * Pièces réellement manquantes d'un candidat, pour personnaliser les relances : on prend les pièces attendues par le programme et le
 * domaine choisis dans son évaluation, puis on retire celles dont un fichier correspondant est déjà déposé (et non refusé).
 * Retourne [] si le programme n'est pas connu (évaluation d'orientation, aucune évaluation) : la relance reste alors générale.
 */
export async function missingPiecesForCandidate(db: any, candidate: { id: number; email: string }, limit = 12): Promise<string[]> {
  try {
    const [evaluation] = await db
      .select({ projectDetailsJson: evaluations.projectDetailsJson })
      .from(evaluations)
      .where(sql`LOWER(TRIM(${evaluations.email})) = ${candidate.email.trim().toLowerCase()}`)
      .orderBy(desc(evaluations.createdAt))
      .limit(1);
    if (!evaluation?.projectDetailsJson) return [];
    const details = JSON.parse(evaluation.projectDetailsJson) as Record<string, unknown>;
    const programId = typeof details.programId === "string" ? details.programId : null;
    const domainId = typeof details.domainId === "string" ? details.domainId : null;
    const expected = programChecklistLines(programId, domainId).map((line) => line.documentType);
    if (expected.length === 0) return [];
    const files: Array<{ fileType: string; fileName: string }> = await db
      .select({ fileType: candidateFiles.fileType, fileName: candidateFiles.fileName })
      .from(candidateFiles)
      .where(and(eq(candidateFiles.candidateId, candidate.id), ne(candidateFiles.status, "rejected")));
    const uploaded = files.map((file) => ({ documentType: file.fileType, documentName: file.fileName }));
    return expected.filter((label) => !documentIsReceived(label, uploaded)).slice(0, limit);
  } catch {
    return [];
  }
}
