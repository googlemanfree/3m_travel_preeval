import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Info, RotateCcw, Sparkles } from "lucide-react";
import { ALL_CRS_TESTS, secondLanguageTests, type CrsAbility, type CrsLanguageTest } from "@shared/crsLanguageTests";
import { EMPTY_FSW_ANSWERS, buildFswProfile, type FswAnswers } from "@shared/fswAnswers";
import { FSW_MAX, FSW_PASS_MARK, FSW_SOURCE, computeFswScore, type FswProfile } from "@shared/fswGrid";
import { Choice, EDUCATION_CHOICES, LanguageBlock, Question, YES_NO } from "@/components/CrsQuestions";

/**
 * Grille de sélection du Programme des travailleurs qualifiés (fédéral) : six facteurs, note sur 100, seuil de 67 points (shared/fswGrid.ts).
 * Ces points ne sont pas ceux du SCG/CRS : ils décident si l'on peut entrer dans le bassin Entrée express par ce programme.
 */
const STORAGE_KEY = "3m-fsw-grid-answers-v1";
const CRS_STORAGE_KEY = "3m-crs-official-answers-v1";
const IRCC_FSW_URL = FSW_SOURCE.url;
const AGE_CHOICES = [
  { value: "17", label: "Moins de 18 ans" }, { value: "18", label: "De 18 à 35 ans" },
  ...Array.from({ length: 11 }, (_, index) => 36 + index).map((age) => ({ value: String(age), label: `${age} ans` })),
  { value: "47", label: "47 ans ou plus" },
];
const EXPERIENCE_CHOICES = [
  { value: "0", label: "Moins d’un an" }, { value: "1", label: "1 an" }, { value: "2", label: "2 ans" }, { value: "3", label: "3 ans" },
  { value: "4", label: "4 ans" }, { value: "5", label: "5 ans" }, { value: "6", label: "6 ans ou plus" },
];

/** Âge de la calculatrice CRS (17 à 45 ans) → tranche de la grille des 67 points. */
const fswAgeFromCrs = (age: string): string => (/^\d+$/.test(age) ? (Number(age) <= 17 ? "17" : Number(age) <= 35 ? "18" : String(Math.min(47, Number(age)))) : "");

type Lever = { label: string; gain: number };
/** Simulations : points gagnés si l'on obtenait chacun de ces éléments (même grille, un élément à la fois). */
function levers(profile: FswProfile, current: number): Lever[] {
  const attempts: Array<[string, Partial<FswProfile>, boolean]> = [
    ["Seconde langue officielle à CLB 5 ou plus aux quatre compétences", { secondLanguage: { speaking: 5, listening: 5, reading: 5, writing: 5 } }, profile.secondLanguage === null || Math.min(...Object.values(profile.secondLanguage)) < 5],
    ["Première langue officielle à CLB 9 ou plus aux quatre compétences", { firstLanguage: { speaking: Math.max(9, profile.firstLanguage.speaking), listening: Math.max(9, profile.firstLanguage.listening), reading: Math.max(9, profile.firstLanguage.reading), writing: Math.max(9, profile.firstLanguage.writing) } }, Math.min(...Object.values(profile.firstLanguage)) < 9],
    ["Une offre d’emploi réservé valide au Canada", { arrangedEmployment: true }, !profile.arrangedEmployment],
    ["Un an de travail qualifié au Canada (autorisé à y travailler)", { ownCanadianWork: true }, !profile.ownCanadianWork],
    ["Deux années d’études à temps plein au Canada", { ownCanadianStudy: true }, !profile.ownCanadianStudy],
    ["Un parent au Canada (citoyen ou résident permanent)", { relativeInCanada: true }, !profile.relativeInCanada],
    ["Une année d’expérience qualifiée de plus", { skilledExperienceYears: profile.skilledExperienceYears + 1 }, profile.skilledExperienceYears < 6],
  ];
  return attempts
    .filter(([, , applicable]) => applicable)
    .map(([label, patch]) => ({ label, gain: computeFswScore({ ...profile, ...patch }).total - current }))
    .filter((lever) => lever.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 5);
}

