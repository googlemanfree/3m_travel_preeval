import { createHash } from "node:crypto";
import { isGridApproved } from "../../../shared/bilanAuto/grid";
import type { ScoreResult } from "../../../shared/bilanAuto/types";
import { checkPdfIntegrity } from "./reportPdf";
import { applyScoreToReport, checkStrictReportCharter, reportHash } from "./report";
import { queueNotification, type PipelineDeps } from "./pipeline";
import { recomputeScore } from "./scoring";
import type { BilanReport, ReportSection, RunRecord, VersionRecord } from "./types";

/**
 * Versions rédactionnelles du bilan et contrôle éditorial permanent de l'agence.
 * - v1 = proposition du système ; chaque correction de l'administrateur = une nouvelle version (brouillon, puis publiée) ;
 * - un brouillon n'est JAMAIS visible du candidat : seule la publication écrit dans l'espace client, génère le PDF de cette version
 *   et conserve la version précédente dans l'historique ;
 * - les points, le total et le verdict passent par la notation (champs contrôlés), pas par le texte libre ;
 * - aucune notification n'est envoyée à l'enregistrement ; deux actions explicites : publier sans notification, publier et notifier.
 */
export class EditorialError extends Error {
  constructor(message: string, public readonly problems: string[] = []) { super(message); this.name = "EditorialError"; }
}

const MAX_PARAGRAPH = 4000;
const MAX_ITEMS = 60;
const SOURCED_PREFIX = /^(OFFRE REPÉRÉE|REPÈRE SALARIAL)/;
const AMOUNT = /\d[\d\s.,]*\s?(?:€|EUR|CAD|USD|\$|PLN|zł|RSD|CHF|GBP|£)/gi;

const lines = (section: ReportSection) => [...section.paragraphs, ...section.bullets, ...(section.table ?? []).map(([label, value]) => `${label} ${value}`)];
const fold = (text: string) => text.replace(/\s+/g, " ").trim();

/** Totaux affichés dans le texte libre : tout « NN/100 » doit égaler la note enregistrée (sauf le rappel d'une évaluation antérieure). */
export function findScoreContradictions(report: BilanReport, score: ScoreResult | null): string[] {
  if (!score || !score.calculable) return [];
  const problems: string[] = [];
  for (const section of report.sections) {
    if (section.locked || section.id === "rappel") continue;
    for (const text of lines(section)) {
      for (const match of Array.from(text.matchAll(/(\d{1,3})\s*\/\s*100\b/g))) {
        if (Number(match[1]) !== score.total) problems.push(`« ${section.title} » affiche ${match[1]}/100 alors que la note enregistrée est ${score.total}/100.`);
      }
    }
  }
  return Array.from(new Set(problems));
}

