import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTHORIZATION_DOCUMENT_MAX_BYTES,
  INVITATION_MAX_HOURS,
  PARTNER_CATEGORIES,
  PARTNER_RELATIONSHIP_STATUSES,
  canDisplayPartnerPublicly,
  clampInvitationHours,
  defaultCategoryForOrganizationType,
  defaultPartnerPermissions,
  detectAuthorizationDocumentType,
  invitationState,
  isIntermediaryCategory,
  organizationTypeForCategory,
  partnerPasswordProblem,
  resolvePartnerPermissions,
  sanitizePartnerPermissions,
} from "../shared/partnerModule";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("module Entreprises & partenaires — règles communes", () => {
  it("rattache les trois catégories aux deux types d'organisation existants, sans modifier les tables", () => {
    expect(PARTNER_CATEGORIES).toEqual(["employer", "recruiter", "placement_agency"]);
    expect(organizationTypeForCategory("employer")).toBe("employer");
    expect(organizationTypeForCategory("recruiter")).toBe("placement_partner");
    expect(organizationTypeForCategory("placement_agency")).toBe("placement_partner");
    expect(defaultCategoryForOrganizationType("employer")).toBe("employer");
    expect(defaultCategoryForOrganizationType("placement_partner")).toBe("placement_agency");
    expect(isIntermediaryCategory("employer")).toBe(false);
    expect(isIntermediaryCategory("recruiter")).toBe(true);
  });

  it("propose les six statuts de relation, et une simple inscription n'affiche jamais un « partenaire officiel »", () => {
    expect(PARTNER_RELATIONSHIP_STATUSES).toEqual(["prospect", "contacted", "in_verification", "validated", "active", "suspended"]);
    expect(canDisplayPartnerPublicly({ relationshipStatus: "validated", publicDisplayConsent: true })).toBe(false);
    expect(canDisplayPartnerPublicly({ relationshipStatus: "active", publicDisplayConsent: false })).toBe(false);
    expect(canDisplayPartnerPublicly({ relationshipStatus: "active", publicDisplayConsent: null })).toBe(false);
    expect(canDisplayPartnerPublicly({ relationshipStatus: "active", publicDisplayConsent: true })).toBe(true);
  });

  it("résout les permissions : défauts du rôle, surcharges valides seulement", () => {
    expect(defaultPartnerPermissions("manager")).toEqual({ viewCvtheque: true, submitNeeds: true, requestInterviews: true, inviteUsers: true });
    expect(defaultPartnerPermissions("reader")).toEqual({ viewCvtheque: true, submitNeeds: false, requestInterviews: false, inviteUsers: false });
    expect(resolvePartnerPermissions("reader", JSON.stringify({ submitNeeds: true, inviteUsers: "oui", inconnue: true })).submitNeeds).toBe(true);
    expect(resolvePartnerPermissions("reader", JSON.stringify({ inviteUsers: "oui" })).inviteUsers).toBe(false);
    expect(resolvePartnerPermissions("reader", "{pas du json").viewCvtheque).toBe(true);
    expect(sanitizePartnerPermissions({ submitNeeds: true, hack: true, inviteUsers: "x" })).toEqual({ submitNeeds: true });
  });

  it("limite la durée d'une invitation et reconnaît son état", () => {
    expect(clampInvitationHours(undefined)).toBe(72);
    expect(clampInvitationHours(0)).toBe(1);
    expect(clampInvitationHours(100000)).toBe(INVITATION_MAX_HOURS);
    const now = new Date("2026-10-20T10:00:00Z");
    const future = new Date("2026-10-21T10:00:00Z");
    expect(invitationState({ expiresAt: future }, now)).toBe("valid");
    expect(invitationState({ expiresAt: new Date("2026-10-19T10:00:00Z") }, now)).toBe("expired");
    expect(invitationState({ expiresAt: future, revokedAt: now }, now)).toBe("revoked");
    expect(invitationState({ expiresAt: future, usedAt: now, revokedAt: now }, now)).toBe("used");
  });

  it("exige un mot de passe d'au moins 12 caractères avec une lettre et un chiffre", () => {
    expect(partnerPasswordProblem("court1")).toMatch(/12 caractères/);
    expect(partnerPasswordProblem("uniquement-des-lettres")).toMatch(/lettre et un chiffre/);
    expect(partnerPasswordProblem("123456789012")).toMatch(/lettre et un chiffre/);
    expect(partnerPasswordProblem("MotDePasse2026ok")).toBeNull();
  });

  it("reconnaît le vrai format du justificatif à ses premiers octets (le type annoncé n'est pas fiable)", () => {
    expect(detectAuthorizationDocumentType(new TextEncoder().encode("%PDF-1.7 contenu"))).toBe("application/pdf");
    expect(detectAuthorizationDocumentType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectAuthorizationDocumentType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectAuthorizationDocumentType(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(AUTHORIZATION_DOCUMENT_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("module Entreprises & partenaires — propriétés de sécurité du serveur", () => {
  const router = read("server/routers/partnerModule.ts");
  const procedures = router.split(/\n  (?=[a-zA-Z]+: publicProcedure)/).slice(1);
  const byName = (name: string) => procedures.find((block) => block.startsWith(`${name}:`)) ?? "";

  it("toutes les actions de l'administration exigent une session administrateur valide", () => {
    const adminBlocks = procedures.filter((block) => block.startsWith("admin"));
    expect(adminBlocks.length).toBeGreaterThanOrEqual(8);
    for (const block of adminBlocks) expect(block, block.slice(0, 40)).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("toutes les actions employeur passent par la session employeur (organisation vérifiée) et restent dans l'organisation", () => {
    const employerBlocks = procedures.filter((block) => block.startsWith("employer"));
    expect(employerBlocks.length).toBeGreaterThanOrEqual(5);
    for (const block of employerBlocks) expect(block, block.slice(0, 40)).toContain("getEmployerSession(input.sessionToken)");
    for (const name of ["employerRevokeInvitation", "employerSetPermissions", "employerTeam"]) expect(byName(name), name).toContain("organization.id");
    for (const name of ["employerInviteColleague", "employerRevokeInvitation", "employerSetPermissions", "employerTeam"]) expect(byName(name), name).toContain("requireEmployerManager(account)");
  });

  it("le lien d'invitation est personnel : jeton haché en base, usage unique, durée limitée, organisation vérifiée exigée", () => {
    expect(router).toContain("tokenHash: hashToken(token)");
    expect(router).not.toMatch(/token:\s*token[,\s]/);
    const activation = byName("activateInvitation");
    expect(activation).toContain("invitationState(invitation) !== \"valid\"");
    expect(activation).toContain("verificationStatus, \"verified\"");
    expect(activation).toContain("partnerPasswordProblem(input.password)");
    expect(activation).toContain("recordFailedAttempt(limitKey)");
    expect(activation).toContain("usedAt: new Date()");
    expect(byName("adminCreateInvitation")).toContain("verificationStatus !== \"verified\"");
    expect(byName("getInvitation")).not.toContain("passwordHash");
  });

  it("le justificatif est stocké en privé après contrôle du contenu, jamais d'après le type annoncé", () => {
    const upload = byName("uploadAuthorizationDocument");
    expect(upload).toContain("detectAuthorizationDocumentType(bytes)");
    expect(upload).toContain("AUTHORIZATION_DOCUMENT_MAX_BYTES");
    expect(upload).toContain("uploadTokenHash");
    expect(byName("adminAuthorizationDocumentUrl")).toContain("storageGetSignedUrl");
  });

  it("une migration non appliquée donne un message clair au lieu d'une erreur technique", () => {
    expect(router).toContain("ER_NO_SUCH_TABLE");
    expect(router).toContain("la migration 0081 doit être appliquée");
  });

  it("le passage au statut « actif » exige une organisation vérifiée", () => {
    expect(byName("adminPartnerSaveProfile")).toContain("Vérifiez l’organisation avant de la passer en partenaire actif.");
  });
});

describe("module Entreprises & partenaires — migration et intégration", () => {
  it("la migration 0081 ne crée que de nouvelles tables (aucune table existante modifiée)", () => {
    const sql = read("drizzle/0081_partner_module_foundation.sql");
    expect(sql).not.toMatch(/ALTER\s+TABLE/i);
    expect(sql).not.toMatch(/DROP\s/i);
    const created = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((match) => match[1]);
    expect(created.sort()).toEqual(["partner_interactions", "partner_invitations", "partner_profiles", "partner_registration_extras", "partner_user_permissions"]);
  });

  it("les tables sont déclarées dans le schéma et le routeur est enregistré", () => {
    expect(read("drizzle/schema.ts")).toContain("export * from \"./partnerModuleSchema\";");
    expect(read("server/routers.ts")).toContain("partnerModule: partnerModuleRouter,");
  });

  it("la fiche partenaire est créée à l'approbation d'une demande, sans jamais passer en « actif » automatiquement", () => {
    expect(read("server/routers/placementPortal.ts")).toContain("ensurePartnerProfileFromRequest(db, request, organizationId, verified, admin)");
    const service = read("server/services/partnerProfiles.ts");
    expect(service).toContain('verified ? "validated" : "in_verification"');
    expect(service).not.toContain('"active"');
  });

  it("la page d'activation est une page privée non indexée, déclarée côté serveur", () => {
    expect(read("server/publicPrerender.ts")).toContain('"/partenaires/activation": privateShell(');
    expect(read("client/src/App.tsx")).toContain('path={"/partenaires/activation"}');
  });
});
