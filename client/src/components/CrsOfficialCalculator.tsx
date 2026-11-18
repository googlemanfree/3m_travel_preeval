import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Copy, Download, ExternalLink, GitCompareArrows, Info, MessageCircle, Printer, RotateCcw, Sparkles } from "lucide-react";
import { CRS_ABILITIES, CRS_TEST_BANDS, CRS_TEST_LABELS, type CrsAbility, type CrsLanguageTest } from "@shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, MARITAL_OPTIONS, buildCrsProfileFromOfficialAnswers, countsAsWithSpouse, type CrsOfficialAnswers } from "@shared/crsOfficialAnswers";
import { CRS_SOURCE, CRS_TOTAL_MAX, computeCrsScore } from "@shared/crsScore";
import { improvementLevers, resultSections } from "@/lib/crsResultModel";
import { AGE_CHOICES, CANADIAN_CREDENTIAL_LEVELS, CrsQuestions, EDUCATION_CHOICES, FOREIGN_YEARS_CHOICES, JOB_OFFER_LEVELS, YEARS_CHOICES, YES_NO } from "@/components/CrsQuestions";
import { CRS_TIPS, tipSummary } from "@/lib/crsTips";
import { CRS_GLOSSARY } from "@/lib/crsGlossary";
import { changedAnswerFields, compareScenarios } from "@/lib/crsScenario";

/**
 * Calculatrice CRS « comme canada.ca » : les mêmes questions, dans le même ordre, avec les mêmes conditions que l'outil officiel d'IRCC
 * « Vérifiez votre note », et un résultat présenté comme le sien (facteurs de base, conjoint, transfert des compétences, points
 * supplémentaires, note sur 1 270). Grille du 3 novembre 2026 (voir shared/crsScore.ts). Estimation : le système Entrée express prévaut.
 */
const IRCC_TOOL_URL = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html";
const STORAGE_KEY = "3m-crs-official-answers-v1";

/** Libellé lisible d'une réponse (pour la liste « Réponses modifiées » du mode comparaison). */
const SIMPLE_FIELDS: Record<string, { label: string; options: ReadonlyArray<{ value: string; label: string }> }> = {
  maritalStatus: { label: "État matrimonial", options: MARITAL_OPTIONS },
  spouseCitizenOrPr: { label: "Conjoint citoyen ou résident permanent", options: YES_NO },
  spouseAccompanies: { label: "Conjoint qui vous accompagne", options: YES_NO },
  age: { label: "Âge", options: AGE_CHOICES },
  education: { label: "Niveau d’études", options: EDUCATION_CHOICES },
  canadianCredential: { label: "Diplôme canadien", options: YES_NO },
  canadianCredentialLevel: { label: "Niveau du diplôme canadien", options: CANADIAN_CREDENTIAL_LEVELS },
  languageTestRecent: { label: "Test de langue de moins de deux ans", options: YES_NO },
  canadianWorkYears: { label: "Expérience de travail qualifié au Canada", options: YEARS_CHOICES },
  highWageExperience: { label: "Expérience au Canada dans une profession à salaire élevé", options: YES_NO },
  highWage2x: { label: "Salaire au moins 2 fois le salaire médian", options: YES_NO },
  highWage15x: { label: "Salaire au moins 1,5 fois le salaire médian", options: YES_NO },
  foreignWorkYears: { label: "Expérience de travail qualifié à l’étranger", options: FOREIGN_YEARS_CHOICES },
  certificate: { label: "Certificat de compétence", options: YES_NO },
  jobOffer: { label: "Offre d’emploi valide à salaire élevé", options: YES_NO },
  jobOfferLevel: { label: "Niveau de l’offre d’emploi", options: JOB_OFFER_LEVELS },
  nomination: { label: "Désignation provinciale", options: YES_NO },
  sibling: { label: "Frère ou sœur au Canada", options: YES_NO },
  spouseEducation: { label: "Niveau d’études du conjoint", options: EDUCATION_CHOICES },
  spouseCanadianWorkYears: { label: "Expérience canadienne du conjoint", options: YEARS_CHOICES },
};
const TEST_FIELDS: Record<string, { label: string; allowNone: boolean }> = {
  firstTest: { label: "Test de langue (première langue)", allowNone: false },
  secondTest: { label: "Test de langue (seconde langue)", allowNone: true },
  spouseTest: { label: "Test de langue du conjoint", allowNone: true },
};
const BAND_FIELDS: Record<string, { label: string; test: "firstTest" | "secondTest" | "spouseTest" }> = {
  firstBands: { label: "première langue", test: "firstTest" },
  secondBands: { label: "seconde langue", test: "secondTest" },
  spouseBands: { label: "conjoint", test: "spouseTest" },
};