/** Contrôle d'une version modifiée par rapport à la proposition du système (structure, charte, notes, sources, montants). */
export function validateEditedReport(original: BilanReport, edited: BilanReport, score: ScoreResult | null): string[] {
  const problems: string[] = [];
  if (original.sections.map((s) => s.id).join("|") !== edited.sections.map((s) => s.id).join("|")) problems.push("La structure du bilan (sections) ne peut pas être modifiée.");
  for (const section of edited.sections) {
    if (!section.title.trim() || section.title.length > 200) problems.push(`Titre de section invalide : « ${section.title.slice(0, 40)} ».`);
    if (section.paragraphs.some((p) => p.length > MAX_PARAGRAPH)) problems.push(`« ${section.title} » : un paragraphe dépasse ${MAX_PARAGRAPH} caractères.`);
    if (section.paragraphs.length + section.bullets.length > MAX_ITEMS) problems.push(`« ${section.title} » : trop d'éléments (${MAX_ITEMS} au plus).`);
    const base = original.sections.find((entry) => entry.id === section.id);
    if (base?.locked && JSON.stringify(base) !== JSON.stringify(section) && section.locked !== true) problems.push(`La section « ${base.title} » est calculée : elle ne se modifie pas à la main.`);
  }
  problems.push(...checkStrictReportCharter(edited));
  problems.push(...findScoreContradictions(edited, score));
  // Une ligne « offre repérée » ou « repère salarial » n'existe que telle que générée avec sa source : modifiée, elle perdrait sa source.
  const allowedSourced = new Set(original.sections.flatMap((s) => s.bullets).filter((b) => SOURCED_PREFIX.test(b)).map(fold));
  for (const section of edited.sections) for (const bullet of section.bullets) {
    if (SOURCED_PREFIX.test(bullet) && !allowedSourced.has(fold(bullet))) problems.push(`« ${section.title} » : une ligne « ${bullet.slice(0, 20)}… » a été modifiée ou ajoutée ; elle n'est plus soutenue par sa source. Retirez le libellé ou passez par le référentiel de sources.`);
  }
  // Tout montant publié doit venir du bilan généré (donc d'une source datée).
  const originalText = original.sections.flatMap(lines).join("\n");
  const knownAmounts = new Set((originalText.match(AMOUNT) ?? []).map((m) => m.replace(/\s/g, "")));
  for (const section of edited.sections) for (const text of lines(section)) for (const amount of text.match(AMOUNT) ?? []) {
    if (!knownAmounts.has(amount.replace(/\s/g, "")) && !/^\d{1,3}\s*\/\s*100/.test(amount)) problems.push(`« ${section.title} » : le montant « ${amount.trim()} » ne provient d'aucune source du référentiel.`);
  }
  return Array.from(new Set(problems));
}

const sourcesOf = (run: RunRecord): VersionRecord["sources"] => (run.orientations?.proposals ?? []).flatMap((proposal) => proposal.sources);
const clean = (items: string[]) => items.map((item) => item.replace(/\s+\n/g, "\n").trim()).filter(Boolean);

/** v1 : proposition du système (créée au premier besoin pour les traitements antérieurs à la fonction). */
export async function ensureBaseVersion(deps: Pick<PipelineDeps, "store" | "now">, run: RunRecord): Promise<VersionRecord> {
  const existing = await deps.store.listVersions(run.id);
  if (existing.length > 0) return existing[existing.length - 1];
  if (!run.report) throw new EditorialError("Ce traitement n'a pas encore de bilan rédigé.");
  const created = await deps.store.addVersion({ runId: run.id, evaluationId: run.evaluationId, versionNumber: 1, authorKind: "systeme", author: "systeme", reason: "Proposition générée par le système", status: run.state === "published" ? "publiee" : "brouillon", baseVersion: null, report: run.report, scoreResult: run.scoreResult, sources: sourcesOf(run), reportHash: reportHash(run.report), pdfKey: run.pdfKey, publishedAt: run.publishedAt, publishedBy: run.validatedBy, notifiedAt: null });
  return created ?? (await deps.store.listVersions(run.id))[0];
}

export async function hasAdminEdits(store: PipelineDeps["store"], runId: number): Promise<boolean> {
  return (await store.listVersions(runId)).some((version) => version.authorKind === "admin");
}

async function loadRun(deps: PipelineDeps, runId: number): Promise<RunRecord> {
  const run = await deps.store.getRun(runId);
  if (!run) throw new EditorialError("Traitement introuvable.");
  if (run.mode === "simulation") throw new EditorialError("Un traitement de simulation ne s'édite pas.");
  if (!["ready_for_review", "published"].includes(run.state)) throw new EditorialError("Le bilan n'est pas encore prêt : il ne peut pas être modifié.");
  return run;
}

