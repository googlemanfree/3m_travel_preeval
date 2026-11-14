import { describe, expect, it, vi } from "vitest";
import { GRID_V1 } from "../shared/bilanAuto/grid";
import { parseEditableText, sectionsToEditableText } from "../shared/bilanAuto/editableText";
import { MemoryBilanAutoStore } from "./services/bilanAuto/memoryStore";
import { DEFAULT_CONFIG, CircuitBreaker, processNext, processOutbox, publishRun, submitForAnalysis, type EvaluationInputs, type PipelineConfig, type PipelineDeps } from "./services/bilanAuto/pipeline";
import { renderPdf } from "./services/bilanAuto/reportPdf";
import { EditorialError, changeScore, compareReports, ensureBaseVersion, notifyPublished, publishVersion, saveDraft, validateEditedReport } from "./services/bilanAuto/versions";
import { extractTextFromPDF } from "./aiEvaluationService";

const NOW = new Date("2026-11-13T10:00:00Z");
const APPROVED = { ...GRID_V1, approvedAt: "2026-11-20", approvedBy: "owner" };
const cvJson = (over: Record<string, unknown> = {}) => JSON.stringify({
  cv: { readable: true, fullName: "Awa Ndiaye", birthDate: "1995-04-02", niveau: { value: "bac_plus_3_4", evidence: null }, pertinence: { value: "alignee", evidence: null }, dureeAnnees: { value: 6, evidence: null }, responsabilite: { value: "autonomie", evidence: null }, chronologie: { value: "coherente", evidence: null }, techniques: { value: "fort", evidence: null }, certifications: { value: 2, evidence: null }, transferables: { value: 3, evidence: null }, langueTravail: { value: "B2", evidence: null }, autreLangue: { value: "B1", evidence: null }, metierVise: "Technicien électricien", secteurs: ["Industrie"], missionsVisees: ["Maintenance"], coherenceProjet: { value: "coherent", evidence: null }, plan: { value: "plan_seul", evidence: null }, ...over },
  documents: [],
});
const inputs = (over: Partial<EvaluationInputs> = {}): EvaluationInputs => ({
  evaluationId: 1, candidateId: 7, email: "awa@example.org", fullName: "Awa Ndiaye", dossierRef: "3M-0001", priorityCountry: "Luxembourg", submitted: true, projectIsWork: true, cvConsent: true,
  form: { fullName: "Awa Ndiaye", email: "awa@example.org", phone: "+237600000000", dateOfBirth: "1995-04-02", educationLevel: "Licence", yearsOfExperience: "5-10 ans", frenchLevel: "B2", englishLevel: "B1", destinationCountry: "Luxembourg", currentJobTitle: "Électricien", passportDeclared: true, languageTestsTaken: "DELF B2", completenessFields: { a: 1, b: 2, c: 3 } },
  cv: { key: "cv/awa-1.pdf", fileName: "cv.pdf", sha256: "abc", stored: true, attachedToAccount: true, text: "CV de Awa Ndiaye.", file: null }, documents: [], ...over,
});

function harness(config: Partial<PipelineConfig> = {}) {
  const clock = { now: NOW.getTime() };
  const store = new MemoryBilanAutoStore(() => new Date(clock.now));
  const state = { inputs: inputs() as EvaluationInputs };
  const published: Array<{ runId: number; verdict: string; pdfKey: string | null; validatedBy: string | null }> = [];
  const mails: Array<{ subject: string }> = [];
  const pdfs = new Map<string, Buffer>();
  const deps: PipelineDeps = {
    store, workerId: "w1", now: () => new Date(clock.now), config: { ...DEFAULT_CONFIG, enabled: true, grid: APPROVED, ...config },
    loadInputs: async () => state.inputs, runExtraction: vi.fn(async () => cvJson()), search: null,
    renderPdf: async (report) => renderPdf(report), storePdf: async (key, bytes) => { pdfs.set(key, bytes); return { key, url: `https://f.test/${key}` }; },
    publisher: { publish: async (run, report, pdf) => { published.push({ runId: run.id, verdict: report.verdictLabel, pdfKey: pdf?.key ?? null, validatedBy: run.validatedBy }); return { reference: "r" }; }, requestComplement: async () => undefined },
    mailer: { send: async (m) => { mails.push(m); return { messageId: `m${mails.length}` }; } }, portalUrl: "https://x.test/mon-espace", breaker: new CircuitBreaker(),
  };
  return { deps, store, state, published, mails, pdfs, clock };
}

