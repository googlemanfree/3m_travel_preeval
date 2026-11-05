import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Download, ExternalLink, Info, MessageCircle, Printer, RotateCcw, Sparkles } from "lucide-react";
import { ALL_CRS_TESTS, CRS_ABILITIES, CRS_TEST_BANDS, CRS_TEST_LABELS, secondLanguageTests, type CrsAbility, type CrsLanguageTest } from "@shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, MARITAL_OPTIONS, buildCrsProfileFromOfficialAnswers, countsAsWithSpouse, isMarried, type CrsOfficialAnswers } from "@shared/crsOfficialAnswers";
import { CRS_SOURCE, CRS_TOTAL_MAX, computeCrsScore } from "@shared/crsScore";
import { improvementLevers, resultSections } from "@/lib/crsResultModel";
import { CRS_TIPS, tipSummary } from "@/lib/crsTips";

/**
 * Calculatrice CRS « comme canada.ca » : les mêmes questions, dans le même ordre, avec les mêmes conditions que l'outil officiel d'IRCC
 * « Vérifiez votre note », et un résultat présenté comme le sien (facteurs de base, conjoint, transfert des compétences, points
 * supplémentaires, note sur 1 270). Grille du 3 novembre 2026 (voir shared/crsScore.ts). Estimation : le système Entrée express prévaut.
 */
const IRCC_TOOL_URL = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html";
const STORAGE_KEY = "3m-crs-official-answers-v1";

