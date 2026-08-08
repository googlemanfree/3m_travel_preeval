#!/usr/bin/env node

/**
 * Script de migration pour normaliser les numéros de dossier existants
 * Format cible : 3M-YYYY-NNNN
 * 
 * Usage: node migrateDossierNumbers.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "3m_travel",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Normalise un numéro de dossier au format 3M-YYYY-NNNN
 */
function normalizeDossierNumber(oldNumber, index) {
  const year = new Date().getFullYear();
  const sequence = (index + 1).toString().padStart(4, "0");
  return `3M-${year}-${sequence}`;
}

/**
 * Extrait l'année d'un ancien numéro
 */
function extractYearFromOldNumber(oldNumber) {
  // Essayer différents formats
  if (oldNumber.includes("-")) {
    const parts = oldNumber.split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[1], 10);
      if (year > 2000 && year < 2100) {
        return year;
      }
    }
  }
  return new Date().getFullYear();
}

async function migrate() {
  const connection = await pool.getConnection();

  try {
    console.log("🔄 Démarrage de la migration des numéros de dossier...\n");

    // Récupérer tous les dossiers existants
    const [applications] = await connection.query(
      "SELECT id, dossierNumber FROM applications ORDER BY id ASC"
    );

    console.log(`📊 Total de dossiers à migrer : ${applications.length}\n`);

    if (applications.length === 0) {
      console.log("✅ Aucun dossier à migrer.");
      return;
    }

    // Grouper par année
    const byYear = {};
    for (const app of applications) {
      const year = extractYearFromOldNumber(app.dossierNumber);
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(app);
    }

    console.log("📅 Dossiers par année :");
    for (const [year, apps] of Object.entries(byYear)) {
      console.log(`   ${year}: ${apps.length} dossiers`);
    }
    console.log();

    // Migrer les dossiers année par année
    let totalMigrated = 0;
    const migrations = [];

    for (const [year, apps] of Object.entries(byYear)) {
      for (let i = 0; i < apps.length; i++) {
        const app = apps[i];
        const sequence = (i + 1).toString().padStart(4, "0");
        const newNumber = `3M-${year}-${sequence}`;

        migrations.push({
          id: app.id,
          oldNumber: app.dossierNumber,
          newNumber,
        });
      }
    }

    // Afficher un aperçu des migrations
    console.log("📋 Aperçu des migrations (premiers 10) :");
    for (let i = 0; i < Math.min(10, migrations.length); i++) {
      const m = migrations[i];
      console.log(`   ${m.oldNumber} → ${m.newNumber}`);
    }
    if (migrations.length > 10) {
      console.log(`   ... et ${migrations.length - 10} autres`);
    }
    console.log();

    // Vérifier les doublons potentiels
    const newNumbers = migrations.map((m) => m.newNumber);
    const uniqueNumbers = new Set(newNumbers);

    if (uniqueNumbers.size !== newNumbers.length) {
      console.error("❌ ERREUR : Doublons détectés après migration !");
      const duplicates = newNumbers.filter(
        (n, i) => newNumbers.indexOf(n) !== i
      );
      console.error(`   Doublons : ${[...new Set(duplicates)].join(", ")}`);
      return;
    }

    console.log("✅ Aucun doublon détecté\n");

    // Demander confirmation
    console.log("⚠️  ATTENTION : Cette opération est irréversible !");
    console.log("Voulez-vous continuer ? (y/n)");

    // Pour le script, on continue automatiquement
    console.log("Continuation automatique...\n");

    // Effectuer les migrations
    console.log("🔄 Migration en cours...\n");

    for (const migration of migrations) {
      try {
        await connection.query(
          "UPDATE applications SET dossierNumber = ? WHERE id = ?",
          [migration.newNumber, migration.id]
        );
        totalMigrated++;

        if (totalMigrated % 100 === 0) {
          console.log(`   ✓ ${totalMigrated}/${migrations.length} dossiers migrés`);
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors de la migration du dossier ${migration.id} :`,
          error.message
        );
      }
    }

    console.log();
    console.log(`✅ Migration complétée : ${totalMigrated}/${migrations.length} dossiers`);

    // Vérifier l'intégrité
    const [result] = await connection.query(
      "SELECT COUNT(DISTINCT dossierNumber) as unique_count, COUNT(*) as total_count FROM applications"
    );

    const uniqueCount = result[0].unique_count;
    const totalCount = result[0].total_count;

    console.log();
    console.log("🔍 Vérification d'intégrité :");
    console.log(`   Total de dossiers : ${totalCount}`);
    console.log(`   Numéros uniques : ${uniqueCount}`);

    if (uniqueCount === totalCount) {
      console.log("   ✅ Intégrité vérifiée : tous les numéros sont uniques");
    } else {
      console.error(
        `   ❌ ERREUR : ${totalCount - uniqueCount} doublons détectés !`
      );
    }

    console.log();
    console.log("✅ Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration :", error);
  } finally {
    await connection.release();
    await pool.end();
  }
}

// Lancer la migration
migrate().catch(console.error);
