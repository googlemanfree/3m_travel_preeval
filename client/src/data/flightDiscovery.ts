/**
 * Contenu de la page de vols avant toute recherche : parcours fréquents, étapes, services liés.
 * Aucun tarif n'est écrit ici : un prix n'est affiché qu'issu d'une vraie recherche (voir flightPriceProvenance).
 */

export type FlightTripKind = "ROUND_TRIP" | "ONE_WAY";

export type FlightRoute = {
  id: string;
  from: { iata: string; city: string };
  to: { iata: string; city: string };
  tripType: FlightTripKind;
};

export type FlightRouteGroup = {
  id: string;
  title: string;
  intro: string;
  routes: FlightRoute[];
};

const route = (from: [string, string], to: [string, string], tripType: FlightTripKind = "ROUND_TRIP"): FlightRoute => ({
  id: `${from[0]}-${to[0]}`.toLowerCase(),
  from: { iata: from[0], city: from[1] },
  to: { iata: to[0], city: to[1] },
  tripType,
});

const YAOUNDE: [string, string] = ["NSI", "Yaoundé"];
const DOUALA: [string, string] = ["DLA", "Douala"];

export const FLIGHT_ROUTE_GROUPS: FlightRouteGroup[] = [
  {
    id: "canada",
    title: "Vers le Canada",
    intro: "Études, travail, immigration ou visite de proches.",
    routes: [route(YAOUNDE, ["YUL", "Montréal"]), route(DOUALA, ["YUL", "Montréal"]), route(DOUALA, ["YYZ", "Toronto"])],
  },
  {
    id: "europe",
    title: "Vers l’Europe",
    intro: "Espace Schengen, Royaume-Uni et correspondances.",
    routes: [route(YAOUNDE, ["CDG", "Paris"]), route(DOUALA, ["CDG", "Paris"]), route(DOUALA, ["BRU", "Bruxelles"]), route(DOUALA, ["IST", "Istanbul"])],
  },
  {
    id: "asie",
    title: "Vers la Chine et le Golfe",
    intro: "Affaires, études et escales vers l’Asie.",
    routes: [route(DOUALA, ["CAN", "Canton"]), route(DOUALA, ["PEK", "Pékin"]), route(YAOUNDE, ["DXB", "Dubaï"])],
  },
  {
    id: "afrique",
    title: "Au Cameroun et en Afrique",
    intro: "Vols intérieurs et liaisons régionales.",
    routes: [route(YAOUNDE, DOUALA, "ONE_WAY"), route(DOUALA, ["ABJ", "Abidjan"]), route(DOUALA, ["CMN", "Casablanca"]), route(DOUALA, ["ADD", "Addis-Abeba"])],
  },
];

export const ALL_FLIGHT_ROUTES: FlightRoute[] = FLIGHT_ROUTE_GROUPS.flatMap((group) => group.routes);

/** Liens de recherche par ville de départ (maillage interne) : mêmes parcours, regroupés autrement. */
export const FLIGHT_ROUTES_BY_DEPARTURE: Array<{ city: string; routes: FlightRoute[] }> = ["NSI", "DLA"].map((iata) => {
  const routes = ALL_FLIGHT_ROUTES.filter((item) => item.from.iata === iata);
  return { city: routes[0]?.from.city ?? iata, routes };
});

export type FlightServiceTab = { id: string; label: string; href: string; active?: boolean };

export const FLIGHT_SERVICE_TABS: FlightServiceTab[] = [
  { id: "vols", label: "Vols", href: "/flights", active: true },
  { id: "hotels", label: "Hôtels", href: "#3m-booking" },
  { id: "sejours", label: "Séjours", href: "/tourisme" },
  { id: "voitures", label: "Voitures", href: "/tourisme?service=vehicle" },
  { id: "assurance", label: "Assurance", href: "/assurance" },
  { id: "evisa", label: "e-Visa", href: "/evisas" },
  { id: "visa", label: "Visa", href: "/procedures" },
];

export const FLIGHT_BOOKING_STEPS: Array<{ title: string; text: string }> = [
  { title: "Recherchez votre trajet", text: "Choisissez vos villes, vos dates, le nombre de voyageurs et la classe. Ajoutez un filtre sur les escales si besoin." },
  { title: "Comparez et choisissez", text: "Prix, durée, escales et compagnie : triez les résultats et retenez le vol qui vous convient." },
  { title: "Envoyez votre demande", text: "Réservez en ligne ou par WhatsApp : le vol, le prix et les voyageurs sont transmis à un conseiller sans ressaisie." },
  { title: "Un conseiller confirme", text: "Il vérifie la disponibilité et le tarif, vous accompagne pour le paiement en ligne ou en agence, puis vous remet votre billet." },
];

export const FLIGHT_ADVANTAGES: Array<{ title: string; text: string }> = [
  { title: "Tarifs comparés, origine indiquée", text: "Chaque résultat précise d’où vient le tarif, et signale un résultat mémorisé ou de démonstration." },
  { title: "Un conseiller à chaque étape", text: "Assistance WhatsApp, agence physique, et assistant Aureol pour préparer un itinéraire sur mesure." },
  { title: "Paiement en ligne ou en agence", text: "Vous choisissez ce qui vous rassure ; votre PNR est validé avant tout règlement." },
  { title: "Un seul interlocuteur pour tout le voyage", text: "Visa, assurance, hôtel et billet : votre dossier reste au même endroit." },
];

export const FLIGHT_COMPANION_SERVICES: Array<{ title: string; text: string; href: string; cta: string }> = [
  { title: "Assurance voyage", text: "Une assurance voyage est exigée pour un visa Schengen : demandez-la en même temps que votre billet.", href: "/assurance", cta: "Demander une assurance" },
  { title: "e-Visa", text: "Pour les pays qui délivrent un e-Visa, préparez votre demande en ligne avant de partir.", href: "/evisas", cta: "Voir les e-Visa" },
  { title: "Hôtels et séjours", text: "Réservez votre hébergement avec 3M Booking et gardez un seul interlocuteur.", href: "#3m-booking", cta: "Voir 3M Booking" },
  { title: "Procédures de visa", text: "Études, travail, tourisme : les étapes et les sources officielles, par destination.", href: "/procedures", cta: "Consulter les procédures" },
];

/** Options d'escales proposées avant la recherche ; null = pas de limite. */
export const FLIGHT_STOP_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: "Toutes les escales" },
  { value: 0, label: "Vols directs uniquement" },
  { value: 1, label: "1 escale maximum" },
];
