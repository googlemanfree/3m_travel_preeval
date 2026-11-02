/**
 * Description d'une erreur de base de données pour les journaux : code MySQL, errno, SQLSTATE et table en cause.
 * Jamais le message brut : celui de Drizzle (« Failed query: … params: … ») contient les valeurs de la requête (e-mails, noms) et
 * celui d'une erreur de connexion peut citer l'hôte ou l'utilisateur. Seuls des champs techniques de la liste ci-dessous sortent.
 */
export type DbErrorInfo = { code: string | null; errno: number | null; sqlState: string | null; table: string | null };

type Chained = { code?: unknown; errno?: unknown; sqlState?: unknown; message?: unknown; cause?: unknown };

const TABLE_PATTERN = /\b(?:from|update|into|join|table)\s+[`"]?([a-z0-9_]{2,64})[`"]?/i;

/** L'erreur et ses `cause` imbriquées (Drizzle enveloppe l'erreur mysql2 d'origine). */
function chain(error: unknown): Chained[] {
  const items: Chained[] = [];
  let current: unknown = error;
  for (let depth = 0; current && typeof current === "object" && depth < 6; depth++) {
    items.push(current as Chained);
    current = (current as Chained).cause;
  }
  return items;
}

export function describeDbErrorParts(error: unknown): DbErrorInfo {
  const items = chain(error);
  const codeOwner = items.find((item) => typeof item.code === "string" && /^[A-Z0-9_]{3,64}$/.test(item.code as string));
  const errnoOwner = items.find((item) => typeof item.errno === "number");
  const stateOwner = items.find((item) => typeof item.sqlState === "string" && /^[0-9A-Z]{5}$/.test(item.sqlState as string));
  // Le nom de la table se lit dans le texte de la requête (première erreur enveloppante), sans en reprendre aucune valeur.
  const table = items.map((item) => (typeof item.message === "string" ? TABLE_PATTERN.exec(item.message)?.[1] ?? null : null)).find(Boolean) ?? null;
  return {
    code: (codeOwner?.code as string | undefined) ?? null,
    errno: (errnoOwner?.errno as number | undefined) ?? null,
    sqlState: (stateOwner?.sqlState as string | undefined) ?? null,
    table,
  };
}

/** Une ligne lisible : « ER_NO_SUCH_TABLE (errno 1146, SQLSTATE 42S02) sur la table customer_reviews ». */
export function describeDbError(error: unknown): string {
  const info = describeDbErrorParts(error);
  const technical = [info.errno !== null ? `errno ${info.errno}` : null, info.sqlState ? `SQLSTATE ${info.sqlState}` : null].filter(Boolean).join(", ");
  const head = info.code ?? (error instanceof Error ? error.name : "erreur inconnue");
  return `${head}${technical ? ` (${technical})` : ""}${info.table ? ` sur la table ${info.table}` : ""}`;
}
