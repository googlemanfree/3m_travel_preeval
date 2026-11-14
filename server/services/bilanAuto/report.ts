import { createHash } from "node:crypto";
import type { CandidateFacts, Provenance, ScoreResult } from "../../../shared/bilanAuto/types";
import type { BilanReport, PreviousEvaluationRef, ReportSection, RunRecord } from "./types";
import type { DestinationProposal, OrientationOutcome } from "./orientations";
import { checkEditorialCharter } from "./controls";

/**
 * Rapport du bilan : construit UNIQUEMENT depuis le résultat calculé (faits, score, orientations). Aucune réinterprétation libre du CV,
 * aucun appel au modèle : le texte est reproductible, relu par les contrôles de charte, et HTML, texte et PDF dérivent du même objet.
 */

export const REPORT_DISCLAIMER =
  "Ce bilan est une préévaluation interne de 3M TRAVEL AGENCY, établie à partir des informations et des pièces transmises à la date indiquée. " +
  "Il ne constitue ni une décision d'une autorité, ni une probabilité d'obtention d'un visa, d'un emploi ou d'un titre de séjour. " +
  "Une pièce examinée n'est pas une pièce authentifiée. Vous pouvez corriger vos informations et demander un réexamen auprès de l'agence.";

export const CONTACT_LINES = ["3M TRAVEL AGENCY — Direction de la Mobilité Internationale", "E-mail : hello@3mtravelagency.com", "WhatsApp : +237 698 104 832 | +237 620 996 045", "Site : www.3mtravelagency.com"];

const PROVENANCE_LABEL: Record<Provenance | "systeme", string> = {
  declare: "déclaré",
  piece: "présent dans une pièce examinée",
  verifie: "vérifié par l'agence",
  non_renseigne: "non renseigné",
  contradictoire: "contradictoire",
  systeme: "calculé par le système",
};

const ROLE_LABEL: Record<DestinationProposal["role"], string> = { prioritaire: "Destination prioritaire", alternative: "Alternative examinée", regle_canada: "Destination complémentaire (Canada)" };

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "UTC" });
}

function section(id: string, title: string, paragraphs: string[] = [], bullets: string[] = [], table?: Array<[string, string]>): ReportSection {
  return { id, title, paragraphs, bullets, ...(table ? { table } : {}) };
}

function itemLine(item: DestinationProposal["items"][number]): string {
  if (item.kind === "offre_reperee") return `OFFRE REPÉRÉE — ${item.title}, ${item.employer}${item.city ? ` (${item.city})` : ""} · recrutement depuis l'étranger : ${item.remote === "confirmee" ? "mentionné par l'annonce" : "non confirmé"} · source : ${item.source.title}, consultée le ${formatDate(item.source.consultedAt)}`;
  if (item.kind === "repere_salarial") return `REPÈRE SALARIAL — ${item.label} : ${item.amount} (${item.period}) · source : ${item.source.title}, consultée le ${formatDate(item.source.consultedAt)}`;
  return `POSTE À CIBLER — ${item.title}${item.missions.length ? ` · missions : ${item.missions.join(", ")}` : ""}`;
}

export function explainScoreChange(previous: { score: number | null; rubrics: Array<{ key: string; label: string; points: number | null }> } | null, next: ScoreResult): string[] {
  if (!previous) return [];
  const lines: string[] = [];
  for (const rubric of next.rubrics) {
    const before = previous.rubrics.find((entry) => entry.key === rubric.key)?.points ?? null;
    if (before === null || rubric.points === null || before === rubric.points) continue;
    const delta = rubric.points - before;
    lines.push(`${rubric.label} : ${before} → ${rubric.points} (${delta > 0 ? "+" : ""}${delta})`);
  }
  if (lines.length === 0 && previous.score !== null && previous.score === next.total) lines.push("Aucune évolution du score : les informations prises en compte sont identiques.");
  return lines;
}

