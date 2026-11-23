import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, like, or, sql } from "drizzle-orm";

/**
 * Liste des candidats paginée par la base : le résultat doit être identique à l'ancien calcul en mémoire (qui sert ici de référence)
 * sur des données variées (dossiers en ligne et agence, comptes sans dossier, CV, bilans publiés, documents, portraits).
 * Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ; lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("liste des candidats : SQL = ancien calcul en mémoire", () => {
  let ctx: any;
  const stamp = String(Date.now()).slice(-9);
  const mail = (name: string) => `zl${stamp}.${name}@Example.org`;

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const s = await import("../drizzle/schema");
    const base = new Date("2026-03-01T10:00:00Z").getTime();
    const at = (n: number) => new Date(base + n * 3_600_000);
    const statuses = ["nouveau", "en_evaluation", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "visa_approuve", "refuse"] as const;
    const badges = ["eligible", "admissible", "faible", null] as const;
    const pay = ["PENDING", "SUCCESS", "FAILED", "CANCELLED"] as const;
    const dest = ["canada", "luxembourg", "pologne", "autre"] as const;
    for (let n = 0; n < 40; n += 1) {
      await db.insert(s.applications).values({
        dossierNumber: `ZL${stamp}-${n}`, fullName: n % 7 === 0 ? `Éloïse Zèbre ${n}` : `Zl Candidat ${String(n).padStart(2, "0")}`, email: mail(`on${n}`), whatsappNumber: `+23760000${n}`, destination: dest[n % 4],
        visaType: n % 5 === 0 ? "" : "travail", dossierStatus: statuses[n % statuses.length], paymentStatus: pay[n % 4], scoringBadge: badges[n % 4], scoringTotal: n % 6 === 0 ? null : (n * 7) % 100, evaluationScore: n % 6 === 0 ? 33 : null,
        evaluationDeliveryStatus: n % 8 === 0 ? "sent" : "draft", cvUrl: n % 3 === 0 ? "https://f.test/cv.pdf" : n % 11 === 0 ? "   " : null, createdAt: at(n % 9 === 0 ? 5 : n),
      } as never);
    }
    for (let n = 0; n < 12; n += 1) {
      await db.insert(s.agencyDossiers).values({ fullName: `Zl Agence ${n}`, email: mail(`ag${n}`), phone: "+33600000000", destination: n % 3 === 0 ? "" : "Canada", visaType: n % 4 === 0 ? "" : "etude", createdByAdmin: "t@t.test", status: (["en_cours", "documents_requis", "approuve", "soumis"] as const)[n % 4], createdAt: at(50 + n) } as never);
    }
    for (let n = 0; n < 15; n += 1) {
      await db.insert(s.candidates).values({
        fullName: `Zl Compte ${n}`, email: mail(`co${n}`), passwordHash: "x", phone: n % 2 ? "+3361" : null, destination: n % 3 === 0 ? null : "canada", visaType: n % 4 === 0 ? null : "etude",
        dossierStatus: (["nouveau", "evaluation", "documents", "traitement"] as const)[n % 4], evaluationDeclarationStatus: n % 5 === 0 ? "validated" : "not_declared", avatarVerificationStatus: (["missing", "pending", "verified", "rejected"] as const)[n % 4], avatarUrl: n % 4 === 2 ? "https://f.test/a.jpg" : null, createdAt: at(70 + n),
      } as never);
    }
    // un compte qui a aussi un dossier en ligne (ne doit PAS apparaître comme « compte sans dossier ») et un compte supprimé
    await db.insert(s.candidates).values({ fullName: "Zl Compte Lié", email: mail("on1"), passwordHash: "x", evaluationDeclarationStatus: "validated", createdAt: at(99), avatarVerificationStatus: "verified", avatarUrl: "https://f.test/lie.jpg" } as never);
    await db.insert(s.candidates).values({ fullName: "Zl Compte Supprimé", email: mail("del"), passwordHash: "x", createdAt: at(98), deletedAt: at(100) } as never);
    const [liee] = await db.select({ id: s.candidates.id }).from(s.candidates).where(like(s.candidates.email, mail("co2")));
    await db.insert(s.candidateFiles).values({ candidateId: liee.id, fileType: "cv", fileName: "cv.pdf", fileUrl: "https://f.test/cv.pdf", fileKey: `k${stamp}` } as never);
    const evaluationIds: number[] = [];
    for (const [name, cv] of [["on2", "https://f.test/e.pdf"], ["ag1", "https://f.test/e.pdf"], ["on4", ""]] as const) {
      const [row] = await db.insert(s.evaluations).values({ fullName: "Zl E", email: mail(name), phone: "+1", destinationCategory: "canada", visaType: "canada_travail", cvFileUrl: cv || null } as never).$returningId();
      evaluationIds.push(row.id);
    }
    // évaluations de personnes SANS compte ni dossier : doivent apparaître (une seule ligne par adresse, la plus récente)
    for (let n = 0; n < 5; n += 1) {
      const [row] = await db.insert(s.evaluations).values({ fullName: `Zl Invité ${n}`, email: mail(`gu${n}`), phone: "+2", destinationCategory: "canada", destinationCountry: n % 2 ? "Canada" : null, visaType: "canada_travail", projectType: n % 3 === 0 ? "travail" : null, status: (["pending", "reviewed", "contacted", "closed", "pending"] as const)[n], cvFileUrl: n % 2 === 0 ? "https://f.test/inv.pdf" : null, finalResponseSentAt: n === 1 ? new Date() : null, createdAt: new Date(base + n * 3_600_000) } as never).$returningId();
      evaluationIds.push(row.id);
    }
    // même adresse évaluée deux fois : seule la plus récente compte
    for (let n = 0; n < 2; n += 1) {
      const [row] = await db.insert(s.evaluations).values({ fullName: `Zl Invité Double ${n}`, email: mail("gudouble"), phone: "+2", destinationCategory: "autre", visaType: "autre", cvFileUrl: n === 1 ? "https://f.test/d.pdf" : null } as never).$returningId();
      evaluationIds.push(row.id);
    }
    // personne dont le compte a été supprimé : l'évaluation ne ressuscite pas la personne dans les listes
    const [gone] = await db.insert(s.evaluations).values({ fullName: "Zl Invité Supprimé", email: mail("del"), phone: "+2", destinationCategory: "autre", visaType: "autre" } as never).$returningId();
    evaluationIds.push(gone.id);
    await db.insert(s.evaluationValidationCases).values({ evaluationId: evaluationIds[0], publishedAt: at(1) } as never);
    await db.insert(s.evaluationValidationCases).values({ evaluationId: evaluationIds[1], publishedAt: at(1) } as never);
    // CV déposé à l'évaluation (table des documents) : doit compter comme « CV reçu »
    await db.insert(s.clientDocuments).values({ evaluationId: evaluationIds[2], candidateEmail: mail("on6"), documentType: "cv", documentName: "cv-eval.pdf", documentUrl: "https://f.test/cv-eval.pdf" } as never);
    for (let n = 0; n < 3; n += 1) await db.insert(s.clientDocuments).values({ evaluationId: evaluationIds[0], candidateEmail: n === 0 ? mail("on2").toLowerCase() : mail("on2"), documentType: "cv", documentName: `d${n}.pdf`, documentUrl: "https://f.test/x.pdf" } as never);
    ctx = { db, s, evaluationIds };
  });

  afterAll(async () => {
    if (!ctx) return;
    const { s, db, evaluationIds } = ctx;
    await db.delete(s.clientDocuments).where(inArray(s.clientDocuments.evaluationId, evaluationIds));
    await db.delete(s.evaluationValidationCases).where(inArray(s.evaluationValidationCases.evaluationId, evaluationIds));
    await db.delete(s.evaluations).where(inArray(s.evaluations.id, evaluationIds));
    await db.delete(s.candidateFiles).where(sql`${s.candidateFiles.fileKey} = ${`k${stamp}`}`);
    await db.delete(s.candidates).where(like(s.candidates.email, `zl${stamp}.%`));
    await db.delete(s.agencyDossiers).where(like(s.agencyDossiers.email, `zl${stamp}.%`));
    await db.delete(s.applications).where(or(like(s.applications.email, `zl${stamp}.%`)));
  });

  const base = { search: "", status: "all", paymentStatus: "all", scoreBand: "all", destination: "all", portraitStatus: "all", cvStatus: "all", evaluationStatus: "all", sortBy: "createdAt", sortDirection: "desc", page: 1, pageSize: 100 } as const;

  async function both(overrides: Record<string, unknown>) {
    const { loadCandidateRecords, filterCandidateRecords, resetCandidateRecordsShareForTests } = await import("./routers/adminCandidateManagement");
    const { queryCandidateList } = await import("./services/candidateListQuery");
    resetCandidateRecordsShareForTests();
    const filter = { ...base, search: `zl${stamp}`, ...overrides } as any;
    const all = await loadCandidateRecords();
    const scope = filterCandidateRecords(all, filter, { skipStatus: true });
    const expected = filterCandidateRecords(all, filter);
    const actual: any[] = [];
    let first: any;
    for (let page = 1; page <= 20; page += 1) {
      const result = await queryCandidateList(ctx.db, { ...filter, page });
      first ??= result;
      actual.push(...result.candidates);
      if (page >= result.totalPages) break;
    }
    return { filter, scope, expected, actual, first };
  }

  const key = (row: any) => row.id;
  const plain = (row: any) => JSON.parse(JSON.stringify(row));

  const cases: Array<[string, Record<string, unknown>]> = [
    ["sans filtre", {}], ["étape paiement", { status: "paiement" }], ["étape nouveau (inclut statuts vides)", { status: "nouveau" }], ["étape traitement", { status: "traitement" }], ["étape approuvé", { status: "approuve" }],
    ["statut brut", { status: "documents_recus" }], ["payé", { paymentStatus: "paye" }], ["en attente", { paymentStatus: "en_attente" }], ["non payé", { paymentStatus: "non_paye" }],
    ["bande excellent", { scoreBand: "excellent" }], ["bande faible", { scoreBand: "faible" }], ["destination", { destination: "Canada" }], ["destination par défaut", { destination: "non spécifiée" }],
    ["portrait vérifié", { portraitStatus: "verified" }], ["portrait manquant", { portraitStatus: "missing" }],
    ["CV à traiter", { cvStatus: "a_traiter" }], ["CV reçu", { cvStatus: "recu" }], ["sans CV", { cvStatus: "sans" }],
    ["recherche par nom accentué", { search: "éloïse" }], ["recherche par référence agence", { search: "3M-AGN-" }], ["recherche par référence compte", { search: "COMPTE-" }], ["recherche avec caractères spéciaux", { search: "100%_x" }],
    ["déjà évalués", { evaluationStatus: "evalue" }], ["non évalués", { evaluationStatus: "non_evalue" }], ["non évalués avec CV reçu", { evaluationStatus: "non_evalue", cvStatus: "recu" }], ["évalués et paiement", { evaluationStatus: "evalue", paymentStatus: "paye" }], ["non évalués par étape", { evaluationStatus: "non_evalue", status: "paiement" }],
    ["tri priorité (CV à traiter d'abord)", { sortBy: "priorite" }], ["priorité + non évalués", { sortBy: "priorite", evaluationStatus: "non_evalue" }],
    ["ordre de soumission", { sortBy: "soumission" }], ["ordre de soumission + non évalués", { sortBy: "soumission", evaluationStatus: "non_evalue" }], ["ordre de soumission + CV à traiter", { sortBy: "soumission", cvStatus: "a_traiter" }],
    ["tri par score croissant", { sortBy: "score", sortDirection: "asc" }], ["tri par nom", { sortBy: "fullName", sortDirection: "asc" }], ["tri par date croissante", { sortDirection: "asc" }],
    ["combinaison", { status: "documents", paymentStatus: "non_paye", cvStatus: "recu", sortBy: "score" }],
  ];

  for (const [label, overrides] of cases) {
    it(`identique à l'ancien calcul : ${label}`, async () => {
      const { scope, expected, actual, first, filter } = await both(overrides);
      expect(first.total).toBe(expected.length);
      expect(first.stats.scopeTotal).toBe(scope.length);
      expect(first.stats.paidCount).toBe(scope.filter((r: any) => r.paymentStatus === "paye").length);
      expect(first.stats.withoutDossierCount).toBe(scope.filter((r: any) => r.source === "compte").length);
      expect(first.stats.cvToProcessCount).toBe(scope.filter((r: any) => r.cvReceived && !r.bilanSent).length);
      expect(first.stats.cvReceivedCount).toBe(scope.filter((r: any) => r.cvReceived).length);
      expect(first.stats.evaluatedCount).toBe(scope.filter((r: any) => r.evaluated).length);
      expect(first.stats.notEvaluatedCount).toBe(scope.filter((r: any) => !r.evaluated).length);
      const stageCounts: Record<string, number> = {};
      for (const r of scope) stageCounts[r.stage] = (stageCounts[r.stage] ?? 0) + 1;
      for (const [stage, n] of Object.entries(first.stats.stageCounts)) expect(n).toBe(stageCounts[stage] ?? 0);
      // mêmes lignes, mêmes valeurs (dates comprises) ; l'ordre est contrôlé sur la clé de tri, les égalités pouvant se départager autrement
      expect(actual.map(key).sort()).toEqual(expected.map(key).sort());
      const byId = new Map(expected.map((r: any) => [r.id, r]));
      for (const row of actual) expect(plain(row)).toEqual(plain(byId.get(row.id)));
      if (filter.sortBy === "priorite") {
        // d'abord tous les dossiers « CV reçu, bilan à faire » (du plus ancien au plus récent), puis les autres (du plus récent au plus ancien)
        const todo = (r: any) => r.cvReceived && !r.evaluated;
        const firstOther = actual.findIndex((r: any) => !todo(r));
        const todoRows = firstOther === -1 ? actual : actual.slice(0, firstOther);
        const others = firstOther === -1 ? [] : actual.slice(firstOther);
        expect(todoRows.every(todo)).toBe(true);
        expect(others.some(todo)).toBe(false);
        const times = (rows: any[]) => rows.map((r) => new Date(r.createdAt).getTime());
        expect(times(todoRows)).toEqual([...times(todoRows)].sort((a, b) => a - b));
        expect(times(others)).toEqual([...times(others)].sort((a, b) => b - a));
        return;
      }
      if (filter.sortBy === "soumission") {
        // premier déposé, premier en tête : du plus ancien au plus récent, quel que soit le sens demandé
        const times = actual.map((r: any) => new Date(r.createdAt).getTime());
        expect(times).toEqual([...times].sort((a, b) => a - b));
        return;
      }
      const sortKey = (r: any) => (filter.sortBy === "score" ? r.scoringTotal : filter.sortBy === "fullName" ? r.fullName : new Date(r.createdAt).getTime());
      for (let i = 1; i < actual.length; i += 1) {
        const a = sortKey(actual[i - 1]), b = sortKey(actual[i]);
        const cmp = typeof a === "string" ? a.localeCompare(b as string, "fr") : (a as number) - (b as number);
        expect(filter.sortDirection === "asc" ? cmp <= 0 : cmp >= 0).toBe(true);
      }
    });
  }

  it("les effectifs des onglets ne changent pas quand on change de classement, et suivent la recherche", async () => {
    const { loadCandidateRecords, filterCandidateRecords, resetCandidateRecordsShareForTests } = await import("./routers/adminCandidateManagement");
    const { queryCandidateList } = await import("./services/candidateListQuery");
    resetCandidateRecordsShareForTests();
    const all = await loadCandidateRecords();
    const reference = filterCandidateRecords(all, { ...base, search: `zl${stamp}` } as any);
    const expected = { all: reference.length, cvToProcess: reference.filter((r: any) => r.cvReceived && !r.evaluated).length, cvReceived: reference.filter((r: any) => r.cvReceived).length, evaluated: reference.filter((r: any) => r.evaluated).length, notEvaluated: reference.filter((r: any) => !r.evaluated).length };
    expect(expected.evaluated).toBeGreaterThan(0);
    expect(expected.notEvaluated).toBeGreaterThan(0);
    for (const overrides of [{}, { evaluationStatus: "evalue" }, { evaluationStatus: "non_evalue" }, { cvStatus: "a_traiter" }, { cvStatus: "sans", evaluationStatus: "evalue" }]) {
      const result = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, ...overrides } as any);
      expect(result.tabCounts).toEqual(expected);
    }
  });

  it("un compte évalué hors ligne (validé par un conseiller) est « évalué » même sans bilan envoyé", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const result = await queryCandidateList(ctx.db, { ...base, search: mail("co0"), evaluationStatus: "evalue" } as any);
    expect(result.candidates.map((r) => r.email.toLowerCase())).toEqual([mail("co0").toLowerCase()]);
    expect(result.candidates[0].evaluated).toBe(true);
    expect(result.candidates[0].bilanSent).toBe(false);
  });

  it("les évaluations de personnes sans compte ni dossier apparaissent, une ligne par adresse, sans ressusciter un compte supprimé", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const result = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}.gu` } as any);
    const guests = result.candidates.filter((r) => r.source === "evaluation");
    expect(guests).toHaveLength(6); // gu0..gu4 + gudouble
    expect(guests.every((r) => r.id.startsWith("evaluation_"))).toBe(true);
    expect(result.stats.evaluationOnlyCount).toBe(6);
    expect(guests.filter((r) => r.email.includes("gudouble"))).toHaveLength(1);
    expect(guests.find((r) => r.email.includes("gudouble"))!.cvReceived).toBe(true); // la plus récente porte le CV
    const gone = await queryCandidateList(ctx.db, { ...base, search: mail("del") } as any);
    expect(gone.candidates.filter((r) => r.source === "evaluation")).toHaveLength(0);
    // CV reçu et non évalué : à traiter ; réponse finale envoyée : évalué
    expect(guests.find((r) => r.email.includes(".gu0@"))).toMatchObject({ cvReceived: true, evaluated: false });
    expect(guests.find((r) => r.email.includes(".gu1@"))).toMatchObject({ evaluated: true });
  });

  it("page demandée au-delà de la dernière : ramenée à la dernière page, avec le bon nombre de lignes", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const result = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, pageSize: 10, page: 99 } as any);
    expect(result.page).toBe(result.totalPages);
    expect(result.candidates.length).toBe(result.total - (result.totalPages - 1) * 10);
  });

  it("pages successives : aucune ligne répétée ni manquante", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const seen: string[] = [];
    const first = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, pageSize: 10, page: 1 } as any);
    for (let page = 1; page <= first.totalPages; page += 1) seen.push(...(await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, pageSize: 10, page } as any)).candidates.map((r) => r.id));
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBe(first.total);
  });

  it("un compte lié à un dossier en ligne ou supprimé n'apparaît pas comme « compte sans dossier »", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const result = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}` } as any);
    const accounts = result.candidates.filter((r) => r.source === "compte");
    expect(accounts).toHaveLength(15);
    expect(accounts.some((r) => /Lié|Supprimé/.test(r.fullName))).toBe(false);
  });

  it("l'export (une page de 10 000 lignes) renvoie toutes les lignes du filtre", async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const small = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, pageSize: 10 } as any);
    const big = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}`, pageSize: 10000 } as any);
    expect(big.candidates).toHaveLength(small.total);
    expect(big.totalPages).toBe(1);
  });

  it("une table du parcours de validation absente n'empêche pas la liste de s'afficher", async () => {
    const { queryCandidateList, resetCandidateListQueryForTests } = await import("./services/candidateListQuery");
    resetCandidateListQueryForTests();
    await ctx.db.execute(sql.raw("RENAME TABLE evaluation_validation_cases TO evaluation_validation_cases_hidden"));
    try {
      const result = await queryCandidateList(ctx.db, { ...base, search: `zl${stamp}` } as any);
      expect(result.total).toBeGreaterThan(50);
      expect(result.candidates.every((r) => r.bilanSent === (r.source === "web" && false) || typeof r.bilanSent === "boolean")).toBe(true);
    } finally {
      await ctx.db.execute(sql.raw("RENAME TABLE evaluation_validation_cases_hidden TO evaluation_validation_cases"));
      resetCandidateListQueryForTests();
    }
  });
});
