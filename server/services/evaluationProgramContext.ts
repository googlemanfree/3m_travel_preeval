import { desc, eq } from "drizzle-orm";
import { evaluations } from "../../drizzle/schema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type EvaluationProgramContext = { programId: string | null; domainId: string | null };

/** Visa ou programme et domaine déclarés dans la dernière évaluation d'un candidat : de quoi adapter checklist et suivi sans les ressaisir. */
export function programContextFromDetails(json: string | null | undefined): EvaluationProgramContext {
  try {
    const parsed: unknown = json ? JSON.parse(json) : null;
    const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    return {
      programId: typeof record.programId === "string" && record.programId ? record.programId.slice(0, 80) : null,
      domainId: typeof record.domainId === "string" && record.domainId ? record.domainId.slice(0, 40) : null,
    };
  } catch {
    return { programId: null, domainId: null };
  }
}

/** Ne bloque jamais l'appelant : une évaluation introuvable ou illisible donne simplement un contexte vide. */
export async function latestProgramContext(db: Db, email: string | null | undefined): Promise<EvaluationProgramContext> {
  if (!email) return { programId: null, domainId: null };
  try {
    const [row] = await db.select({ json: evaluations.projectDetailsJson }).from(evaluations).where(eq(evaluations.email, email)).orderBy(desc(evaluations.createdAt)).limit(1);
    return programContextFromDetails(row?.json);
  } catch {
    return { programId: null, domainId: null };
  }
}
