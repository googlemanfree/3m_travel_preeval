/**
 * Script pour mettre à jour les mots de passe des admins dans la base de données
 * Utilisation : node server/update-admin-passwords.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const adminCredentials = [
  {
    email: 'fabienbah203@gmail.com',
    adminType: 'evaluation',
    passwordHash: '$2b$10$hvhuE1cbMoETeR0VCJLYb.AElmyWYuPlZFY5PM5VJpV4uxyRBYr0G',
    fullName: 'Fabien Bah'
  },
  {
    email: 'aureoldonfack@gmail.com',
    adminType: 'accompagnement',
    passwordHash: '$2b$10$H0eNii5I.PNhJ/lDmyUTkOTf/YKQM2HMbJT2Wqni/gI56eAeSUkrm',
    fullName: 'Aureol Donfack'
  },
  {
    email: 'hello@3mtravelagency.click',
    adminType: 'procedures',
    passwordHash: '$2b$10$dGv5RZNphne8iaVBi7afoevwRq.zgPtahgcI4keYob0CGrmGL7j/a',
    fullName: '3M Travel Agency'
  }
];

async function updateAdminPasswords() {
  let connection;
  try {
    // Créer la connexion à la base de données
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL non définie');
    }

    // Parser la connexion MySQL
    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: url.hostname.includes('tidbcloud') || url.hostname.includes('rds') ? { rejectUnauthorized: false } : undefined,
    };

    connection = await mysql.createConnection(config);

    console.log('✅ Connecté à la base de données');

    // Mettre à jour chaque admin
    for (const admin of adminCredentials) {
      const query = `
        UPDATE admin_accounts 
        SET passwordHash = ?, fullName = ?, status = 'active'
        WHERE email = ?
      `;

      const [result] = await connection.execute(query, [
        admin.passwordHash,
        admin.fullName,
        admin.email
      ]);

      if (result.affectedRows > 0) {
        console.log(`✅ ${admin.email} - Mot de passe mis à jour`);
      } else {
        console.log(`⚠️ ${admin.email} - Compte non trouvé, création en cours...`);
        
        // Créer le compte s'il n'existe pas
        const insertQuery = `
          INSERT INTO admin_accounts 
          (email, adminType, passwordHash, fullName, status, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
        `;
        
        await connection.execute(insertQuery, [
          admin.email,
          admin.adminType,
          admin.passwordHash,
          admin.fullName
        ]);
        
        console.log(`✅ ${admin.email} - Compte créé`);
      }
    }

    console.log('\n✅ Tous les mots de passe ont été mis à jour avec succès');
    console.log('\n📝 Les admins peuvent maintenant se connecter avec leurs credentials');

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter le script
updateAdminPasswords();
