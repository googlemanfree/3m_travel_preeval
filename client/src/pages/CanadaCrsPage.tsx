import React, { Suspense } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { SimulatorRetryBoundary } from "@/components/SimulatorRetryBoundary";

const CanadaScoreSimulator = React.lazy(() => import("@/components/CanadaScoreSimulator"));

const IRCC_CALCULATOR_URL = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html#calculatrice";

export default function CanadaCrsPage() {
  return (
    <ServicePageShell
      eyebrow="Canada · Entrée express · SCG / CRS"
      title="Calculatrice CRS Canada — parcours dédié"
      introduction="Cette page est réservée au Canada et au Système de classement global d’Entrée express. Saisissez vos réponses comme dans la calculatrice officielle d’IRCC pour obtenir un résultat indicatif, détaillé et cohérent."
      primaryHref="#calculatrice-crs"
      primaryLabel="Commencer la calculatrice CRS"
      officialHref={IRCC_CALCULATOR_URL}
      officialLabel="Ouvrir la calculatrice IRCC"
      notice="Résultat indicatif uniquement : le système Entrée express et les instructions officielles d’IRCC ont toujours préséance. Les points d’offre d’emploi ne sont plus accordés au SCG depuis le 25 mars 2025."
    >
      <section className="relative isolate overflow-hidden bg-[#071d39] px-4 py-14 text-white sm:px-6 lg:px-8">
        <img src="/manus-storage/canada-hero-original_5fe49ae0.jpg" alt="Ville canadienne au bord de l’eau" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#061a36] via-[#0a3264]/90 to-[#0a3264]/55" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Canada à part</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Un résultat CRS lisible, avec les quatre compétences linguistiques.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">Âge, études, langue officielle première et seconde, expérience canadienne, conjoint, transférabilité et points additionnels sont regroupés dans un rapport clair. Le calcul ne mélange pas les barèmes des autres pays.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"><ShieldCheck className="h-8 w-8 text-amber-300" /><p className="mt-3 text-sm font-bold">Référence officielle</p><p className="mt-2 text-xs leading-5 text-blue-100">La calculatrice 3M Travel sert à préparer une discussion et ne remplace pas le résultat généré par le profil Entrée express.</p><a href={IRCC_CALCULATOR_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-200 underline underline-offset-4"><ExternalLink className="h-4 w-4" /> Voir la source IRCC</a></div>
        </div>
      </section>

      <div id="calculatrice-crs" className="scroll-mt-24">
        <ServiceSection tone="blue" title="Calculatrice CRS Canada" introduction="Choisissez le parcours Canada dans le formulaire, puis renseignez chaque compétence linguistique séparément. Le résultat et le PDF détaillent les points obtenus et les leviers d’amélioration.">
          <SimulatorRetryBoundary label="La calculatrice CRS Canada" onRetry={() => window.location.reload()} onFailure={() => undefined}>
            <Suspense fallback={<div className="rounded-2xl border border-blue-200 bg-white p-6 text-sm font-semibold text-blue-900" role="status">Chargement de la calculatrice CRS…</div>}>
              <CanadaScoreSimulator />
            </Suspense>
          </SimulatorRetryBoundary>
        </ServiceSection>
      </div>
    </ServicePageShell>
  );
}
