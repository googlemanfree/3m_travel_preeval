import { ExternalLink, Landmark, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { OFFICIAL_CONSULAR_PORTALS } from "@/data/officialConsularPortals";

const DESTINATIONS = [
  ["canada", "Canada", "Immigration, Réfugiés et Citoyenneté Canada"],
  ["france", "France", "France-Visas"],
  ["allemagne", "Allemagne", "Ministère fédéral des Affaires étrangères"],
  ["belgique", "Belgique", "SPF Affaires étrangères"],
  ["espagne", "Espagne", "Ministère des Affaires étrangères"],
  ["italie", "Italie", "Ministère des Affaires étrangères"],
  ["luxembourg", "Luxembourg", "Gouvernement du Luxembourg"],
  ["portugal", "Portugal", "Ministère des Affaires étrangères"],
  ["royaume-uni", "Royaume-Uni", "GOV.UK — Visas et immigration"],
  ["suisse", "Suisse", "Secrétariat d’État aux migrations"],
  ["australie", "Australie", "Department of Home Affairs"],
  ["etats-unis", "États-Unis", "U.S. Department of State"],
] as const;

export default function OfficialSources() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Transparence documentaire</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Sources officielles par destination</h1>
          <p className="mt-5 text-base leading-7 text-slate-600">
            Consultez les portails institutionnels avant toute démarche. Les conditions, frais et délais relèvent des autorités compétentes et peuvent évoluer.
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8" aria-label="Limites des informations">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-blue-800" aria-hidden="true" />
            <p className="text-sm leading-6 text-blue-950">
              Les liens ci-dessous renvoient vers des ressources publiques d’autorités nationales. Ils ne constituent ni une garantie d’éligibilité, ni une soumission, ni une décision de visa. Vérifiez toujours la procédure adaptée à votre nationalité et à votre projet.
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Portails institutionnels">
          {DESTINATIONS.map(([key, country, authority]) => {
            const portal = OFFICIAL_CONSULAR_PORTALS[key];
            if (!portal) return null;
            return (
              <article key={key} className="flex min-h-58 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{country}</h2>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{authority}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-600">{portal.label}</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">Contrôlé le {portal.verifiedAt}. Les exigences peuvent changer.</p>
                <a href={portal.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-2 pt-6 text-sm font-black text-blue-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  Ouvrir la source officielle <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            );
          })}
        </section>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7 text-center">
          <h2 className="text-2xl font-black text-slate-950">Besoin de comprendre une procédure&nbsp;?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">L’évaluation gratuite permet de présenter votre projet. Un conseiller explique ensuite le périmètre du service, les documents attendus et les limites applicables.</p>
          <Link href="/?project=travail#evaluation-multi" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Commencer l’évaluation gratuite</Link>
        </section>
      </div>
    </main>
  );
}
