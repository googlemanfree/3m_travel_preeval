import { desc, eq, inArray } from "drizzle-orm";
import { evaluations } from "../../drizzle/schema";
import { getProgram } from "../../shared/dynamicForm";
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

/** Contexte vide : le parcours reste celui du pays et du type de visa. */
export const NO_PROGRAM_CONTEXT: EvaluationProgramContext = { programId: null, domainId: null };

/**
 * Dernières évaluations de plusieurs comptes en une requête (listes d'administration). Un même e-mail peut avoir plusieurs projets
 * (travail puis études) : on garde tous les contextes, du plus récent au plus ancien, et `pickProgramContext` choisit celui du projet de la ligne.
 */
export async function programContextsByEmail(db: Db, emails: Array<string | null | undefined>): Promise<Map<string, EvaluationProgramContext[]>> {
  const wanted = Array.from(new Set(emails.map((email) => String(email ?? "").trim().toLowerCase()).filter(Boolean)));
  const result = new Map<string, EvaluationProgramContext[]>();
  try {
    for (let offset = 0; offset < wanted.length; offset += 400) {
      const chunk = wanted.slice(offset, offset + 400);
      const rows = await db.select({ email: evaluations.email, json: evaluations.projectDetailsJson }).from(evaluations).where(inArray(evaluations.email, chunk)).orderBy(desc(evaluations.createdAt)).limit(chunk.length * 4);
      for (const row of rows) {
        const context = programContextFromDetails(row.json);
        if (!context.programId) continue;
        const key = String(row.email).trim().toLowerCase();
        result.set(key, [...(result.get(key) ?? []), context]);
      }
    }
  } catch {
    return new Map();
  }
  return result;
}

const foldKind = (value: string | null | undefined) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Le contexte qui correspond au projet de la ligne (travail, études…) ; à défaut de projet connu, le plus récent. */
export function pickProgramContext(contexts: EvaluationProgramContext[] | undefined, projectType?: string | null): EvaluationProgramContext {
  if (!contexts || contexts.length === 0) return NO_PROGRAM_CONTEXT;
  const wanted = foldKind(projectType);
  if (!wanted) return contexts[0];
  return contexts.find((context) => foldKind(getProgram(context.programId)?.kind) === wanted) ?? NO_PROGRAM_CONTEXT;
}
