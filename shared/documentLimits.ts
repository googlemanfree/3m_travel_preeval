/**
 * Capacité documentaire partagée client ↔ admin.
 * Une checklist opérationnelle ne dépasse jamais 16 pièces ;
 * un dépôt groupé accepte jusqu’à 16 fichiers.
 */
export const MAX_CHECKLIST_DOCUMENTS = 16;
export const MAX_UPLOAD_BATCH_FILES = 16;

/** Tronque une liste à la capacité documentaire, sans inventer de lignes. */
export function capDocumentList<T>(items: T[], max: number = MAX_CHECKLIST_DOCUMENTS): T[] {
  if (!Array.isArray(items) || items.length <= max) return Array.isArray(items) ? items : [];
  return items.slice(0, max);
}
