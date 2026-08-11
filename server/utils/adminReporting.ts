export interface CandidateCountryRow {
  id: number;
  email?: string | null;
  country?: string | null;
}

export interface ActivityReportRow {
  id: number;
  adminEmail: string;
  action: string;
  evaluationType?: string | null;
  evaluationId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  resultCount?: number | null;
  details?: string | null;
  createdAt?: Date | string | null;
}

export function buildCandidateCountryDistribution(
  groups: Array<{ source: string; rows: CandidateCountryRow[] }>,
  limit: number,
) {
  const countryCandidates = new Map<string, Set<string>>();
  const uniqueCandidates = new Set<string>();

  groups.forEach(({ source, rows }) => {
    rows.forEach((row) => {
      const country = String(row.country ?? "").trim();
      if (!country) return;

      const candidateKey = row.email?.trim().toLowerCase() || `${source}:${row.id}`;
      uniqueCandidates.add(candidateKey);
      const bucket = countryCandidates.get(country) ?? new Set<string>();
      bucket.add(candidateKey);
      countryCandidates.set(country, bucket);
    });
  });

  return {
    totalCandidates: uniqueCandidates.size,
    totalCountries: countryCandidates.size,
    data: Array.from(countryCandidates.entries())
      .map(([country, candidateKeys]) => ({ country, count: candidateKeys.size }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, "fr"))
      .slice(0, limit),
  };
}

export function escapeCsvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function buildActivityReportCsv(rows: ActivityReportRow[]): string {
  const headers = ["ID", "Administrateur", "Action", "Type", "Identifiant", "Ancien statut", "Nouveau statut", "Résultats", "Détails", "Date"];
  const csvRows = rows.map((row) => [
    row.id,
    row.adminEmail,
    row.action,
    row.evaluationType,
    row.evaluationId,
    row.oldStatus,
    row.newStatus,
    row.resultCount,
    row.details,
    row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "",
  ]);

  return "\uFEFF" + [headers, ...csvRows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}
