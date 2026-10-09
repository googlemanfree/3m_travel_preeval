import { ArrowRight, BriefcaseBusiness, Building2, Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CORRIDOR_REGIONS, CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { Button } from "@/components/ui/button";

/**
 * Hub public des 4 interfaces — porte d’entrée internationale pour recruteurs
 * et orientation claire vers client / agences / employeurs.
 */
export default function PartnersHub() {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(135,185,255,0.25),_transparent_28rem),linear-gradient(160deg,_#071b3d_0%,_#0b2f6f_55%,_#1463ff_120%)]">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20" data-testid="partners-hub-hero">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-sky-200">
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          {en ? "Africa → Europe · Americas · Asia" : "Afrique → Europe · Amériques · Asie"}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
          {en ? "International talent corridor" : "Corridor de talents international"}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-sky-100 sm:text-lg">
          {en
            ? "Candidates across Africa register and build a selectable profile. Verified placement agencies and employers shortlist anonymised profiles. 3M TRAVEL AGENCY then handles the administrative procedure once contract and invitation letter are approved."
            : "Les candidats d’Afrique s’inscrivent et construisent un profil sélectionnable. Les agences de placement et employeurs vérifiés présélectionnent des profils anonymisés. 3M TRAVEL AGENCY gère ensuite la procédure administrative une fois le contrat et la lettre d’invitation approuvés."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {CORRIDOR_REGIONS.map((region) => (
            <span key={region.id} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white">
              {en ? region.en : region.fr}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="four-interfaces-title">
        <h2 id="four-interfaces-title" className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">
          {en ? "Four interfaces · one corridor" : "Quatre interfaces · un corridor"}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <a href="/register" className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition hover:-translate-y-0.5 hover:shadow-xl" data-testid="partners-hub-client">
            <UsersRound className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "1. Candidate space" : "1. Espace candidat"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Create an account, complete the assessment, consent to anonymised sharing, and become selectable."
                : "Créer un compte, compléter l’évaluation, consentir au partage anonymisé et devenir sélectionnable."}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff]">
              {en ? "Register / sign in" : "S’inscrire / se connecter"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-white" data-testid="partners-hub-admin">
            <ShieldCheck className="h-8 w-8 text-amber-300" aria-hidden="true" />
            <p className="mt-4 text-lg font-black">{en ? "2. 3M back-office" : "2. Back-office 3M"}</p>
            <p className="mt-2 text-sm leading-6 text-sky-100">
              {en
                ? "Verify organisations, prepare anonymised profiles, confirm contracts & invitations, open Protocol No. 02, run the visa procedure."
                : "Vérifier les organisations, préparer les profils anonymisés, confirmer contrats & invitations, ouvrir le Protocole N°02, piloter la procédure visa."}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-sky-200">
              {en ? "Internal access only" : "Accès interne uniquement"}
            </p>
          </div>

          <a href={CORRIDOR_ROUTES.agencies} className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition hover:-translate-y-0.5 hover:shadow-xl" data-testid="partners-hub-agencies">
            <BriefcaseBusiness className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "3. Placement agencies" : "3. Agences de placement"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Access eligible candidates from the 3M evaluation pipeline. Human verification before any credentials."
                : "Accéder aux candidats éligibles issus de l’évaluation 3M. Vérification humaine avant tout identifiant."}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff]">
              {en ? "Agency portal" : "Portail agences"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
            <p className="mt-3 text-xs text-slate-500">
              <a href={CORRIDOR_ROUTES.agenciesLogin} className="font-semibold text-indigo-700 underline-offset-2 hover:underline">
                {en ? "Already verified? Sign in to the agency workspace" : "Déjà vérifié ? Ouvrir l’espace agence"}
              </a>
            </p>
          </a>

          <a href={CORRIDOR_ROUTES.employers} className="group rounded-2xl border border-white/20 bg-white/95 p-6 transition hover:-translate-y-0.5 hover:shadow-xl" data-testid="partners-hub-employers">
            <Building2 className="h-8 w-8 text-[#0f2460]" aria-hidden="true" />
            <p className="mt-4 text-lg font-black text-slate-950">{en ? "4. Direct employers" : "4. Employeurs directs"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {en
                ? "Review top anonymised profiles for Europe, the Americas and Asia. Select, then 3M handles admin follow-up."
                : "Examiner les meilleurs profils anonymisés pour l’Europe, les Amériques et l’Asie. Sélectionner, puis 3M gère le suivi admin."}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1463ff]">
              {en ? "Employer portal" : "Portail employeurs"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-6 text-sky-50">
          <p className="font-black text-white">{en ? "Credibility rules for international ads" : "Règles de crédibilité pour les pubs internationales"}</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2">
            <li>· {en ? "Organisation verification is mandatory" : "Vérification d’organisation obligatoire"}</li>
            <li>· {en ? "Candidate consent + anonymised profiles only" : "Consentement candidat + profils anonymisés uniquement"}</li>
            <li>· {en ? "No automatic access or hiring decision" : "Aucun accès automatique ni décision d’embauche"}</li>
            <li>· {en ? "Immigration outcome remains with authorities" : "La décision d’immigration reste aux autorités"}</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-[#071b3d] hover:bg-sky-50">
              <a href="/?project=travail#evaluation-multi">{en ? "Candidate assessment" : "Évaluation candidat"}</a>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={CORRIDOR_ROUTES.agenciesRegister}>{en ? "Request agency access" : "Demander un accès agence"}</a>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href={CORRIDOR_ROUTES.employersRegister}>{en ? "Request employer access" : "Demander un accès employeur"}</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
