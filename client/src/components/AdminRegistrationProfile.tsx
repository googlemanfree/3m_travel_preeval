import React from "react";
import CountryFlag from "@/components/CountryFlag";
import { getCandidateDestinationOption } from "@shared/candidateDestinationOptions";

export type RegistrationProfile = {
  preferredDestinations?: string[] | null;
  visaType?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  languageLevel?: string | null;
  nationality?: string | null;
};

/** Ce que le candidat a déclaré à l'inscription, tel que l'équipe doit le voir dans le back-office. */
export default function AdminRegistrationProfile({ profile }: { profile?: RegistrationProfile | null }) {
  if (!profile) return null;
  const destinations = profile.preferredDestinations ?? [];
  const rows: Array<[string, string | null | undefined]> = [
    ["Type de projet", profile.visaType],
    ["Niveau d’études", profile.educationLevel],
    ["Situation professionnelle", profile.employmentStatus],
    ["Niveau de langue", profile.languageLevel],
    ["Nationalité", profile.nationality],
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="registration-profile-title">
      <p id="registration-profile-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">Projet déclaré à l’inscription</p>
      <div className="mt-3">
        <p className="text-xs font-semibold text-slate-500">Destinations{destinations.length > 1 ? " (la première est la principale)" : ""}</p>
        {destinations.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">Aucune destination précise déclarée.</p>
        ) : (
          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Destinations déclarées">
            {destinations.map((name, index) => {
              const option = getCandidateDestinationOption(name);
              return (
                <li key={name} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900">
                  {option && <CountryFlag flag={option.flag} />}
                  {option?.name ?? name}
                  {index === 0 && <span className="rounded-full bg-blue-700 px-1.5 text-[10px] font-black uppercase leading-4 text-white">Principale</span>}
                  {option && !option.hasGuide && <span className="text-[10px] font-medium text-amber-700">sans guide</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd className="text-sm text-slate-800">{value || <span className="text-slate-400">Non renseigné</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