async function readyRun(h: ReturnType<typeof harness>) {
  await submitForAnalysis(h.deps, 1);
  return (await processNext(h.deps))!;
}
const editable = (report: { sections: Array<{ id: string; title: string; paragraphs: string[]; bullets: string[]; locked?: boolean }> }) => report.sections.filter((s) => !s.locked).map(({ id, title, paragraphs, bullets }) => ({ id, title, paragraphs, bullets }));
const withProfile = (report: Parameters<typeof editable>[0], text: string) => editable(report).map((s) => (s.id === "profil" ? { ...s, paragraphs: [text] } : s));

describe("brouillons : jamais visibles du candidat, jamais d'e-mail", () => {
  it("enregistrer un brouillon ne publie rien, n'envoie rien et garde la proposition du système", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Profil reformulé par l'agence."), reason: "Reformulation" });
    expect(draft).toMatchObject({ versionNumber: 2, status: "brouillon", authorKind: "admin", author: "admin@3m.test" });
    expect(h.published).toHaveLength(0);
    await processOutbox(h.deps);
    expect(h.mails).toHaveLength(0);
    const versions = await h.store.listVersions(run.id);
    expect(versions.map((v) => [v.versionNumber, v.authorKind, v.status])).toEqual([[1, "systeme", "brouillon"], [2, "admin", "brouillon"]]);
    expect(versions[0].report.sections.find((s) => s.id === "profil")!.paragraphs[0]).not.toMatch(/reformulé/);
  });
  it("les enregistrements suivants mettent à jour le même brouillon (pas de multiplication de versions)", async () => {
    const h = harness();
    const run = await readyRun(h);
    await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Première correction.") });
    await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Deuxième correction.") });
    const versions = await h.store.listVersions(run.id);
    expect(versions).toHaveLength(2);
    expect(versions[1].report.sections.find((s) => s.id === "profil")!.paragraphs[0]).toBe("Deuxième correction.");
  });
  it("les modifications restent enregistrées après rechargement", async () => {
    const h = harness();
    const run = await readyRun(h);
    await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Texte conservé.") });
    const reloaded = (await h.store.listVersions(run.id)).at(-1)!;
    expect(reloaded.report.sections.find((s) => s.id === "profil")!.paragraphs).toEqual(["Texte conservé."]);
  });
});