async function writeDraft(deps: PipelineDeps, run: RunRecord, admin: string, base: VersionRecord, report: BilanReport, score: ScoreResult | null, reason: string): Promise<VersionRecord> {
  const hash = reportHash(report);
  if (hash === base.reportHash && base.status === "brouillon" && base.authorKind === "admin") return base;
  const patch = { author: admin, authorKind: "admin" as const, reason, report, scoreResult: score, reportHash: hash, sources: base.sources };
  if (base.status === "brouillon" && base.authorKind === "admin") {
    return (await deps.store.updateVersion(base.id, patch, { expectedStatus: "brouillon" })) ?? base;
  }
  const versions = await deps.store.listVersions(run.id);
  const created = await deps.store.addVersion({ runId: run.id, evaluationId: run.evaluationId, versionNumber: versions[versions.length - 1].versionNumber + 1, status: "brouillon", baseVersion: base.versionNumber, pdfKey: null, publishedAt: null, publishedBy: null, notifiedAt: null, ...patch });
  if (!created) throw new EditorialError("Une autre modification est en cours : rechargez la page.");
  await deps.store.updateRun(run.id, { reviewStatus: "corrected" });
  return created;
}

export type EditableInput = Array<{ id: string; title: string; paragraphs: string[]; bullets: string[] }>;

/** Enregistre un brouillon (sans toucher au bilan visible du candidat, sans e-mail). */
export async function saveDraft(deps: PipelineDeps, runId: number, admin: string, input: { sections: EditableInput; reason?: string }): Promise<VersionRecord> {
  const run = await loadRun(deps, runId);
  const base = await ensureBaseVersion(deps, run);
  const original = (await deps.store.listVersions(run.id))[0].report;
  const incoming = new Map(input.sections.map((section) => [section.id, section]));
  const report: BilanReport = { ...base.report, sections: base.report.sections.map((section) => {
    const next = incoming.get(section.id);
    if (!next || section.locked) return section;
    const { table, ...rest } = section;
    return { ...rest, title: next.title.trim(), paragraphs: clean(next.paragraphs), bullets: clean(next.bullets), ...(table ? { table } : {}) };
  }) };
  const problems = validateEditedReport(original, report, base.scoreResult);
  if (problems.length > 0) throw new EditorialError("Le bilan ne respecte pas les règles de publication.", problems);
  const draft = await writeDraft(deps, run, admin, base, report, base.scoreResult, input.reason?.trim() || "Correction du texte");
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: admin, action: "draft_saved", detail: `version ${draft.versionNumber}${input.reason ? ` · ${input.reason.trim().slice(0, 200)}` : ""}`, at: deps.now() });
  return draft;
}

export type ScoreChange = { rubric: string; subCriterion: string; points: number; justification: string };

/** Modifie une note par le champ contrôlé : justification, total et verdict recalculés, texte et PDF cohérents. */
export async function changeScore(deps: PipelineDeps, runId: number, admin: string, change: ScoreChange): Promise<VersionRecord> {
  const run = await loadRun(deps, runId);
  const base = await ensureBaseVersion(deps, run);
  const current = base.scoreResult;
  if (!current) throw new EditorialError("Ce bilan n'a pas de notation à corriger.");
  if (change.justification.trim().length < 10) throw new EditorialError("Une justification d'au moins 10 caractères est obligatoire.");
  const rubric = current.rubrics.find((entry) => entry.key === change.rubric);
  const sub = rubric?.subCriteria.find((entry) => entry.key === change.subCriterion);
  if (!rubric || !sub) throw new EditorialError("Sous-critère inconnu.");
  if (!Number.isInteger(change.points) || change.points < 0 || change.points > sub.max) throw new EditorialError(`Les points doivent être un entier entre 0 et ${sub.max}.`);
  const next = structuredClone(current);
  const target = next.rubrics.find((entry) => entry.key === change.rubric)!.subCriteria.find((entry) => entry.key === change.subCriterion)!;
  const before = target.points;
  target.points = change.points;
  target.provenance = "verifie";
  target.explanation = `${target.explanation} Ajusté par l'agence (${change.points}/${sub.max}) : ${change.justification.trim()}`;
  const score = recomputeScore(next);
  score.missing = score.missing.filter((item) => !(item.rubric === change.rubric && item.subCriterion === change.subCriterion));
  const report = applyScoreToReport(base.report, score);
  const original = (await deps.store.listVersions(run.id))[0].report;
  const problems = validateEditedReport(original, report, score);
  if (problems.length > 0) throw new EditorialError("La nouvelle note rend le texte incohérent : corrigez d'abord les passages signalés.", problems);
  const reason = `Note « ${sub.label} » : ${before ?? "non évaluable"} → ${change.points} — ${change.justification.trim()}`;
  const draft = await writeDraft(deps, run, admin, base, report, score, reason);
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: admin, action: "score_changed", detail: `${change.rubric}.${change.subCriterion} : ${before ?? "—"} → ${change.points} · total ${score.total}/100 · ${change.justification.trim().slice(0, 200)}`, at: deps.now() });
  return draft;
}

