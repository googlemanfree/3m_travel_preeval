/**
 * Tests pour le service de génération de numéros de dossier
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateDossierNumber,
  validateDossierNumber,
  extractYearFromDossierNumber,
  extractSequenceFromDossierNumber,
  countDossiersForYear,
  getDossierStats,
} from "./dossierNumberService";

describe("dossierNumberService", () => {
  describe("validateDossierNumber", () => {
    it("devrait valider un format correct 3M-YYYY-NNNN", () => {
      expect(validateDossierNumber("3M-2026-0001")).toBe(true);
      expect(validateDossierNumber("3M-2025-9999")).toBe(true);
    });

    it("devrait rejeter les formats invalides", () => {
      expect(validateDossierNumber("3M-26-0001")).toBe(false); // Année trop courte
      expect(validateDossierNumber("3M-2026-001")).toBe(false); // Séquence trop courte
      expect(validateDossierNumber("3M-2026-00001")).toBe(false); // Séquence trop longue
      expect(validateDossierNumber("3M-2026-ABCD")).toBe(false); // Non-numérique
      expect(validateDossierNumber("#3M-2026-0001")).toBe(false); // Caractère spécial
      expect(validateDossierNumber("")).toBe(false); // Vide
    });
  });

  describe("extractYearFromDossierNumber", () => {
    it("devrait extraire l'année correctement", () => {
      expect(extractYearFromDossierNumber("3M-2026-0001")).toBe(2026);
      expect(extractYearFromDossierNumber("3M-2025-5000")).toBe(2025);
      expect(extractYearFromDossierNumber("3M-2024-9999")).toBe(2024);
    });
  });

  describe("extractSequenceFromDossierNumber", () => {
    it("devrait extraire la séquence correctement", () => {
      expect(extractSequenceFromDossierNumber("3M-2026-0001")).toBe(1);
      expect(extractSequenceFromDossierNumber("3M-2026-0100")).toBe(100);
      expect(extractSequenceFromDossierNumber("3M-2026-9999")).toBe(9999);
    });
  });

  describe("generateDossierNumber", () => {
    it("devrait générer un numéro au format correct", async () => {
      const dossierNumber = await generateDossierNumber();
      expect(validateDossierNumber(dossierNumber)).toBe(true);
    });

    it("devrait générer des numéros uniques", async () => {
      const numbers = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const number = await generateDossierNumber();
        expect(numbers.has(number)).toBe(false);
        numbers.add(number);
      }
      expect(numbers.size).toBe(10);
    });

    it("devrait incrémenter la séquence correctement", async () => {
      const first = await generateDossierNumber();
      const second = await generateDossierNumber();

      const firstSeq = extractSequenceFromDossierNumber(first);
      const secondSeq = extractSequenceFromDossierNumber(second);

      expect(secondSeq).toBeGreaterThan(firstSeq);
    });

    it("devrait utiliser l'année actuelle", async () => {
      const dossierNumber = await generateDossierNumber();
      const year = extractYearFromDossierNumber(dossierNumber);
      expect(year).toBe(new Date().getFullYear());
    });
  });

  describe("countDossiersForYear", () => {
    it("devrait compter les dossiers pour une année donnée", async () => {
      const currentYear = new Date().getFullYear();
      const count = await countDossiersForYear(currentYear);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("devrait retourner 0 pour une année sans dossiers", async () => {
      const futureYear = new Date().getFullYear() + 10;
      const count = await countDossiersForYear(futureYear);
      expect(count).toBe(0);
    });
  });

  describe("getDossierStats", () => {
    it("devrait retourner les statistiques complètes", async () => {
      const stats = await getDossierStats();

      expect(stats).toHaveProperty("currentYear");
      expect(stats).toHaveProperty("dossiersThisYear");
      expect(stats).toHaveProperty("nextSequence");
      expect(stats).toHaveProperty("maxCapacity");
      expect(stats).toHaveProperty("remainingCapacity");

      expect(stats.currentYear).toBe(new Date().getFullYear());
      expect(stats.maxCapacity).toBe(9999);
      expect(stats.remainingCapacity).toBe(9999 - stats.dossiersThisYear);
      expect(stats.nextSequence).toBe(stats.dossiersThisYear + 1);
    });

    it("devrait alerter si la capacité annuelle est atteinte", async () => {
      const stats = await getDossierStats();
      if (stats.remainingCapacity < 100) {
        console.warn(
          `⚠️ Capacité annuelle presque atteinte: ${stats.remainingCapacity} dossiers restants`
        );
      }
    });
  });

  describe("Intégration complète", () => {
    it("devrait supporter un flux complet de génération", async () => {
      // Générer un dossier
      const dossierNumber = await generateDossierNumber();

      // Valider le format
      expect(validateDossierNumber(dossierNumber)).toBe(true);

      // Extraire les informations
      const year = extractYearFromDossierNumber(dossierNumber);
      const sequence = extractSequenceFromDossierNumber(dossierNumber);

      // Vérifier la cohérence
      expect(year).toBe(new Date().getFullYear());
      expect(sequence).toBeGreaterThan(0);
      expect(sequence).toBeLessThanOrEqual(9999);

      // Vérifier les statistiques
      const stats = await getDossierStats();
      expect(stats.dossiersThisYear).toBeGreaterThanOrEqual(sequence);
    });
  });
});
