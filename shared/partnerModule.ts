/**
 * Module « Entreprises & partenaires » : règles communes au serveur et à l'interface.
 *
 * Réutilise le portail existant (placementPortal) : les trois catégories professionnelles se rattachent aux deux types
 * d'organisation déjà en base (employeur / agence de placement) sans modifier ces tables. Un recruteur / cabinet est une
 * organisation « placement_partner » dont la catégorie précise est enregistrée dans la fiche partenaire.
 */

export const PARTNER_CATEGORIES = ["employer", "recruiter", "placement_agency"] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, { fr: string; en: string; hintFr: string; hintEn: string }> = {
  employer: { fr: "Employeur direct", en: "Direct employer", hintFr: "Une entreprise qui recrute pour ses propres besoins.", hintEn: "A company hiring for its own needs." },
  recruiter: { fr: "Recruteur / cabinet de recrutement", en: "Recruiter / recruitment firm", hintFr: "Un cabinet qui recrute pour le compte d’entreprises clientes.", hintEn: "A firm hiring on behalf of client companies." },
  placement_agency: { fr: "Agence de placement", en: "Placement agency", hintFr: "Une agence autorisée à placer des travailleurs à l’étranger.", hintEn: "An agency authorised to place workers abroad." },
};

export type PartnerOrganizationType = "employer" | "placement_partner";

/** Les organisations déjà en base n'ont que deux types : un recruteur / cabinet est un intermédiaire, comme une agence. */
export function organizationTypeForCategory(category: PartnerCategory): PartnerOrganizationType {
  return category === "employer" ? "employer" : "placement_partner";
}

export function defaultCategoryForOrganizationType(type: PartnerOrganizationType): PartnerCategory {
  return type === "employer" ? "employer" : "placement_agency";
}

/** Un intermédiaire travaille pour des entreprises bénéficiaires : le mandat doit être identifié. */
export const isIntermediaryCategory = (category: PartnerCategory) => category !== "employer";

export const PARTNER_RELATIONSHIP_STATUSES = ["prospect", "contacted", "in_verification", "validated", "active", "suspended"] as const;
export type PartnerRelationshipStatus = (typeof PARTNER_RELATIONSHIP_STATUSES)[number];

export const PARTNER_STATUS_LABELS: Record<PartnerRelationshipStatus, { fr: string; en: string }> = {
  prospect: { fr: "Prospect", en: "Prospect" },
  contacted: { fr: "Contacté", en: "Contacted" },
  in_verification: { fr: "En vérification", en: "Under verification" },
  validated: { fr: "Validé", en: "Validated" },
  active: { fr: "Actif", en: "Active" },
  suspended: { fr: "Suspendu", en: "Suspended" },
};

/**
 * Une simple inscription n'affiche JAMAIS une entreprise comme « partenaire officiel ».
 * Le nom ou le logo n'est publiable que si le partenaire est « actif » ET a donné une autorisation écrite enregistrée.
 */
export function canDisplayPartnerPublicly(profile: { relationshipStatus: string; publicDisplayConsent: boolean | number | null | undefined }): boolean {
  return profile.relationshipStatus === "active" && Boolean(profile.publicDisplayConsent);
}

export const PARTNER_INTERACTION_KINDS = ["note", "call", "email", "meeting", "status_change", "invitation", "document"] as const;
export type PartnerInteractionKind = (typeof PARTNER_INTERACTION_KINDS)[number];

/** Permissions détaillées d'un utilisateur d'une entreprise partenaire. */
export const PARTNER_PERMISSION_KEYS = ["viewCvtheque", "submitNeeds", "requestInterviews", "inviteUsers"] as const;
export type PartnerPermissionKey = (typeof PARTNER_PERMISSION_KEYS)[number];
export type PartnerPermissions = Record<PartnerPermissionKey, boolean>;

export const PARTNER_PERMISSION_LABELS: Record<PartnerPermissionKey, { fr: string; en: string }> = {
  viewCvtheque: { fr: "Consulter les profils autorisés", en: "View authorised profiles" },
  submitNeeds: { fr: "Déposer des besoins de recrutement", en: "Submit recruitment needs" },
  requestInterviews: { fr: "Demander des entretiens", en: "Request interviews" },
  inviteUsers: { fr: "Inviter des collègues", en: "Invite colleagues" },
};

/** Valeurs par défaut selon le rôle existant : un lecteur consulte, un gestionnaire agit. */
export function defaultPartnerPermissions(role: "reader" | "manager"): PartnerPermissions {
  return role === "manager"
    ? { viewCvtheque: true, submitNeeds: true, requestInterviews: true, inviteUsers: true }
    : { viewCvtheque: true, submitNeeds: false, requestInterviews: false, inviteUsers: false };
}

/** Résout les permissions : défauts du rôle, puis surcharges enregistrées (JSON). Une valeur illisible est ignorée. */
export function resolvePartnerPermissions(role: "reader" | "manager", stored?: string | null): PartnerPermissions {
  const result = defaultPartnerPermissions(role);
  if (!stored) return result;
  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    for (const key of PARTNER_PERMISSION_KEYS) {
      if (typeof parsed[key] === "boolean") result[key] = parsed[key] as boolean;
    }
  } catch {
    // surcharge illisible : on garde les valeurs par défaut du rôle
  }
  return result;
}

export function sanitizePartnerPermissions(input: Partial<Record<string, unknown>> | null | undefined): Partial<PartnerPermissions> {
  const clean: Partial<PartnerPermissions> = {};
  for (const key of PARTNER_PERMISSION_KEYS) {
    if (typeof input?.[key] === "boolean") clean[key] = input[key] as boolean;
  }
  return clean;
}

export const INVITATION_DEFAULT_HOURS = 72;
export const INVITATION_MIN_HOURS = 1;
export const INVITATION_MAX_HOURS = 24 * 14;
export const INVITATION_MAX_PENDING_PER_ORGANIZATION = 20;

export function clampInvitationHours(hours: number | undefined | null): number {
  const value = Number.isFinite(hours as number) ? Math.round(hours as number) : INVITATION_DEFAULT_HOURS;
  return Math.min(INVITATION_MAX_HOURS, Math.max(INVITATION_MIN_HOURS, value));
}

export type InvitationState = "valid" | "used" | "revoked" | "expired";

export function invitationState(invitation: { usedAt?: Date | null; revokedAt?: Date | null; expiresAt: Date }, now: Date = new Date()): InvitationState {
  if (invitation.usedAt) return "used";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}

/** Mot de passe d'un compte professionnel : 12 caractères minimum, avec au moins une lettre et un chiffre. */
export function partnerPasswordProblem(password: string): string | null {
  if (password.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  return null;
}

export const AUTHORIZATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
export const AUTHORIZATION_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

/** Reconnaît le vrai format d'un fichier à ses premiers octets (le type annoncé par le navigateur n'est pas fiable). */
export function detectAuthorizationDocumentType(bytes: Uint8Array): (typeof AUTHORIZATION_DOCUMENT_TYPES)[number] | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  return null;
}

export const PARTNER_ROUTES = {
  hub: "/partenaires",
  register: "/employeurs?tab=register",
  registerNeed: "/employeurs?tab=register&intent=need",
  login: "/employeurs?tab=login",
  activation: "/partenaires/activation",
} as const;
