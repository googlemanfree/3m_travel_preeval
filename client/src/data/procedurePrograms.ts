/**
 * Catalogue des familles de visas et de programmes que l'on rencontre dans le monde, par type de procédure.
 *
 * Règle d'écriture : on décrit chaque famille (à quoi elle sert, à qui elle s'adresse, ce qu'il faut vérifier), jamais son
 * existence ni ses conditions chiffrées dans un pays donné. Chaque pays propose un sous-ensemble de ces programmes, sous des
 * noms qui lui sont propres : la fiche renvoie donc toujours à la source officielle du pays pour confirmer la disponibilité.
 */
import type { ProcedureKind } from "./procedureBlueprints";

export type ProgramEntry = { name: string; who: string; check: string };
export type ProgramLocale = "fr" | "en";

const p = (name: string, who: string, check: string): ProgramEntry => ({ name, who, check });

const WORK_FR: ProgramEntry[] = [
  p("Permis de travail lié à un employeur", "Vous avez une offre ou un contrat auprès d’une entreprise du pays.", "Autorisation préalable de l’employeur, lien avec le poste, durée et conditions de renouvellement."),
  p("Permis fondé sur les compétences ou un système de points", "Vous avez un profil qualifié et visez une installation durable, sans offre obligatoire.", "Métier recherché, diplômes évalués, langue, expérience ; les barèmes changent régulièrement."),
  p("Carte pour profils hautement qualifiés", "Vous avez un diplôme élevé et un poste qualifié bien rémunéré.", "Reconnaissance du diplôme, seuil de rémunération fixé par le pays, possibilité de circuler ensuite."),
  p("Permis de recherche d’emploi", "Vous venez chercher un emploi sur place pendant une période limitée.", "Diplôme reconnu, ressources suffisantes, durée et conditions de conversion en permis de travail."),
  p("Transfert intra-entreprise", "Votre employeur actuel vous affecte à une filiale à l’étranger.", "Ancienneté dans l’entreprise, lien entre les deux entités, rôle de cadre ou de spécialiste."),
  p("Emploi saisonnier ou agricole", "Vous travaillez quelques mois dans l’année, souvent dans l’agriculture, le tourisme ou la restauration.", "Quotas, contrat saisonnier, hébergement, obligation de retour."),
  p("Stage, alternance ou formation en entreprise", "Vous apprenez un métier en entreprise, en parallèle d’une formation.", "Contrat de formation, niveau de langue, reconnaissance du parcours."),
  p("Programme vacances-travail", "Vous êtes jeune et votre pays a un accord avec le pays d’accueil.", "Limite d’âge, accord bilatéral, nombre de places, durée du séjour."),
  p("Entrepreneur, travailleur indépendant ou investisseur", "Vous créez une activité ou investissez dans le pays.", "Plan d’activité, capital ou investissement exigé, création d’emplois, preuves de fonds."),
  p("Télétravail à distance (nomade numérique)", "Vous travaillez pour un employeur ou des clients situés hors du pays.", "Revenu minimum fixé par le pays, assurance, durée du séjour et règles fiscales."),
  p("Au pair", "Vous accueillez une famille en échange d’un hébergement et d’une activité encadrée.", "Limite d’âge, famille d’accueil, niveau de langue, durée."),
];

const WORK_EN: ProgramEntry[] = [
  p("Employer-sponsored work permit", "You have an offer or contract with a company in the country.", "Prior employer authorisation, link to the position, duration and renewal conditions."),
  p("Skills-based or points-based permit", "You have a qualified profile and aim for lasting settlement, without a mandatory offer.", "In-demand occupation, assessed diplomas, language, experience; scoring grids change regularly."),
  p("Permit for highly qualified profiles", "You hold an advanced degree and a well-paid qualified position.", "Diploma recognition, salary threshold set by the country, possibility to move afterwards."),
  p("Job-search permit", "You come to look for a job locally for a limited period.", "Recognised diploma, sufficient funds, duration and conditions to convert into a work permit."),
  p("Intra-company transfer", "Your current employer assigns you to a branch abroad.", "Seniority in the company, link between both entities, manager or specialist role."),
  p("Seasonal or agricultural work", "You work a few months a year, often in farming, tourism or catering.", "Quotas, seasonal contract, housing, obligation to return."),
  p("Internship, apprenticeship or on-the-job training", "You learn a trade in a company alongside a course.", "Training contract, language level, recognition of your background."),
  p("Working holiday programme", "You are young and your country has an agreement with the host country.", "Age limit, bilateral agreement, number of places, length of stay."),
  p("Entrepreneur, self-employed or investor", "You start a business or invest in the country.", "Business plan, required capital or investment, job creation, proof of funds."),
  p("Remote work (digital nomad)", "You work for an employer or clients located outside the country.", "Minimum income set by the country, insurance, length of stay and tax rules."),
  p("Au pair", "You live with a host family in exchange for housing and supervised activity.", "Age limit, host family, language level, duration."),
];

