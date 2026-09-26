import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accountReference,
  agencyDossierReference,
  currentReference,
  isAccountReference,
  isActiveDossierReference,
  normalizeAccountReference,
  referenceChangeSentence,
  referenceKind,
  resolveClientReference,
} from "../shared/caseReference";
import { findRedundantPreAccounts, samePhone } from "./services/redundantPreAccounts";
import { archiveRedundantPreAccounts, loadRedundantPreAccounts } from "./services/redundantPreAccountsStore";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("références : du compte au dossier actif", () => {
  it("une seule écriture par format : COMPTE-00012 et 3M-AGN-0034", () => {
    expect(accountReference(12)).toBe("COMPTE-00012");
    expect(accountReference(123456)).toBe("COMPTE-123456");
    expect(agencyDossierReference(34)).toBe("3M-AGN-0034");
    expect(normalizeAccountReference("COMPTE-12")).toBe("COMPTE-00012");
    expect(normalizeAccountReference("3M-AGN-0034")).toBe("3M-AGN-0034");
  });

  it("reconnaît le type de référence : compte, dossier actif (3M-…), inconnu", () => {
    expect(referenceKind("COMPTE-00012")).toBe("account");
    expect(referenceKind("COMPTE-12")).toBe("account");
    expect(referenceKind("3M-AGN-0034")).toBe("active_dossier");
    expect(referenceKind("3M-2026-0042")).toBe("active_dossier");
    expect(referenceKind("#3M-2026-0042")).toBe("active_dossier");
    expect(referenceKind("EVAL-AG-77")).toBe("unknown");
    expect(referenceKind(null)).toBe("unknown");
    expect(isAccountReference("XCOMPTE-1")).toBe(false);
    expect(isActiveDossierReference("3M")).toBe(false);
  });

  it("avant l'activation : référence de compte ; après : numéro 3M-… et l'ancienne référence est conservée", () => {
    expect(currentReference({ candidateId: 12 })).toEqual({ reference: "COMPTE-00012", kind: "account", formerAccountReference: null, activated: false });
    expect(currentReference({ candidateId: 12, activeDossierReference: "3M-AGN-0034" })).toEqual({ reference: "3M-AGN-0034", kind: "active_dossier", formerAccountReference: "COMPTE-00012", activated: true });
    // Un numéro qui ne commence pas par 3M- n'est jamais présenté comme dossier actif.
    expect(currentReference({ candidateId: 12, activeDossierReference: "EVAL-AG-77" }).activated).toBe(false);
  });

  it("un pré-dossier « nouveau » ou un paiement non validé n'active pas ; un dossier ouvert ou un paiement validé si", () => {
    expect(resolveClientReference({ candidateId: 5, agencyDossier: { id: 9, status: "nouveau" } }).reference).toBe("COMPTE-00005");
    expect(resolveClientReference({ candidateId: 5, agencyDossier: { id: 9, status: "en_cours" } }).reference).toBe("3M-AGN-0009");
    expect(resolveClientReference({ candidateId: 5, onlineApplication: { dossierNumber: "3M-2026-0042", paymentStatus: "SUCCESS", paymentValidatedAt: null } }).reference).toBe("COMPTE-00005");
    expect(resolveClientReference({ candidateId: 5, onlineApplication: { dossierNumber: "3M-2026-0042", paymentStatus: "PENDING", paymentValidatedAt: new Date() } }).reference).toBe("COMPTE-00005");
    expect(resolveClientReference({ candidateId: 5, onlineApplication: { dossierNumber: "3M-2026-0042", paymentStatus: "SUCCESS", paymentValidatedAt: new Date() } }).reference).toBe("3M-2026-0042");
    // Le dossier agence prime sur le dossier en ligne.
    expect(resolveClientReference({ candidateId: 5, agencyDossier: { id: 9, status: "documents_requis" }, onlineApplication: { dossierNumber: "3M-2026-0042", paymentStatus: "SUCCESS", paymentValidatedAt: new Date() } }).reference).toBe("3M-AGN-0009");
  });

  it("la phrase de changement nomme les deux références", () => {
    const sentence = referenceChangeSentence("COMPTE-00012", "3M-AGN-0034");
    expect(sentence).toContain("COMPTE-00012");
    expect(sentence).toContain("3M-AGN-0034");
  });
});

