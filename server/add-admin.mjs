#!/usr/bin/env node

/**
 * Script pour ajouter un compte administrateur
 * Exécuter avec: node server/add-admin.mjs
 */

import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL non défini");
  process.exit(1);
}

async function addAdmin() {
  let connection;
  try {
    console.log("[ADMIN] Connexion à la base de données...");
    
    // Parser la DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false,
      },
    };

    connection = await mysql.createConnection(config);
    console.log("✅ Connecté à la base de données");

    // Vérifier si l'admin existe déjà
    const [existing] = await connection.execute(
      "SELECT id FROM admin_accounts WHERE email = ?",
      ["aureoldonfack@gmail.com"]
    );

    if (existing.length > 0) {
      console.log("⚠️  aureoldonfack@gmail.com est déjà enregistré comme admin");
      process.exit(0);
    }

    // Insérer le nouvel admin
    console.log("[ADMIN] Création du compte administrateur...");
    const [result] = await connection.execute(
      `INSERT INTO admin_accounts (email, fullName, adminType, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      ["aureoldonfack@gmail.com", "Aureol Donfack", "evaluation", "active"]
    );

    console.log(`✅ Admin créé avec succès (ID: ${result.insertId})`);
    console.log("📧 Email: aureoldonfack@gmail.com");
    console.log("👤 Nom: Aureol Donfack");
    console.log("🔑 Type: evaluation");
    console.log("📊 Statut: active");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addAdmin();
