/**
 * Profils pays pour les formulaires d’évaluation préliminaire 3M.
 * Chaque destination adapte langues, reconnaissance des diplômes, voies typiques
 * et libellés de liens locaux (province / Land / émirat / etc.).
 */

export type CountryFormFamily =
  | "canada"
  | "schengen"
  | "uk"
  | "usa"
  | "gulf"
  | "africa"
  | "asia_pacific"
  | "latam"
  | "generic";

export type CountryEvaluationFormProfile = {
  code: string;
  family: CountryFormFamily;
  /** Autorité / cadre de référence (indicatif). */
  authorityHint: string;
  /** Langues à déclarer en priorité. */
  languageFocus: string;
  /** Tests linguistiques typiques. */
  languageTestsHint: string;
  /** Reconnaissance / équivalence des diplômes. */
  diplomaRecognitionHint: string;
  /** Libellé de la zone cible (province, Land, émirat…). */
  regionTargetLabel: string;
  /** Voies / objectifs proposés sur le formulaire. */
  objectiveOptions: string;
  /** Questions spécifiques liens avec le pays. */
  localLinksHints: string[];
  /** Documents prioritaires à transmettre. */
  priorityDocuments: string[];
  /** Devise indicative pour les fonds. */
  fundsCurrencyHint: string;
};

const SCHENGEN_CORE = (authority: string, language: string, tests: string, region: string, recognition: string): Omit<CountryEvaluationFormProfile, "code" | "family"> => ({
  authorityHint: authority,
  languageFocus: language,
  languageTestsHint: tests,
  diplomaRecognitionHint: recognition,
  regionTargetLabel: region,
  objectiveOptions: "travail / études / séjour temporaire (visiteur) / regroupement / autre",
  localLinksHints: [
    "Études ou travail déjà effectués dans ce pays (lieu, dates, statut)",
    "Famille ou réseau sur place (lien, ville, statut)",
    "Offre d’emploi, admission scolaire, ou hébergement (si connu)",
    `${region} souhaitée ; ouverture à d’autres zones (oui / non)`,
  ],
  priorityDocuments: [
    "CV à jour ; passeport ; diplômes et relevés",
    "Attestations d’emploi détaillées ; preuves de fonds",
    "Assurance voyage Schengen si exigée ; lettres d’admission / offre",
  ],
  fundsCurrencyHint: "EUR",
});

