/**
 * Indicateurs sur les pièces : pièces envoyées en double et délai moyen de vérification.
 * Fonctions pures. Le rapprochement par taille est un indice (pas une preuve) : l'agent confirme en ouvrant les pièces.
 */

export type FileForDuplicates = {
  id: number;
  fileType: string;
  fileName: string;
  fileSizeBytes: number | null;
  status: string;
  uploadedAt: Date | string | number;
};

export type DuplicateGroup = {
  fileType: string;
  sizeBytes: number;
  fileIds: number[];
  fileNames: string[];
  /** Une pièce plus récente a exactement la taille d'une pièce déjà rejetée : renvoyée sans modification ? */
  resentAfterRejection: boolean;
};

const time = (value: Date | string | number) => new Date(value).getTime();

/** Pièces de même catégorie et de même taille (octet près), au moins deux. Les tailles nulles ou à 0 sont ignorées. */
export function findDuplicateGroups(files: readonly FileForDuplicates[]): DuplicateGroup[] {
  const buckets = new Map<string, FileForDuplicates[]>();
  for (const file of files) {
    if (!file.fileSizeBytes || file.fileSizeBytes <= 0) continue;
    const key = `${file.fileType}:${file.fileSizeBytes}`;
    buckets.set(key, [...(buckets.get(key) ?? []), file]);
  }
  const groups: DuplicateGroup[] = [];
  for (const bucket of Array.from(buckets.values())) {
    if (bucket.length < 2) continue;
    const ordered = [...bucket].sort((a, b) => time(a.uploadedAt) - time(b.uploadedAt));
    const resentAfterRejection = ordered.some((file, index) => file.status === "rejected" && ordered.slice(index + 1).some((later) => time(later.uploadedAt) > time(file.uploadedAt)));
    groups.push({
      fileType: ordered[0].fileType,
      sizeBytes: ordered[0].fileSizeBytes as number,
      fileIds: ordered.map((file) => file.id),
      fileNames: ordered.map((file) => file.fileName),
      resentAfterRejection,
    });
  }
  return groups.sort((a, b) => Number(b.resentAfterRejection) - Number(a.resentAfterRejection) || b.fileIds.length - a.fileIds.length);
}

/** Délai moyen en heures entre dépôt et décision ; ignore les couples incohérents (décision avant dépôt). */
export function averageVerificationHours(pairs: ReadonlyArray<{ uploadedAt: Date | string | number | null | undefined; verifiedAt: Date | string | number | null | undefined }>): { averageHours: number | null; count: number } {
  const durations: number[] = [];
  for (const pair of pairs) {
    if (!pair.uploadedAt || !pair.verifiedAt) continue;
    const start = time(pair.uploadedAt);
    const end = time(pair.verifiedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    durations.push((end - start) / 3_600_000);
  }
  if (durations.length === 0) return { averageHours: null, count: 0 };
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return { averageHours: Math.round(average * 10) / 10, count: durations.length };
}
