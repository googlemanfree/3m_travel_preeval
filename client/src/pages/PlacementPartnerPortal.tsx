import { ArrowRight, BriefcaseBusiness, CheckCircle2, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { B2bPartnerRegistrationForm } from "@/components/B2bPartnerRegistrationForm";
import { CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlacementPartnerPortal() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(109,145,255,0.2),_transparent_30rem),linear-gradient(145deg,_#071b3d_0%,_#0b2f6f_100%)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="max-w-3xl text-white">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">3M TRAVEL AGENCY · B2B</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Portail agences de placement</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            Identifiez votre agence, puis connectez-vous après vérification par 3M. Chaque profil partagé est anonymisé et soumis au consentement actif du candidat.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#inscription-agence" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-black text-[#071b3d] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              S’identifier à l’inscription <ArrowRight className="h-5 w-5" />
            </a>
            <a href={`${CORRIDOR_ROUTES.employersLogin}&portal=placement_partner`} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <LockKeyhole className="h-5 w-5" /> Déjà partenaire — se connecter
            </a>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/20 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#071b3d]"><UsersRound className="h-5 w-5 text-indigo-700" />Profils éligibles</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">Les profils sont présélectionnés à partir d’une évaluation humaine, sans décision automatique d’embauche.</CardContent>
          </Card>
          <Card className="border-white/20 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#071b3d]"><ShieldCheck className="h-5 w-5 text-emerald-700" />Consentement vérifiable</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">Le candidat peut autoriser ou retirer le partage depuis son espace personnel.</CardContent>
          </Card>
          <Card className="border-white/20 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#071b3d]"><LockKeyhole className="h-5 w-5 text-amber-700" />Accès contrôlé</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">L’accès est créé par l’administration après vérification de l’organisation et remis par un canal approuvé.</CardContent>
          </Card>
        </div>

        <section id="inscription-agence" className="reveal-on-scroll rounded-2xl border border-white/20 bg-white p-5 text-slate-900 shadow-xl sm:p-7">
          <B2bPartnerRegistrationForm defaultOrganizationType="placement_partner" lockOrganizationType />
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/10 p-5 text-blue-50" aria-label="Règles de confidentialité partenaire">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h2 className="flex items-center gap-2 font-black text-white"><BriefcaseBusiness className="h-5 w-5" />Un cadre de partage limité</h2>
              <p className="mt-1 text-sm leading-6">Les portails partenaires ne présentent que des profils anonymisés. Aucun CV brut, numéro, adresse, e-mail ou document d’identité n’est exposé sans contrôle humain et consentement actif.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