/** Profils détaillés par code ISO — le reste du monde utilise le profil régional. */
export const COUNTRY_FORM_PROFILES: Record<string, CountryEvaluationFormProfile> = {
  CA: {
    code: "CA",
    family: "canada",
    authorityHint: "IRCC (Immigration, Réfugiés et Citoyenneté Canada) — Entrée express, permis, PNP",
    languageFocus: "français / anglais",
    languageTestsHint: "TEF Canada / TCF Canada ; IELTS General / CELPIP-General (notes par compétence)",
    diplomaRecognitionHint: "Évaluation des diplômes (EDE) : WES, IQAS, ICES, CES, ou autre organisme reconnu pour Entrée express",
    regionTargetLabel: "Province / territoire",
    objectiveOptions: "résidence permanente directe / travail / études / autre",
    localLinksHints: [
      "Études ou expérience au Canada : lieu, dates, diplôme / poste et statut",
      "Famille au Canada : lien exact, province, statut et âge si connu",
      "Offre d’emploi : employeur, poste, province et démarches effectuées",
      "Province souhaitée ; ouverture à d’autres provinces (oui / non, lesquelles)",
    ],
    priorityDocuments: [
      "CV à jour ; diplômes et relevés ; résultat EDE exact",
      "Tests linguistiques ; attestations d’emploi détaillées",
      "Décisions de refus antérieures ; preuve de fonds",
    ],
    fundsCurrencyHint: "CAD",
  },
  FR: {
    code: "FR",
    family: "schengen",
    ...SCHENGEN_CORE(
      "France — visas Schengen / long séjour (Campus France, OFII, préfecture selon le cas)",
      "français (et anglais si pertinent)",
      "TCF / TEF / DELF-DALF ; IELTS ou TOEIC si demandé par l’établissement",
      "Région / académie",
      "Comparabilité ENIC-NARIC France / reconnaissance professionnelle si métier réglementé",
    ),
  },
  DE: {
    code: "DE",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Allemagne — visas nationaux / Schengen (make-it-in-germany, reconnaissance Anabin / ZAB)",
      "allemand (et anglais si pertinent)",
      "Goethe / TestDaF / telc ; IELTS si exigé",
      "Land / ville",
      "Anabin / ZAB — reconnaissance des diplômes étrangers",
    ),
    fundsCurrencyHint: "EUR",
  },
  LU: {
    code: "LU",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Luxembourg — autorisation de séjour / travail (ADEM, ministère des Affaires étrangères)",
      "français / allemand / anglais / luxembourgeois",
      "Tests selon l’employeur ou l’établissement (français, allemand, anglais)",
      "Canton / commune",
      "Reconnaissance des diplômes via le ministère de l’Éducation / CNEDIC selon le cas",
    ),
  },
  BE: {
    code: "BE",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Belgique — visas / permis (régions Flandre, Wallonie, Bruxelles)",
      "français / néerlandais / anglais",
      "DELF-DALF / CNaVT / IELTS selon la région et le projet",
      "Région (Flandre / Wallonie / Bruxelles)",
      "NARIC Belgique / équivalence selon la Communauté",
    ),
  },
  GB: {
    code: "GB",
    family: "uk",
    authorityHint: "Royaume-Uni — UKVI (Skilled Worker, Student, Visitor, etc.)",
    languageFocus: "anglais",
    languageTestsHint: "IELTS UKVI / PTE Academic UKVI / LanguageCert selon la voie",
    diplomaRecognitionHint: "Équivalence UK ENIC (anciennement UK NARIC) si demandée",
    regionTargetLabel: "Nation / ville (Angleterre, Écosse, Galles, Irlande du Nord)",
    objectiveOptions: "travail (Skilled Worker) / études / séjour temporaire / autre",
    localLinksHints: [
      "Études ou travail déjà effectués au Royaume-Uni",
      "Famille ou réseau sur place",
      "Offre d’emploi (sponsor Licence) ou CAS / admission",
      "Ville / nation ciblée ; mobilité interne envisagée",
    ],
    priorityDocuments: [
      "CV ; passeport ; diplômes ; preuve de fonds",
      "CAS ou Certificate of Sponsorship si déjà obtenu",
      "Tests d’anglais UKVI ; historique de visas UK",
    ],
    fundsCurrencyHint: "GBP",
  },
  US: {
    code: "US",
    family: "usa",
    authorityHint: "États-Unis — USCIS / Département d’État (travail, études F-1, visiteur B)",
    languageFocus: "anglais",
    languageTestsHint: "TOEFL / IELTS / Duolingo selon l’établissement ; anglais professionnel pour le travail",
    diplomaRecognitionHint: "Évaluation WES / ECE / autres NACES si exigée par l’employeur ou l’école",
    regionTargetLabel: "État / métropole",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours antérieurs aux États-Unis (visa, durée, statut)",
      "Famille ou réseau sur place (citoyen / résident)",
      "Offre d’emploi, petition, ou I-20 / admission",
      "État souhaité ; ouverture à d’autres États",
    ],
    priorityDocuments: [
      "CV ; passeport ; diplômes ; relevés",
      "Offre / petition / I-20 si disponible ; preuves de fonds",
      "Historique DS-160 / refus antérieurs",
    ],
    fundsCurrencyHint: "USD",
  },
  AE: {
    code: "AE",
    family: "gulf",
    authorityHint: "Émirats arabes unis — visas travail / visite (employeur sponsor, free zone)",
    languageFocus: "anglais / arabe",
    languageTestsHint: "Anglais professionnel ; arabe si pertinent pour le poste",
    diplomaRecognitionHint: "Attestation / équivalence selon l’émirat et le métier (MoE / autorités locales)",
    regionTargetLabel: "Émirat (Dubaï, Abou Dhabi, Sharjah…)",
    objectiveOptions: "travail / visite affaires / études / autre",
    localLinksHints: [
      "Séjours ou contrats antérieurs aux EAU",
      "Sponsor / employeur pressenti (free zone ou mainland)",
      "Famille déjà sur place",
      "Émirat ciblé ; ouverture à d’autres émirats",
    ],
    priorityDocuments: [
      "CV ; passeport ; diplômes attestés",
      "Offre / contrat ; photos d’identité conformes",
      "Casier judiciaire / examens médicaux si demandés",
    ],
    fundsCurrencyHint: "AED / USD",
  },
  PL: {
    code: "PL",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Pologne — visas nationaux / Schengen (travail, études)",
      "polonais / anglais",
      "Polonais (certificat) ; IELTS / TOEFL si études en anglais",
      "Voïvodie / ville",
      "Reconnaissance via NAWA / autorités polonaises selon le diplôme",
    ),
  },
  CH: {
    code: "CH",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Suisse — autorisations de séjour / travail (cantons, SEM)",
      "français / allemand / italien / anglais",
      "Tests selon le canton et l’employeur",
      "Canton",
      "Reconnaissance Swiss ENIC / autorités cantonales",
    ),
    fundsCurrencyHint: "CHF",
  },
  IT: {
    code: "IT",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Italie — visas Schengen / nationaux (lavoro, studio)",
      "italien / anglais",
      "CILS / CELI / PLIDA ; IELTS si pertinent",
      "Région / province",
      "Dichiarazione di valore / CIMEA selon le cas",
    ),
  },
  ES: {
    code: "ES",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Espagne — visas / autorisations (trabajo, estudios)",
      "espagnol / anglais",
      "DELE / SIELE ; IELTS si pertinent",
      "Communauté autonome / province",
      "Homologación / equivalencia Ministerio de Educación",
    ),
  },
  PT: {
    code: "PT",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Portugal — visas / titres de séjour (trabalho, estudo, D7…)",
      "portugais / anglais",
      "CAPLE ; IELTS si pertinent",
      "District / région",
      "Reconhecimento de habilitações (DGES / NARIC)",
    ),
  },
  NL: {
    code: "NL",
    family: "schengen",
    ...SCHENGEN_CORE(
      "Pays-Bas — IND (travail highly skilled, études, Schengen)",
      "néerlandais / anglais",
      "NT2 ; IELTS / TOEFL pour études en anglais",
      "Province / ville",
      "Nuffic / IDW pour l’évaluation des diplômes",
    ),
  },
  AU: {
    code: "AU",
    family: "asia_pacific",
    authorityHint: "Australie — Department of Home Affairs (travail, études, visiteur)",
    languageFocus: "anglais",
    languageTestsHint: "IELTS / PTE / TOEFL selon la voie",
    diplomaRecognitionHint: "Skills assessment (autorité métier) / AEI-NOOSR selon le cas",
    regionTargetLabel: "État / territoire",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours ou visas australiens antérieurs",
      "Famille ou réseau sur place",
      "Offre d’emploi ou CoE / admission",
      "État ciblé ; mobilité inter-États",
    ],
    priorityDocuments: [
      "CV ; passeport ; diplômes ; skills assessment si lancé",
      "Preuves de fonds ; tests d’anglais",
      "Historique de visas / refus",
    ],
    fundsCurrencyHint: "AUD",
  },
  NZ: {
    code: "NZ",
    family: "asia_pacific",
    authorityHint: "Nouvelle-Zélande — Immigration New Zealand",
    languageFocus: "anglais",
    languageTestsHint: "IELTS / PTE selon la voie",
    diplomaRecognitionHint: "NZQA pour l’évaluation des diplômes si exigée",
    regionTargetLabel: "Région / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours néo-zélandais antérieurs",
      "Famille ou emploi pressenti",
      "Offre / admission",
      "Région ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; fonds ; tests d’anglais"],
    fundsCurrencyHint: "NZD",
  },
  JP: {
    code: "JP",
    family: "asia_pacific",
    authorityHint: "Japon — Immigration Services Agency (travail, études, visiteur)",
    languageFocus: "japonais / anglais",
    languageTestsHint: "JLPT ; IELTS / TOEFL si études en anglais",
    diplomaRecognitionHint: "Équivalence selon l’employeur / établissement japonais",
    regionTargetLabel: "Préfecture / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours au Japon antérieurs",
      "Certificate of Eligibility / employeur / école",
      "Famille ou réseau",
      "Préfecture ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; CoE si disponible ; fonds"],
    fundsCurrencyHint: "JPY / USD",
  },
  QA: {
    code: "QA",
    family: "gulf",
    authorityHint: "Qatar — visas travail / visite (sponsor employeur)",
    languageFocus: "anglais / arabe",
    languageTestsHint: "Anglais professionnel ; arabe si pertinent",
    diplomaRecognitionHint: "Attestation / équivalence selon le métier et le sponsor",
    regionTargetLabel: "Ville / zone",
    objectiveOptions: "travail / visite / études / autre",
    localLinksHints: [
      "Contrats ou séjours antérieurs au Qatar",
      "Sponsor / employeur",
      "Famille sur place",
      "Zone ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes attestés ; offre / contrat"],
    fundsCurrencyHint: "QAR / USD",
  },
};

