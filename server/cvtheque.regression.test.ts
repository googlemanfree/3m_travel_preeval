import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AVAILABILITY_LABELS,
  CVTHEQUE_STATES,
  EDUCATION_LABELS,
  VERIFICATION_LABELS,
  WORK_AUTHORIZATION_LABELS,
  buildSearchText,
  canTransitionCvtheque,
  containsForbiddenPromise,
  defaultVerificationLevels,
  isCvthequeVisible,
  parseList,
  parseVerificationLevels,
  searchTerms,
  toCleanList,
} from "../shared/cvtheque";
import { PRIVACY_NOTICES } from "../shared/privacyCatalog";
import { signedUrlExpiry } from "./routers/privacyCenter";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("CVthèque — règles communes", () => {
  it("n'autorise que les transitions prévues (un profil retiré ne repasse jamais directement en ligne)", () => {
    expect(canTransitionCvtheque("draft", "pending_review")).toBe(true);
    expect(canTransitionCvtheque("draft", "published")).toBe(false);
    expect(canTransitionCvtheque("withdrawn", "published")).toBe(false);
    expect(canTransitionCvtheque("rejected", "published")).toBe(false);
    expect(canTransitionCvtheque("pending_review", "published")).toBe(true);
    expect(canTransitionCvtheque("published", "withdrawn")).toBe(true);
    expect(CVTHEQUE_STATES).toHaveLength(5);
  });

  it("une fiche n'est visible que si TOUS les critères sont réunis", () => {
    const ok = { visibilityState: "published", placementConsentGranted: true, summaryApproved: true, archived: false };
    expect(isCvthequeVisible(ok)).toBe(true);
    expect(isCvthequeVisible({ ...ok, visibilityState: "pending_review" })).toBe(false);
    expect(isCvthequeVisible({ ...ok, visibilityState: "withdrawn" })).toBe(false);
    expect(isCvthequeVisible({ ...ok, placementConsentGranted: false })).toBe(false);
    expect(isCvthequeVisible({ ...ok, summaryApproved: false })).toBe(false);
    expect(isCvthequeVisible({ ...ok, archived: true })).toBe(false);
  });

  it("« déclaré » est le niveau par défaut et une valeur illisible ne fait jamais monter le niveau", () => {
    expect(defaultVerificationLevels()).toEqual({ skills: "declared", experience: "declared", education: "declared", languages: "declared" });
    expect(parseVerificationLevels(null).skills).toBe("declared");
    expect(parseVerificationLevels("{pas json").experience).toBe("declared");
    expect(parseVerificationLevels(JSON.stringify({ skills: "verified", education: "supervérifié" }))).toMatchObject({ skills: "verified", education: "declared" });
  });

  it("aucun libellé ne promet un visa, un emploi ou une admissibilité", () => {
    const labels = JSON.stringify([WORK_AUTHORIZATION_LABELS, VERIFICATION_LABELS, AVAILABILITY_LABELS, EDUCATION_LABELS, PRIVACY_NOTICES]);
    expect(labels).not.toMatch(/visa garanti|emploi garanti|admissible|garanti(e|s)? /i);
    expect(containsForbiddenPromise("Visa garanti en trois mois")).toBe(true);
    expect(containsForbiddenPromise("Candidat admissible")).toBe(true);
    expect(containsForbiddenPromise("Soins aux personnes, manutention")).toBe(false);
  });

  it("la situation d'autorisation de travail est toujours présentée comme une déclaration", () => {
    for (const value of Object.values(WORK_AUTHORIZATION_LABELS)) expect(value.fr).not.toMatch(/autorisé à travailler|permis valide|éligible/i);
    expect(WORK_AUTHORIZATION_LABELS.none.fr).toMatch(/déclarée/);
  });

  it("nettoie les listes saisies et fabrique un texte de recherche sans donnée d'identité", () => {
    expect(toCleanList("Soudure, soudure ; Manutention\n  , x, Excel ")).toEqual(["Soudure", "Manutention", "Excel"]);
    expect(toCleanList(["a".repeat(100)])[0]).toHaveLength(60);
    expect(parseList(JSON.stringify(["a", 3, "b"]))).toEqual(["a", "b"]);
    expect(parseList("pas json")).toEqual([]);
    expect(buildSearchText({ jobTitle: "Aide-soignant", skills: ["Soins aux personnes"], languages: ["Français"], destinations: ["Canada"] })).toBe("aide-soignant soins aux personnes francais canada");
    expect(searchTerms("Soins  à Éric ??")).toEqual(["soins", "eric"]);
  });

  it("la durée du lien est lue dans l'adresse signée quand le stockage l'indique", () => {
    const now = new Date("2026-10-20T10:00:00Z");
    expect(signedUrlExpiry("https://s.example/f?X-Amz-Expires=300&X-Amz-Signature=abc", now)).toEqual({ expiresAt: new Date("2026-10-20T10:05:00Z"), fromProvider: true });
    expect(signedUrlExpiry("https://s.example/f?token=1", now)).toEqual({ expiresAt: new Date("2026-10-20T10:15:00Z"), fromProvider: false });
    expect(signedUrlExpiry("pas une adresse", now).fromProvider).toBe(false);
  });
});

