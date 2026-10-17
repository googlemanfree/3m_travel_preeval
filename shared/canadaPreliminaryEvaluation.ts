/**
 * Évaluation préliminaire Canada — alignée sur le formulaire PDF 3M
 * « Formulaire_evaluation_Canada_3M » (5 sections) et le dossier type
 * « Dossier_candidate_…_remplissable » (préremplissage CV + lacunes).
 */

export type CanadaEvalObjective = "permanent_residence" | "work" | "study" | "other";

export type CanadaJobEntry = {
  title: string;
  employer: string;
  country: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: string;
  employmentType: "employee" | "self_employed" | "unknown";
  paid: "yes" | "no" | "unknown";
  tasks: string;
};

export type CanadaLanguageTestDetail = {
  testName: string;
  testDate: string;
  reportNumber: string;
  listening: string;
  reading: string;
  speaking: string;
  writing: string;
};

export type CanadaPreliminaryProfile = {
  /** Identité */
  referenceOrInitials: string;
  fullName: string;
  dateOfBirth: string;
  age: number | null;
  nationalities: string;
  residenceCountry: string;
  email: string;
  phone: string;

  /** Famille */
  maritalStatusLabel: string;
  childrenCount: number;
  childrenAges: string;
  dependentsWillAccompany: string;

  /** Études */
  highestDiploma: string;
  diplomaSpecialty: string;
  diplomaCountry: string;
  diplomaInstitution: string;
  diplomaYear: string;
  diplomaDuration: string;
  otherDiplomas: string;
  educationAssessmentDone: boolean | null;
  educationAssessmentBody: string;
  educationAssessmentDate: string;
  educationAssessmentResult: string;
  ecaForExpressEntryConfirmed: boolean | null;

  /** Emplois (du plus récent) */
  jobs: CanadaJobEntry[];

  /** Langues */
  frenchEstimatedLevel: string;
  englishEstimatedLevel: string;
  frenchTest: CanadaLanguageTestDetail;
  englishTest: CanadaLanguageTestDetail;

  /** Liens Canada */
  canadaStudyOrWork: string;
  familyInCanada: string;
  jobOfferDetail: string;
  targetProvince: string;
  openToOtherProvinces: string;

  /** Budget / historique */
  availableFunds: string;
  fundsCurrency: string;
  fundsOrigin: string;
  visaRefusals: string;
  ongoingCanadianApplications: string;
  specialNotes: string;

  /** Conjoint */
  spouseAgeNationalityProfession: string;
  spouseDiplomas: string;
  spouseExperience: string;
  spouseLanguages: string;
  spouseEducationAssessment: string;

  /** Objectif */
  objective: CanadaEvalObjective | "";
  otherOptionsAndTimeline: string;
  complementaryInfo: string;

  /** Validation */
  clientDeclarationConfirmed: boolean;
  declarantName: string;
  declarationDate: string;
};

export const EMPTY_CANADA_JOB = (): CanadaJobEntry => ({
  title: "",
  employer: "",
  country: "",
  startDate: "",
  endDate: "",
  hoursPerWeek: "",
  employmentType: "unknown",
  paid: "unknown",
  tasks: "",
});

export const EMPTY_LANGUAGE_TEST = (): CanadaLanguageTestDetail => ({
  testName: "",
  testDate: "",
  reportNumber: "",
  listening: "",
  reading: "",
  speaking: "",
  writing: "",
});

export const emptyCanadaPreliminaryProfile = (): CanadaPreliminaryProfile => ({
  referenceOrInitials: "",
  fullName: "",
  dateOfBirth: "",
  age: null,
  nationalities: "",
  residenceCountry: "",
  email: "",
  phone: "",
  maritalStatusLabel: "",
  childrenCount: 0,
  childrenAges: "",
  dependentsWillAccompany: "",
  highestDiploma: "",
  diplomaSpecialty: "",
  diplomaCountry: "",
  diplomaInstitution: "",
  diplomaYear: "",
  diplomaDuration: "",
  otherDiplomas: "",
  educationAssessmentDone: null,
  educationAssessmentBody: "",
  educationAssessmentDate: "",
  educationAssessmentResult: "",
  ecaForExpressEntryConfirmed: null,
  jobs: [EMPTY_CANADA_JOB(), EMPTY_CANADA_JOB(), EMPTY_CANADA_JOB()],
  frenchEstimatedLevel: "",
  englishEstimatedLevel: "",
  frenchTest: EMPTY_LANGUAGE_TEST(),
  englishTest: EMPTY_LANGUAGE_TEST(),
  canadaStudyOrWork: "",
  familyInCanada: "",
  jobOfferDetail: "",
  targetProvince: "",
  openToOtherProvinces: "",
  availableFunds: "",
  fundsCurrency: "",
  fundsOrigin: "",
  visaRefusals: "",
  ongoingCanadianApplications: "",
  specialNotes: "",
  spouseAgeNationalityProfession: "",
  spouseDiplomas: "",
  spouseExperience: "",
  spouseLanguages: "",
  spouseEducationAssessment: "",
  objective: "",
  otherOptionsAndTimeline: "",
  complementaryInfo: "",
  clientDeclarationConfirmed: false,
  declarantName: "",
  declarationDate: "",
});