const EDUCATION_CHOICES = [
  { value: "less_than_secondary", label: "Aucun, études secondaires non complétées (école secondaire)" },
  { value: "secondary", label: "Diplôme d’études secondaires" },
  { value: "one_year_postsecondary", label: "Programme d’un an d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement" },
  { value: "two_year_postsecondary", label: "Programme de deux ans d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement" },
  { value: "bachelor_or_three_year", label: "Baccalauréat (programme de trois ans ou plus d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement)" },
  { value: "two_or_more_credentials", label: "Au moins deux certificats, grades ou diplômes. Au moins l’un de ces diplômes a été obtenu à la suite de la réussite d’un programme d’études postsecondaires d’au moins trois ans" },
  { value: "master_or_professional", label: "Maîtrise ou diplôme professionnel nécessaire pour pratiquer une profession réglementée" },
  { value: "doctoral", label: "Diplôme universitaire au niveau du doctorat (Ph. D.)" },
];
const AGE_CHOICES = Array.from({ length: 29 }, (_, index) => 17 + index).map((age) => ({ value: String(age), label: age === 17 ? "17 ans ou moins" : age === 45 ? "45 ans ou plus" : `${age} ans` }));
const YEARS_CHOICES = [
  { value: "0", label: "Aucune ou moins d’un an" }, { value: "1", label: "1 an" }, { value: "2", label: "2 ans" },
  { value: "3", label: "3 ans" }, { value: "4", label: "4 ans" }, { value: "5", label: "5 ans ou plus" },
];
const FOREIGN_YEARS_CHOICES = [{ value: "0", label: "Aucune ou moins d’un an" }, { value: "1", label: "1 an" }, { value: "2", label: "2 ans" }, { value: "3", label: "3 ans ou plus" }];
const YES_NO = [{ value: "no", label: "Non" }, { value: "yes", label: "Oui" }];
const NO_YES_FR = YES_NO;
const CANADIAN_CREDENTIAL_LEVELS = [
  { value: "secondary_or_less", label: "École secondaire ou moins" },
  { value: "one_two_year", label: "Diplôme ou certificat d’un ou de deux ans" },
  { value: "three_year_or_more", label: "Degré, diplôme ou certificat de trois ans ou plus OU une maîtrise, un doctorat ou un diplôme professionnel avec au moins une année de scolarité" },
];
const JOB_OFFER_LEVELS = [
  { value: "2", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 2 fois supérieur au salaire médian" },
  { value: "1.5", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 1,5 fois supérieur, mais inférieur à 2 fois, au salaire médian" },
  { value: "1.3", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 1,3 fois supérieur, mais inférieur à 1,5 fois, au salaire médian" },
];

const selectClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

/** Une question et son infobulle : survol (texte court) ou clic / clavier (explication complète), y compris sur téléphone. */
function Question({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const tip = CRS_TIPS[id];
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-bold leading-6 text-slate-900">{label}</label>
        {tip ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={`${id}-tip`}
            aria-label={open ? "Masquer l’aide de cette question" : "Afficher l’aide de cette question"}
            title={tipSummary(tip)}
            className="crs-no-print mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            data-testid={`${id}-tip-button`}
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {tip && open ? <p id={`${id}-tip`} role="note" className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-700" data-testid={`${id}-tip`}>{tip}</p> : null}
      {children}
    </div>
  );
}

function Choice({ id, value, onChange, options, placeholder = "Sélectionner…" }: { id: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

/** Test de langue (cinq tests officiels) puis une note par compétence, comme l'outil d'IRCC. */
function LanguageBlock({ idPrefix, test, bands, tests, onTest, onBand }: { idPrefix: string; test: string; bands: Record<CrsAbility, string>; tests: CrsLanguageTest[]; onTest: (value: string) => void; onBand: (ability: CrsAbility, value: string) => void }) {
  const chosen = tests.includes(test as CrsLanguageTest) ? (test as CrsLanguageTest) : null;
  return (
    <div className="mt-2 space-y-3">
      <Choice id={`${idPrefix}-test`} value={test} onChange={onTest} options={[...tests.map((entry) => ({ value: entry, label: CRS_TEST_LABELS[entry] })), ...(idPrefix === "crs-first" ? [] : [{ value: "none", label: "Sans objet" }])]} />
      {chosen ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {CRS_ABILITIES.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`${idPrefix}-${key}`} className="block text-xs font-semibold text-slate-700">{label} :</label>
              <Choice id={`${idPrefix}-${key}`} value={bands[key]} onChange={(value) => onBand(key, value)} options={CRS_TEST_BANDS[chosen][key].map((entry, index) => ({ value: String(index), label: entry.label }))} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

  const set = <K extends keyof CrsOfficialAnswers>(key: K, value: CrsOfficialAnswers[K]) => { setSubmitted(false); setAnswers((previous) => ({ ...previous, [key]: value })); };
  const setBand = (group: "firstBands" | "secondBands" | "spouseBands", ability: CrsAbility, value: string) => set(group, { ...answers[group], [ability]: value });
  const withSpouse = countsAsWithSpouse(answers);
  const result = useMemo(() => buildCrsProfileFromOfficialAnswers(answers), [answers]);
  const breakdown = result.complete ? computeCrsScore(result.profile) : null;
  const levers = result.complete && breakdown ? improvementLevers(result.profile, breakdown) : [];
  const firstTest = ALL_CRS_TESTS.includes(answers.firstTest as CrsLanguageTest) ? (answers.firstTest as CrsLanguageTest) : null;
  const liveValidationMessage = result.complete
    ? "Toutes les réponses nécessaires sont renseignées. Vous pouvez calculer votre résultat."
    : `${result.missing.length} réponse${result.missing.length > 1 ? "s" : ""} ${result.missing.length > 1 ? "restent" : "reste"} à renseigner avant le calcul.`;

  const summaryText = breakdown
    ? `Mon score CRS estimé (grille IRCC du 3 novembre 2026) : ${breakdown.total} / ${CRS_TOTAL_MAX}. Facteurs de base ${breakdown.coreHumanCapital}, conjoint ${breakdown.spouseFactors}, transfert des compétences ${breakdown.skillTransferability}, points supplémentaires ${breakdown.additionalPoints}.`
    : "";
  const copyResult = async () => {
    try { await navigator.clipboard.writeText(summaryText); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); }
  };
  const reset = () => { setAnswers(EMPTY_CRS_ANSWERS); setSubmitted(false); };
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
      </div>

      <div
        role="status"
        aria-live="polite"
        data-testid="crs-live-validation"
        className={`rounded-xl border p-3 text-sm ${result.complete ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}
      >
        <span className="font-bold">Validation en temps réel : </span>{liveValidationMessage}
        {!result.complete && <span className="ml-1">Les questions manquantes sont listées après le bouton de calcul.</span>}
      </div>

      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} noValidate>
        <Question id="crs-q1" label="1) Quel est votre état matrimonial ?">
          <Choice id="crs-q1" value={answers.maritalStatus} onChange={(value) => set("maritalStatus", value)} options={[...MARITAL_OPTIONS]} />
        </Question>
        {isMarried(answers.maritalStatus) && (
          <>
            <Question id="crs-q2i" label="2) i. Votre époux ou conjoint de fait est-il citoyen ou résident permanent du Canada ?">
              <Choice id="crs-q2i" value={answers.spouseCitizenOrPr} onChange={(value) => set("spouseCitizenOrPr", value)} options={NO_YES_FR} />
            </Question>
            {answers.spouseCitizenOrPr === "no" && (
              <Question id="crs-q2ii" label="2) ii. Votre époux ou conjoint de fait vous accompagnera-t-il au Canada ?">
                <Choice id="crs-q2ii" value={answers.spouseAccompanies} onChange={(value) => set("spouseAccompanies", value)} options={NO_YES_FR} />
              </Question>
            )}
          </>
        )}
        <Question id="crs-q3" label="3) Quel âge avez-vous ?">
          <Choice id="crs-q3" value={answers.age} onChange={(value) => set("age", value)} options={AGE_CHOICES} />
        </Question>
        <Question id="crs-q4" label="4) Quel niveau d’études avez-vous atteint ?">
          <Choice id="crs-q4" value={answers.education} onChange={(value) => set("education", value)} options={EDUCATION_CHOICES} />
        </Question>
        <Question id="crs-q4b" label="4b) Avez-vous obtenu un certificat, grade ou diplôme canadien ?">
          <Choice id="crs-q4b" value={answers.canadianCredential} onChange={(value) => set("canadianCredential", value)} options={YES_NO} />
        </Question>
        {answers.canadianCredential === "yes" && (
          <Question id="crs-q4c" label="4c) Choisissez la meilleure réponse pour décrire ce niveau d’éducation.">
            <Choice id="crs-q4c" value={answers.canadianCredentialLevel} onChange={(value) => set("canadianCredentialLevel", value)} options={CANADIAN_CREDENTIAL_LEVELS} />
          </Question>
        )}

        <Question id="crs-q5i" label="5) Langues officielles : i. Vos résultats de test linguistique ont-ils moins de deux ans ?">
          <Choice id="crs-q5i" value={answers.languageTestRecent} onChange={(value) => set("languageTestRecent", value)} options={YES_NO} />
        </Question>
        {answers.languageTestRecent === "no" && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950" data-testid="crs-language-note">
            <AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />{result.languageNote}
          </p>
        )}
        {answers.languageTestRecent === "yes" && (
          <>
            <Question id="crs-first-test" label="5) ii. Quel test linguistique avez-vous passé pour votre première langue officielle ?">
              <LanguageBlock idPrefix="crs-first" test={answers.firstTest} bands={answers.firstBands} tests={ALL_CRS_TESTS} onTest={(value) => setAnswers((previous) => ({ ...previous, firstTest: value, firstBands: EMPTY_CRS_ANSWERS.firstBands, secondTest: "", secondBands: EMPTY_CRS_ANSWERS.secondBands }))} onBand={(ability, value) => setBand("firstBands", ability, value)} />
            </Question>
            {firstTest && (
              <Question id="crs-second-test" label="5) iii. Avez-vous d’autres résultats linguistiques ? Si oui, quel test avez-vous passé pour votre seconde langue officielle ?">
                <LanguageBlock idPrefix="crs-second" test={answers.secondTest} bands={answers.secondBands} tests={secondLanguageTests(firstTest)} onTest={(value) => setAnswers((previous) => ({ ...previous, secondTest: value, secondBands: EMPTY_CRS_ANSWERS.secondBands }))} onBand={(ability, value) => setBand("secondBands", ability, value)} />
              </Question>
            )}
          </>
        )}

        <Question id="crs-q6i" label="6) Expérience de travail : i. Au cours des 10 dernières années, combien d’années d’expérience de travail qualifié au Canada avez-vous accumulées ?">
          <Choice id="crs-q6i" value={answers.canadianWorkYears} onChange={(value) => set("canadianWorkYears", value)} options={YEARS_CHOICES} />
        </Question>
        <Question id="crs-q6ii" label="6) ii. Au cours des 10 dernières années, avez-vous au moins 1 an (ou 1 560 heures) d’expérience de travail qualifié au Canada dans un ou plusieurs emplois de la CNP figurant sur la liste des professions à salaire élevé ?">
          <Choice id="crs-q6ii" value={answers.highWageExperience} onChange={(value) => set("highWageExperience", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
        </Question>
        {answers.highWageExperience === "yes" && (
          <>
            <Question id="crs-q6iii" label="6) iii. Cette expérience de travail a-t-elle duré au moins 1 an (ou 1 560 heures) dans un ou plusieurs emplois à salaire élevé dont le salaire était au moins 2 fois supérieur au salaire médian ?">
              <Choice id="crs-q6iii" value={answers.highWage2x} onChange={(value) => set("highWage2x", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
            </Question>
            {answers.highWage2x === "no" && (
              <Question id="crs-q6iv" label="6) iv. Cette expérience de travail a-t-elle duré au moins 1 an (ou 1 560 heures) dans un ou plusieurs emplois à salaire élevé dont le salaire était au moins 1,5 fois supérieur au salaire médian moyen ?">
                <Choice id="crs-q6iv" value={answers.highWage15x} onChange={(value) => set("highWage15x", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
              </Question>
            )}
          </>
        )}
        <Question id="crs-q6v" label="6) v. Au cours des 10 dernières années, combien d’années d’expérience de travail qualifié à l’étranger avez-vous accumulées au total ?">
          <Choice id="crs-q6v" value={answers.foreignWorkYears} onChange={(value) => set("foreignWorkYears", value)} options={FOREIGN_YEARS_CHOICES} />
        </Question>
        <Question id="crs-q7" label="7) Possédez-vous un certificat de compétence d’une province, d’un territoire ou d’un organisme fédéral canadien ?">
          <Choice id="crs-q7" value={answers.certificate} onChange={(value) => set("certificate", value)} options={YES_NO} />
        </Question>
        <Question id="crs-q8" label="8) Avez-vous une offre d’emploi valide pour un emploi dans une catégorie de la CNP figurant dans la liste des professions à salaire élevé ?">
          <Choice id="crs-q8" value={answers.jobOffer} onChange={(value) => set("jobOffer", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
        </Question>
        {answers.jobOffer === "yes" && (
          <Question id="crs-q8a" label="8a) À quel niveau de profession à salaire élevé l’offre d’emploi correspond-elle ?">
            <Choice id="crs-q8a" value={answers.jobOfferLevel} onChange={(value) => set("jobOfferLevel", value)} options={JOB_OFFER_LEVELS} />
          </Question>
        )}

        <h4 className="pt-2 text-sm font-black uppercase tracking-wide text-blue-800">Points supplémentaires</h4>
        <Question id="crs-q9" label="9) Avez-vous un certificat de désignation d’une province ou d’un territoire ?">
          <Choice id="crs-q9" value={answers.nomination} onChange={(value) => set("nomination", value)} options={YES_NO} />
        </Question>
        <Question id="crs-q10i" label="10) Est-ce que vous ou votre époux/conjoint de fait (si celui-ci vous accompagne au Canada) avez au moins un frère ou une sœur habitant au Canada qui est un citoyen ou un résident permanent ?">
          <Choice id="crs-q10i" value={answers.sibling} onChange={(value) => set("sibling", value)} options={YES_NO} />
        </Question>

        {withSpouse && (
          <>
            <h4 className="pt-2 text-sm font-black uppercase tracking-wide text-blue-800">Votre époux ou conjoint de fait</h4>
            <Question id="crs-q11" label="11) Quel est le niveau de scolarité le plus élevé de votre époux ou conjoint de fait (diplôme canadien ou évaluation des diplômes d’études) ?">
              <Choice id="crs-q11" value={answers.spouseEducation} onChange={(value) => set("spouseEducation", value)} options={EDUCATION_CHOICES} />
            </Question>
            <Question id="crs-q12" label="12) Au cours des dix dernières années, combien d’années d’expérience de travail qualifié au Canada votre époux ou conjoint de fait possède-t-il ?">
              <Choice id="crs-q12" value={answers.spouseCanadianWorkYears} onChange={(value) => set("spouseCanadianWorkYears", value)} options={YEARS_CHOICES} />
            </Question>
            <Question id="crs-q13" label="13) i) Votre époux ou conjoint de fait a-t-il passé un test linguistique ? Si oui, lequel ?">
              <LanguageBlock idPrefix="crs-spouse" test={answers.spouseTest} bands={answers.spouseBands} tests={ALL_CRS_TESTS} onTest={(value) => setAnswers((previous) => ({ ...previous, spouseTest: value, spouseBands: EMPTY_CRS_ANSWERS.spouseBands }))} onBand={(ability, value) => setBand("spouseBands", ability, value)} />
            </Question>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" data-testid="crs-calculate">
            <Sparkles className="h-4 w-4" aria-hidden="true" />Calculer vos résultats
          </button>
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
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
            <a href="/evaluation?destination=canada" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-800">Faire évaluer mon profil Canada</a>
            <a href={IRCC_TOOL_URL} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-50"><ExternalLink className="h-4 w-4" aria-hidden="true" />Comparer avec l’outil officiel</a>
          </div>
        </section>
      )}
    </section>
  );
}
