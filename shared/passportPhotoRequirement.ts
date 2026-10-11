/**
 * Photo type passeport obligatoire après activation d’un dossier visa travail
 * (exploitation employeur / agences de placement). Remplace la photo de profil.
 */

export const PASSPORT_PHOTO_REQUEST_TITLE = "Photo de profil type passeport requise";

export const PASSPORT_PHOTO_REQUEST_BODY =
  "Votre dossier visa travail est actif. Pour une exploitation optimale côté employeurs et agences de placement, déposez une photo type passeport : fond uni clair, visage centré de face, expression neutre, sans lunettes de soleil ni filtre. Cette photo remplacera automatiquement votre photo de profil.";

/** Marqueur posé après dépôt accepté — lève l’obligation. */
export const PASSPORT_PHOTO_DEPOSITED_REASON =
  "Photo type passeport déposée pour le dossier actif (espaces employeur et agences de placement).";

export const PASSPORT_PHOTO_PROFILE_ACTION_URL = "/mon-espace?section=profile";

function fold(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isWorkVisaForPassportPhoto(visaOrProject?: string | null): boolean {
  const value = fold(visaOrProject);
  if (!value) return false;
  if (/(etude|study|scolaire|touris|visitor|visiteur|sejour|famille|family)/.test(value)) return false;
  return /(travail|work|emploi|job|qualified|qualifie|professionnel)/.test(value);
}

export function hasPassportPhotoDeposited(reason?: string | null): boolean {
  return /photo type passeport déposée/i.test(String(reason ?? ""));
}

export function isPassportPhotoRequestReason(reason?: string | null): boolean {
  return /type passeport|photo de profil type passeport/i.test(String(reason ?? ""));
}

export function candidateHasActiveDossierForPassport(input: {
  dossierStatus?: string | null;
  hasAgencyDossier?: boolean;
}): boolean {
  if (input.hasAgencyDossier) return true;
  const status = fold(input.dossierStatus);
  if (!status || status === "nouveau") return false;
  if (/(refuse|annul|archiv|corbeille|deleted)/.test(status)) return false;
  return true;
}

/**
 * Photo passeport requise pour un dossier actif visa travail
 * tant qu’elle n’a pas été déposée (remplace le profil).
 */
export function requiresPassportPhotoUpload(input: {
  dossierStatus?: string | null;
  hasAgencyDossier?: boolean;
  visaType?: string | null;
  projectType?: string | null;
  avatarVerificationReason?: string | null;
  forceRequest?: boolean;
}): boolean {
  if (hasPassportPhotoDeposited(input.avatarVerificationReason)) return false;
  if (input.forceRequest || isPassportPhotoRequestReason(input.avatarVerificationReason)) {
    return candidateHasActiveDossierForPassport(input);
  }
  if (!candidateHasActiveDossierForPassport(input)) return false;
  return isWorkVisaForPassportPhoto(input.visaType) || isWorkVisaForPassportPhoto(input.projectType);
}
