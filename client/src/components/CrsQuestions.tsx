import React, { useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import { ALL_CRS_TESTS, CRS_ABILITIES, CRS_TEST_BANDS, CRS_TEST_LABELS, secondLanguageTests, type CrsAbility, type CrsLanguageTest } from "@shared/crsLanguageTests";
import { EMPTY_CRS_ANSWERS, MARITAL_OPTIONS, buildCrsProfileFromOfficialAnswers, countsAsWithSpouse, isMarried, type CrsOfficialAnswers } from "@shared/crsOfficialAnswers";
import { CRS_TIPS, tipSummary } from "@/lib/crsTips";

/**
 * Les questions de la calculatrice CRS, dans l'ordre et avec les conditions de l'outil officiel d'IRCC. Le même ensemble sert au profil
 * principal (préfixe « crs ») et au scénario B du mode « Comparer deux scénarios » (préfixe « crs-b »), pour que les deux se remplissent
 * exactement de la même façon.
 */
export const EDUCATION_CHOICES = [
  { value: "less_than_secondary", label: "Aucun, études secondaires non complétées (école secondaire)" },
  { value: "secondary", label: "Diplôme d’études secondaires" },
  { value: "one_year_postsecondary", label: "Programme d’un an d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement" },
  { value: "two_year_postsecondary", label: "Programme de deux ans d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement" },
  { value: "bachelor_or_three_year", label: "Baccalauréat (programme de trois ans ou plus d’une université, d’un collège, d’une école technique ou d’une école de métier, ou d’un autre établissement)" },
  { value: "two_or_more_credentials", label: "Au moins deux certificats, grades ou diplômes. Au moins l’un de ces diplômes a été obtenu à la suite de la réussite d’un programme d’études postsecondaires d’au moins trois ans" },
  { value: "master_or_professional", label: "Maîtrise ou diplôme professionnel nécessaire pour pratiquer une profession réglementée" },
  { value: "doctoral", label: "Diplôme universitaire au niveau du doctorat (Ph. D.)" },
];
export const AGE_CHOICES = Array.from({ length: 29 }, (_, index) => 17 + index).map((age) => ({ value: String(age), label: age === 17 ? "17 ans ou moins" : age === 45 ? "45 ans ou plus" : `${age} ans` }));
export const YEARS_CHOICES = [
  { value: "0", label: "Aucune ou moins d’un an" }, { value: "1", label: "1 an" }, { value: "2", label: "2 ans" },
  { value: "3", label: "3 ans" }, { value: "4", label: "4 ans" }, { value: "5", label: "5 ans ou plus" },
];
export const FOREIGN_YEARS_CHOICES = [{ value: "0", label: "Aucune ou moins d’un an" }, { value: "1", label: "1 an" }, { value: "2", label: "2 ans" }, { value: "3", label: "3 ans ou plus" }];
export const YES_NO = [{ value: "no", label: "Non" }, { value: "yes", label: "Oui" }];
const NO_YES_FR = YES_NO;
export const CANADIAN_CREDENTIAL_LEVELS = [
  { value: "secondary_or_less", label: "École secondaire ou moins" },
  { value: "one_two_year", label: "Diplôme ou certificat d’un ou de deux ans" },
  { value: "three_year_or_more", label: "Degré, diplôme ou certificat de trois ans ou plus OU une maîtrise, un doctorat ou un diplôme professionnel avec au moins une année de scolarité" },
];
export const JOB_OFFER_LEVELS = [
  { value: "2", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 2 fois supérieur au salaire médian" },
  { value: "1.5", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 1,5 fois supérieur, mais inférieur à 2 fois, au salaire médian" },
  { value: "1.3", label: "Une offre d’emploi dans une profession à salaire élevé offrant un salaire au moins 1,3 fois supérieur, mais inférieur à 1,5 fois, au salaire médian" },
];

export const selectClass = "mt-1 block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 sm:text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

/** Une question et son infobulle : survol (texte court) ou clic / clavier (explication complète), y compris sur téléphone. */
export function Question({ id, label, children, changed = false }: { id: string; label: string; children: React.ReactNode; changed?: boolean }) {
  // le scénario B réutilise les mêmes questions (identifiants « crs-b-… ») : l'aide est celle de la question d'origine
  const tip = CRS_TIPS[id.replace(/^crs-b-/, "crs-")];
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border bg-white p-3 sm:p-4 ${changed ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-bold leading-6 text-slate-900">{label}{changed ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900" data-testid={`${id}-changed`}>modifié</span> : null}</label>
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
      {tip && open ? <p id={`${id}-tip`} role="note" className="panel-in mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-slate-700" data-testid={`${id}-tip`}>{tip}</p> : null}
      {children}
    </div>
  );
}

export function Choice({ id, value, onChange, options, placeholder = "Sélectionner…" }: { id: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

/** Test de langue (cinq tests officiels) puis une note par compétence, comme l'outil d'IRCC. */
export function LanguageBlock({ idPrefix, test, bands, tests, onTest, onBand }: { idPrefix: string; test: string; bands: Record<CrsAbility, string>; tests: CrsLanguageTest[]; onTest: (value: string) => void; onBand: (ability: CrsAbility, value: string) => void }) {
  const chosen = tests.includes(test as CrsLanguageTest) ? (test as CrsLanguageTest) : null;
  return (
    <div className="mt-2 space-y-3">
      <Choice id={`${idPrefix}-test`} value={test} onChange={onTest} options={[...tests.map((entry) => ({ value: entry, label: CRS_TEST_LABELS[entry] })), ...(idPrefix.endsWith("-first") ? [] : [{ value: "none", label: "Sans objet" }])]} />
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

type QuestionsProps = {
  answers: CrsOfficialAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<CrsOfficialAnswers>>;
  /** Appelé à chaque modification (le profil principal masque alors son résultat jusqu'au prochain calcul). */
  onEdit?: () => void;
  /** « crs » pour le profil principal, « crs-b » pour le scénario B. */
  prefix?: string;
  /** Réponses qui diffèrent du scénario A (scénario B seulement) : leur question est signalée « modifié ». */
  changedFields?: string[];
};

export function CrsQuestions({ answers, setAnswers, onEdit, prefix = "crs", changedFields = [] }: QuestionsProps) {
  const set = <K extends keyof CrsOfficialAnswers>(key: K, value: CrsOfficialAnswers[K]) => { onEdit?.(); setAnswers((previous) => ({ ...previous, [key]: value })); };
  const setBand = (group: "firstBands" | "secondBands" | "spouseBands", ability: CrsAbility, value: string) => { onEdit?.(); setAnswers((previous) => ({ ...previous, [group]: { ...previous[group], [ability]: value } })); };
  const mod = (...fields: string[]) => fields.some((field) => changedFields.some((changed) => changed === field || changed.startsWith(`${field}.`)));
  const withSpouse = countsAsWithSpouse(answers);
  const result = buildCrsProfileFromOfficialAnswers(answers);
  const firstTest = ALL_CRS_TESTS.includes(answers.firstTest as CrsLanguageTest) ? (answers.firstTest as CrsLanguageTest) : null;

  return (
    <>
        <Question id={`${prefix}-q1`} changed={mod("maritalStatus")} label="1) Quel est votre état matrimonial ?">
          <Choice id={`${prefix}-q1`} value={answers.maritalStatus} onChange={(value) => set("maritalStatus", value)} options={[...MARITAL_OPTIONS]} />
        </Question>
        {isMarried(answers.maritalStatus) && (
          <>
            <Question id={`${prefix}-q2i`} changed={mod("spouseCitizenOrPr")} label="2) i. Votre époux ou conjoint de fait est-il citoyen ou résident permanent du Canada ?">
              <Choice id={`${prefix}-q2i`} value={answers.spouseCitizenOrPr} onChange={(value) => set("spouseCitizenOrPr", value)} options={NO_YES_FR} />
            </Question>
            {answers.spouseCitizenOrPr === "no" && (
              <Question id={`${prefix}-q2ii`} changed={mod("spouseAccompanies")} label="2) ii. Votre époux ou conjoint de fait vous accompagnera-t-il au Canada ?">
                <Choice id={`${prefix}-q2ii`} value={answers.spouseAccompanies} onChange={(value) => set("spouseAccompanies", value)} options={NO_YES_FR} />
              </Question>
            )}
          </>
        )}
        {isMarried(answers.maritalStatus) && answers.spouseCitizenOrPr !== "" && !withSpouse && (answers.spouseCitizenOrPr === "yes" || answers.spouseAccompanies !== "") && (
          <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-950" data-testid={`${prefix}-without-spouse-note`}>
            Votre conjoint n’est pas compté dans la demande : IRCC vous note comme une personne sans conjoint, donc aucune question sur lui ne vous sera posée.
          </p>
        )}
        <Question id={`${prefix}-q3`} changed={mod("age")} label="3) Quel âge avez-vous ?">
          <Choice id={`${prefix}-q3`} value={answers.age} onChange={(value) => set("age", value)} options={AGE_CHOICES} />
        </Question>
        <Question id={`${prefix}-q4`} changed={mod("education")} label="4) Quel niveau d’études avez-vous atteint ?">
          <Choice id={`${prefix}-q4`} value={answers.education} onChange={(value) => set("education", value)} options={EDUCATION_CHOICES} />
        </Question>
        <Question id={`${prefix}-q4b`} changed={mod("canadianCredential")} label="4b) Avez-vous obtenu un certificat, grade ou diplôme canadien ?">
          <Choice id={`${prefix}-q4b`} value={answers.canadianCredential} onChange={(value) => set("canadianCredential", value)} options={YES_NO} />
        </Question>
        {answers.canadianCredential === "yes" && (
          <Question id={`${prefix}-q4c`} changed={mod("canadianCredentialLevel")} label="4c) Choisissez la meilleure réponse pour décrire ce niveau d’éducation.">
            <Choice id={`${prefix}-q4c`} value={answers.canadianCredentialLevel} onChange={(value) => set("canadianCredentialLevel", value)} options={CANADIAN_CREDENTIAL_LEVELS} />
          </Question>
        )}

        <Question id={`${prefix}-q5i`} changed={mod("languageTestRecent")} label="5) Langues officielles : i. Vos résultats de test linguistique ont-ils moins de deux ans ?">
          <Choice id={`${prefix}-q5i`} value={answers.languageTestRecent} onChange={(value) => set("languageTestRecent", value)} options={YES_NO} />
        </Question>
        {answers.languageTestRecent === "no" && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950" data-testid="crs-language-note">
            <AlertCircle className="mr-1 inline h-4 w-4" aria-hidden="true" />{result.languageNote}
          </p>
        )}
        {answers.languageTestRecent === "yes" && (
          <>
            <Question id={`${prefix}-first-test`} changed={mod("firstTest", "firstBands")} label="5) ii. Quel test linguistique avez-vous passé pour votre première langue officielle ?">
              <LanguageBlock idPrefix={`${prefix}-first`} test={answers.firstTest} bands={answers.firstBands} tests={ALL_CRS_TESTS} onTest={(value) => { onEdit?.(); setAnswers((previous) => {
                // la réponse « seconde langue » reste valable si le nouveau test est dans la même langue que l'ancien ; sinon elle est à redonner
                const keepSecond = value === previous.firstTest || previous.secondTest === "none" || (ALL_CRS_TESTS.includes(value as CrsLanguageTest) && secondLanguageTests(value as CrsLanguageTest).includes(previous.secondTest as CrsLanguageTest));
                return { ...previous, firstTest: value, firstBands: EMPTY_CRS_ANSWERS.firstBands, secondTest: keepSecond ? previous.secondTest : "", secondBands: keepSecond ? previous.secondBands : EMPTY_CRS_ANSWERS.secondBands };
              }); }} onBand={(ability, value) => setBand("firstBands", ability, value)} />
            </Question>
            {firstTest && (
              <Question id={`${prefix}-second-test`} changed={mod("secondTest", "secondBands")} label="5) iii. Avez-vous d’autres résultats linguistiques ? Si oui, quel test avez-vous passé pour votre seconde langue officielle ?">
                <LanguageBlock idPrefix={`${prefix}-second`} test={answers.secondTest} bands={answers.secondBands} tests={secondLanguageTests(firstTest)} onTest={(value) => { onEdit?.(); setAnswers((previous) => ({ ...previous, secondTest: value, secondBands: EMPTY_CRS_ANSWERS.secondBands })); }} onBand={(ability, value) => setBand("secondBands", ability, value)} />
              </Question>
            )}
          </>
        )}

        <Question id={`${prefix}-q6i`} changed={mod("canadianWorkYears")} label="6) Expérience de travail : i. Au cours des 10 dernières années, combien d’années d’expérience de travail qualifié au Canada avez-vous accumulées ?">
          <Choice id={`${prefix}-q6i`} value={answers.canadianWorkYears} onChange={(value) => set("canadianWorkYears", value)} options={YEARS_CHOICES} />
        </Question>
        {Number(answers.canadianWorkYears) >= 1 && (
          <>
          <Question id={`${prefix}-q6ii`} changed={mod("highWageExperience")} label="6) ii. Au cours des 10 dernières années, avez-vous au moins 1 an (ou 1 560 heures) d’expérience de travail qualifié au Canada dans un ou plusieurs emplois de la CNP figurant sur la liste des professions à salaire élevé ?">
            <Choice id={`${prefix}-q6ii`} value={answers.highWageExperience} onChange={(value) => set("highWageExperience", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
          </Question>
          {answers.highWageExperience === "yes" && (
            <>
              <Question id={`${prefix}-q6iii`} changed={mod("highWage2x")} label="6) iii. Cette expérience de travail a-t-elle duré au moins 1 an (ou 1 560 heures) dans un ou plusieurs emplois à salaire élevé dont le salaire était au moins 2 fois supérieur au salaire médian ?">
                <Choice id={`${prefix}-q6iii`} value={answers.highWage2x} onChange={(value) => set("highWage2x", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
              </Question>
              {answers.highWage2x === "no" && (
                <Question id={`${prefix}-q6iv`} changed={mod("highWage15x")} label="6) iv. Cette expérience de travail a-t-elle duré au moins 1 an (ou 1 560 heures) dans un ou plusieurs emplois à salaire élevé dont le salaire était au moins 1,5 fois supérieur au salaire médian moyen ?">
                  <Choice id={`${prefix}-q6iv`} value={answers.highWage15x} onChange={(value) => set("highWage15x", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
                </Question>
              )}
            </>
          )}
          </>
        )}
        <Question id={`${prefix}-q6v`} changed={mod("foreignWorkYears")} label="6) v. Au cours des 10 dernières années, combien d’années d’expérience de travail qualifié à l’étranger avez-vous accumulées au total ?">
          <Choice id={`${prefix}-q6v`} value={answers.foreignWorkYears} onChange={(value) => set("foreignWorkYears", value)} options={FOREIGN_YEARS_CHOICES} />
        </Question>
        <Question id={`${prefix}-q7`} changed={mod("certificate")} label="7) Possédez-vous un certificat de compétence d’une province, d’un territoire ou d’un organisme fédéral canadien ?">
          <Choice id={`${prefix}-q7`} value={answers.certificate} onChange={(value) => set("certificate", value)} options={YES_NO} />
        </Question>
        <Question id={`${prefix}-q8`} changed={mod("jobOffer")} label="8) Avez-vous une offre d’emploi valide pour un emploi dans une catégorie de la CNP figurant dans la liste des professions à salaire élevé ?">
          <Choice id={`${prefix}-q8`} value={answers.jobOffer} onChange={(value) => set("jobOffer", value)} options={[{ value: "yes", label: "Oui" }, { value: "no", label: "Non" }]} />
        </Question>
        {answers.jobOffer === "yes" && (
          <Question id={`${prefix}-q8a`} changed={mod("jobOfferLevel")} label="8a) À quel niveau de profession à salaire élevé l’offre d’emploi correspond-elle ?">
            <Choice id={`${prefix}-q8a`} value={answers.jobOfferLevel} onChange={(value) => set("jobOfferLevel", value)} options={JOB_OFFER_LEVELS} />
          </Question>
        )}

        <h4 className="pt-2 text-sm font-black uppercase tracking-wide text-blue-800">Points supplémentaires</h4>
        <Question id={`${prefix}-q9`} changed={mod("nomination")} label="9) Avez-vous un certificat de désignation d’une province ou d’un territoire ?">
          <Choice id={`${prefix}-q9`} value={answers.nomination} onChange={(value) => set("nomination", value)} options={YES_NO} />
        </Question>
        <Question id={`${prefix}-q10i`} changed={mod("sibling")} label="10) Est-ce que vous ou votre époux/conjoint de fait (si celui-ci vous accompagne au Canada) avez au moins un frère ou une sœur habitant au Canada qui est un citoyen ou un résident permanent ?">
          <Choice id={`${prefix}-q10i`} value={answers.sibling} onChange={(value) => set("sibling", value)} options={YES_NO} />
        </Question>

        {withSpouse && (
          <>
            <h4 className="pt-2 text-sm font-black uppercase tracking-wide text-blue-800">Votre époux ou conjoint de fait</h4>
            <Question id={`${prefix}-q11`} changed={mod("spouseEducation")} label="11) Quel est le niveau de scolarité le plus élevé de votre époux ou conjoint de fait (diplôme canadien ou évaluation des diplômes d’études) ?">
              <Choice id={`${prefix}-q11`} value={answers.spouseEducation} onChange={(value) => set("spouseEducation", value)} options={EDUCATION_CHOICES} />
            </Question>
            <Question id={`${prefix}-q12`} changed={mod("spouseCanadianWorkYears")} label="12) Au cours des dix dernières années, combien d’années d’expérience de travail qualifié au Canada votre époux ou conjoint de fait possède-t-il ?">
              <Choice id={`${prefix}-q12`} value={answers.spouseCanadianWorkYears} onChange={(value) => set("spouseCanadianWorkYears", value)} options={YEARS_CHOICES} />
            </Question>
            <Question id={`${prefix}-q13`} changed={mod("spouseTest", "spouseBands")} label="13) i) Votre époux ou conjoint de fait a-t-il passé un test linguistique ? Si oui, lequel ?">
              <LanguageBlock idPrefix={`${prefix}-spouse`} test={answers.spouseTest} bands={answers.spouseBands} tests={ALL_CRS_TESTS} onTest={(value) => { onEdit?.(); setAnswers((previous) => ({ ...previous, spouseTest: value, spouseBands: EMPTY_CRS_ANSWERS.spouseBands })); }} onBand={(ability, value) => setBand("spouseBands", ability, value)} />
            </Question>
          </>
        )}
    </>
  );
}