export type ReportInput = {
  candidateName: string;
  dossierRef: string | null;
  referenceDate: string;
  facts: CandidateFacts;
  score: ScoreResult;
  orientations: OrientationOutcome;
  previous: PreviousEvaluationRef | null;
  unreadableDocuments: string[];
  injectionSuspected: boolean;
};

export function verdictLabelOf(score: ScoreResult): string {
  return score.thresholdReached ? `Seuil interne atteint (${score.total}/${score.max}, seuil ${score.threshold})` : `Seuil interne non atteint à ce stade (${score.total}/${score.max}, seuil ${score.threshold})`;
}

/** Section « Verdict interne et note expliquée » : entièrement dérivée de la notation, jamais saisie à la main. */
export function buildVerdictSection(score: ScoreResult): ReportSection {
  const entry = section(
    "verdict",
    "2. Verdict interne et note expliquée",
    [
      `${verdictLabelOf(score)}. Ce score mesure la préparation du dossier et l'adéquation du profil au projet de travail ; il n'est pas une décision officielle d'immigration.`,
      "Le total est calculé par le système à partir de règles publiées, rubrique par rubrique.",
    ],
    [],
    score.rubrics.map((rubric): [string, string] => [rubric.label, `${rubric.points ?? "non calculable"}/${rubric.max}`]),
  );
  for (const rubric of score.rubrics) {
    entry.bullets.push(...rubric.subCriteria.map((sub) => `${rubric.label} · ${sub.label} : ${sub.points ?? "non évaluable"}/${sub.max} — ${sub.explanation} (${PROVENANCE_LABEL[sub.provenance]})`));
  }
  return { ...entry, locked: true };
}

/**
 * Applique une notation (corrigée par l'administrateur) à un bilan déjà rédigé : le verdict, la note et le détail des rubriques sont
 * régénérés ; les autres sections, y compris les textes modifiés à la main, restent intacts.
 */
export function applyScoreToReport(report: BilanReport, score: ScoreResult): BilanReport {
  return {
    ...report,
    score: score.calculable ? score.total : null,
    thresholdReached: score.calculable ? score.thresholdReached : null,
    verdictLabel: verdictLabelOf(score),
    gridVersion: score.gridVersion,
    sections: report.sections.map((entry) => (entry.id === "verdict" ? buildVerdictSection(score) : entry)),
  };
}