describe("CVthèque — propriétés de sécurité du serveur", () => {
  const router = read("server/routers/cvtheque.ts");
  const blocks = router.split(/\n  (?=[a-zA-Z]+: publicProcedure)/).slice(1);
  const byName = (name: string) => blocks.find((block) => block.startsWith(`${name}:`)) ?? "";

  it("la fiche présentée à un employeur ne contient jamais d'identité, de nationalité, de contact ni de pièce", () => {
    const card = router.slice(router.indexOf("function toEmployerCard"), router.indexOf("const visibleWhere"));
    expect(card.length).toBeGreaterThan(200);
    for (const forbidden of ["nationality", "fullName", "email", "phone", "candidateId", "passport", "passeport", "fileKey", "birth"]) expect(card, forbidden).not.toContain(forbidden);
  });

  it("la visibilité exige publication, résumé approuvé, non archivé ET consentement de partage accordé", () => {
    const where = router.slice(router.indexOf("const visibleWhere"), router.indexOf("const visibleSelect"));
    for (const clause of ['visibilityState, "published"', 'summaryStatus, "approved"', "archivedAt", 'candidatePlacementConsents.status, "granted"']) expect(where, clause).toContain(clause);
  });

  it("toutes les actions employeur vérifient la session, la permission, et sont plafonnées et journalisées", () => {
    for (const name of ["search", "getProfile", "selectionList", "selectionAdd"]) {
      const block = byName(name);
      expect(block, name).toContain("getEmployerSession(input.sessionToken)");
      expect(block, name).toContain('requirePartnerPermission(db, account, "viewCvtheque")');
    }
    expect(byName("search")).toContain("SEARCH_LIMIT_PER_HOUR");
    expect(byName("search")).toContain('action: "cvtheque.search"');
    expect(byName("getProfile")).toContain("PROFILE_VIEW_LIMIT_PER_DAY");
    expect(byName("getProfile")).toContain('action: "cvtheque.profile_viewed"');
  });

  it("le diplôme n'est jamais un critère obligatoire de recherche", () => {
    const search = byName("search");
    expect(search).toContain("educationLevels: z.array(z.enum(EDUCATION_LEVELS)).max(6).optional()");
    expect(search).toContain("if (input.educationLevels?.length)");
    expect(search).not.toMatch(/educationLevel[^s].*required/);
  });

  it("la publication exige un administrateur renforcé, le consentement versionné du candidat et un résumé approuvé", () => {
    const review = byName("adminReview");
    expect(review).toContain("requireStrongAdmin(admin)");
    expect(review).toContain("CVTHEQUE_CONSENT_KIND");
    expect(review).toContain('summaryStatus !== "approved"');
    expect(review).toContain("canTransitionCvtheque(from, target)");
    for (const name of ["adminQueue", "adminReview"]) expect(byName(name), name).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("le candidat retire sa fiche sans supprimer son compte, et toute modification d'une fiche publiée la remet en examen", () => {
    const withdraw = byName("withdraw");
    expect(withdraw).toContain('visibilityState: "withdrawn"');
    expect(router).not.toMatch(/\.delete\(candidates\)/);
    expect(byName("saveDeclared")).toContain('existing.visibilityState === "published" ? "pending_review"');
    expect(byName("requestPublication")).toContain("consent: z.literal(true)");
  });

  it("la migration 0082 ne crée que de nouvelles tables", () => {
    const sql = read("drizzle/0082_privacy_foundations_cvtheque.sql");
    expect(sql).not.toMatch(/ALTER\s+TABLE/i);
    expect(sql).not.toMatch(/DROP\s/i);
    const created = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((match) => match[1]).sort();
    expect(created).toEqual(["consent_records", "cvtheque_profiles", "data_processors", "document_transmissions", "partner_selections", "privacy_audit_events"]);
    expect(sql).toMatch(/safeguards_status ENUM\('unreviewed', 'reviewed', 'refused'\) NOT NULL DEFAULT 'unreviewed'/);
    expect(sql).toMatch(/integration_enabled BOOLEAN NOT NULL DEFAULT FALSE/);
  });
});

describe("Confidentialité — pièces privées et prestataires", () => {
  const center = read("server/routers/privacyCenter.ts");
  const blocks = center.split(/\n  (?=[a-zA-Z]+: publicProcedure)/).slice(1);
  const byName = (name: string) => blocks.find((block) => block.startsWith(`${name}:`)) ?? "";

  it("toutes les actions du centre exigent une session administrateur", () => {
    expect(blocks.length).toBeGreaterThanOrEqual(6);
    for (const block of blocks) expect(block.slice(0, 30), block.slice(0, 30)).toContain("admin");
    for (const block of blocks) expect(block).toContain("requireValidAdminSession(input.sessionToken)");
  });

  it("une pièce privée n'est transmise qu'avec motif, destinataire, administrateur renforcé, enregistrement et journal", () => {
    const issue = byName("adminIssueDocumentLink");
    expect(issue).toContain("purpose: z.string().trim().min(10)");
    expect(issue).toContain("recipient: z.string().trim().min(3)");
    expect(issue).toContain("requireStrongAdmin(admin)");
    expect(issue).toContain("storageGetSignedUrl");
    expect(issue).toContain("documentTransmissions");
    expect(issue).toContain('action: "documents.link_issued"');
    // La liste des pièces ne renvoie ni contenu ni lien.
    const list = byName("adminCandidateFiles");
    expect(list).not.toContain("storageGetSignedUrl");
    expect(list).not.toContain("fileUrl");
    expect(list).toContain('action: "documents.list_viewed"');
  });

  it("aucune intégration ne s'active sans examen des garanties et pays d'hébergement", () => {
    const update = byName("adminProcessorUpdate");
    expect(update).toContain('nextStatus !== "reviewed"');
    expect(update).toContain("hostingCountry");
    expect(update).toContain("Impossible d’activer");
  });

  it("l'authentification renforcée est exigée PAR DÉFAUT : seule une désactivation explicite l'ouvre, et une erreur refuse l'action", async () => {
    const strong = read("server/services/adminStrongAuth.ts");
    expect(strong).toContain('?? "on"');
    expect(strong).toContain('!== "off"');
    expect(strong).not.toMatch(/catch\s*\{\s*enabled = false/);
    const { isStrongAdminEnforced } = await import("./services/adminStrongAuth");
    const previous = process.env.ADMIN_2FA_ENFORCEMENT;
    try {
      delete process.env.ADMIN_2FA_ENFORCEMENT;
      expect(isStrongAdminEnforced()).toBe(true);
      process.env.ADMIN_2FA_ENFORCEMENT = "";
      expect(isStrongAdminEnforced()).toBe(true);
      process.env.ADMIN_2FA_ENFORCEMENT = "ON";
      expect(isStrongAdminEnforced()).toBe(true);
      process.env.ADMIN_2FA_ENFORCEMENT = "off";
      expect(isStrongAdminEnforced()).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.ADMIN_2FA_ENFORCEMENT;
      else process.env.ADMIN_2FA_ENFORCEMENT = previous;
    }
  });

  it("le registre des prestataires est amorcé en « non examiné » et l'audit n'enregistre pas d'adresse IP en clair", () => {
    expect(read("drizzle/0082_privacy_foundations_cvtheque.sql")).toContain("INSERT IGNORE INTO data_processors");
    const audit = read("server/services/privacyAudit.ts");
    expect(audit).toContain("createHash");
    expect(audit).toContain("ipHash");
    expect(audit).not.toMatch(/ip:\s*input\.ip/);
  });

  it("les notifications des modules ne joignent aucune pièce", () => {
    for (const file of ["server/routers/partnerModule.ts", "server/routers/cvtheque.ts", "server/routers/privacyCenter.ts"]) {
      expect(read(file), file).not.toMatch(/attachments\s*:/);
    }
  });

  it("aucune mention de conformité réglementaire n'est affichée dans les écrans de confidentialité", () => {
    for (const file of ["shared/privacyCatalog.ts", "client/src/components/PrivacyNotice.tsx", "client/src/components/CvthequePresenceCard.tsx", "client/src/components/AdminPrivacyCenter.tsx"]) {
      expect(read(file), file).not.toMatch(/conforme au RGPD|conforme RGPD|RGPD[- ]compliant|GDPR[- ]compliant/i);
    }
  });
});
