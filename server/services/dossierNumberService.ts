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

  // Récupère le dernier numéro de dossier de l'année actuelle
  const lastDossier = await db
    .select({ dossierNumber: applications.dossierNumber })
    .from(applications)
    .where(sql`${applications.dossierNumber} LIKE ${prefix + "%"}`)
    .orderBy(sql`${applications.dossierNumber} DESC`)
    .limit(1);

  let sequence = 1;

  if (lastDossier.length > 0) {
    const lastNumber = lastDossier[0].dossierNumber;
    const lastSequence = parseInt(lastNumber.split("-")[2], 10);
    sequence = lastSequence + 1;

    // Vérifier que la séquence ne dépasse pas 9999
    if (sequence > 9999) {
      throw new Error("Séquence de dossier dépassée pour l'année actuelle");
    }
  }

  const dossierNumber = `${prefix}${sequence.toString().padStart(4, "0")}`;

  // Vérifier l'unicité
  const existing = await db
    .select({ id: applications.id })
    .from(applications)
    .where(sql`${applications.dossierNumber} = ${dossierNumber}`)
    .limit(1);

  if (existing.length > 0) {
    // Si le numéro existe déjà, réessayer avec le suivant
    return generateDossierNumber();
  }

  return dossierNumber;
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