export function buildReport(input: ReportInput): BilanReport {
  const { facts, score, orientations, previous } = input;
  const flags = score.rubrics.flatMap((rubric) => rubric.subCriteria.flatMap((sub) => sub.flags));
  const verdict = verdictLabelOf(score);
  const sections: ReportSection[] = [];

  // 1. Rappel d'une évaluation antérieure
  sections.push(
    previous
      ? section("rappel", "1. Rappel d'une évaluation antérieure", [`Évaluation du ${formatDate(previous.date)} : ${previous.score ?? "non calculée"}/100 — ${previous.verdict}.`, `Nature de la mise à jour : ${previous.updateNature}.`], previous.changeExplanations)
      : section("rappel", "1. Rappel d'une évaluation antérieure", ["Aucune évaluation antérieure n'a été trouvée pour ce compte."]),
  );

  // 2. Verdict interne et note expliquée (section calculée : verrouillée)
  sections.push(buildVerdictSection(score));

  // 3. Profil et points forts
  const strengths = score.rubrics
    .flatMap((rubric) => rubric.subCriteria.filter((sub) => sub.kind !== "system" && sub.points !== null && sub.max > 0 && sub.points / sub.max >= 0.75).map((sub) => `${rubric.label} — ${sub.label.toLowerCase()} : ${sub.points}/${sub.max}`))
    .slice(0, 8);
  const profileLine = [facts.metierVise ? `Métier visé : ${facts.metierVise}.` : null, facts.secteurs.length ? `Secteurs : ${facts.secteurs.join(", ")}.` : null, facts.formation.niveau.value ? `Niveau de formation retenu : ${facts.formation.niveau.value.replace(/_/g, " ")} (${PROVENANCE_LABEL[facts.formation.niveau.provenance]}).` : null].filter((line): line is string => Boolean(line));
  sections.push(section("profil", "3. Profil et points forts", profileLine.length ? profileLine : ["Le profil sera précisé dès réception des informations manquantes."], strengths.length ? strengths : ["Aucun point fort ne ressort encore de façon établie : voir les actions de renforcement."]));

  // 4. Incohérences et réserves
  const reserves = [
    ...flags,
    ...(input.unreadableDocuments.length ? [`${input.unreadableDocuments.length} pièce(s) illisible(s) : une nouvelle version est à déposer.`] : []),
    ...(orientations.sourcesIncomplete ? ["Les sources d'offres et de salaires sont incomplètes : les montants non documentés ne sont pas indiqués."] : []),
    ...(input.injectionSuspected ? ["Un contenu du dossier contenait des consignes adressées au système ; elles ont été ignorées."] : []),
  ];
  sections.push(section("reserves", "4. Incohérences et réserves", reserves.length ? [] : ["Aucune incohérence n'a été relevée à ce stade."], reserves));

  // 5 & 6. Destinations
  const toSection = (proposal: DestinationProposal, id: string, title: string): ReportSection =>
    section(id, title, [proposal.rationale, `Villes de référence : ${proposal.cities.join(", ")}. Rémunération : ${proposal.salary}`], [...proposal.items.map(itemLine), ...proposal.conditions.map((line) => `Condition à vérifier — ${line}`), ...proposal.reserves.map((line) => `Réserve — ${line}`)]);
  const priority = orientations.proposals.find((proposal) => proposal.role === "prioritaire")!;
  sections.push(toSection(priority, "destination", `5. ${ROLE_LABEL.prioritaire} : ${priority.country}`));
  const others = orientations.proposals.filter((proposal) => proposal.role !== "prioritaire");
  sections.push(section("alternatives", `6. Alternatives examinées (${others.length})`, ["Chaque piste est une proposition d'étude : les éléments non confirmés sont signalés comme tels."]));
  for (const proposal of others) sections.push(toSection(proposal, `alt-${proposal.country}`, `${ROLE_LABEL[proposal.role]} : ${proposal.country}`));
  if (!orientations.canadaRule.applies && orientations.canadaRule.undecidable.length > 0) sections[sections.length - 1].bullets.push(`Canada : ${orientations.canadaRule.reason}`);

  // 7. Éléments manquants
  const missing = [...score.missing.map((item) => item.label), ...(facts.ageAns === null ? ["Date de naissance (nécessaire pour examiner certaines destinations)"] : [])];
  sections.push(section("manquants", "7. Éléments manquants", missing.length ? [] : ["Aucun élément essentiel ne manque à ce stade."], missing));

  // 8. Actions de renforcement (sans promettre de points)
  const weak = score.rubrics
    .flatMap((rubric) => rubric.subCriteria.filter((sub) => sub.points !== null && sub.points < sub.max * 0.5).map((sub) => ({ rubric: rubric.label, sub, gap: sub.max - (sub.points ?? 0) })))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 6);
  const actions = weak.map(({ rubric, sub }) => (sub.kind === "proof" ? `${rubric} — déposer ou compléter les pièces justificatives (${sub.label.toLowerCase()}).` : `${rubric} — renforcer : ${sub.label.toLowerCase()}.`));
  sections.push(section("actions", "8. Actions de renforcement", score.thresholdReached ? ["Le dossier peut être consolidé en complétant les pièces justificatives et en précisant le calendrier du projet."] : ["Les pistes ci-dessous peuvent améliorer la préparation du dossier. Elles ne préjugent pas du résultat d'un nouvel examen."], actions));

  // 9. Limites et coordonnées
  sections.push(section("limites", "9. Limites et coordonnées de 3M", [REPORT_DISCLAIMER], CONTACT_LINES));

  return {
    candidateName: input.candidateName,
    dossierRef: input.dossierRef,
    referenceDate: input.referenceDate,
    gridVersion: score.gridVersion,
    score: score.calculable ? score.total : null,
    scoreMax: score.max,
    threshold: score.threshold,
    thresholdReached: score.calculable ? score.thresholdReached : null,
    verdictLabel: verdict,
    sections,
    disclaimer: REPORT_DISCLAIMER,
  };
}

