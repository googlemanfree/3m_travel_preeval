import { randomBytes } from "node:crypto";

/**
 * Génère un code dossier lisible au format #3M-YYYYMMDD-XXXX-YYYYYY.
 * Le suffixe aléatoire protège l’unicité en cas de plusieurs processus.
 */
let dailyCounter = 0;
let lastDate = "";

export function generateDossierCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Réinitialiser le compteur si c'est un nouveau jour
  if (dateStr !== lastDate) {
    dailyCounter = 0;
    lastDate = dateStr;
  }

  // Incrémenter le compteur
  dailyCounter++;
  const sequence = String(dailyCounter).padStart(4, "0");

  const nonce = randomBytes(3).toString("hex").toUpperCase();
  return `#3M-${dateStr}-${sequence}-${nonce}`;
}
