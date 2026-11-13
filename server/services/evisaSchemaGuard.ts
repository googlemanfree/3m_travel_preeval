/**
 * La colonne `evisa_requests.issuedPdfUrl` est lue et écrite par les routeurs e-Visa (PDF final du dossier approuvé),
 * mais aucune migration ni `drizzle/schema.ts` ne la crée. Sur une base où elle manque, la liste « Mes demandes e-Visa »
 * de l'espace candidat répond 500 et le téléversement administrateur du PDF échoue après l'écriture du fichier.
 *
 * Ce garde vérifie la colonne une fois par processus et l'ajoute si elle manque. Il ne fait rien si elle existe déjà,
 * et n'empêche jamais la requête de suivre son cours : en cas d'échec (droits insuffisants, course entre deux
 * processus) l'erreur est journalisée et la requête d'origine s'exécute comme avant.
 */
type SqlConnection = {
  execute: (sql: string) => Promise<unknown>;
};

let ensured = false;

const DUPLICATE_COLUMN_ERRNO = 1060;

export async function ensureEvisaIssuedPdfColumn(connection: SqlConnection): Promise<void> {
  if (ensured) return;
  try {
    const result = (await connection.execute(
      `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'evisa_requests' AND COLUMN_NAME = 'issuedPdfUrl'`,
    )) as [Array<{ n: number | string }>, unknown] | undefined;
    const present = Number(result?.[0]?.[0]?.n ?? 0) > 0;
    if (!present) {
      await connection.execute("ALTER TABLE evisa_requests ADD COLUMN issuedPdfUrl TEXT NULL");
      console.warn("[evisa] colonne evisa_requests.issuedPdfUrl absente : ajoutée automatiquement.");
    }
    ensured = true;
  } catch (error) {
    if ((error as { errno?: number })?.errno === DUPLICATE_COLUMN_ERRNO) {
      ensured = true;
      return;
    }
    console.error("[evisa] impossible de vérifier ou d'ajouter evisa_requests.issuedPdfUrl :", error);
  }
}

/** Réservé aux tests : remet le cache du garde à zéro. */
export function resetEvisaSchemaGuardForTests(): void {
  ensured = false;
}