const REGION_DEFAULTS: Record<string, Omit<CountryEvaluationFormProfile, "code">> = {
  Europe: {
    family: "schengen",
    authorityHint: "Autorités nationales / cadre Schengen ou EEE selon le pays",
    languageFocus: "langue(s) officielle(s) du pays / anglais",
    languageTestsHint: "Tests officiels de la langue du pays ; IELTS / TOEFL si études en anglais",
    diplomaRecognitionHint: "ENIC-NARIC / équivalence nationale selon le diplôme et le métier",
    regionTargetLabel: "Région / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Études ou travail déjà effectués dans ce pays",
      "Famille ou réseau sur place",
      "Offre d’emploi, admission, ou hébergement",
      "Région / ville souhaitée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; attestations d’emploi ; preuves de fonds"],
    fundsCurrencyHint: "EUR / devise locale",
  },
  "Amérique du Nord": {
    family: "generic",
    authorityHint: "Autorités d’immigration du pays de destination",
    languageFocus: "anglais / français selon le pays",
    languageTestsHint: "IELTS / TEF / TOEFL selon la voie",
    diplomaRecognitionHint: "Évaluation des diplômes reconnue localement si exigée",
    regionTargetLabel: "Province / État / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours antérieurs",
      "Famille ou réseau",
      "Offre / admission",
      "Zone ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; fonds ; tests de langue"],
    fundsCurrencyHint: "USD / CAD / devise locale",
  },
  Afrique: {
    family: "africa",
    authorityHint: "Autorités nationales d’immigration / consulats du pays",
    languageFocus: "français / anglais / langue(s) locale(s)",
    languageTestsHint: "Selon la langue de travail ou d’études du pays",
    diplomaRecognitionHint: "Équivalence / attestation selon les autorités locales",
    regionTargetLabel: "Ville / région",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours ou contrats antérieurs",
      "Employeur / établissement pressenti",
      "Famille ou réseau",
      "Ville ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; offre ou admission ; fonds"],
    fundsCurrencyHint: "XAF / XOF / USD / EUR",
  },
  "Golfe et Moyen-Orient": {
    family: "gulf",
    authorityHint: "Autorités d’immigration / sponsor employeur du pays",
    languageFocus: "anglais / arabe",
    languageTestsHint: "Anglais professionnel ; arabe si pertinent",
    diplomaRecognitionHint: "Attestation / équivalence selon le métier et le pays",
    regionTargetLabel: "Ville / zone / émirat",
    objectiveOptions: "travail / visite / études / autre",
    localLinksHints: [
      "Contrats ou séjours antérieurs",
      "Sponsor / employeur",
      "Famille sur place",
      "Zone ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes attestés ; offre / contrat"],
    fundsCurrencyHint: "USD / devise locale",
  },
  Asie: {
    family: "asia_pacific",
    authorityHint: "Autorités d’immigration du pays de destination",
    languageFocus: "langue(s) locale(s) / anglais",
    languageTestsHint: "Tests locaux et/ou IELTS / TOEFL selon la voie",
    diplomaRecognitionHint: "Équivalence selon l’employeur ou l’établissement",
    regionTargetLabel: "Région / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours antérieurs",
      "Employeur / école / CoE",
      "Famille ou réseau",
      "Région ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; fonds ; admission ou offre"],
    fundsCurrencyHint: "USD / devise locale",
  },
  Océanie: {
    family: "asia_pacific",
    authorityHint: "Autorités d’immigration du pays de destination",
    languageFocus: "anglais",
    languageTestsHint: "IELTS / PTE selon la voie",
    diplomaRecognitionHint: "Évaluation des compétences / diplômes selon le pays",
    regionTargetLabel: "État / région / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours antérieurs",
      "Offre ou admission",
      "Famille ou réseau",
      "Zone ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; fonds ; tests d’anglais"],
    fundsCurrencyHint: "AUD / NZD / USD",
  },
  "Amérique latine et Caraïbes": {
    family: "latam",
    authorityHint: "Autorités d’immigration du pays de destination",
    languageFocus: "espagnol / portugais / anglais / français selon le pays",
    languageTestsHint: "DELE / CELPE-Bras / IELTS selon la langue du projet",
    diplomaRecognitionHint: "Reconnaissance locale des diplômes si exigée",
    regionTargetLabel: "État / province / ville",
    objectiveOptions: "travail / études / séjour temporaire / autre",
    localLinksHints: [
      "Séjours antérieurs",
      "Employeur / établissement",
      "Famille ou réseau",
      "Zone ciblée",
    ],
    priorityDocuments: ["CV ; passeport ; diplômes ; fonds"],
    fundsCurrencyHint: "USD / devise locale",
  },
};

export function resolveCountryFormProfile(
  code: string,
  region: string,
): CountryEvaluationFormProfile {
  const existing = COUNTRY_FORM_PROFILES[code];
  if (existing) return existing;
  const regional = REGION_DEFAULTS[region] || REGION_DEFAULTS.Europe;
  return { code, ...regional };
}