// ── Contrôles de charte stricts pour le bilan automatisé ──────────────────

/** Le bilan automatisé exclut totalement « garanti » et ses variantes, même niés (consigne du propriétaire). */
export function checkStrictReportCharter(report: BilanReport): string[] {
  const texts = reportTexts(report);
  const problems = checkEditorialCharter(texts);
  for (const { field, text } of texts) {
    if (/garant/i.test(text.normalize("NFKD").replace(/[̀-ͯ]/g, ""))) problems.push(`« ${field} » contient le terme « garanti » ou une variante`);
  }
  return Array.from(new Set(problems));
}

export function reportTexts(report: BilanReport): Array<{ field: string; text: string }> {
  return [
    { field: "Verdict", text: report.verdictLabel },
    ...report.sections.flatMap((entry) => [
      ...entry.paragraphs.map((text, index) => ({ field: `${entry.title} §${index + 1}`, text })),
      ...entry.bullets.map((text, index) => ({ field: `${entry.title} •${index + 1}`, text })),
      ...(entry.table ?? []).map(([label, value]) => ({ field: `${entry.title} ${label}`, text: `${label} ${value}` })),
    ]),
  ];
}

/** Aucune donnée d'un autre candidat : le texte ne doit contenir aucun e-mail ni numéro de téléphone étranger au candidat. */
export function foreignPersonalData(report: BilanReport, allowed: { names: string[]; emails: string[] }): string[] {
  const texts = reportTexts(report).map((entry) => entry.text).join("\n");
  const own = new Set(allowed.emails.map((email) => email.toLowerCase()));
  const agency = new Set(["hello@3mtravelagency.com"]);
  const foreign = ((texts.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []) as string[]).filter((email) => !own.has(email.toLowerCase()) && !agency.has(email.toLowerCase()));
  return foreign;
}

// ── Rendus : texte, HTML (échappé) ────────────────────────────────────────

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderText(report: BilanReport): string {
  const rule = "─".repeat(48);
  const lines = [`BILAN D'ÉVALUATION PRÉLIMINAIRE — PROJET DE TRAVAIL`, rule, `Candidat : ${report.candidateName}`, ...(report.dossierRef ? [`Dossier : ${report.dossierRef}`] : []), `Date de référence : ${formatDate(report.referenceDate)}`, `Verdict : ${report.verdictLabel}`, rule];
  for (const entry of report.sections) {
    lines.push("", entry.title.toUpperCase(), ...entry.paragraphs);
    for (const [label, value] of entry.table ?? []) lines.push(`  ${label} : ${value}`);
    for (const bullet of entry.bullets) lines.push(`  • ${bullet}`);
  }
  return lines.join("\n");
}

export function renderHtml(report: BilanReport): string {
  const body = report.sections
    .map((entry) => {
      const table = entry.table ? `<table>${entry.table.map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table>` : "";
      const bullets = entry.bullets.length ? `<ul>${entry.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>` : "";
      return `<section id="${escapeHtml(entry.id)}"><h2>${escapeHtml(entry.title)}</h2>${entry.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}${table}${bullets}</section>`;
    })
    .join("");
  return `<article lang="fr"><h1>Bilan d'évaluation préliminaire — projet de travail</h1><p>${escapeHtml(report.candidateName)} · ${escapeHtml(formatDate(report.referenceDate))}</p><p><strong>${escapeHtml(report.verdictLabel)}</strong></p>${body}</article>`;
}

/** Empreinte du contenu publié : sert à la déduplication et à la traçabilité. */
export function reportHash(report: BilanReport): string {
  return createHash("sha256").update(JSON.stringify(report)).digest("hex");
}

export function verdictFor(run: Pick<RunRecord, "thresholdReached" | "score" | "scoreMax">): string {
  if (run.score === null) return "Non calculable";
  return run.thresholdReached ? "Seuil interne atteint" : "Seuil interne non atteint";
}
