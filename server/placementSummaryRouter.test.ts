import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<unknown, any[]>(),
  updates: [] as Array<{ table: unknown; values: any }>,
  stored: [] as Array<{ key: string; bytes: Buffer }>,
  fetches: [] as string[],
  portraitBytes: Buffer.alloc(0),
  cvOutcome: undefined as any,
  cvCalls: 0,
}));

vi.mock("./db", () => ({
  getDb: async () => {
    const chain = (rows: any[]) => {
      const c: any = {
        where: () => c, limit: () => c, orderBy: () => c, innerJoin: () => c,
        then: (resolve: (value: any[]) => unknown) => resolve(rows),
      };
      return c;
    };
    return {
      // La requête « photo » sélectionne une clé de fichier : elle ne renvoie que les photos (les clauses where ne sont pas évaluées ici).
      select: (fields?: Record<string, unknown>) => ({ from: (table: unknown) => { const rows = state.rows.get(table) ?? []; return chain(table === candidateFiles && fields && "key" in fields ? rows.filter((row) => row.type === "photo") : rows); } }),
      update: (table: unknown) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); } }) }),
      insert: () => ({ values: async () => undefined }),
    };
  },
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ id: 1, email: "agent@3mtravelagency.com" }) }));
vi.mock("./routers/candidate", async (importOriginal) => ({ ...(await importOriginal<object>()), verifyCandidateToken: () => 5 }));
vi.mock("./storage", () => ({
  storagePut: async (key: string, bytes: Buffer) => { state.stored.push({ key, bytes }); return { key, url: `https://files.example/${key}` }; },
  storageGetSignedUrl: async (key: string) => `https://signed.example/${key}`,
  storageGet: async (key: string) => ({ key, url: `https://files.example/${key}` }),
}));
vi.mock("./services/cvDraftGenerator", () => ({
  generateCvDraft: async () => { state.cvCalls += 1; return state.cvOutcome; },
}));

import { agencyDossierDocuments, candidateFiles, candidatePlacementConsents, candidates, evaluations, placementCandidateProfiles, placementProfileSubmissions } from "../drizzle/schema";
import { placementPortalRouter } from "./routers/placementPortal";
import { buildPlacementSummaryDraft, fingerprintPlacementSources } from "./services/placementProfileSummary";