export type CanadaGapItem = {
  id: string;
  section: "identity" | "education" | "work" | "languages" | "canada_links" | "budget" | "spouse" | "objective" | "documents";
  label: string;
  priority: "high" | "medium" | "low";
};

const blank = (value: string | null | undefined) => !String(value ?? "").trim();

/** Lacunes à signaler (style dossier Danièle CAN-001). */
export function buildCanadaPreliminaryGaps(profile: CanadaPreliminaryProfile): CanadaGapItem[] {
  const gaps: CanadaGapItem[] = [];
  if (blank(profile.fullName)) gaps.push({ id: "name", section: "identity", label: "Nom complet du candidat", priority: "high" });
  if (blank(profile.dateOfBirth) && profile.age == null) gaps.push({ id: "dob", section: "identity", label: "Date de naissance ou âge", priority: "high" });
  if (blank(profile.nationalities)) gaps.push({ id: "nationality", section: "identity", label: "Nationalité(s)", priority: "medium" });
  if (profile.childrenCount > 0 && blank(profile.dependentsWillAccompany)) {
    gaps.push({ id: "children_accompany", section: "identity", label: "Accompagnement des enfants (oui / non / à préciser)", priority: "high" });
  }
  if (blank(profile.highestDiploma)) gaps.push({ id: "diploma", section: "education", label: "Diplôme le plus élevé et spécialité", priority: "high" });
  if (profile.educationAssessmentDone !== true) {
    gaps.push({ id: "ede", section: "education", label: "Évaluation des diplômes (organisme, date, résultat) — EDE Entrée express à confirmer", priority: "high" });
  } else if (blank(profile.educationAssessmentBody) || blank(profile.educationAssessmentResult)) {
    gaps.push({ id: "ede_detail", section: "education", label: "Détail de l’évaluation des diplômes (organisme et résultat exact)", priority: "high" });
  }
  const job1 = profile.jobs[0];
  if (!job1 || blank(job1.title) || blank(job1.employer)) {
    gaps.push({ id: "job1", section: "work", label: "Emploi le plus récent (intitulé, employeur, pays, dates, tâches)", priority: "high" });
  } else if (blank(job1.hoursPerWeek) || job1.paid === "unknown") {
    gaps.push({ id: "job1_hours", section: "work", label: "Volume horaire, statut et rémunération de l’emploi actuel", priority: "medium" });
  }
  const hasOfficialFrench = !blank(profile.frenchTest.testName) && !blank(profile.frenchTest.listening);
  const hasOfficialEnglish = !blank(profile.englishTest.testName) && !blank(profile.englishTest.listening);
  if (!hasOfficialFrench && !hasOfficialEnglish) {
    gaps.push({ id: "lang_tests", section: "languages", label: "Résultats de tests linguistiques officiels (TEF/TCF et/ou IELTS/CELPIP)", priority: "high" });
  }
  if (blank(profile.targetProvince)) gaps.push({ id: "province", section: "canada_links", label: "Province souhaitée et ouverture aux autres provinces", priority: "medium" });
  if (blank(profile.availableFunds)) gaps.push({ id: "funds", section: "budget", label: "Fonds disponibles (montant, devise, origine)", priority: "high" });
  if (blank(profile.visaRefusals)) gaps.push({ id: "refusals", section: "budget", label: "Refus de visa / demandes canadiennes en cours (ou « aucun »)", priority: "medium" });
  if (!profile.objective) gaps.push({ id: "objective", section: "objective", label: "Objectif : résidence permanente / travail / études / autre", priority: "high" });
  if (!profile.clientDeclarationConfirmed) {
    gaps.push({ id: "declaration", section: "documents", label: "Validation / déclaration du client encore à recueillir", priority: "high" });
  }
  return gaps;
}