const STUDY_FR: ProgramEntry[] = [
  p("Visa étudiant long séjour (licence, master, doctorat)", "Vous êtes admis dans un établissement pour un cycle complet.", "Lettre d’admission, financement, assurance, logement, durée de validité."),
  p("Formation en langue", "Vous apprenez la langue du pays avant ou à la place d’un cursus.", "Durée du cours, établissement agréé, règles de travail pendant le séjour."),
  p("Programme d’échange ou de mobilité", "Votre établissement d’origine a un accord avec un établissement d’accueil.", "Convention entre établissements, durée, reconnaissance des crédits."),
  p("Formation professionnelle ou apprentissage", "Vous visez un métier plutôt qu’un diplôme universitaire.", "Contrat de formation éventuel, niveau de langue, reconnaissance du diplôme."),
  p("Recherche et doctorat financé", "Vous rejoignez un laboratoire ou un projet de recherche.", "Convention d’accueil, financement du doctorat, statut de chercheur."),
  p("Stage académique", "Vous faites un stage intégré à votre cursus.", "Convention de stage, rémunération éventuelle, durée autorisée."),
  p("Cours de courte durée ou été", "Vous suivez un programme court, souvent sous un visa de court séjour.", "Durée maximale du séjour, nature du programme, preuve d’inscription."),
  p("Bourses d’études", "Vous financez vos études avec une bourse publique ou privée.", "Calendrier de candidature, critères, engagement éventuel de retour."),
  p("Permis après le diplôme", "Vous souhaitez rester travailler après vos études.", "Niveau de diplôme, délai pour demander, durée accordée, lien avec un emploi."),
];

const STUDY_EN: ProgramEntry[] = [
  p("Long-stay student visa (bachelor, master, doctorate)", "You are admitted to an institution for a full programme.", "Admission letter, funding, insurance, housing, validity period."),
  p("Language course", "You learn the country’s language before or instead of a degree.", "Course length, approved school, work rules during the stay."),
  p("Exchange or mobility programme", "Your home institution has an agreement with a host institution.", "Agreement between institutions, duration, credit recognition."),
  p("Vocational training or apprenticeship", "You aim for a trade rather than a university degree.", "Possible training contract, language level, diploma recognition."),
  p("Research and funded doctorate", "You join a laboratory or research project.", "Hosting agreement, doctoral funding, researcher status."),
  p("Academic internship", "You do an internship built into your course.", "Internship agreement, possible pay, authorised duration."),
  p("Short course or summer programme", "You attend a short programme, often on a short-stay visa.", "Maximum length of stay, nature of the programme, proof of enrolment."),
  p("Scholarships", "You fund your studies with a public or private scholarship.", "Application calendar, criteria, possible return commitment."),
  p("Post-graduation permit", "You want to stay and work after your studies.", "Degree level, deadline to apply, duration granted, link to a job."),
];

const VISIT_FR: ProgramEntry[] = [
  p("Court séjour touristique", "Vous voyagez pour découvrir le pays.", "Justificatif de séjour, ressources, assurance, billet de retour."),
  p("Visite familiale ou amicale", "Vous rendez visite à un proche sur place.", "Invitation ou attestation d’accueil, statut de l’hôte, preuve du lien."),
  p("Voyage d’affaires, salon ou conférence", "Vous participez à une rencontre professionnelle.", "Lettre d’invitation, objet précis, interdiction éventuelle de travailler."),
  p("Transit ou escale", "Vous passez par le pays pour rejoindre une autre destination.", "Visa de transit éventuel, durée de l’escale, billet vers la destination finale."),
  p("Soins médicaux", "Vous venez vous faire soigner.", "Attestation de l’établissement de santé, prise en charge des frais, accompagnant éventuel."),
  p("Événement sportif, culturel ou religieux", "Vous participez à un événement précis.", "Justificatif d’inscription ou d’invitation, dates, hébergement."),
  p("Visa à entrées multiples", "Vous voyagez régulièrement dans le pays.", "Historique de voyages, motif récurrent, durée de validité accordée."),
  p("Autorisation électronique de voyage", "Votre nationalité peut voyager avec une autorisation en ligne.", "Éligibilité de votre nationalité, portail officiel uniquement, durée de validité."),
];

