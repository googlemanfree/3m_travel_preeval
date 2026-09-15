/**
 * Script d'amorçage — crée les 3 comptes administrateurs avec email + mot de
 * passe (nouveau système d'authentification, remplace l'ancien système OTP).
 *
 * Sûr à relancer : un compte dont l'email existe déjà n'est pas recréé ni
 * modifié (son mot de passe existant n'est jamais écrasé par ce script).
 *
 * Utilisation :
 *   npx tsx scripts/seed-admins.ts
 */
import bcrypt from "bcryptjs";
import { getDb } from "../server/db";
import { adminAccounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Les mots de passe sont passés en variables d'environnement pour éviter
// de les stocker en clair dans le dépôt.
// Usage : SEED_PWD_1=xxx SEED_PWD_2=yyy SEED_PWD_3=zzz npx tsx server/seed-admins.ts
const ADMINS = [
  {
    email: "aureoldonfack@gmail.com",
    fullName: "Aureol Donfack",
    phone: "+237698104832",
    adminType: "evaluation" as const,
    password: process.env.SEED_PWD_1 || "",
  },
  {
    email: "fabienbah203@gmail.com",
    fullName: "Fabien",
    phone: "",
    adminType: "accompagnement" as const,
    password: process.env.SEED_PWD_2 || "",
  },
  {
    email: "hello@3mtravelagency.com",
    fullName: "3M Travel & Services",
    phone: "+237698104832",
    adminType: "procedures" as const,
    password: process.env.SEED_PWD_3 || "",
  },
];

async function main() {
  if (!process.env.SEED_PWD_1 || !process.env.SEED_PWD_2 || !process.env.SEED_PWD_3) {
    console.error("❌ SEED_PWD_1, SEED_PWD_2 et SEED_PWD_3 doivent être définis en variable d'environnement.");
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error("❌ Impossible de se connecter à la base de données (DATABASE_URL manquant ou invalide).");
    process.exit(1);
  }

  for (const admin of ADMINS) {
    const existing = await db
      .select({ id: adminAccounts.id })
      .from(adminAccounts)
      .where(eq(adminAccounts.email, admin.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  ${admin.email} existe déjà — mot de passe conservé, ignoré.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);
    await db.insert(adminAccounts).values({
      email: admin.email,
      fullName: admin.fullName,
      phone: admin.phone || null,
      adminType: admin.adminType,
      passwordHash,
      status: "active",
    });

    console.log(`✅ Créé : ${admin.email} (${admin.adminType}) — mot de passe : ${admin.password}`);
  }

  console.log("\n⚠️  Note : ces mots de passe sont visibles dans ce script en clair. Une fois les");
  console.log("comptes créés et les mots de passe communiqués en sécurité aux admins, il est");
  console.log("recommandé de supprimer ce fichier du dépôt ou d'en retirer les mots de passe.");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur lors de la création des comptes admin :", err);
  process.exit(1);
});