export type PublishOptions = { notify: boolean };

/** Publie une version : bilan visible mis à jour, PDF de CETTE version, version précédente conservée. L'e-mail n'est envoyé que sur demande. */
export async function publishVersion(deps: PipelineDeps, runId: number, versionNumber: number, admin: string, options: PublishOptions): Promise<{ version: VersionRecord; notified: boolean; alreadyPublished: boolean }> {
  const run = await loadRun(deps, runId);
  if (!isGridApproved(deps.config.grid)) throw new EditorialError("La grille de notation n'est pas approuvée : publication impossible.");
  const versions = await deps.store.listVersions(run.id);
  const version = versions.find((entry) => entry.versionNumber === versionNumber);
  if (!version) throw new EditorialError("Version introuvable.");
  if (version.status === "publiee") return { version, notified: false, alreadyPublished: true };
  if (version.status !== "brouillon") throw new EditorialError("Cette version a été remplacée : créez un brouillon à partir d'elle pour la republier.");
  const latest = await deps.store.latestRunForEvaluation(run.evaluationId);
  if (latest && latest.id !== run.id && latest.state !== "superseded") throw new EditorialError("Une proposition plus récente existe pour cette évaluation : comparez-la avant de publier cette version.");
  const original = versions[0].report;
  const problems = validateEditedReport(original, version.report, version.scoreResult);
  if (problems.length > 0) throw new EditorialError("Le bilan ne respecte pas les règles de publication.", problems);
  const inputs = await deps.loadInputs(run.evaluationId);
  if (!inputs || inputs.candidateId !== run.candidateId) throw new EditorialError("Le dossier n'est plus rattaché au même candidat.");

  // PDF de cette version, contrôlé avant toute écriture visible du candidat.
  const bytes = await deps.renderPdf(version.report).catch(() => null);
  const pdfProblems = bytes ? checkPdfIntegrity(bytes) : ["PDF non généré"];
  if (!bytes || pdfProblems.length > 0) throw new EditorialError(`PDF impossible à générer : ${pdfProblems.join(" ; ")}`);
  const pdf = await deps.storePdf(`bilan-auto/${run.evaluationId}/bilan-run-${run.id}-v${version.versionNumber}-${version.reportHash.slice(0, 12)}.pdf`, bytes);

  const now = deps.now();
  const claimed = await deps.store.updateVersion(version.id, { status: "publiee", pdfKey: pdf.key, publishedAt: now, publishedBy: admin }, { expectedStatus: "brouillon" });
  if (!claimed) return { version: (await deps.store.listVersions(run.id)).find((entry) => entry.versionNumber === versionNumber) ?? version, notified: false, alreadyPublished: true };
  const previouslyPublished = versions.filter((entry) => entry.status === "publiee" && entry.id !== version.id);
  try {
    await deps.publisher.publish({ ...run, validatedBy: admin }, version.report, { key: pdf.key, url: pdf.url });
  } catch (error) {
    await deps.store.updateVersion(version.id, { status: "brouillon", pdfKey: null, publishedAt: null, publishedBy: null });
    throw new EditorialError(`Publication impossible : ${error instanceof Error ? error.message : "erreur"}`);
  }
  for (const old of previouslyPublished) await deps.store.updateVersion(old.id, { status: "remplacee" });
  await deps.store.updateRun(run.id, {
    state: "published", report: version.report, reportHash: version.reportHash, pdfKey: pdf.key, scoreResult: version.scoreResult, score: version.report.score, thresholdReached: version.report.thresholdReached,
    publishedAt: now, validatedBy: admin, validatedAt: now, reviewStatus: version.authorKind === "admin" ? "corrected" : "validated",
  });
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: admin, action: "version_published", detail: `version ${version.versionNumber}${options.notify ? " · avec notification" : " · sans notification"} · empreinte ${version.reportHash.slice(0, 12)}`, at: now });

  let notified = false;
  if (options.notify && deps.config.notificationsEnabled) {
    notified = await queueVersionNotification(deps, run, version, inputs.email, previouslyPublished.length > 0);
    await deps.store.updateVersion(version.id, { notifiedAt: now });
  }
  return { version: { ...claimed, status: "publiee", pdfKey: pdf.key }, notified, alreadyPublished: false };
}