const VISIT_EN: ProgramEntry[] = [
  p("Tourist short stay", "You travel to discover the country.", "Proof of stay, funds, insurance, return ticket."),
  p("Family or friends visit", "You visit someone who lives there.", "Invitation or host certificate, host’s status, proof of relationship."),
  p("Business trip, trade fair or conference", "You attend a professional meeting.", "Invitation letter, precise purpose, possible ban on working."),
  p("Transit or layover", "You pass through the country to reach another destination.", "Possible transit visa, layover length, ticket to the final destination."),
  p("Medical treatment", "You come for care.", "Certificate from the health facility, cost coverage, possible companion."),
  p("Sporting, cultural or religious event", "You attend a specific event.", "Proof of registration or invitation, dates, accommodation."),
  p("Multiple-entry visa", "You travel to the country regularly.", "Travel history, recurring purpose, validity granted."),
  p("Electronic travel authorisation", "Your nationality can travel with an online authorisation.", "Eligibility of your nationality, official portal only, validity period."),
];

const EVISA_FR: ProgramEntry[] = [
  p("e-Visa touristique", "Vous voyagez pour le tourisme et le pays délivre un visa en ligne.", "Éligibilité de votre nationalité, durée de séjour, portail officiel uniquement."),
  p("e-Visa d’affaires", "Vous voyagez pour une réunion ou une mission professionnelle.", "Lettre d’invitation, objet précis, entrée unique ou multiple."),
  p("e-Visa de transit", "Vous faites une escale dans le pays.", "Durée de l’escale, billet de continuation, conditions de sortie de l’aéroport."),
  p("Visa à l’arrivée", "Le pays délivre le visa à l’aéroport ou à la frontière.", "Nationalités concernées, frais à régler sur place, pièces à présenter."),
  p("Autorisation électronique de voyage (ETA)", "Une autorisation en ligne remplace un visa pour certaines nationalités.", "Éligibilité, durée de validité, nombre d’entrées."),
  p("e-Visa à entrées multiples", "Vous prévoyez plusieurs entrées dans la période de validité.", "Durée de validité, durée maximale par séjour, conditions de renouvellement."),
];

const EVISA_EN: ProgramEntry[] = [
  p("Tourist e-Visa", "You travel for tourism and the country issues an online visa.", "Eligibility of your nationality, length of stay, official portal only."),
  p("Business e-Visa", "You travel for a meeting or business assignment.", "Invitation letter, precise purpose, single or multiple entry."),
  p("Transit e-Visa", "You have a layover in the country.", "Layover length, onward ticket, airport exit conditions."),
  p("Visa on arrival", "The country issues the visa at the airport or border.", "Eligible nationalities, fees paid on site, documents to show."),
  p("Electronic travel authorisation (ETA)", "An online authorisation replaces a visa for some nationalities.", "Eligibility, validity, number of entries."),
  p("Multiple-entry e-Visa", "You plan several entries within the validity period.", "Validity, maximum length per stay, renewal conditions."),
];

export const PROGRAMS_FR: Record<ProcedureKind, ProgramEntry[]> = { travail: WORK_FR, etudes: STUDY_FR, visiteur: VISIT_FR, evisa: EVISA_FR };
export const PROGRAMS_EN: Record<ProcedureKind, ProgramEntry[]> = { travail: WORK_EN, etudes: STUDY_EN, visiteur: VISIT_EN, evisa: EVISA_EN };

/** Autres voies, valables quel que soit le type de procédure consulté. */
export const OTHER_ROUTES_FR: ProgramEntry[] = [
  p("Regroupement familial et mariage", "Vous rejoignez un conjoint, un parent ou un enfant installé dans le pays.", "Preuve du lien, statut et ressources du membre de la famille, délais de traitement."),
  p("Résidence permanente et immigration", "Vous visez une installation durable.", "Voie choisie (points, parrainage, régional, investisseur), délai de résidence préalable, langue."),
  p("Retraite et revenus passifs", "Vous vivez de revenus réguliers sans travailler dans le pays.", "Montant de revenus exigé par le pays, assurance santé, preuve de pension ou de rente."),
];

export const OTHER_ROUTES_EN: ProgramEntry[] = [
  p("Family reunification and marriage", "You join a spouse, parent or child settled in the country.", "Proof of relationship, family member’s status and income, processing times."),
  p("Permanent residence and immigration", "You aim for lasting settlement.", "Route chosen (points, sponsorship, regional, investor), prior residence period, language."),
  p("Retirement and passive income", "You live on regular income without working in the country.", "Income level required by the country, health insurance, proof of pension or annuity."),
];

export function getProgramCatalog(kind: ProcedureKind, locale: ProgramLocale): { programs: ProgramEntry[]; other: ProgramEntry[] } {
  return locale === "en" ? { programs: PROGRAMS_EN[kind], other: OTHER_ROUTES_EN } : { programs: PROGRAMS_FR[kind], other: OTHER_ROUTES_FR };
}
