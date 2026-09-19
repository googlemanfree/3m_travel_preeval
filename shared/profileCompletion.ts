/**
 * Complétude du profil candidat : source unique partagée entre le serveur (statistiques du tableau
 * de bord) et le client (barre de progression), pour qu'un même pourcentage soit affiché partout.
 * Les champs déjà exigés à l'inscription (nom, e-mail) ne comptent pas : ils rendraient la barre
 * pleine dès le départ et ne motiveraient personne à compléter le reste.
 */
export type ProfileCompletionInput = {
  fullName?: string | null;
  phone?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | Date | null;
  visaType?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  languageLevel?: string | null;
  preferredDestinations?: string | string[] | null;
  avatarVerificationStatus?: string | null;
};

export type ProfileCompletionField = { key: string; label: string };

export type ProfileCompletion = {
  percent: number;
  filled: number;
  total: number;
  missing: ProfileCompletionField[];
};

const hasText = (value: unknown) => value instanceof Date || (value !== null && value !== undefined && String(value).trim() !== "");

function countPreferredDestinations(value: ProfileCompletionInput["preferredDestinations"]): number {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim() !== "").length;
  if (typeof value !== "string" || value.trim() === "") return 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string" && item.trim() !== "").length : 0;
  } catch {
    return 0;
  }
}

const PROFILE_COMPLETION_CHECKS: Array<ProfileCompletionField & { isDone: (profile: ProfileCompletionInput) => boolean }> = [
  { key: "fullName", label: "Nom complet", isDone: (p) => hasText(p.fullName) },
  { key: "avatar", label: "Portrait vérifié", isDone: (p) => p.avatarVerificationStatus === "verified" },
  { key: "preferredDestinations", label: "Destinations favorites", isDone: (p) => countPreferredDestinations(p.preferredDestinations) > 0 },
  { key: "phone", label: "Téléphone", isDone: (p) => hasText(p.phone) },
  { key: "nationality", label: "Nationalité", isDone: (p) => hasText(p.nationality) },
  { key: "dateOfBirth", label: "Date de naissance", isDone: (p) => hasText(p.dateOfBirth) },
  { key: "visaType", label: "Type de visa souhaité", isDone: (p) => hasText(p.visaType) },
  { key: "educationLevel", label: "Niveau d’études", isDone: (p) => hasText(p.educationLevel) },
  { key: "employmentStatus", label: "Situation professionnelle", isDone: (p) => hasText(p.employmentStatus) },
  { key: "languageLevel", label: "Niveau de langue", isDone: (p) => hasText(p.languageLevel) },
];

export function computeProfileCompletion(profile: ProfileCompletionInput | null | undefined): ProfileCompletion {
  const total = PROFILE_COMPLETION_CHECKS.length;
  const missing = PROFILE_COMPLETION_CHECKS
    .filter((check) => !profile || !check.isDone(profile))
    .map(({ key, label }) => ({ key, label }));
  const filled = total - missing.length;
  return { percent: Math.round((filled / total) * 100), filled, total, missing };
}