export default function FswGridCalculator() {
  const [answers, setAnswers] = useState<FswAnswers>(EMPTY_FSW_ANSWERS);
  const [submitted, setSubmitted] = useState(false);
  const [hasCrsAnswers, setHasCrsAnswers] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setAnswers({ ...EMPTY_FSW_ANSWERS, ...(JSON.parse(saved) as Partial<FswAnswers>) });
      const crs = window.localStorage.getItem(CRS_STORAGE_KEY);
      setHasCrsAnswers(Boolean(crs && JSON.parse(crs)?.education));
    } catch { /* stockage indisponible : le calcul fonctionne sans */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch { /* ignoré */ }
  }, [answers]);

  const set = <K extends keyof FswAnswers>(key: K, value: FswAnswers[K]) => { setSubmitted(false); setAnswers((previous) => ({ ...previous, [key]: value })); };
  const setBand = (group: "firstBands" | "secondBands", ability: CrsAbility, value: string) => { setSubmitted(false); setAnswers((previous) => ({ ...previous, [group]: { ...previous[group], [ability]: value } })); };
  const built = useMemo(() => buildFswProfile(answers), [answers]);
  const breakdown = built.complete ? computeFswScore(built.profile) : null;
  const suggestions = built.complete && breakdown ? levers(built.profile, breakdown.total) : [];
  const firstTest = ALL_CRS_TESTS.includes(answers.firstTest as CrsLanguageTest) ? (answers.firstTest as CrsLanguageTest) : null;
  const spouse = answers.hasSpouse === "yes";

  const importFromCrs = () => {
    try {
      const crs = JSON.parse(window.localStorage.getItem(CRS_STORAGE_KEY) || "{}") as Record<string, any>;
      setSubmitted(false);
      setAnswers((previous) => ({
        ...previous,
        age: fswAgeFromCrs(String(crs.age ?? "")) || previous.age,
        education: crs.education || previous.education,
        firstTest: crs.firstTest || previous.firstTest, firstBands: crs.firstBands ?? previous.firstBands,
        secondTest: crs.secondTest ?? previous.secondTest, secondBands: crs.secondBands ?? previous.secondBands,
        hasSpouse: crs.maritalStatus === "married" || crs.maritalStatus === "common_law" ? (crs.spouseAccompanies === "yes" && crs.spouseCitizenOrPr === "no" ? "yes" : previous.hasSpouse) : crs.maritalStatus ? "no" : previous.hasSpouse,
      }));
    } catch { /* réponses CRS illisibles : on ne change rien */ }
  };
  const reset = () => { setAnswers(EMPTY_FSW_ANSWERS); setSubmitted(false); };

  const tiles = breakdown ? [
    { label: "Langues", points: breakdown.language, max: 28 }, { label: "Études", points: breakdown.education, max: 25 }, { label: "Expérience", points: breakdown.experience, max: 15 },
    { label: "Âge", points: breakdown.age, max: 12 }, { label: "Emploi réservé", points: breakdown.arrangedEmployment, max: 10 }, { label: "Adaptabilité", points: breakdown.adaptability, max: 10 },
  ] : [];
  const blocking = breakdown ? [
    !breakdown.minimums.firstLanguageClb7 && "la première langue officielle doit être au moins à CLB 7 dans les quatre compétences",
    !breakdown.minimums.oneYearExperience && "il faut au moins 1 an (1 560 heures) d’expérience de travail qualifié (TEER 0 à 3) au cours des 10 dernières années",
  ].filter(Boolean) as string[] : [];

  return (
    <section aria-labelledby="fsw-title" className="space-y-5" data-testid="fsw-grid-calculator">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 id="fsw-title" className="text-xl font-black text-slate-950">Grille de sélection : 67 points sur 100 pour être admissible</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">Pour entrer dans le bassin Entrée express par le <strong>Programme des travailleurs qualifiés (fédéral)</strong>, IRCC note votre profil sur <strong>{FSW_MAX} points</strong> avec six facteurs (langues 28, études 25, expérience 15, âge 12, emploi réservé 10, adaptabilité 10) : il en faut <strong>{FSW_PASS_MARK} ou plus</strong>. Ces points sont <strong>différents</strong> de la note CRS sur 1 270, qui sert ensuite à classer les profils déjà dans le bassin.</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">Grille lue sur canada.ca le {new Date(FSW_SOURCE.verifiedAt).toLocaleDateString("fr-FR")}. Résultat indicatif : IRCC n’a pas d’outil public pour ces points ; le système Entrée express et les officiers d’IRCC prévalent. <a className="font-semibold text-blue-800 underline" href={IRCC_FSW_URL} target="_blank" rel="noreferrer noopener">Voir la grille officielle d’IRCC</a></p>
        {hasCrsAnswers && (
          <button type="button" onClick={importFromCrs} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-900 hover:bg-blue-50" data-testid="fsw-import-crs">Reprendre mes réponses du calculateur CRS (âge, études, langues, conjoint)</button>
        )}
      </div>

      <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} noValidate>
        <Question id="fsw-q1" label="1) Quel âge avez-vous (le jour du dépôt de votre demande) ?"><Choice id="fsw-q1" value={answers.age} onChange={(value) => set("age", value)} options={AGE_CHOICES} /></Question>
        <Question id="fsw-q2" label="2) Quel est votre niveau d’études ? (un diplôme obtenu hors du Canada doit avoir une évaluation des diplômes d’études, EDE)"><Choice id="fsw-q2" value={answers.education} onChange={(value) => set("education", value)} options={EDUCATION_CHOICES} /></Question>
        <Question id="fsw-first-test" label="3) Quel test avez-vous passé pour votre première langue officielle ?">
          <LanguageBlock idPrefix="fsw-first" test={answers.firstTest} bands={answers.firstBands} tests={ALL_CRS_TESTS} onTest={(value) => { setSubmitted(false); setAnswers((previous) => {
            const keep = previous.secondTest === "none" || value === previous.firstTest || (ALL_CRS_TESTS.includes(value as CrsLanguageTest) && secondLanguageTests(value as CrsLanguageTest).includes(previous.secondTest as CrsLanguageTest));
            return { ...previous, firstTest: value, firstBands: EMPTY_FSW_ANSWERS.firstBands, secondTest: keep ? previous.secondTest : "", secondBands: keep ? previous.secondBands : EMPTY_FSW_ANSWERS.secondBands };
          }); }} onBand={(ability, value) => setBand("firstBands", ability, value)} />
        </Question>
        {firstTest && (
          <Question id="fsw-second-test" label="4) Avez-vous aussi passé un test dans l’autre langue officielle ? (4 points si CLB 5 ou plus aux quatre compétences)">
            <LanguageBlock idPrefix="fsw-second" test={answers.secondTest} bands={answers.secondBands} tests={secondLanguageTests(firstTest)} onTest={(value) => { setSubmitted(false); setAnswers((previous) => ({ ...previous, secondTest: value, secondBands: EMPTY_FSW_ANSWERS.secondBands })); }} onBand={(ability, value) => setBand("secondBands", ability, value)} />
          </Question>
        )}
        <Question id="fsw-q5" label="5) Combien d’années d’expérience de travail qualifié (TEER 0, 1, 2 ou 3, rémunéré, au Canada ou à l’étranger) avez-vous au cours des 10 dernières années ?"><Choice id="fsw-q5" value={answers.experienceYears} onChange={(value) => set("experienceYears", value)} options={EXPERIENCE_CHOICES} /></Question>
        <Question id="fsw-q6" label="6) Avez-vous une offre d’emploi réservé : au moins 1 an, temps plein (30 h/semaine), non saisonnier, d’un seul employeur canadien, TEER 0 à 3 ? (aucune EIMT n’est exigée)"><Choice id="fsw-q6" value={answers.arrangedEmployment} onChange={(value) => set("arrangedEmployment", value)} options={YES_NO} /></Question>
        <Question id="fsw-q7" label="7) Un époux ou conjoint de fait vous accompagnera-t-il au Canada ?"><Choice id="fsw-q7" value={answers.hasSpouse} onChange={(value) => set("hasSpouse", value)} options={YES_NO} /></Question>
        {spouse && (
          <>
            <Question id="fsw-q7a" label="7 a) Votre époux ou conjoint de fait a-t-il CLB 4 ou plus aux quatre compétences (test de moins de 2 ans) ?"><Choice id="fsw-q7a" value={answers.spouseLanguageClb4} onChange={(value) => set("spouseLanguageClb4", value)} options={YES_NO} /></Question>
            <Question id="fsw-q7b" label="7 b) A-t-il fait au moins 2 années d’études à temps plein au Canada (programme d’au moins 2 ans) ?"><Choice id="fsw-q7b" value={answers.spouseCanadianStudy} onChange={(value) => set("spouseCanadianStudy", value)} options={YES_NO} /></Question>
            <Question id="fsw-q7c" label="7 c) A-t-il travaillé au moins 1 an à temps plein au Canada, avec autorisation de travail ?"><Choice id="fsw-q7c" value={answers.spouseCanadianWork} onChange={(value) => set("spouseCanadianWork", value)} options={YES_NO} /></Question>
          </>
        )}
        <Question id="fsw-q8" label="8) Avez-vous fait au moins 2 années d’études à temps plein au Canada (programme d’au moins 2 ans, bons résultats) ?"><Choice id="fsw-q8" value={answers.ownCanadianStudy} onChange={(value) => set("ownCanadianStudy", value)} options={YES_NO} /></Question>
        <Question id="fsw-q9" label="9) Avez-vous travaillé au moins 1 an à temps plein au Canada (TEER 0 à 3, avec autorisation de travail) ?"><Choice id="fsw-q9" value={answers.ownCanadianWork} onChange={(value) => set("ownCanadianWork", value)} options={YES_NO} /></Question>
        <Question id="fsw-q10" label="10) Vous ou votre conjoint avez-vous un parent au Canada (citoyen ou résident permanent de 18 ans ou plus : parent, grand-parent, enfant, petit-enfant, frère ou sœur, oncle ou tante, neveu ou nièce) ?"><Choice id="fsw-q10" value={answers.relativeInCanada} onChange={(value) => set("relativeInCanada", value)} options={YES_NO} /></Question>

        <p className="pt-1 text-xs text-slate-600" data-testid="fsw-remaining" aria-live="polite">
          {built.complete ? "Toutes les questions ont une réponse : vous pouvez calculer vos points." : `Il reste ${built.missing.length} question${built.missing.length > 1 ? "s" : ""} à répondre. Aucune réponse manquante n’est comptée comme « non » ou comme zéro.`}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white shadow transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:w-auto" data-testid="fsw-calculate"><Sparkles className="h-4 w-4" aria-hidden="true" />Calculer mes points sur 100</button>
          <button type="button" onClick={reset} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 sm:w-auto"><RotateCcw className="h-4 w-4" aria-hidden="true" />Recommencer</button>
        </div>
      </form>

      {submitted && !built.complete && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" data-testid="fsw-missing">
          <p className="font-black"><AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />Répondez d’abord aux questions suivantes :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{built.missing.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>
      )}

      {submitted && breakdown && (
        <section aria-labelledby="fsw-results-title" className="space-y-4 rounded-2xl border-2 border-blue-300 bg-white p-4 shadow-md sm:p-5" data-testid="fsw-results">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="fsw-results-title" className="text-xl font-black text-slate-950">Votre grille de sélection</h3>
              <p className="mt-1 text-sm text-slate-600">Seuil à atteindre : {FSW_PASS_MARK} points sur {FSW_MAX}.</p>
            </div>
            <p className="text-right" data-testid="fsw-total"><span className="text-5xl font-black text-blue-900">{breakdown.total}</span><span className="ml-1 text-lg font-semibold text-slate-600">/ {FSW_MAX}</span></p>
          </div>

          {breakdown.meetsPassMark && breakdown.meetsMinimums && (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-bold text-emerald-950" data-testid="fsw-status"><CheckCircle2 className="mr-1 inline h-4 w-4" aria-hidden="true" />Seuil des {FSW_PASS_MARK} points atteint ({breakdown.total} points).</p>
          )}
          {breakdown.meetsPassMark && !breakdown.meetsMinimums && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" data-testid="fsw-status"><AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" /><strong>{breakdown.total} points, mais une exigence minimale n’est pas remplie :</strong> {blocking.join(" ; ")}. Les points seuls ne suffisent pas.</p>
          )}
          {!breakdown.meetsPassMark && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950" data-testid="fsw-status"><AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" /><strong>Il manque {breakdown.missingPoints} point{breakdown.missingPoints > 1 ? "s" : ""}</strong> pour atteindre {FSW_PASS_MARK}.{blocking.length > 0 ? ` De plus : ${blocking.join(" ; ")}.` : ""}</p>
          )}

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="fsw-tiles" aria-label="Répartition des 100 points">
            {tiles.map((tile) => (
              <li key={tile.label} className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-center"><p className="text-[11px] font-bold leading-4 text-slate-700">{tile.label}</p><p className="mt-1 text-xl font-black text-blue-900">{tile.points}<span className="text-xs font-semibold text-slate-600"> / {tile.max}</span></p></li>
            ))}
          </ul>

          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-black text-slate-950">Détail de l’adaptabilité (maximum 10 points)</h4>
            <ul className="mt-2 divide-y divide-slate-100 text-sm" data-testid="fsw-adaptability">
              {breakdown.adaptabilityElements.map((element) => (
                <li key={element.key} className={`flex justify-between gap-4 py-1.5 ${element.earned ? "text-slate-900" : "text-slate-500"}`}><span>{element.label}</span><strong>{element.earned ? `+${element.points}` : "0"}</strong></li>
              ))}
            </ul>
            {breakdown.adaptabilityBeforeCap > 10 && <p className="mt-2 text-xs text-slate-600">Total des éléments : {breakdown.adaptabilityBeforeCap} points, plafonné à 10 par IRCC.</p>}
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" data-testid="fsw-levers">
              <h4 className="text-sm font-black text-emerald-950">Ce qui pourrait ajouter des points</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-emerald-950">{suggestions.map((lever) => <li key={lever.label} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /><span>{lever.label} : <strong>+{lever.gain} point{lever.gain > 1 ? "s" : ""}</strong></span></li>)}</ul>
              <p className="mt-2 text-xs text-emerald-900/80">Simulations avec la même grille, un élément à la fois : ce ne sont pas des promesses.</p>
            </div>
          )}

          <details className="rounded-xl border border-slate-200 p-4 text-sm">
            <summary className="cursor-pointer font-black text-slate-900"><Info className="mr-1 inline h-4 w-4" aria-hidden="true" />Les 67 points ne suffisent pas : autres exigences minimales</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
              <li>Première langue officielle : CLB 7 ou plus dans les quatre compétences, avec un test reconnu de moins de 2 ans.</li>
              <li>Au moins 1 an (1 560 heures) d’expérience de travail qualifié rémunéré (TEER 0 à 3) dans la même profession principale, au cours des 10 dernières années.</li>
              <li>Études : un diplôme obtenu hors du Canada doit être accompagné d’une évaluation des diplômes d’études.</li>
              <li>Preuve de fonds suffisants (sauf si vous êtes autorisé à travailler au Canada avec une offre d’emploi valide).</li>
              <li>Être admissible au Canada et prévoir de vivre hors du Québec (qui sélectionne ses propres travailleurs qualifiés).</li>
            </ul>
          </details>

          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950" data-testid="fsw-disclaimer"><strong>Résultat indicatif.</strong> Atteindre {FSW_PASS_MARK} points ne confirme ni votre admissibilité au Programme des travailleurs qualifiés (fédéral), ni une invitation à présenter une demande : un officier d’IRCC vérifie vos documents et le système Entrée express prévaut.</p>
          <div className="flex flex-wrap gap-3">
            <a href="/evaluation?destination=canada" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-800" data-testid="fsw-evaluation-cta">Demander une évaluation de mon profil</a>
            <a href={IRCC_FSW_URL} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-50"><ExternalLink className="h-4 w-4" aria-hidden="true" />Voir la grille officielle d’IRCC</a>
          </div>
        </section>
      )}
    </section>
  );
}
