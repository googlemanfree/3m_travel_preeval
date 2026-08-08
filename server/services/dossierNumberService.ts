/**
 * Service centralisé pour la génération des numéros de dossier
 * Format unique : 3M-YYYY-NNNN
 * Garantit l'unicité et la synchronisation avec la base de données
 */

import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

/**
 * Génère un numéro de dossier unique au format 3M-YYYY-NNNN
 * YYYY = année actuelle
 * NNNN = séquence numérique (0001-9999)
 */
export async function generateDossierNumber(): Promise<string> {
  const db = await getDb();
  const year = new Date().getFullYear();
  const prefix = `3M-${year}-`;

  // Trouver le prochain numéro disponible en boucle
  let sequence = 1;
  let maxAttempts = 9999;
  let dossierNumber = "";

  while (maxAttempts > 0) {
    dossierNumber = `${prefix}${sequence.toString().padStart(4, "0")}`;

    // Vérifier si ce numéro existe déjà
    const existing = await db
      .select({ id: applications.id })
      .from(applications)
      .where(sql`${applications.dossierNumber} = ${dossierNumber}`)
      .limit(1);

    if (existing.length === 0) {
      // Numéro disponible trouvé
      return dossierNumber;
    }

    sequence++;
    maxAttempts--;
  }

  throw new Error("Impossible de générer un numéro de dossier unique (capacité annuelle atteinte)");
}

/**
 * Valide le format d'un numéro de dossier
 */
export function validateDossierNumber(dossierNumber: string): boolean {
  const regex = /^3M-\d{4}-\d{4}$/;
  return regex.test(dossierNumber);
}

/**
 * Extrait l'année d'un numéro de dossier
 */
export function extractYearFromDossierNumber(dossierNumber: string): number {
  const parts = dossierNumber.split("-");
  return parseInt(parts[1], 10);
}

/**
 * Extrait la séquence d'un numéro de dossier
 */
export function extractSequenceFromDossierNumber(dossierNumber: string): number {
  const parts = dossierNumber.split("-");
  return parseInt(parts[2], 10);
}

/**
 * Compte les dossiers créés pour une année donnée
 */
export async function countDossiersForYear(year: number): Promise<number> {
  const db = await getDb();
  const prefix = `3M-${year}-`;
  const result = await db
    .select({ count: sql`COUNT(*) as count` })
    .from(applications)
    .where(sql`${applications.dossierNumber} LIKE ${prefix + "%"}`);

  return result[0]?.count as number || 0;
}

/**
 * Récupère les statistiques des dossiers
 */
export async function getDossierStats() {
  const currentYear = new Date().getFullYear();
  const count = await countDossiersForYear(currentYear) || 0;

  return {
    currentYear,
    dossiersThisYear: count,
    nextSequence: count + 1,
    maxCapacity: 9999,
    remainingCapacity: 9999 - count,
  };
}