function crc32(buf: Buffer) {
  let c = ~0;
  for (const byte of buf) { c ^= byte; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; }
  return ~c >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png() {
  const w = 16, h = 20;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const token = "t".repeat(32);
const caller = () => placementPortalRouter.createCaller({ req: { headers: {} }, res: {} } as any);
const profileRow = { id: 3, candidateId: 5, profileCode: "PRF-AB12CD34", targetDestination: "Canada", targetProcedure: "Travail", sector: "Logistique", yearsExperience: "6 ans", languagesSummary: "Français", summary: "Profil logistique solide.", summaryDraft: null, summaryFingerprint: null, summaryStatus: "draft", summaryPdfKey: null, archivedAt: null, updatedAt: new Date() };
const candidateRow = { id: 5, fullName: "Aïcha Nkolo Mballa", email: "aicha@example.com" };
const files = [{ id: 40, type: "cv", name: "cv.pdf", status: "verified", comment: null, key: "photos/40.png" }];

const defaultDocs = [{ ...files[0], id: 41, type: "photo" }, ...files];

function fingerprintFor(photoConsent: boolean, photoId: number | null) {
  const base = buildPlacementSummaryDraft({ fullName: candidateRow.fullName, destination: "Canada", procedure: "Travail", sector: "Logistique", yearsExperience: "6 ans", languages: "Français", profileSummary: "Profil logistique solide.", documents: defaultDocs });
  return fingerprintPlacementSources({ draft: base, fullName: candidateRow.fullName, photoConsent, photoId });
}

function seed(options: { photoConsent?: boolean; pdfConsent?: boolean; photoFile?: boolean; profile?: Partial<typeof profileRow> } = {}) {
  state.rows = new Map<unknown, any[]>([
    [placementCandidateProfiles, [{ ...profileRow, ...options.profile }]],
    [candidates, [candidateRow]],
    [candidatePlacementConsents, [{ id: 9, candidateId: 5, status: "granted", pdfShareConsent: options.pdfConsent === false ? 0 : 1, photoShareConsent: options.photoConsent ? 1 : 0 }]],
    [candidateFiles, options.photoFile === false ? files.map((file) => ({ ...file, type: "cv", id: 40 })) : [{ ...files[0], id: 41, type: "photo" }, ...files]],
    [agencyDossierDocuments, []],
    [placementProfileSubmissions, []],
    [evaluations, []],
  ]);
}

beforeEach(() => {
  state.updates = [];
  state.stored = [];
  state.fetches = [];
  state.cvCalls = 0;
  state.portraitBytes = png();
  state.cvOutcome = undefined;
  seed();
  vi.stubGlobal("fetch", async (url: string) => { state.fetches.push(String(url)); return { ok: true, arrayBuffer: async () => state.portraitBytes.buffer.slice(state.portraitBytes.byteOffset, state.portraitBytes.byteOffset + state.portraitBytes.byteLength) }; });
});

const pdfOf = (dataUrl: string) => Buffer.from(dataUrl.split(",")[1], "base64").toString("latin1");

describe("fiche de synthèse : aperçu administrateur et portrait", () => {
  it("sans accord photo : la photo n'est même pas lue, le PDF part sans portrait", async () => {
    seed({ photoConsent: false });
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(state.fetches).toEqual([]);
    expect(result.photoShareConsent).toBe(false);
    expect(result.portraitIncluded).toBe(false);
    expect(pdfOf(result.previewPdfDataUrl)).not.toContain("/Subtype /Image");
  });

  it("avec l'accord photo et une photo exploitable : portrait incrusté dans l'aperçu", async () => {
    seed({ photoConsent: true });
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(state.fetches).toHaveLength(1);
    expect(result.portraitIncluded).toBe(true);
    expect(pdfOf(result.previewPdfDataUrl)).toContain("/Subtype /Image");
  });

  it("accord photo mais aucune photo au dossier : fiche complète sans portrait, signalé à l'administrateur", async () => {
    seed({ photoConsent: true, photoFile: false });
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ photoShareConsent: true, portraitAvailable: false, portraitIncluded: false });
  });

  it("une photo qui n'est pas une image (fichier déguisé) n'est jamais incrustée", async () => {
    seed({ photoConsent: true });
    state.portraitBytes = Buffer.from("<html>pas une image</html>");
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ portraitAvailable: true, portraitIncluded: false });
  });

  it("identité externe : prénom + initiale, jamais le nom complet ni l'e-mail", async () => {
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(result.draft.identity).toBe("Aïcha N.");
    expect(JSON.stringify(result.draft)).not.toContain("Mballa");
    expect(JSON.stringify(result.draft)).not.toContain("aicha@example.com");
  });

  it("l'aperçu avec corrections en cours n'enregistre rien", async () => {
    seed({ photoConsent: true });
    const draft = JSON.stringify({ destination: "Canada", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français", profileSummary: "Résumé corrigé par l’administrateur.", highlights: ["Point clé"] });
    const result = await caller().adminPreviewCandidateSummary({ sessionToken: token, candidateId: 5, draft });
    expect(result.portraitIncluded).toBe(true);
    expect(pdfOf(result.previewPdfDataUrl)).toContain("Point cl");
    expect(state.updates).toEqual([]);
    expect(state.stored).toEqual([]);
  });
});

