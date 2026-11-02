import { like } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { applications } from "../../drizzle/schema";
import { allocateAccountKey } from "../../shared/accountKeys";
import { accountReference } from "../../shared/caseReference";

type Db = NonNullable<Awaited<ReturnType<typeof import("../db").getDb>>>;

/**
 * Clé technique d'une nouvelle demande d'évaluation (colonne unique `applications.dossierNumber`).
 * Avant paiement il n'y a qu'un COMPTE : « COMPTE-00012 » (puis « COMPTE-00012-2 » pour une deuxième demande du même compte).
 * Plus aucun identifiant « EVAL-… » n'est créé. Sans compte rattaché : « COMPTE-S » + 6 chiffres.
 */
export async function allocateDraftKey(db: Db, candidateId: number | null | undefined): Promise<string> {
  const id = Number(candidateId);
  if (Number.isInteger(id) && id > 0) {
    const base = accountReference(id);
    const rows = await db.select({ value: applications.dossierNumber }).from(applications).where(like(applications.dossierNumber, `${base}%`));
    return allocateAccountKey({ candidateId: id, applicationId: 0, taken: new Set(rows.map((row) => row.value.toUpperCase())) });
  }
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const key = `COMPTE-S${randomInt(100000, 1000000)}`;
    const used = await db.select({ value: applications.dossierNumber }).from(applications).where(like(applications.dossierNumber, key)).limit(1);
    if (used.length === 0) return key;
  }
  return `COMPTE-S${Date.now().toString().slice(-8)}`;
}