describe("pré-comptes redondants : détection prudente", () => {
  const active = [{ source: "agency" as const, id: 34, reference: "3M-AGN-0034", fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237 6 98 10 48 32", status: "en_cours" }];
  const row = (overrides: Record<string, unknown> = {}) => ({ id: 1, fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "698104832", createdAt: "2026-09-01T10:00:00Z", ...overrides });

  it("téléphone : mêmes 9 derniers chiffres, indicatif et 0 initial ignorés, 8 chiffres minimum", () => {
    expect(samePhone("+237 6 98 10 48 32", "698104832")).toBe(true);
    expect(samePhone("0698104832", "+237698104832")).toBe(true);
    expect(samePhone("698104832", "698104833")).toBe(false);
    expect(samePhone("1234", "1234")).toBe(false);
    expect(samePhone(null, "698104832")).toBe(false);
  });

  it("pré-dossier agence avec l'e-mail d'un dossier actif : certain", () => {
    const [found] = findRedundantPreAccounts({ accounts: [], agencyPreDossiers: [row({ id: 7, phone: null })], activeDossiers: active, accountEmailsWithOwnDossier: [] });
    expect(found).toMatchObject({ kind: "agency_pre_dossier", id: 7, reference: "3M-AGN-0007", confidence: "certain", activeDossierReference: "3M-AGN-0034" });
    expect(found.reason).toContain("3M-AGN-0034");
  });

  it("le compte dont l'e-mail est celui d'un dossier actif est son compte de connexion : jamais proposé", () => {
    expect(findRedundantPreAccounts({ accounts: [row({ id: 12 })], agencyPreDossiers: [], activeDossiers: active, accountEmailsWithOwnDossier: [] })).toEqual([]);
    expect(findRedundantPreAccounts({ accounts: [row({ id: 12, email: "autre@example.com" })], agencyPreDossiers: [], activeDossiers: [], accountEmailsWithOwnDossier: ["autre@example.com"] })).toEqual([]);
  });

  it("autre e-mail : seulement « probable », et seulement avec le même téléphone ET un nom très proche", () => {
    const samePersonOtherEmail = row({ id: 20, email: "aicha2@example.com" });
    const [probable] = findRedundantPreAccounts({ accounts: [samePersonOtherEmail], agencyPreDossiers: [], activeDossiers: active, accountEmailsWithOwnDossier: [] });
    expect(probable).toMatchObject({ kind: "account", reference: "COMPTE-00020", confidence: "probable" });
    // Même nom seul, autre téléphone : homonyme, ignoré.
    expect(findRedundantPreAccounts({ accounts: [row({ id: 21, email: "x@example.com", phone: "670000000" })], agencyPreDossiers: [], activeDossiers: active, accountEmailsWithOwnDossier: [] })).toEqual([]);
    // Même téléphone, nom différent (famille qui partage un numéro) : ignoré.
    expect(findRedundantPreAccounts({ accounts: [row({ id: 22, email: "y@example.com", fullName: "Paul Mbarga" })], agencyPreDossiers: [], activeDossiers: active, accountEmailsWithOwnDossier: [] })).toEqual([]);
  });

  it("les cas certains passent avant les probables ; l'e-mail est comparé sans tenir compte de la casse", () => {
    const result = findRedundantPreAccounts({
      accounts: [row({ id: 20, email: "aicha2@example.com" })],
      agencyPreDossiers: [row({ id: 7, email: "AICHA@Example.com", phone: null })],
      activeDossiers: active,
      accountEmailsWithOwnDossier: [],
    });
    expect(result.map((item) => item.confidence)).toEqual(["certain", "probable"]);
  });
});

describe("mise en corbeille : revérifiée côté serveur, réversible, journalisée", () => {
  const store = read("server/services/redundantPreAccountsStore.ts");
  const router = read("server/routers/adminCandidateManagement.ts");

  it("un identifiant qui n'est pas (ou plus) redondant est ignoré, jamais archivé", () => {
    expect(store).toContain("const found = byKey.get(");
    expect(store).toMatch(/if \(!found\) \{\s*skipped\.push\(requested\);\s*continue;/);
    expect(store.indexOf("const current = await loadRedundantPreAccounts(db)")).toBeLessThan(store.indexOf("db.update("));
  });

  it("c'est un marquage de corbeille (deletedAt) et non une suppression, avec le motif et un journal", () => {
    expect(store).not.toMatch(/db\.delete\(/);
    expect(store).toContain("deletedAt: now");
    expect(store).toContain("adminActivityLogs");
    expect(store).toContain("redundant_pre_account_archived");
  });

  it("les deux procédures exigent une session admin ; l'écriture exige la confirmation « CORBEILLE » et borne le lot", () => {
    const list = router.slice(router.indexOf("listRedundantPreAccounts:"), router.indexOf("archiveRedundantPreAccounts:"));
    const archive = router.slice(router.indexOf("archiveRedundantPreAccounts:"), router.indexOf("listPreDossierAccounts:"));
    expect(list).toContain("requireValidAdminSession(input.sessionToken)");
    expect(archive).toContain("requireValidAdminSession(input.sessionToken)");
    expect(archive).toContain('confirmation: z.literal("CORBEILLE")');
    expect(archive).toContain(".max(200)");
    expect(list).not.toContain("archiveRedundantPreAccounts(db");
  });
});

describe("activation : la référence de compte devient le numéro de dossier actif", () => {
  const router = read("server/routers/adminCandidateManagement.ts");
  const activate = router.slice(router.indexOf("activatePreDossierAccount:"), router.indexOf("  list: publicProcedure"));

  it("le changement est tracé, annoncé dans l'espace client et par e-mail", () => {
    expect(activate).toContain('action: "reference_changed"');
    expect(activate).toContain("oldValue: previousAccountReference");
    expect(activate).toContain("newValue: dossierReference");
    expect(activate).toContain("referenceChangeSentence(previousAccountReference, dossierReference)");
    expect(activate).toContain("sendDossierConfirmationEmail(candidate.email, candidate.fullName, dossierReference, input.destination, 0, previousAccountReference)");
    expect(activate).toContain("accountReference(candidate.id)");
  });

  it("l'espace client affiche cette référence et plus deux écritures du même numéro", () => {
    const candidateRouter = read("server/routers/candidate.ts");
    expect(candidateRouter).toContain("reference: clientReference,");
    expect(candidateRouter).not.toMatch(/`COMPTE-\$\{/);
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).not.toMatch(/`COMPTE-\$\{/);
    expect(space).toContain("{displayReference}");
  });

  it("l'e-mail d'activation ne montre plus « 0 FCFA » et ne promet plus de délai", () => {
    const source = read("server/emailService.ts");
    const email = source.slice(source.indexOf("export async function sendDossierConfirmationEmail"), source.indexOf("export async function", source.indexOf("export async function sendDossierConfirmationEmail") + 10));
    expect(email).toContain("amount > 0 ?");
    expect(email).not.toContain("sous 24h");
    expect(email).toContain("previousAccountReference");
  });
});

describe("mise en corbeille : comportement avec une base simulée", () => {

  // Les six lectures de loadRedundantPreAccounts partent dans cet ordre (Promise.all) : comptes, pré-dossiers agence,
  // dossiers agence actifs, dossiers en ligne actifs, e-mails des dossiers agence, e-mails des dossiers en ligne.
  const fakeDb = (results: unknown[][]) => {
    const calls = { updates: [] as unknown[], logs: [] as any[] };
    let next = 0;
    const db: any = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => results[next++] ?? [] }) }) }),
      update: () => ({ set: (values: unknown) => ({ where: async () => { calls.updates.push(values); } }) }),
      insert: () => ({ values: async (row: unknown) => { calls.logs.push(row); } }),
    };
    return { db, calls, reset: () => { next = 0; } };
  };
  const world = () => [
    [{ id: 20, fullName: "Aïcha Nkolo", email: "aicha2@example.com", phone: "698104832", createdAt: new Date("2026-09-02") }],
    [{ id: 7, fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: null, createdAt: new Date("2026-09-01") }],
    [{ id: 34, fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237698104832", status: "en_cours" }],
    [],
    [{ email: "aicha@example.com" }, { email: "aicha@example.com" }],
    [],
  ];

  it("détecte le pré-dossier certain et le compte probable", async () => {
    const { db } = fakeDb(world());
    const items = await loadRedundantPreAccounts(db);
    expect(items.map((item) => [item.reference, item.confidence])).toEqual([["3M-AGN-0007", "certain"], ["COMPTE-00020", "probable"]]);
  });

  it("archive seulement ce qui est réellement redondant, journalise, et ignore le reste", async () => {
    const { db, calls } = fakeDb([...world(), ...world()]);
    // Premier appel de lecture (loadRedundantPreAccounts dans archive) consomme les 6 premiers résultats.
    const result = await archiveRedundantPreAccounts(db, {
      items: [{ kind: "agency_pre_dossier", id: 7 }, { kind: "account", id: 999 }, { kind: "agency_pre_dossier", id: 34 }],
      adminEmail: "admin@3mtravelagency.com",
    });
    expect(result.archived.map((item) => item.reference)).toEqual(["3M-AGN-0007"]);
    expect(result.skipped).toEqual([{ kind: "account", id: 999 }, { kind: "agency_pre_dossier", id: 34 }]);
    expect(calls.updates).toHaveLength(1);
    expect((calls.updates[0] as any).deletedBy).toBe("admin@3mtravelagency.com");
    expect((calls.updates[0] as any).deletionReason).toContain("3M-AGN-0034");
    expect(calls.logs).toHaveLength(1);
    expect(JSON.parse(calls.logs[0].details).activeDossierReference).toBe("3M-AGN-0034");
  });
});