export function describeAnswerChange(field: string, a: CrsOfficialAnswers, b: CrsOfficialAnswers): { label: string; from: string; to: string } {
  const unanswered = "non renseigné";
  const simple = SIMPLE_FIELDS[field];
  if (simple) {
    const read = (answers: CrsOfficialAnswers) => { const value = String(answers[field as keyof CrsOfficialAnswers] ?? ""); return simple.options.find((option) => option.value === value)?.label ?? (value === "" ? unanswered : value); };
    return { label: simple.label, from: read(a), to: read(b) };
  }
  const testField = TEST_FIELDS[field];
  if (testField) {
    const read = (answers: CrsOfficialAnswers) => { const value = String(answers[field as keyof CrsOfficialAnswers] ?? ""); return value === "" ? unanswered : value === "none" ? "Sans objet" : CRS_TEST_LABELS[value as CrsLanguageTest] ?? value; };
    return { label: testField.label, from: read(a), to: read(b) };
  }
  const [group, ability] = field.split(".") as [keyof typeof BAND_FIELDS, CrsAbility];
  const meta = BAND_FIELDS[group];
  const abilityLabel = CRS_ABILITIES.find((entry) => entry.key === ability)?.label ?? ability;
  const read = (answers: CrsOfficialAnswers) => {
    const test = answers[meta.test] as string;
    const index = (answers[group] as Record<CrsAbility, string>)[ability];
    return test in CRS_TEST_BANDS && index !== "" ? `${CRS_TEST_LABELS[test as CrsLanguageTest]} : ${CRS_TEST_BANDS[test as CrsLanguageTest][ability][Number(index)]?.label ?? index}` : unanswered;
  };
  return { label: `${abilityLabel} (${meta.label})`, from: read(a), to: read(b) };
}

const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0");
const deltaTone = (value: number) => (value > 0 ? "text-emerald-800" : value < 0 ? "text-red-800" : "text-slate-600");

const fmt = (value: number) => value.toLocaleString("fr-FR");