async function queueVersionNotification(deps: PipelineDeps, run: RunRecord, version: VersionRecord, email: string, isUpdate: boolean): Promise<boolean> {
  const before = (await deps.store.listOutbox(run.id)).length;
  await queueNotification(deps, { ...run, reportHash: version.reportHash }, email, isUpdate ? "bilan_mis_a_jour" : "bilan_publie", `v${version.versionNumber}`);
  return (await deps.store.listOutbox(run.id)).length > before;
}

/** « Notifier le candidat » : une seule fois par version publiée (aucun doublon si on clique deux fois). */
export async function notifyPublished(deps: PipelineDeps, runId: number, admin: string): Promise<{ notified: boolean; reason?: string }> {
  const run = await deps.store.getRun(runId);
  if (!run || run.state !== "published") throw new EditorialError("Aucun bilan publié à notifier.");
  const versions = await deps.store.listVersions(run.id);
  const published = [...versions].reverse().find((entry) => entry.status === "publiee");
  if (!published) throw new EditorialError("Aucune version publiée.");
  if (published.notifiedAt) return { notified: false, reason: "Le candidat a déjà été notifié pour cette version." };
  const inputs = await deps.loadInputs(run.evaluationId);
  if (!inputs || inputs.candidateId !== run.candidateId) throw new EditorialError("Le dossier n'est plus rattaché au même candidat.");
  const claimed = await deps.store.updateVersion(published.id, { notifiedAt: deps.now() }, { expectedStatus: "publiee" });
  if (!claimed) return { notified: false, reason: "Version modifiée entre-temps." };
  const queued = await queueVersionNotification(deps, run, published, inputs.email, published.versionNumber > 1 || versions.some((entry) => entry.status === "remplacee"));
  await deps.store.addEvent({ runId: run.id, evaluationId: run.evaluationId, actor: admin, action: "candidate_notified", detail: `version ${published.versionNumber}`, at: deps.now() });
  return { notified: queued };
}

/** Après une publication faite par le circuit existant (validation ou mode automatique) : la version 1 est marquée publiée avec son PDF. */
export async function syncVersionAfterPublish(deps: Pick<PipelineDeps, "store" | "now">, run: RunRecord, actor: string): Promise<void> {
  const base = await ensureBaseVersion(deps, run);
  if (base.status !== "publiee") await deps.store.updateVersion(base.id, { status: "publiee", pdfKey: run.pdfKey, publishedAt: run.publishedAt ?? deps.now(), publishedBy: actor });
}

export type SectionDiff = { sectionId: string; title: string; added: string[]; removed: string[] };

/** Comparaison de deux versions (ou d'une proposition et d'une version corrigée) : lignes ajoutées et retirées par section. */
export function compareReports(a: BilanReport, b: BilanReport): SectionDiff[] {
  return b.sections.flatMap((section) => {
    const before = a.sections.find((entry) => entry.id === section.id);
    const was = new Set((before ? lines(before) : []).map(fold));
    const is = new Set(lines(section).map(fold));
    const added = lines(section).filter((line) => !was.has(fold(line)));
    const removed = (before ? lines(before) : []).filter((line) => !is.has(fold(line)));
    return added.length || removed.length || before?.title !== section.title ? [{ sectionId: section.id, title: section.title, added, removed }] : [];
  });
}