/** Pièces prioritaires (ordre dossier Danièle). */
export function buildCanadaDocumentChecklist(profile: CanadaPreliminaryProfile): string[] {
  const items = [
    "Évaluation comparative des diplômes (EDE / WES ou organisme reconnu) — résultat exact",
    "Diplômes et relevés de notes",
    "Attestations d’emploi détaillées (dates, heures, rémunération, tâches, signature employeur)",
    "Résultats de tests linguistiques officiels lorsqu’ils seront disponibles",
    "CV à jour",
  ];
  if (profile.childrenCount > 0) items.push("Actes de naissance des enfants à charge");
  if (/marié|conjoint|époux/i.test(profile.maritalStatusLabel)) {
    items.push("Certificat de mariage / preuve de conjoint de fait");
    items.push("Passeport et documents d’identité du conjoint");
  }
  if (!blank(profile.visaRefusals) && !/^aucun|^sans objet|^n\/?a$/i.test(profile.visaRefusals.trim())) {
    items.push("Décisions de refus antérieures et documents utiles");
  }
  items.push("Preuve de fonds financiers (montant, devise, origine)");
  return items;
}

/** Estimation d’années d’expérience étrangère à partir des emplois déclarés (approx.). */
export function estimateForeignExperienceYearsFromJobs(jobs: CanadaJobEntry[]): number {
  let months = 0;
  for (const job of jobs) {
    if (blank(job.startDate)) continue;
    const start = parseLooseDate(job.startDate);
    if (!start) continue;
    const end = blank(job.endDate) || /présent|actuel|ce jour|aujourd/i.test(job.endDate)
      ? new Date()
      : parseLooseDate(job.endDate);
    if (!end || end <= start) continue;
    const country = (job.country || "").toLowerCase();
    if (country.includes("canada")) continue;
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
  const years = months / 12;
  if (years < 1) return 0;
  if (years < 2) return 1;
  if (years < 3) return 2;
  if (years < 4) return 3;
  if (years < 5) return 4;
  return 5;
}

function parseLooseDate(value: string): Date | null {
  const raw = value.trim();
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(raw);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3] || "1"));
  const fr = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(raw);
  if (fr) return new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
  const yearMonth = /^(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})$/i.exec(raw);
  if (yearMonth) {
    const months = ["janvier","février","fevrier","mars","avril","mai","juin","juillet","août","aout","septembre","octobre","novembre","décembre","decembre"];
    const idx = months.indexOf(yearMonth[1].toLowerCase());
    const map = [0,1,1,2,3,4,5,6,7,7,8,9,10,11,11];
    return new Date(Number(yearMonth[2]), map[idx] ?? 0, 1);
  }
  const yearOnly = /^(\d{4})$/.exec(raw);
  if (yearOnly) return new Date(Number(yearOnly[1]), 0, 1);
  return null;
}

export const CANADA_OBJECTIVE_OPTIONS: Array<{ value: CanadaEvalObjective; label: string }> = [
  { value: "permanent_residence", label: "Résidence permanente directe" },
  { value: "work", label: "Travail" },
  { value: "study", label: "Études" },
  { value: "other", label: "Autre" },
];

/** Fixture de non-régression inspirée du dossier Danièle (données anonymisées de structure). */
export const DANIELE_STRUCTURE_FIXTURE: Partial<CanadaPreliminaryProfile> = {
  fullName: "Danièle Rabeline Ngo Matip",
  referenceOrInitials: "CAN-001",
  dateOfBirth: "04/05/1987",
  age: 39,
  nationalities: "Camerounaise",
  residenceCountry: "Cameroun — Yaoundé",
  maritalStatusLabel: "célibataire",
  childrenCount: 2,
  childrenAges: "8 et 5 ans",
  dependentsWillAccompany: "",
  highestDiploma: "Diplôme d'aide-soignante",
  diplomaInstitution: "Centre d'instruction médical d'Ayos",
  diplomaCountry: "Cameroun",
  diplomaYear: "2012",
  diplomaDuration: "12 mois",
  educationAssessmentDone: true,
  educationAssessmentBody: "",
  educationAssessmentResult: "",
  ecaForExpressEntryConfirmed: false,
  frenchEstimatedLevel: "avancé",
  englishEstimatedLevel: "débutant",
  objective: "permanent_residence",
  clientDeclarationConfirmed: false,
};