describe("fiche de synthèse : validation", () => {
  const draft = JSON.stringify({ destination: "Canada", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français, Anglais", profileSummary: "Contact aicha@example.com. Gestionnaire logistique expérimentée.", headline: "Gestionnaire logistique", highlights: ["Gestionnaire — TRANSCAM SA"], identity: "Aïcha Nkolo Mballa" });

  it("valider : PDF figé et stocké, brouillon nettoyé enregistré avec l'empreinte du dossier, identité forcée", async () => {
    seed({ photoConsent: true });
    const result = await caller().adminReviewCandidateSummary({ sessionToken: token, profileId: 3, action: "approve", draft, note: "OK" });
    expect(result).toMatchObject({ status: "approved", portraitIncluded: true });
    expect(state.stored).toHaveLength(1);
    expect(state.stored[0].key).toBe("placement-summaries/PRF-AB12CD34.pdf");
    expect(state.stored[0].bytes.toString("latin1")).toContain("/Subtype /Image");
    const update = state.updates.find((entry) => entry.table === placementCandidateProfiles)!.values;
    expect(update.summaryStatus).toBe("approved");
    expect(update.summaryFingerprint).toBe(fingerprintFor(true, 41));
    expect(update.summaryDraft).not.toContain("aicha@example.com");
    expect(update.summaryDraft).not.toContain("Mballa");
    expect(JSON.parse(update.summaryDraft).identity).toBe("Aïcha N.");
  });

  it("valider sans accord photo : le PDF diffusé ne contient pas de portrait", async () => {
    seed({ photoConsent: false });
    const result = await caller().adminReviewCandidateSummary({ sessionToken: token, profileId: 3, action: "approve", draft });
    expect(result.portraitIncluded).toBe(false);
    expect(state.stored[0].bytes.toString("latin1")).not.toContain("/Subtype /Image");
  });

  it("brouillon invalide : refusé avec un message clair, rien n'est stocké", async () => {
    const bad = JSON.stringify({ destination: "Canada", procedure: "Travail", sector: "x", experience: "x", languages: "x", profileSummary: "court court court court court court court court" .slice(0, 5), highlights: [] });
    await expect(caller().adminReviewCandidateSummary({ sessionToken: token, profileId: 3, action: "approve", draft: bad.padEnd(60, " ") })).rejects.toThrow(/incomplète ou invalide/);
    expect(state.stored).toEqual([]);
    expect(state.updates).toEqual([]);
  });

  it("refuser : statut « refusée », aucun PDF", async () => {
    await caller().adminReviewCandidateSummary({ sessionToken: token, profileId: 3, action: "reject", draft, note: "Résumé à reprendre" });
    expect(state.stored).toEqual([]);
    expect(state.updates.find((entry) => entry.table === placementCandidateProfiles)!.values).toMatchObject({ summaryStatus: "rejected", summaryReviewNote: "Résumé à reprendre", summaryValidatedAt: null });
  });
});

describe("fiche de synthèse : revalidation", () => {
  it("fiche validée dont le dossier a changé depuis : repasse « à revalider » (plus diffusée)", async () => {
    seed({ profile: { summaryStatus: "approved", summaryFingerprint: "ancienne-empreinte", summaryDraft: JSON.stringify({ destination: "Belgique", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français", profileSummary: "Texte relu par l’administrateur.", highlights: ["Point conservé"] }) } });
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(result.status).toBe("needs_revalidation");
    expect(result.draft.profileSummary).toBe("Texte relu par l’administrateur."); // le texte relu est conservé
    expect(result.draft.highlights).toEqual(["Point conservé"]);
    expect(result.draft.destination).toBe("Canada"); // les faits repartent du dossier
    expect(state.updates.find((entry) => entry.table === placementCandidateProfiles)!.values.summaryStatus).toBe("needs_revalidation");
  });

  it("fiche validée dont le dossier n'a pas changé : reste validée, le brouillon relu est conservé et rien n'est réécrit", async () => {
    seed({ profile: { summaryStatus: "approved", summaryFingerprint: fingerprintFor(false, null), summaryDraft: JSON.stringify({ destination: "Canada", procedure: "Travail", sector: "Logistique", experience: "6 ans", languages: "Français", profileSummary: "Texte relu par l’administrateur.", headline: "Gestionnaire" }) } });
    const result = await caller().adminGetCandidateSummary({ sessionToken: token, candidateId: 5 });
    expect(result.status).toBe("approved");
    expect(result.draft.headline).toBe("Gestionnaire");
    expect(state.updates).toEqual([]);
  });

  it("le candidat retire (ou accorde) l'accord photo : toute fiche validée doit être revalidée", async () => {
    seed({ photoConsent: true });
    await caller().setMySummaryConsents({ candidateToken: "c".repeat(30), pdfShareConsent: true, photoShareConsent: false });
    const profileUpdate = state.updates.find((entry) => entry.table === placementCandidateProfiles);
    expect(profileUpdate?.values).toMatchObject({ summaryStatus: "needs_revalidation" });
  });

  it("l'accord photo ne change pas : aucune fiche n'est retirée de la diffusion", async () => {
    seed({ photoConsent: true });
    await caller().setMySummaryConsents({ candidateToken: "c".repeat(30), pdfShareConsent: false, photoShareConsent: true });
    expect(state.updates.some((entry) => entry.table === placementCandidateProfiles)).toBe(false);
  });
});

describe("fiche de synthèse : résumé depuis le CV", () => {
  const cvDraft = { headline: "Gestionnaire logistique", summary: "Gestionnaire logistique avec six années d’expérience.", experiences: [{ role: "Gestionnaire logistique", employer: "TRANSCAM SA", location: null, start: "2019", end: "2024", bullets: [] }], education: [], skills: ["Excel"], languages: [{ language: "Français", level: "natif" }], certifications: [], missing: ["Niveau d’anglais non précisé"] };

  it("sans évaluation rattachée au candidat : message clair, le modèle n'est pas appelé", async () => {
    const result = await caller().adminGenerateSummaryFromCv({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ ok: false, reason: "no_evaluation" });
    expect(state.cvCalls).toBe(0);
  });

  it("avec un CV exploitable : champs proposés + éléments non retrouvés et informations manquantes signalés ; rien n'est enregistré", async () => {
    state.rows.set(evaluations, [{ id: 77, candidateId: 5, email: "aicha@example.com" }]);
    state.cvOutcome = { ok: true, draft: cvDraft, unverified: ["Employeur « TRANSCAM SA » non retrouvé dans le CV"], model: "test", excerpt: { chars: 400, truncated: false, masked: 0 } };
    const result = await caller().adminGenerateSummaryFromCv({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ ok: true, unverified: ["Employeur « TRANSCAM SA » non retrouvé dans le CV"], missing: ["Niveau d’anglais non précisé"] });
    if (result.ok === true) {
      expect(result.fields.headline).toBe("Gestionnaire logistique");
      expect(result.fields.highlights?.[0]).toContain("TRANSCAM SA");
      expect(result.fields.languages).toBe("Français (natif)");
    }
    expect(state.updates).toEqual([]);
  });

  it("sans l'accord du candidat à la lecture de son CV : refus relayé tel quel", async () => {
    state.rows.set(evaluations, [{ id: 77, candidateId: 5, email: "aicha@example.com" }]);
    state.cvOutcome = { ok: false, reason: "no_cv_consent", error: "Le candidat n’a pas donné son accord distinct à la lecture de son CV par l’IA." };
    const result = await caller().adminGenerateSummaryFromCv({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ ok: false, reason: "no_cv_consent" });
    expect(state.updates).toEqual([]);
  });
});

describe("fiche de synthèse : téléchargement partenaire (garde-fous du code)", () => {
  const source = readFileSync(resolve(process.cwd(), "server/routers/placementPortal.ts"), "utf8").replace(/\r/g, "");
  const download = source.slice(source.indexOf("employerDownloadProfileSummary"), source.indexOf("employerSubmissionHistory"));

  it("exige une fiche validée, un accord de partage actif, un fichier figé et une soumission non retirée", () => {
    expect(download).toContain('row.profile.summaryStatus !== "approved"');
    expect(download).toContain('row.consent.status !== "granted"');
    expect(download).toContain("!row.consent.pdfShareConsent");
    expect(download).toContain("!row.profile.summaryPdfKey");
    expect(download).toContain('row.submission.status === "withdrawn"');
  });

  it("le téléchargement est tracé sans contenu de la fiche", () => {
    expect(download).toContain('logger.info("[placementSummary] fiche téléchargée par un partenaire"');
    expect(download).not.toContain("summaryDraft");
  });
});