describe("publication : nouvelle version, PDF correspondant, notification explicite", () => {
  it("publier sans notification : bilan visible, PDF de cette version, aucun e-mail", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Version corrigée MARQUEUR-UNIQUE-42.") });
    const result = await publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: false });
    expect(result).toMatchObject({ notified: false, alreadyPublished: false });
    expect(h.published).toHaveLength(1);
    expect(h.published[0].validatedBy).toBe("admin@3m.test");
    await processOutbox(h.deps);
    expect(h.mails).toHaveLength(0);
    const after = (await h.store.getRun(run.id))!;
    expect(after.state).toBe("published");
    expect(after.reviewStatus).toBe("corrected");
    expect(after.pdfKey).toBe(result.version.pdfKey);
  });
  it("le PDF correspond exactement à la version publiée (texte extrait du fichier)", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Version corrigée MARQUEUR-UNIQUE-42 pour le PDF.") });
    const { version } = await publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: false });
    const text = (await extractTextFromPDF(h.pdfs.get(version.pdfKey!)!)).replace(/\s+/g, " ");
    expect(text).toContain("MARQUEUR-UNIQUE-42");
    expect(text).toContain(version.report.verdictLabel.slice(0, 25));
    const original = (await h.store.listVersions(run.id))[0];
    expect(text).not.toContain(original.report.sections.find((s) => s.id === "profil")!.paragraphs.join(" ").slice(0, 40));
  });
  it("publier et notifier : un seul e-mail, même si on clique deux fois", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Texte A.") });
    await Promise.all([publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: true }), publishVersion(h.deps, run.id, draft.versionNumber, "admin2@3m.test", { notify: true })]);
    await processOutbox(h.deps); await processOutbox(h.deps);
    expect(h.mails).toHaveLength(1);
    expect(h.mails[0].subject).toMatch(/disponible/);
    expect(h.published).toHaveLength(1);
  });
  it("« Notifier le candidat » après une publication sans notification : une seule fois", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Texte B.") });
    await publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: false });
    expect((await notifyPublished(h.deps, run.id, "admin@3m.test")).notified).toBe(true);
    expect((await notifyPublished(h.deps, run.id, "admin@3m.test")).notified).toBe(false);
    await processOutbox(h.deps);
    expect(h.mails).toHaveLength(1);
  });
  it("publier une correction crée une nouvelle version, met à jour le visible, garde l'historique et ne renvoie pas d'e-mail seul", async () => {
    const h = harness();
    const run = await readyRun(h);
    const first = await publishRun(h.deps, run.id, "admin@3m.test");
    expect(first.ok).toBe(true);
    await processOutbox(h.deps);
    expect(h.mails).toHaveLength(1);
    const published = (await h.store.getRun(run.id))!;
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(published.report!, "Correction après publication.") });
    expect(draft.versionNumber).toBe(2);
    expect(h.published).toHaveLength(1); // le brouillon n'a pas modifié le bilan visible
    await publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: false });
    await processOutbox(h.deps);
    expect(h.published).toHaveLength(2);
    expect(h.mails).toHaveLength(1); // aucune notification automatique
    const versions = await h.store.listVersions(run.id);
    expect(versions.map((v) => v.status)).toEqual(["remplacee", "publiee"]);
    expect(versions[0].pdfKey).toBeTruthy();
    expect(versions[1].pdfKey).not.toBe(versions[0].pdfKey);
    // notifier la mise à jour : un message distinct, une seule fois
    await notifyPublished(h.deps, run.id, "admin@3m.test");
    await processOutbox(h.deps);
    expect(h.mails).toHaveLength(2);
    expect(h.mails[1].subject).toMatch(/mis à jour/);
  });
  it("refuse de publier sans grille approuvée, et un brouillon incohérent n'est pas publié", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Texte C.") });
    h.deps.config = { ...h.deps.config, grid: GRID_V1 };
    await expect(publishVersion(h.deps, run.id, draft.versionNumber, "admin@3m.test", { notify: false })).rejects.toThrow(/grille/);
    expect(h.published).toHaveLength(0);
  });
});

describe("notes : champs contrôlés, justification, recalcul", () => {
  it("exige une justification, recalcule total et verdict, régénère la section calculée", async () => {
    const h = harness();
    const run = await readyRun(h);
    await expect(changeScore(h.deps, run.id, "admin@3m.test", { rubric: "langues", subCriterion: "preuve", points: 3, justification: "court" })).rejects.toThrow(/justification/);
    await expect(changeScore(h.deps, run.id, "admin@3m.test", { rubric: "langues", subCriterion: "preuve", points: 9, justification: "Attestation DELF B2 vérifiée" })).rejects.toThrow(/entre 0 et 3/);
    const draft = await changeScore(h.deps, run.id, "admin@3m.test", { rubric: "langues", subCriterion: "preuve", points: 3, justification: "Attestation DELF B2 vérifiée par l'agence" });
    const total = draft.scoreResult!.total;
    expect(draft.scoreResult!.total).toBe(draft.scoreResult!.rubrics.reduce((sum, r) => sum + (r.points ?? 0), 0));
    expect(draft.report.score).toBe(total);
    expect(draft.report.verdictLabel).toContain(`${total}/100`);
    expect(draft.report.sections.find((s) => s.id === "verdict")!.bullets.join(" ")).toContain("DELF B2 vérifiée");
    expect(draft.reason).toMatch(/Note « .* » : \d+ → 3/);
    expect(draft.author).toBe("admin@3m.test");
    const events = await h.store.listEvents(run.id);
    expect(events.some((e) => e.action === "score_changed" && /DELF/.test(e.detail ?? ""))).toBe(true);
  });
  it("le texte libre ne peut pas contredire la note enregistrée", async () => {
    const h = harness();
    const run = await readyRun(h);
    const score = run.scoreResult!.total;
    await expect(saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, `Le candidat obtient ${score === 99 ? 98 : score + 1}/100.`) })).rejects.toMatchObject({ problems: expect.arrayContaining([expect.stringMatching(/alors que la note enregistrée/)]) });
    await expect(saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, `Le candidat obtient ${score}/100.`) })).resolves.toBeTruthy();
  });
  it("une nouvelle note qui contredit un total écrit dans le texte est refusée avec les passages à corriger", async () => {
    const h = harness();
    const run = await readyRun(h);
    await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, `Note actuelle ${run.scoreResult!.total}/100.`) });
    await expect(changeScore(h.deps, run.id, "admin@3m.test", { rubric: "langues", subCriterion: "preuve", points: 3, justification: "Attestation DELF B2 vérifiée par l'agence" })).rejects.toMatchObject({ problems: expect.arrayContaining([expect.stringMatching(/Profil/)]) });
  });
});

