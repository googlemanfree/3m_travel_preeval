import React from "react";
import type { CountryFacts } from "@/data/countryFacts";

type Props = {
  country: string;
  facts: CountryFacts;
  /** Intitulé de la liste de villes : « universitaires » pour un guide d'études, « principales » pour une page de travail. */
  citiesLabel?: string;
  note?: string;
};

const DEFAULT_NOTE = "Repères généraux, à titre d’orientation : le choix d’un établissement et d’une ville dépend de la formation visée et des conditions d’admission.";

const cardClass = "rounded-xl border border-blue-100 bg-blue-50 p-4";
const labelClass = "text-[11px] font-black uppercase tracking-[.14em] text-blue-700";

/** Repères stables du pays : capitale, langues, monnaie et villes universitaires connues. */
export function CountryFactsPanel({ country, facts, citiesLabel = "Villes universitaires connues", note = DEFAULT_NOTE }: Props) {
  return (
    <section className="mt-10" aria-labelledby="reperes-pays" data-testid="country-facts">
      <h2 id="reperes-pays" className="text-2xl font-black text-slate-950">Repères : {country}</h2>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className={cardClass}>
          <dt className={labelClass}>Capitale</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-slate-900">{facts.capital}</dd>
        </div>
        <div className={cardClass}>
          <dt className={labelClass}>Monnaie</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-slate-900">{facts.currency}</dd>
        </div>
        <div className={cardClass}>
          <dt className={labelClass}>Langues</dt>
          <dd className="mt-1 text-sm font-semibold leading-6 text-slate-900">{facts.languages}</dd>
        </div>
        <div className={cardClass}>
          <dt className={labelClass}>{citiesLabel}</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {facts.cities.map((city) => (
              <span key={city} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-900">{city}</span>
            ))}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p>
    </section>
  );
}

export default CountryFactsPanel;
