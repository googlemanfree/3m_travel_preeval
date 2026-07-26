/**
 * Génère un code dossier simple au format #3M-YYYYMMDD-XXXX
 * Exemple : #3M-20260726-0001
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

  return `#3M-${dateStr}-${sequence}`;
}