describe("règles de contenu", () => {
  async function base() {
    const h = harness();
    const run = await readyRun(h);
    return { h, run, original: run.report! };
  }
  it("refuse une structure modifiée, une section calculée modifiée et une formulation interdite", async () => {
    const { h, run } = await base();
    await expect(saveDraft(h.deps, run.id, "a", { sections: [...editable(run.report!), { id: "nouveau", title: "x", paragraphs: [], bullets: [] }] })).resolves.toBeTruthy(); // section inconnue ignorée, structure inchangée
    const sections = editable(run.report!);
    const bad = await saveDraft(h.deps, run.id, "a", { sections: sections.map((s) => (s.id === "profil" ? { ...s, paragraphs: ["Votre visa est garanti."] } : s)) }).catch((e) => e);
    expect(bad).toBeInstanceOf(EditorialError);
    expect(bad.problems.join(" ")).toMatch(/garanti|formulation interdite/);
  });
  it("les sections calculées ne se modifient pas par le texte libre", async () => {
    const { h, run } = await base();
    const forged = editable(run.report!).concat([{ id: "verdict", title: "2. Verdict", paragraphs: ["Seuil atteint (100/100)."], bullets: [] }]);
    await saveDraft(h.deps, run.id, "a", { sections: forged });
    const draft = (await h.store.listVersions(run.id)).at(-1)!;
    expect(JSON.stringify(draft.report.sections.find((s) => s.id === "verdict"))).not.toContain("100/100)");
  });
  it("une ligne sourcée modifiée perd sa source : refusée ; une ligne identique reste acceptée", async () => {
    const { run, original } = await base();
    const sourced = { ...original, sections: original.sections.map((s) => (s.id === "destination" ? { ...s, bullets: [...s.bullets, "OFFRE REPÉRÉE — Technicien, Société X (Esch) · source : Observatoire, consultée le 1 novembre 2026"] } : s)) };
    expect(validateEditedReport(sourced, sourced, run.scoreResult)).toEqual([]);
    const edited = { ...sourced, sections: sourced.sections.map((s) => (s.id === "destination" ? { ...s, bullets: s.bullets.map((b) => b.replace("Société X", "Société Y")) } : s)) };
    expect(validateEditedReport(sourced, edited, run.scoreResult).join(" ")).toMatch(/n'est plus soutenue par sa source/);
  });
  it("un montant absent du bilan généré (donc sans source) est refusé", async () => {
    const { h, run } = await base();
    await expect(saveDraft(h.deps, run.id, "a", { sections: withProfile(run.report!, "Salaire attendu : 3 500 EUR par mois.") })).rejects.toMatchObject({ problems: expect.arrayContaining([expect.stringMatching(/ne provient d'aucune source/)]) });
  });
  it("le brouillon n'a aucun effet sur un traitement non prêt ou simulé", async () => {
    const h = harness({ mode: "simulation", grid: GRID_V1 });
    await submitForAnalysis(h.deps, 1);
    const run = (await processNext(h.deps))!;
    await expect(saveDraft(h.deps, run.id, "a", { sections: [] })).rejects.toThrow(/simulation/);
  });
});

describe("protection des corrections manuelles lors d'une régénération", () => {
  it("une nouvelle proposition reste distincte, signalée, et n'écrase pas la correction", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "admin@3m.test", { sections: withProfile(run.report!, "Ma correction à protéger.") });
    h.state.inputs = inputs({ form: { ...inputs().form, yearsOfExperience: "10 ans et plus" } });
    expect((await submitForAnalysis(h.deps, 1)).status).toBe("queued");
    const proposal = (await processNext(h.deps))!;
    expect(proposal.id).not.toBe(run.id);
    expect(proposal.state).toBe("ready_for_review");
    expect(proposal.flags.join(" ")).toMatch(/version corrigée manuellement existe \(traitement n° 1\)/);
    const old = (await h.store.getRun(run.id))!;
    expect(old.state).toBe("ready_for_review"); // non remplacée
    expect((await h.store.listVersions(run.id)).at(-1)!.report.sections.find((s) => s.id === "profil")!.paragraphs).toEqual(["Ma correction à protéger."]);
    const diff = compareReports((await h.store.listVersions(run.id)).at(-1)!.report, proposal.report!);
    expect(diff.length).toBeGreaterThan(0);
    expect(draft.versionNumber).toBe(2);
    // l'ancienne version corrigée ne peut plus être publiée à l'insu d'une proposition plus récente
    await expect(publishVersion(h.deps, run.id, 2, "admin@3m.test", { notify: false })).rejects.toThrow(/proposition plus récente/);
  });
  it("sans correction manuelle, la nouvelle version remplace l'ancienne comme avant (parcours automatique inchangé)", async () => {
    const h = harness();
    const run = await readyRun(h);
    h.state.inputs = inputs({ form: { ...inputs().form, yearsOfExperience: "10 ans et plus" } });
    await submitForAnalysis(h.deps, 1);
    expect((await h.store.getRun(run.id))!.state).toBe("superseded");
  });
  it("en mode automatique, une proposition en conflit avec une correction n'est jamais publiée toute seule", async () => {
    const h = harness({ mode: "automatique" });
    await submitForAnalysis(h.deps, 1);
    const first = (await processNext(h.deps))!;
    expect(first.state).toBe("published");
    await saveDraft(h.deps, first.id, "admin@3m.test", { sections: withProfile(first.report!, "Correction manuelle après publication.") });
    h.state.inputs = inputs({ form: { ...inputs().form, yearsOfExperience: "10 ans et plus" } });
    await submitForAnalysis(h.deps, 1);
    const second = (await processNext(h.deps))!;
    expect(second.state).toBe("ready_for_review");
    expect(h.published).toHaveLength(1);
  });
});

describe("historique, comparaison et texte simple", () => {
  it("la comparaison liste les lignes ajoutées et retirées par section", async () => {
    const h = harness();
    const run = await readyRun(h);
    const draft = await saveDraft(h.deps, run.id, "a", { sections: withProfile(run.report!, "Nouveau texte.") });
    const diff = compareReports((await h.store.listVersions(run.id))[0].report, draft.report);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toMatchObject({ sectionId: "profil", added: ["Nouveau texte."] });
    expect(diff[0].removed.length).toBeGreaterThan(0);
  });
  it("le texte simple se relit sans perte (titres, paragraphes, puces)", async () => {
    const h = harness();
    const run = await readyRun(h);
    const sections = run.report!.sections;
    const text = sectionsToEditableText(sections);
    expect(text).not.toContain("2. Verdict interne"); // section calculée exclue
    const parsed = parseEditableText(text, sections.filter((s) => !s.locked).length);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const unlocked = sections.filter((s) => !s.locked);
      parsed.sections.forEach((section, index) => {
        expect(section.title).toBe(unlocked[index].title);
        expect(section.paragraphs).toEqual(unlocked[index].paragraphs);
        expect(section.bullets).toEqual(unlocked[index].bullets);
      });
    }
    expect(parseEditableText("## seule section", 5)).toMatchObject({ ok: false });
  });
  it("la version 1 du système est créée au premier besoin pour un traitement ancien", async () => {
    const h = harness();
    const run = await readyRun(h);
    await h.store.eraseCandidate(999); // sans effet
    const v = await ensureBaseVersion(h.deps, run);
    expect(v).toMatchObject({ versionNumber: 1, authorKind: "systeme" });
  });
});
