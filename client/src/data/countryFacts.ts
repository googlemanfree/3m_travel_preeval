/**
 * Repères stables par pays pour les guides d'études (/blog/etudes/:slug) : capitale, langues, monnaie, villes
 * universitaires connues, portails officiels complémentaires. Aucune règle d'immigration, aucun montant, aucun
 * classement ici : ces informations changent et restent dans les guides et auprès des autorités.
 * Les adresses ont été vérifiées le 2026-09-25 (réponse HTTP) ; `france-visas.gouv.fr` et `travel.state.gov`
 * bloquent les robots (403) mais sont les portails officiels de leurs États.
 */
export type CountryFacts = {
  capital: string;
  languages: string;
  currency: string;
  cities: string[];
  extraSources: Array<{ label: string; href: string }>;
};

export const countryFacts: Record<string, CountryFacts> = {
  canada: {
    capital: "Ottawa",
    languages: "Français et anglais (langues officielles)",
    currency: "Dollar canadien (CAD)",
    cities: ["Montréal", "Toronto", "Vancouver", "Québec"],
    extraSources: [],
  },
  france: {
    capital: "Paris",
    languages: "Français",
    currency: "Euro (EUR)",
    cities: ["Paris", "Lyon", "Toulouse", "Lille"],
    extraSources: [
      { label: "Campus France", href: "https://www.campusfrance.org/fr" },
      { label: "France-Visas (portail officiel)", href: "https://france-visas.gouv.fr" },
    ],
  },
  belgique: {
    capital: "Bruxelles",
    languages: "Néerlandais, français et allemand (langues officielles)",
    currency: "Euro (EUR)",
    cities: ["Bruxelles", "Louvain", "Liège", "Gand"],
    extraSources: [{ label: "Study in Belgium", href: "https://www.studyinbelgium.be" }],
  },
  allemagne: {
    capital: "Berlin",
    languages: "Allemand",
    currency: "Euro (EUR)",
    cities: ["Berlin", "Munich", "Heidelberg", "Hambourg"],
    extraSources: [
      { label: "Study in Germany (DAAD)", href: "https://www.study-in-germany.de" },
      { label: "uni-assist", href: "https://www.uni-assist.de" },
    ],
  },
  pologne: {
    capital: "Varsovie",
    languages: "Polonais",
    currency: "Zloty (PLN)",
    cities: ["Varsovie", "Cracovie", "Wrocław", "Poznań"],
    extraSources: [
      { label: "Study in Poland", href: "https://studyinpoland.pl" },
      { label: "NAWA, agence nationale d’échange académique", href: "https://nawa.gov.pl" },
    ],
  },
  australie: {
    capital: "Canberra",
    languages: "Anglais (langue de fait)",
    currency: "Dollar australien (AUD)",
    cities: ["Sydney", "Melbourne", "Brisbane", "Perth"],
    extraSources: [
      { label: "Study Australia", href: "https://www.studyaustralia.gov.au" },
      { label: "Department of Home Affairs", href: "https://immi.homeaffairs.gov.au" },
    ],
  },
  "royaume-uni": {
    capital: "Londres",
    languages: "Anglais (le gallois est aussi officiel au pays de Galles)",
    currency: "Livre sterling (GBP)",
    cities: ["Londres", "Oxford", "Cambridge", "Édimbourg"],
    extraSources: [
      { label: "GOV.UK — Student visa", href: "https://www.gov.uk/student-visa" },
      { label: "UCAS", href: "https://www.ucas.com" },
    ],
  },
  "etats-unis": {
    capital: "Washington, D.C.",
    languages: "Anglais (langue principale)",
    currency: "Dollar américain (USD)",
    cities: ["Boston", "New York", "Chicago", "Los Angeles"],
    extraSources: [
      { label: "EducationUSA", href: "https://educationusa.state.gov" },
      { label: "Travel.State.Gov", href: "https://travel.state.gov" },
    ],
  },
  irlande: {
    capital: "Dublin",
    languages: "Irlandais et anglais (langues officielles)",
    currency: "Euro (EUR)",
    cities: ["Dublin", "Cork", "Galway", "Limerick"],
    extraSources: [
      { label: "Study in Ireland", href: "https://www.studyinireland.ie" },
      { label: "Irish Immigration Service", href: "https://www.irishimmigration.ie" },
    ],
  },
  maroc: {
    capital: "Rabat",
    languages: "Arabe et amazigh (langues officielles) ; le français est très répandu",
    currency: "Dirham marocain (MAD)",
    cities: ["Rabat", "Casablanca", "Marrakech", "Fès"],
    extraSources: [],
  },
  // Pays des pages /procedures/<pays> (formation et travail qualifié) : leurs portails officiels sont dans
  // destinationOfficialSources.ts, donc `extraSources` reste vide ici. `cities` = villes principales.
  "pays-bas": {
    capital: "Amsterdam (le gouvernement siège à La Haye)",
    languages: "Néerlandais",
    currency: "Euro (EUR)",
    cities: ["Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Eindhoven"],
    extraSources: [],
  },
  portugal: {
    capital: "Lisbonne",
    languages: "Portugais",
    currency: "Euro (EUR)",
    cities: ["Lisbonne", "Porto", "Coimbra", "Braga"],
    extraSources: [],
  },
  espagne: {
    capital: "Madrid",
    languages: "Espagnol (castillan) ; catalan, galicien et basque sont co-officiels dans leurs régions",
    currency: "Euro (EUR)",
    cities: ["Madrid", "Barcelone", "Valence", "Séville"],
    extraSources: [],
  },
  italie: {
    capital: "Rome",
    languages: "Italien",
    currency: "Euro (EUR)",
    cities: ["Rome", "Milan", "Turin", "Bologne"],
    extraSources: [],
  },
  malte: {
    capital: "La Valette",
    languages: "Maltais et anglais (langues officielles)",
    currency: "Euro (EUR)",
    cities: ["La Valette", "Sliema", "Saint-Julien"],
    extraSources: [],
  },
  norvege: {
    capital: "Oslo",
    languages: "Norvégien",
    currency: "Couronne norvégienne (NOK)",
    cities: ["Oslo", "Bergen", "Trondheim", "Stavanger"],
    extraSources: [],
  },
  "nouvelle-zelande": {
    capital: "Wellington",
    languages: "Anglais (de fait), maori et langue des signes néo-zélandaise (langues officielles)",
    currency: "Dollar néo-zélandais (NZD)",
    cities: ["Auckland", "Wellington", "Christchurch"],
    extraSources: [],
  },
  emirats: {
    capital: "Abou Dabi",
    languages: "Arabe (langue officielle) ; l’anglais est très utilisé",
    currency: "Dirham des Émirats (AED)",
    cities: ["Dubaï", "Abou Dabi", "Charjah"],
    extraSources: [],
  },
  qatar: {
    capital: "Doha",
    languages: "Arabe (langue officielle) ; l’anglais est très utilisé",
    currency: "Riyal qatarien (QAR)",
    cities: ["Doha", "Al Rayyan", "Al Wakrah", "Lusail"],
    extraSources: [],
  },
  "arabie-saoudite": {
    capital: "Riyad",
    languages: "Arabe",
    currency: "Riyal saoudien (SAR)",
    cities: ["Riyad", "Djeddah", "Dammam"],
    extraSources: [],
  },
  "coree-du-sud": {
    capital: "Séoul",
    languages: "Coréen",
    currency: "Won sud-coréen (KRW)",
    cities: ["Séoul", "Busan", "Incheon", "Daejeon"],
    extraSources: [],
  },
  japon: {
    capital: "Tokyo",
    languages: "Japonais",
    currency: "Yen (JPY)",
    cities: ["Tokyo", "Osaka", "Nagoya", "Fukuoka"],
    extraSources: [],
  },
};

export function getCountryFacts(slug: string): CountryFacts | undefined {
  return countryFacts[slug];
}
