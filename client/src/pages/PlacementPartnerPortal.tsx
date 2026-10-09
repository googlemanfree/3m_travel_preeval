import { ArrowRight, BriefcaseBusiness, CheckCircle2, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlacementPartnerPortal() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(109,145,255,0.2),_transparent_30rem),linear-gradient(145deg,_#071b3d_0%,_#0b2f6f_100%)] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="max-w-3xl text-white">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">3M TRAVEL AGENCY · B2B</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Portail agences de placement</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">Accédez, après vérification par 3M, à des profils professionnels éligibles à une mise en relation ciblée. Chaque profil est anonymisé et partagé uniquement avec le consentement actif du candidat.</p>
          <a href="/employeurs?portal=placement_partner" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-amber-300 px-5 py-3 font-black text-[#071b3d] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Se connecter comme agence partenaire <ArrowRight className="h-5 w-5" /></a>
        </section>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/20 bg-white/95"><CardHeader><CardTitle className="flex items-center gap-2 text-[#071b3d]"><UsersRound className="h-5 w-5 text-indigo-700" />Profils éligibles</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Les profils sont présélectionnés à partir d’une évaluation humaine, sans décision automatique d’embauche.</CardContent></Card>
          <Card className="border-white/20 bg-white/95"><CardHeader><CardTitle className="flex items-center gap-2 text-[#071b3d]"><ShieldCheck className="h-5 w-5 text-emerald-700" />Consentement vérifiable</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">Le candidat peut autoriser ou retirer le partage depuis son espace personnel.</CardContent></Card>
          <Card className="border-white/20 bg-white/95"><CardHeader><CardTitle className="flex items-center gap-2 text-[#071b3d]"><LockKeyhole className="h-5 w-5 text-amber-700" />Accès contrôlé</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">L’accès est créé par l’administration après vérification de l’organisation et remis par un canal approuvé.</CardContent></Card>
        </div>
        <section className="rounded-2xl border border-white/20 bg-white/10 p-5 text-blue-50" aria-label="Demande d’accès partenaire">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-black text-white">Vous souhaitez devenir partenaire ?</h2><p className="mt-1 text-sm leading-6">Envoyez votre demande à l’agence avec votre raison sociale, pays d’activité et e-mail professionnel. 3M vérifiera l’organisation avant toute création d’accès ou transmission de profil.</p><a href="/contact?subject=Demande%20d%27acces%20agence%20de%20placement" className="mt-3 inline-flex items-center gap-1 font-bold text-amber-200 underline underline-offset-4">Demander un accès partenaire <ArrowRight className="h-4 w-4" /></a></div></div>
        </section>
      </div>
    </main>
  );
}
