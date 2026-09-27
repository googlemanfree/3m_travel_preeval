/**
 * Aéroport international principal par pays de destination, pour préremplir une recherche de vol. Ce n'est qu'un point de départ
 * (le client peut changer d'aéroport sur la page des vols) ; un pays absent de la liste ne préremplit rien.
 */

const AIRPORT_BY_COUNTRY: Record<string, { iata: string; city: string }> = {
  canada: { iata: "YUL", city: "Montréal" },
  france: { iata: "CDG", city: "Paris" },
  belgique: { iata: "BRU", city: "Bruxelles" },
  allemagne: { iata: "FRA", city: "Francfort" },
  "royaume-uni": { iata: "LHR", city: "Londres" },
  espagne: { iata: "MAD", city: "Madrid" },
  italie: { iata: "FCO", city: "Rome" },
  "pays-bas": { iata: "AMS", city: "Amsterdam" },
  "etats-unis": { iata: "JFK", city: "New York" },
  suisse: { iata: "GVA", city: "Genève" },
  autriche: { iata: "VIE", city: "Vienne" },
  portugal: { iata: "LIS", city: "Lisbonne" },
  turquie: { iata: "IST", city: "Istanbul" },
  maroc: { iata: "CMN", city: "Casablanca" },
  tunisie: { iata: "TUN", city: "Tunis" },
  egypte: { iata: "CAI", city: "Le Caire" },
  "emirats arabes unis": { iata: "DXB", city: "Dubaï" },
  chine: { iata: "PEK", city: "Pékin" },
  singapour: { iata: "SIN", city: "Singapour" },
  thailande: { iata: "BKK", city: "Bangkok" },
};

const normalize = (value: string): string => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, " ").replace(/\s+/g, " ").trim();

export function airportForDestination(destination: string | null | undefined): { iata: string; city: string } | null {
  if (!destination) return null;
  const key = normalize(destination);
  if (AIRPORT_BY_COUNTRY[key]) return AIRPORT_BY_COUNTRY[key];
  // « Canada (Québec) », « Paris, France » : le premier pays connu cité dans le texte.
  const hit = Object.keys(AIRPORT_BY_COUNTRY).find((country) => new RegExp(`(^|[^a-z])${country.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")}([^a-z]|$)`).test(key));
  return hit ? AIRPORT_BY_COUNTRY[hit] : null;
}

/** Lien vers la page des vols, départ de Yaoundé, avec l'arrivée préremplie quand le pays est connu. */
export function flightsLinkForDestination(destination: string | null | undefined): string {
  const airport = airportForDestination(destination);
  return airport ? `/flights?origin=NSI&destination=${airport.iata}` : "/flights";
}