export default function CrsOfficialCalculator() {
  const [answers, setAnswers] = useState<CrsOfficialAnswers>(EMPTY_CRS_ANSWERS);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers({ ...EMPTY_CRS_ANSWERS, ...(JSON.parse(saved) as Partial<CrsOfficialAnswers>) });
    } catch { /* stockage indisponible : le calcul fonctionne sans */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch { /* ignoré */ }
  }, [answers]);

  const [scenario, setScenario] = useState<CrsOfficialAnswers | null>(null);
  const withSpouse = countsAsWithSpouse(answers);
  const result = useMemo(() => buildCrsProfileFromOfficialAnswers(answers), [answers]);
  const breakdown = result.complete ? computeCrsScore(result.profile) : null;
  const levers = result.complete && breakdown ? improvementLevers(result.profile, breakdown) : [];
  const comparison = useMemo(() => (scenario ? compareScenarios(answers, scenario) : null), [answers, scenario]);
  const scenarioChanged = useMemo(() => (scenario ? changedAnswerFields(answers, scenario) : []), [answers, scenario]);

  const summaryText = breakdown
    ? `Mon score CRS estimé (grille IRCC du 3 novembre 2026) : ${breakdown.total} / ${CRS_TOTAL_MAX}. Facteurs de base ${breakdown.coreHumanCapital}, conjoint ${breakdown.spouseFactors}, transfert des compétences ${breakdown.skillTransferability}, points supplémentaires ${breakdown.additionalPoints}.`
    : "";
  const copyResult = async () => {
    try { await navigator.clipboard.writeText(summaryText); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  };
  const reset = () => { setAnswers(EMPTY_CRS_ANSWERS); setSubmitted(false); setScenario(null); };
  const downloadPdf = async () => {
    if (!breakdown) return;
    setPdfState("working");
    try {
      const { downloadCrsPdf } = await import("@/lib/crsPdf");
      await downloadCrsPdf({ breakdown, withSpouse, levers });
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  };

  return (
    <section aria-labelledby="crs-official-title" className="space-y-5" data-testid="crs-official-calculator">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 id="crs-official-title" className="text-xl font-black text-slate-950">Calculatrice du SCG — mêmes questions que l’outil officiel d’IRCC</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">Répondez dans l’ordre, comme sur canada.ca. Le résultat est présenté de la même façon et le total est sur <strong>{fmt(CRS_TOTAL_MAX)} points</strong>.</p>
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="crs-november-2026-notice">
          <strong>Nouveau depuis le 3 novembre 2026 :</strong> l’expérience de travail canadienne devient le « facteur d’intégration sur le marché du travail » (durée + points pour une profession à salaire élevé), ou, à la place, une offre d’emploi valide dans une profession à salaire élevé — jamais les deux : IRCC retient le plus avantageux. Plus aucune EIMT n’est exigée pour l’offre d’emploi.
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-600">Cet outil sert uniquement de repère. En cas de divergence avec le résultat du système électronique Entrée express, c’est ce dernier qui prévaut. <a className="font-semibold text-blue-800 underline" href={IRCC_TOOL_URL} target="_blank" rel="noreferrer noopener">Ouvrir l’outil officiel d’IRCC</a></p>
        <details className="mt-3 rounded-lg border border-blue-200 bg-white" data-testid="crs-glossary">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm font-bold text-blue-900"><BookOpen className="h-4 w-4" aria-hidden="true" />Mots techniques expliqués simplement (CLB, TEER, EIMT, salaire élevé…)</summary>
          <dl className="space-y-3 border-t border-blue-100 px-3 py-3 text-sm">
            {CRS_GLOSSARY.map((entry) => (
              <div key={entry.term}><dt className="font-black text-slate-900">{entry.term}</dt><dd className="mt-0.5 leading-6 text-slate-700">{entry.meaning}</dd></div>
            ))}
          </dl>
        </details>
      </div>

      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} noValidate>
        <CrsQuestions answers={answers} setAnswers={setAnswers} onEdit={() => setSubmitted(false)} />

        <p className="pt-1 text-xs text-slate-600" data-testid="crs-remaining" aria-live="polite">
          {result.complete ? "Toutes les questions nécessaires ont une réponse : vous pouvez calculer votre note." : `Il reste ${result.missing.length} question${result.missing.length > 1 ? "s" : ""} à répondre pour obtenir votre note. Aucune réponse manquante n’est comptée comme zéro.`}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" data-testid="crs-calculate">
            <Sparkles className="h-4 w-4" aria-hidden="true" />Calculer vos résultats
          </button>
          <button type="button" onClick={reset} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 sm:w-auto text-sm font-bold text-slate-800 hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />Recommencer
          </button>
        </div>
      </form>

      {submitted && !result.complete && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" data-testid="crs-missing">
          <p className="font-black"><AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />Répondez d’abord aux questions suivantes pour obtenir votre note :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{result.missing.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>
      )}

      {submitted && breakdown && result.complete && (
        <section id="crs-print-area" aria-labelledby="crs-results-title" className="space-y-4 rounded-2xl border-2 border-blue-300 bg-white p-5 shadow-md" data-testid="crs-results">
          {/* Impression / PDF : seule cette zone est imprimée ; l'en-tête ci-dessous n'apparaît qu'à l'impression. */}
          <style>{`.crs-print-only{display:none}@media print{body *{visibility:hidden!important}#crs-print-area,#crs-print-area *{visibility:visible!important}#crs-print-area{position:absolute;left:0;top:0;width:100%;border:0;box-shadow:none}.crs-no-print{display:none!important}.crs-print-only{display:block!important}}`}</style>
          <div className="crs-print-only" data-testid="crs-print-header">
            <p className="text-lg font-black">3M TRAVEL AGENCY — Estimation du score CRS (Entrée express)</p>
            <p className="text-xs text-slate-600">Établie le {new Date().toLocaleDateString("fr-FR")} avec la grille IRCC du 3 novembre 2026. Estimation indicative : en cas de divergence, le système Entrée express d’IRCC prévaut.</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="crs-results-title" className="text-xl font-black text-slate-950">Vos résultats</h3>
              <p className="mt-1 text-sm text-slate-600">Tous les candidats inscrits à Entrée express obtiennent une note sur {fmt(CRS_TOTAL_MAX)}, déterminée à partir des quatre éléments de la formule du SCG.</p>
            </div>
            <p className="text-right" data-testid="crs-total"><span className="text-5xl font-black text-blue-900">{breakdown.total}</span><span className="ml-1 text-lg font-semibold text-slate-600">/ {fmt(CRS_TOTAL_MAX)}</span></p>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="crs-summary-tiles" aria-label="Répartition de la note estimée">
            {[
              { label: "Profil principal", points: breakdown.coreHumanCapital, max: breakdown.coreHumanCapitalMax },
              { label: result.withSpouse ? "Conjoint" : "Conjoint (non compté)", points: breakdown.spouseFactors, max: result.withSpouse ? 40 : 0 },
              { label: "Transfert des compétences", points: breakdown.skillTransferability, max: 100 },
              { label: "Points supplémentaires", points: breakdown.additionalPoints, max: 600 },
            ].map((tile) => (
              <li key={tile.label} className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                <p className="text-[11px] font-bold leading-4 text-slate-700">{tile.label}</p>
                <p className="mt-1 text-xl font-black text-blue-900">{tile.points}{tile.max > 0 ? <span className="text-xs font-semibold text-slate-600"> / {tile.max}</span> : null}</p>
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="crs-estimate-disclaimer">
            <strong>Note estimée, à titre indicatif.</strong> Elle ne confirme ni votre admissibilité à Entrée express, ni une invitation à présenter une demande de résidence permanente : seul IRCC décide, sur la base de vos documents, et le résultat du système Entrée express prévaut.
          </p>

          <p className="crs-no-print rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950" data-testid="crs-fsw-link">Cette note CRS classe les profils déjà dans le bassin. Pour y entrer par le Programme des travailleurs qualifiés (fédéral), il faut aussi <strong>67 points sur 100</strong> à la grille de sélection : <a className="font-bold underline" href="#grille-67-points">calculer ma grille de 67 points</a>.</p>

          {resultSections(breakdown, result.withSpouse).map((section) => (
            <div key={section.title} className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-black text-slate-950">{section.title}</h4>
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {section.lines.map((line) => (
                  <li key={line.label} className={`flex justify-between gap-4 py-1.5 ${line.sub ? "pl-5 text-slate-600" : "text-slate-800"}`}><span>{line.label}</span><strong>{line.points}</strong></li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between gap-4 border-t border-slate-200 pt-2 text-sm font-black text-blue-900"><span>{section.subtotalLabel}</span><span>{section.subtotal}</span></p>
            </div>
          ))}
          <p className="flex items-center justify-between gap-4 rounded-xl bg-blue-900 px-4 py-3 text-base font-black text-white"><span>Note totale du SCG</span><span>{breakdown.total} / {fmt(CRS_TOTAL_MAX)}</span></p>
          {breakdown.labourMarketSource === "job_offer" && <p className="text-xs text-slate-600">Pour le facteur d’intégration sur le marché du travail, l’offre d’emploi ({breakdown.jobOfferPoints} points) vaut plus que votre expérience canadienne ({breakdown.canadianExperience + breakdown.highWageExperience} points) : IRCC retient la plus élevée.</p>}

          {levers.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" data-testid="crs-levers">
              <h4 className="text-sm font-black text-emerald-950">Ce qui pourrait augmenter votre note</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-950">
                {levers.map((lever) => <li key={lever.label} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /><span>{lever.label} : <strong>+{lever.gain} points</strong></span></li>)}
              </ul>
              <p className="mt-2 text-xs text-emerald-900/80">Écarts calculés avec la même grille. Ce sont des simulations, pas des promesses : seul IRCC fixe la note de chaque ronde d’invitations.</p>
            </div>
          )}

          <p className="text-[11px] leading-5 text-slate-500">Grille IRCC en vigueur depuis le 3 novembre 2026, relue le {new Date(CRS_SOURCE.verifiedAt).toLocaleDateString("fr-FR")}. {CRS_SOURCE.note} Les niveaux de langue sont convertis avec les tranches de notes officielles. Résultat indicatif : en cas de divergence, le système Entrée express prévaut. <a className="underline" href={CRS_SOURCE.url} target="_blank" rel="noreferrer noopener">Voir les critères du SCG sur Canada.ca</a></p>

          {pdfState === "error" && <p role="alert" className="crs-no-print rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950" data-testid="crs-pdf-error">Le PDF n’a pas pu être généré sur cet appareil. Utilisez « Imprimer » puis « Enregistrer au format PDF », ou copiez le résultat.</p>}
          <div className="crs-no-print flex flex-wrap gap-3">
            <button type="button" onClick={downloadPdf} disabled={pdfState === "working"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60" data-testid="crs-download-pdf"><Download className="h-4 w-4" aria-hidden="true" />{pdfState === "working" ? "Préparation du PDF…" : "Télécharger le PDF"}</button>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50" data-testid="crs-print"><Printer className="h-4 w-4" aria-hidden="true" />Imprimer</button>
            <a href={`https://wa.me/237698104832?text=${encodeURIComponent(`${summaryText} Je souhaite l’avis d’un conseiller 3M TRAVEL AGENCY.`)}`} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800" data-testid="crs-share-whatsapp"><MessageCircle className="h-4 w-4" aria-hidden="true" />Demander l’avis d’un conseiller (WhatsApp)</a>
            <button type="button" onClick={copyResult} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50" data-testid="crs-copy"><Copy className="h-4 w-4" aria-hidden="true" />{copied ? "Résultat copié" : "Copier le résultat"}</button>
            <a href="/evaluation?destination=canada" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-800" data-testid="crs-evaluation-cta">Demander une évaluation de mon profil</a>
            <button type="button" onClick={() => setScenario((current) => current ?? { ...answers, firstBands: { ...answers.firstBands }, secondBands: { ...answers.secondBands }, spouseBands: { ...answers.spouseBands } })} aria-expanded={scenario !== null} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-400 bg-amber-50 px-5 py-2.5 text-sm font-black text-amber-950 hover:bg-amber-100" data-testid="crs-compare-open"><GitCompareArrows className="h-4 w-4" aria-hidden="true" />Comparer deux scénarios</button>
            <a href={IRCC_TOOL_URL} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-50"><ExternalLink className="h-4 w-4" aria-hidden="true" />Comparer avec l’outil officiel</a>
          </div>
        </section>
      )}
      {scenario && (
        <section aria-labelledby="crs-compare-title" className="space-y-4 rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-md sm:p-5" data-testid="crs-compare">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="crs-compare-title" className="text-xl font-black text-slate-950">Comparer deux scénarios</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">Le <strong>scénario A</strong> est votre profil ci-dessus. Le <strong>scénario B</strong> en est une copie : changez seulement ce que vous voulez tester (par exemple la note d’expression orale de votre TCF Canada) et lisez la différence. C’est une simulation : ni une prévision, ni une garantie, ni un engagement d’IRCC.</p>
            </div>
            <button type="button" onClick={() => setScenario(null)} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50" data-testid="crs-compare-close">Fermer la comparaison</button>
          </div>

          {comparison && comparison.ok === false && (
            <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" data-testid="crs-compare-missing">
              <p className="font-black"><AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />{comparison.reason === "a_incomplete" ? "Complétez d’abord votre profil (scénario A) :" : "Complétez le scénario B pour voir la différence :"}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">{comparison.missing.map((entry) => <li key={entry}>{entry}</li>)}</ul>
            </div>
          )}

          {comparison && comparison.ok === true && (
            <div className="space-y-4" data-testid="crs-compare-result" aria-live="polite">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-600">Scénario A</p><p className="text-2xl font-black text-slate-900" data-testid="crs-compare-a">{comparison.totalA}</p></div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-600">Scénario B</p><p className="text-2xl font-black text-slate-900" data-testid="crs-compare-b">{comparison.totalB}</p></div>
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3"><p className="text-[11px] font-bold text-slate-700">Différence</p><p className={`text-2xl font-black ${deltaTone(comparison.delta)}`} data-testid="crs-compare-delta">{signed(comparison.delta)}</p></div>
              </div>

              {comparison.identical ? (
                <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950" data-testid="crs-compare-identical">Les deux scénarios sont identiques. Modifiez une réponse du scénario B pour voir l’effet sur la note.</p>
              ) : (
                <>
                  <div>
                    <h4 className="text-sm font-black text-slate-950">Réponses modifiées</h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-800" data-testid="crs-compare-answers">
                      {comparison.changedFields.map((field) => {
                        const change = describeAnswerChange(field, answers, scenario);
                        return <li key={field} className="flex flex-wrap items-center gap-x-2 rounded-lg bg-slate-50 px-3 py-2"><strong>{change.label} :</strong><span>{change.from}</span><ArrowRight className="h-4 w-4 text-slate-500" aria-hidden="true" /><span className="font-bold">{change.to}</span></li>;
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-950">Rubriques de la note qui changent</h4>
                    {comparison.changedLines.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-700" data-testid="crs-compare-no-line">Aucune rubrique ne change : la réponse modifiée ne change pas les points (par exemple parce que la tranche de notes reste la même ou qu’un plafond est déjà atteint).</p>
                    ) : (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-left text-sm" data-testid="crs-compare-lines">
                          <thead><tr className="border-b border-slate-200 text-xs text-slate-600"><th className="py-1.5 pr-3 font-bold">Rubrique</th><th className="px-2 py-1.5 text-right font-bold">A</th><th className="px-2 py-1.5 text-right font-bold">B</th><th className="py-1.5 pl-2 text-right font-bold">Écart</th></tr></thead>
                          <tbody>
                            {comparison.changedLines.map((line) => (
                              <tr key={`${line.section}|${line.label}`} className="border-b border-slate-100"><td className="py-1.5 pr-3 text-slate-800">{line.label}</td><td className="px-2 py-1.5 text-right">{line.a}</td><td className="px-2 py-1.5 text-right">{line.b}</td><td className={`py-1.5 pl-2 text-right font-black ${deltaTone(line.delta)}`}>{signed(line.delta)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
              <p className="text-xs leading-5 text-slate-600" data-testid="crs-compare-disclaimer">Cette comparaison utilise la même grille que le résultat principal. Elle montre l’effet d’un changement sur la note estimée : elle ne prédit aucune note de ronde d’invitations et ne confirme ni votre admissibilité, ni une invitation. <a className="font-semibold text-blue-800 underline" href={IRCC_TOOL_URL} target="_blank" rel="noreferrer noopener">Vérifier avec l’outil officiel d’IRCC</a></p>
            </div>
          )}
          <details open className="rounded-xl border border-slate-200" data-testid="crs-compare-form">
            <summary className="flex min-h-11 cursor-pointer items-center px-3 py-2 text-sm font-black text-slate-900">Réponses du scénario B (les réponses modifiées sont signalées)</summary>
            <div className="space-y-3 border-t border-slate-200 p-3">
              <CrsQuestions answers={scenario} setAnswers={setScenario as React.Dispatch<React.SetStateAction<CrsOfficialAnswers>>} prefix="crs-b" changedFields={scenarioChanged} />
              <button type="button" onClick={() => setScenario({ ...answers, firstBands: { ...answers.firstBands }, secondBands: { ...answers.secondBands }, spouseBands: { ...answers.spouseBands } })} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50" data-testid="crs-compare-reset"><RotateCcw className="h-4 w-4" aria-hidden="true" />Revenir au profil A</button>
            </div>
          </details>
        </section>
      )}
    </section>
  );
}
