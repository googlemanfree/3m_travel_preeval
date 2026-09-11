import { and, isNull, sql } from "drizzle-orm";
import { agencyDossiers, applications, candidates } from "../../drizzle/schema";

export type DuplicateMatch = {
  source: "account" | "application" | "agency";
  id: number;
  reference: string;
  fullName: string;
  email: string;
  reason: "email" | "name";
  similarity: number;
};

export function normalizeDuplicateEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDuplicateName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function tokenSimilarity(left: string, right: string) {
  if (left === right) return 1;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = left[i - 1] === right[j - 1]
        ? diagonal
        : Math.min(previous[j - 1] + 1, above + 1, diagonal + 1);
      diagonal = above;
    }
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length, 1);
}

export function nameSimilarity(left: string, right: string) {
  const a = normalizeDuplicateName(left).split(" ").filter(Boolean);
  const b = normalizeDuplicateName(right).split(" ").filter(Boolean);
  if (!a.length || !b.length) return 0;
  const matched = a.map((token) => Math.max(...b.map((candidate) => tokenSimilarity(token, candidate))));
  return matched.reduce((sum, value) => sum + value, 0) / Math.max(a.length, b.length);
}

export async function findPotentialDuplicates(db: any, input: { email: string; fullName: string }): Promise<DuplicateMatch[]> {
  const email = normalizeDuplicateEmail(input.email);
  const [accounts, apps, agencies] = await Promise.all([
    db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email }).from(candidates).where(sql`LOWER(TRIM(${candidates.email})) = ${email}`),
    db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, email: applications.email }).from(applications).where(sql`LOWER(TRIM(${applications.email})) = ${email}`),
    db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, email: agencyDossiers.email }).from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(TRIM(${agencyDossiers.email})) = ${email}`)),
  ]);
  const matches: DuplicateMatch[] = [
    ...accounts.map((r: any) => ({ source: "account" as const, id: r.id, reference: `COMPTE-${r.id}`, fullName: r.fullName, email: r.email, reason: "email" as const, similarity: 1 })),
    ...apps.map((r: any) => ({ source: "application" as const, id: r.id, reference: r.dossierNumber, fullName: r.fullName, email: r.email, reason: "email" as const, similarity: 1 })),
    ...agencies.map((r: any) => ({ source: "agency" as const, id: r.id, reference: `3M-AGN-${String(r.id).padStart(6, "0")}`, fullName: r.fullName, email: r.email, reason: "email" as const, similarity: 1 })),
  ];
  const seen = new Set(matches.map((m) => `${m.source}:${m.id}`));
  const [allAccounts, allApps, allAgencies] = await Promise.all([
    db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email }).from(candidates).limit(500),
    db.select({ id: applications.id, dossierNumber: applications.dossierNumber, fullName: applications.fullName, email: applications.email }).from(applications).limit(500),
    db.select({ id: agencyDossiers.id, fullName: agencyDossiers.fullName, email: agencyDossiers.email }).from(agencyDossiers).where(isNull(agencyDossiers.deletedAt)).limit(500),
  ]);
  const add = (rows: any[], source: DuplicateMatch["source"], ref: (r: any) => string) => rows.forEach((r) => {
    const similarity = nameSimilarity(input.fullName, r.fullName ?? "");
    const key = `${source}:${r.id}`;
    if (similarity >= 0.75 && !seen.has(key)) {
      matches.push({ source, id: r.id, reference: ref(r), fullName: r.fullName, email: r.email, reason: "name", similarity });
      seen.add(key);
    }
  });
  add(allAccounts, "account", (r) => `COMPTE-${r.id}`);
  add(allApps, "application", (r) => r.dossierNumber);
  add(allAgencies, "agency", (r) => `3M-AGN-${String(r.id).padStart(6, "0")}`);
  return matches;
}

export function duplicateConflictMessage(matches: DuplicateMatch[]) {
  const first = matches[0];
  return `Création bloquée : ${first.reason === "email" ? "la même adresse e-mail" : "un nom très proche"} est déjà associé(e) à ${first.reference} (${first.fullName}). Ouvrez le compte existant ou utilisez une identité vérifiée différente.`;
}

export const duplicateDetectionForTests = { normalizeDuplicateEmail, normalizeDuplicateName, nameSimilarity, duplicateConflictMessage };
