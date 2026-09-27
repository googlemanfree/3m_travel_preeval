import React from "react";
import { ArrowRight, BadgeCheck, CreditCard, ListChecks, MessageCircle, Plane, Route as RouteIcon, Search, Send, ShieldCheck, Star } from "lucide-react";
import {
  FLIGHT_ADVANTAGES,
  FLIGHT_BOOKING_STEPS,
  FLIGHT_COMPANION_SERVICES,
  FLIGHT_ROUTES_BY_DEPARTURE,
  FLIGHT_ROUTE_GROUPS,
  FLIGHT_SERVICE_TABS,
  type FlightRoute,
} from "@/data/flightDiscovery";

type PickRoute = (route: FlightRoute) => void;

const tripLabel = (route: FlightRoute) => (route.tripType === "ROUND_TRIP" ? "Aller-retour" : "Aller simple");

/** Passerelle vers les autres services 3M, au-dessus du formulaire de recherche. */
export function FlightServiceTabs() {
  return (
    <nav aria-label="Services de voyage 3M" className="mb-5 -mx-1 flex justify-start gap-2 overflow-x-auto px-1 pb-1 sm:justify-center" data-testid="flight-service-tabs">
      {FLIGHT_SERVICE_TABS.map((tab) => (
        <a
          key={tab.id}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            tab.active ? "bg-white text-[#1E3A8A] shadow-md" : "bg-white/15 text-white hover:bg-white/30"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}

export type BestOffer = {
  routeId: string;
  tripType: "ROUND_TRIP" | "ONE_WAY";
  from: { iata: string; city: string };
  to: { iata: string; city: string };
  departureDate: string;
  returnDate: string | null;
  priceXaf: number;
  airline: string;
  /** Logo réellement fourni par le fournisseur pour cette compagnie ; absent si inconnu (jamais un logo générique inventé). */
  airlineLogo: string | null;
  stops: number;
  durationMinutes: number;
};

/** Petit logo de compagnie à côté des codes IATA ; sans logo connu ou en cas d'échec de chargement, une icône neutre le remplace. */
function OfferAirlineLogo({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = React.useState(false);
  if (!logo || failed) return <Plane data-testid="offer-airline-logo-fallback" className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />;
  return <img src={logo} alt="" aria-hidden="true" loading="lazy" data-testid="offer-airline-logo" onError={() => setFailed(true)} className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain" />;
}

const formatOfferDate = (iso: string) => {
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};
export const formatOfferPrice = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
const stopsLabel = (stops: number) => (stops === 0 ? "Direct" : stops === 1 ? "1 escale" : `${stops} escales`);
const durationLabel = (minutes: number) => (minutes > 0 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}` : "");

/**
 * « Meilleures offres » : tarifs le plus bas réellement relevés chez le fournisseur (jamais écrits en dur), avec leur date de
 * relevé. Rien ne s'affiche sans données réelles ; un clic lance la recherche avec exactement ces dates.
 */
export function FlightBestOffers({ offers, retrievedAt, onPick, onAdvisor }: { offers: BestOffer[]; retrievedAt: string | null; onPick: (offer: BestOffer) => void; onAdvisor?: (offer: BestOffer, intent: "quote" | "watch") => void }) {
  if (offers.length === 0) return null;
  const retrieved = retrievedAt ? new Date(retrievedAt) : null;
  const retrievedLabel = retrieved && !Number.isNaN(retrieved.getTime()) ? retrieved.toLocaleString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <section aria-labelledby="flight-offers-title" className="mx-auto max-w-6xl px-4 pt-10" data-testid="flight-best-offers">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-widest text-amber-600">Meilleures offres</p>
        <h2 id="flight-offers-title" className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">Les tarifs les plus bas relevés pour vous</h2>
        <p className="mt-2 text-sm text-slate-600">Comparez les meilleurs tarifs sur les parcours les plus demandés, puis lancez la recherche en un clic.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <div key={offer.routeId} className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
          <button
            type="button"
            onClick={() => onPick(offer)}
            data-testid={`flight-offer-${offer.routeId}`}
            aria-label={`Voir les vols ${offer.from.city} ${offer.to.city} à partir de ${formatOfferPrice(offer.priceXaf)}`}
            className="group flex-1 rounded-2xl p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>{offer.tripType === "ROUND_TRIP" ? "Aller-retour" : "Aller simple"}</span>
              <span className="normal-case">{stopsLabel(offer.stops)}{durationLabel(offer.durationMinutes) ? ` · ${durationLabel(offer.durationMinutes)}` : ""}</span>
            </span>
            <span className="mt-2 flex items-center gap-2 text-lg font-black text-slate-900">
              <span className="truncate">{offer.from.city}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <span className="truncate">{offer.to.city}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <OfferAirlineLogo name={offer.airline} logo={offer.airlineLogo} />
              {offer.from.iata} – {offer.to.iata} · {offer.airline}
            </span>
            <span className="mt-3 block text-sm text-slate-700">{formatOfferDate(offer.departureDate)}{offer.returnDate ? ` → ${formatOfferDate(offer.returnDate)}` : ""}</span>
            <span className="mt-3 flex items-end justify-between gap-3">
              <span>
                <span className="block text-xs text-slate-500">à partir de</span>
                <span className="block text-2xl font-black text-blue-800" data-testid="offer-price">{formatOfferPrice(offer.priceXaf)}</span>
                {retrievedLabel && <span className="block text-[11px] text-slate-400" data-testid="offer-retrieved">Relevé le {retrievedLabel}</span>}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 transition group-hover:bg-blue-700 group-hover:text-white"><Search className="h-3.5 w-3.5" aria-hidden="true" /> Voir ce vol</span>
            </span>
          </button>
          {onAdvisor && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3" data-testid={`flight-offer-actions-${offer.routeId}`}>
              <button type="button" onClick={() => onAdvisor(offer, "quote")} data-testid={`flight-offer-advisor-${offer.routeId}`} className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Réserver via un conseiller
              </button>
              <button type="button" onClick={() => onAdvisor(offer, "watch")} data-testid={`flight-offer-watch-${offer.routeId}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                Faire suivre ce tarif
              </button>
            </div>
          )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500" data-testid="offers-provenance">
        Tarifs {retrievedLabel ? `relevés le ${retrievedLabel}` : "relevés"} sur Google Flights pour 1 adulte en classe économique ; ils évoluent sans préavis. Bagages, conditions, taxes et disponibilité sont confirmés par un conseiller 3M avant toute réservation.
      </p>
    </section>
  );
}

export type ClientReview = { id?: number; displayName?: string; destinationCountry?: string; serviceType?: string; rating?: number; reviewText?: string; createdAt?: string | Date };

/**
 * Avis de clients déjà approuvés par l'équipe (avec leur consentement de publication). Les 3 plus récents, sans tri sur la note.
 * Sans avis approuvé, rien ne s'affiche : aucun témoignage n'est jamais fabriqué.
 */
export function FlightClientReviews({ reviews }: { reviews: ClientReview[] }) {
  const shown = reviews
    .filter((review) => (review.reviewText ?? "").trim().length > 0 && Number.isFinite(review.rating))
    .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
    .slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <section aria-labelledby="flight-reviews-title" className="mx-auto max-w-6xl px-4 py-10" data-testid="flight-client-reviews">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-widest text-amber-600">Avis de nos clients</p>
        <h2 id="flight-reviews-title" className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">Ils ont voyagé avec 3M</h2>
        <p className="mt-2 text-sm text-slate-600">Avis déposés par des clients, publiés avec leur accord après vérification par notre équipe.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {shown.map((review, index) => (
          <figure key={review.id ?? index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="flight-review-card">
            <div className="flex gap-0.5" role="img" aria-label={`${review.rating} sur 5`}>
              {Array.from({ length: 5 }).map((_, star) => (
                <Star key={star} aria-hidden="true" className={`h-4 w-4 ${star < (review.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
              ))}
            </div>
            <blockquote className="mt-3 line-clamp-5 text-sm leading-6 text-slate-700">“{review.reviewText}”</blockquote>
            <figcaption className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="block text-sm font-bold text-slate-900">{review.displayName}</span>
              {[review.destinationCountry, review.serviceType].filter(Boolean).join(" • ")}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-6 text-center text-sm">
        <a href="/avis" className="font-bold text-blue-800 underline underline-offset-4 hover:text-blue-950">Voir tous les avis</a>
      </p>
    </section>
  );
}

function RouteButton({ route, onPick }: { route: FlightRoute; onPick: PickRoute }) {
  return (
    <button
      type="button"
      onClick={() => onPick(route)}
      data-testid={`flight-route-${route.id}`}
      aria-label={`Rechercher un vol ${route.from.city} vers ${route.to.city}`}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-base font-black text-slate-900">
          <span className="truncate">{route.from.city}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">{route.to.city}</span>
        </span>
        <span className="mt-1 block text-xs font-semibold text-slate-500">
          {route.from.iata} – {route.to.iata} · {tripLabel(route)}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800 transition group-hover:bg-blue-700 group-hover:text-white">
        <Search className="h-3.5 w-3.5" aria-hidden="true" /> Voir les vols
      </span>
    </button>
  );
}

/** Parcours fréquents : un clic lance la recherche. Aucun tarif n'est affiché avant une vraie recherche. */
export function FlightPopularRoutes({ onPick }: { onPick: PickRoute }) {
  return (
    <section aria-labelledby="flight-popular-title" className="mx-auto max-w-6xl px-4 py-10" data-testid="flight-popular-routes">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Parcours fréquents</p>
        <h2 id="flight-popular-title" className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">Où voulez-vous aller ?</h2>
        <p className="mt-2 text-sm text-slate-600">Choisissez un trajet : nous lançons la recherche avec des dates dans deux semaines, que vous pouvez modifier ensuite. Le prix affiché est toujours celui de la recherche, jamais un tarif de vitrine.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {FLIGHT_ROUTE_GROUPS.map((group) => (
          <div key={group.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Plane className="h-5 w-5 text-blue-700" aria-hidden="true" /> {group.title}
            </h3>
            <p className="mb-4 mt-1 text-xs text-slate-500">{group.intro}</p>
            <div className="grid gap-3">
              {group.routes.map((route) => (
                <RouteButton key={route.id} route={route} onPick={onPick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEP_ICONS = [Search, ListChecks, Send, BadgeCheck];

function HowItWorks() {
  return (
    <section aria-labelledby="flight-steps-title" className="mx-auto max-w-6xl px-4 py-10" data-testid="flight-steps">
      <h2 id="flight-steps-title" className="mb-8 text-center text-2xl font-black text-slate-900 md:text-3xl">Réserver en quatre étapes</h2>
      <ol className="grid gap-4 md:grid-cols-4">
        {FLIGHT_BOOKING_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Search;
          return (
            <li key={step.title} className="relative rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <span className="absolute -top-3 left-5 rounded-full bg-blue-700 px-2.5 py-0.5 text-xs font-black text-white">Étape {index + 1}</span>
              <Icon className="mb-3 mt-1 h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="text-base font-black text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.text}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const ADVANTAGE_ICONS = [ShieldCheck, MessageCircle, CreditCard, RouteIcon];

function Advantages() {
  return (
    <section aria-labelledby="flight-advantages-title" className="bg-slate-50 py-10" data-testid="flight-advantages">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="flight-advantages-title" className="mb-8 text-center text-2xl font-black text-slate-900 md:text-3xl">Pourquoi réserver avec 3M Travel</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FLIGHT_ADVANTAGES.map((item, index) => {
            const Icon = ADVANTAGE_ICONS[index] ?? ShieldCheck;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CompanionServices() {
  return (
    <section aria-labelledby="flight-companion-title" className="mx-auto max-w-6xl px-4 py-10" data-testid="flight-companion-services">
      <h2 id="flight-companion-title" className="mb-2 text-center text-2xl font-black text-slate-900 md:text-3xl">Complétez votre voyage</h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-slate-600">Le billet n’est qu’une étape : préparez aussi votre visa, votre assurance et votre hébergement au même endroit.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FLIGHT_COMPANION_SERVICES.map((item) => (
          <a key={item.title} href={item.href} className="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            <h3 className="text-base font-black text-slate-900">{item.title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-600">{item.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-blue-700">{item.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </a>
        ))}
      </div>
    </section>
  );
}

function RoutesByDeparture({ onPick }: { onPick: PickRoute }) {
  return (
    <section aria-labelledby="flight-departures-title" className="mx-auto max-w-6xl px-4 pb-12 pt-4" data-testid="flight-routes-by-departure">
      <h2 id="flight-departures-title" className="mb-6 text-center text-xl font-black text-slate-900">Vols au départ de nos principales villes</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {FLIGHT_ROUTES_BY_DEPARTURE.map((group) => (
          <div key={group.city} className="rounded-2xl border border-slate-100 bg-white p-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Au départ de {group.city}</h3>
            <ul className="flex flex-wrap gap-2">
              {group.routes.map((route) => (
                <li key={route.id}>
                  <button type="button" onClick={() => onPick(route)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                    {route.from.city} → {route.to.city}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Sections toujours visibles sous les résultats : étapes, garanties, services liés et maillage par ville de départ. */
export function FlightLowerSections({ onPick }: { onPick: PickRoute }) {
  return (
    <>
      <HowItWorks />
      <Advantages />
      <CompanionServices />
      <RoutesByDeparture onPick={onPick} />
    </>
  );
}
