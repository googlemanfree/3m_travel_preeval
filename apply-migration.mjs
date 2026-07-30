import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS \`approved_visas\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`firstName\` varchar(100) NOT NULL,
    \`country\` varchar(100) NOT NULL,
    \`visaType\` varchar(100) NOT NULL,
    \`destination\` varchar(100) NOT NULL,
    \`approvedDate\` varchar(20) NOT NULL,
    \`testimonial\` text,
    \`isPublic\` boolean NOT NULL DEFAULT true,
    \`imageUrl\` varchar(500),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`approved_visas_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`callback_requests\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`phone\` varchar(30) NOT NULL,
    \`email\` varchar(320),
    \`preferredTime\` varchar(100),
    \`preferredDate\` varchar(20),
    \`subject\` varchar(255),
    \`message\` text,
    \`status\` enum('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
    \`scheduledAt\` timestamp NULL,
    \`completedAt\` timestamp NULL,
    \`adminNotes\` text,
    \`applicationId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`callback_requests_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`country_costs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`country\` varchar(100) NOT NULL,
    \`visaType\` varchar(100) NOT NULL,
    \`visaFee\` int NOT NULL,
    \`serviceFee\` int NOT NULL,
    \`guaranteeFee\` int DEFAULT 0,
    \`translationFee\` int DEFAULT 0,
    \`otherFees\` int DEFAULT 0,
    \`processingDays\` int NOT NULL,
    \`successRate\` int DEFAULT 85,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`country_costs_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`dossier_progress\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`applicationId\` int NOT NULL,
    \`dossierNumber\` varchar(20) NOT NULL,
    \`currentStep\` int NOT NULL DEFAULT 1,
    \`stepsStatus\` text NOT NULL,
    \`step1CompletedAt\` timestamp NULL,
    \`step2CompletedAt\` timestamp NULL,
    \`step3CompletedAt\` timestamp NULL,
    \`step4CompletedAt\` timestamp NULL,
    \`step5CompletedAt\` timestamp NULL,
    \`adminNotes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`dossier_progress_id\` PRIMARY KEY(\`id\`)
  )`
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    console.log(`✅ Table ${tableName} créée ou déjà existante`);
  } catch (err) {
    console.error(`❌ Erreur:`, err.message);
  }
}

await conn.end();
console.log('Migration terminée.');
