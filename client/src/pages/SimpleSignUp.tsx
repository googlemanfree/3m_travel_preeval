/**
 * Script d'amorçage — crée le tout premier compte administrateur.
 *
 * Pourquoi ce script existe : la connexion admin se fait par code OTP envoyé
 * à un email déjà enregistré dans la table `admin_accounts`. Si cette table
 * est vide (par exemple juste après une migration), personne ne peut se
 * connecter — et la fonctionnalité "inviter un administrateur" ne peut pas
 * aider non plus puisqu'elle nécessite déjà d'être connecté en admin.
 *
 * Ce script casse ce cercle vicieux en créant directement le premier compte.
 * Il ne fait rien si un compte admin actif existe déjà (sûr à relancer).
 *
 * Utilisation :
 *   npx tsx scripts/seed-first-admin.ts
 *
 * Variables d'environnement optionnelles (sinon valeurs par défaut ci-dessous) :
 *   ADMIN_SEED_EMAIL, ADMIN_SEED_NAME, ADMIN_SEED_PHONE, ADMIN_SEED_TYPE
 */
import { getDb } from "../server/db";
import { adminAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const EMAIL = process.env.ADMIN_SEED_EMAIL || "aureoldonfack@gmail.com";
const FULL_NAME = process.env.ADMIN_SEED_NAME || "Aureol Donfack";
const PHONE = process.env.ADMIN_SEED_PHONE || "+237698104832";
const ADMIN_TYPE = (process.env.ADMIN_SEED_TYPE || "evaluation") as
  | "evaluation"
  | "accompagnement"
  | "procedures";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Impossible de se connecter à la base de données (DATABASE_URL manquant ou invalide).");
    process.exit(1);
  }

  const existing = await db
    .select({ id: adminAccounts.id, email: adminAccounts.email })
    .from(adminAccounts)
    .where(eq(adminAccounts.status, "active"));

  if (existing.length > 0) {
    console.log(`✅ Un ou plusieurs comptes admin actifs existent déjà (${existing.map(a => a.email).join(", ")}).`);
    console.log("Rien à faire — ce script ne crée un compte que si la table est vide.");
    console.log("Pour ajouter un autre admin, utilise la fonctionnalité \"Inviter un administrateur\" une fois connecté.");
    return;
  }

  const alreadyThisEmail = await db
    .select({ id: adminAccounts.id })
    .from(adminAccounts)
    .where(eq(adminAccounts.email, EMAIL))
    .limit(1);

  if (alreadyThisEmail.length > 0) {
    console.log(`ℹ️ Un compte existe déjà pour ${EMAIL} mais n'est pas "actif". Vérifie son statut en base.`);
    return;
  }

  await db.insert(adminAccounts).values({
    email: EMAIL,
    fullName: FULL_NAME,
    phone: PHONE,
    adminType: ADMIN_TYPE,
    status: "active",
  });

  console.log(`✅ Premier compte administrateur créé avec succès :`);
  console.log(`   Email : ${EMAIL}`);
  console.log(`   Nom : ${FULL_NAME}`);
  console.log(`   Rôle : ${ADMIN_TYPE}`);
  console.log(`\nTu peux maintenant te connecter sur /admin/login avec cet email — un code OTP te sera envoyé.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur lors de la création du compte admin :", err);
    process.exit(1);
  });
