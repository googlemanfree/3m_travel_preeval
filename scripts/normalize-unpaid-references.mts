#!/usr/bin/env tsx

import { and, eq, isNull, like, sql } from "drizzle-orm";
import { agencyDossiers, applications, candidates } from "../drizzle/schema";
import { getDb } from "../server/db";
import { accountReference } from "../shared/caseReference";

const APPLY_TOKEN = "RESET_UNPAID_REFERENCES";
const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes(`--confirm=${APPLY_TOKEN}`);

const db = await getDb();
if (!db) throw new Error("Base de données indisponible");

const rows = await db
  .select({ id: candidates.id, email: candidates.email, activeDossierNumber: candidates.activeDossierNumber })
  .from(candidates)
  .where(and(like(candidates.activeDossierNumber, "3M-%"), isNull(candidates.deletedAt)))
  .limit(5000);

const resettable: Array<{ id: number; email: string; from: string; to: string }> = [];
for (const candidate of rows) {
  const email = candidate.email.trim().toLowerCase();
  const [paidOnline] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(sql`LOWER(TRIM(${applications.email})) = ${email}`, eq(applications.paymentStatus, "SUCCESS"), isNull(applications.deletedAt)))
    .limit(1);
  const [paidAgency] = await db
    .select({ id: agencyDossiers.id })
    .from(agencyDossiers)
    .where(and(sql`LOWER(TRIM(${agencyDossiers.email})) = ${email}`, eq(agencyDossiers.initialPaymentStatus, "paid"), isNull(agencyDossiers.deletedAt)))
    .limit(1);

  if (!paidOnline && !paidAgency) {
    resettable.push({
      id: candidate.id,
      email,
      from: candidate.activeDossierNumber!,
      to: accountReference(candidate.id),
    });
  }
}

console.log(JSON.stringify({ mode: apply && confirmed ? "apply" : "dry-run", candidatesScanned: rows.length, resettable }, null, 2));

if (apply && confirmed) {
  for (const candidate of resettable) {
    await db.update(candidates)
      .set({ activeDossierNumber: accountReference(candidate.id) })
      .where(eq(candidates.id, candidate.id));
  }
  console.log(`Références COMPTE rétablies : ${resettable.length}`);
} else if (apply) {
  console.error(`Refus d'appliquer : ajoutez --confirm=${APPLY_TOKEN}.`);
  process.exitCode = 2;
} else {
  console.log("Aucune écriture effectuée. Relisez le rapport puis relancez avec --apply --confirm=RESET_UNPAID_REFERENCES.");
}
