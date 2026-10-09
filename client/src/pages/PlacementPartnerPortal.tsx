import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function PlacementPartnerPortal() {
  const [form, setForm] = useState({ name: "", email: "", legalName: "", country: "", organizationType: "placement_partner" as "placement_partner" | "employer", message: "" });
  const requestAccess = trpc.contact.sendContactEmail.useMutation({
    onSuccess: () => {
      toast.success("Demande transmise à 3M TRAVEL AGENCY.");
      setForm({ name: "", email: "", legalName: "", country: "", organizationType: "placement_partner", message: "" });
    },
    onError: (error) => toast.error("Demande non envoyée", { description: error.message }),
  });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestAccess.mutate({
      name: form.name,
      email: form.email,
      phone: "",
      subject: `Demande d’accès partenaire — ${form.organizationType === "placement_partner" ? "agence de placement" : "employeur international"}`,
      message: `Organisation : ${form.legalName}\nPays d’activité : ${form.country}\nType : ${form.organizationType}\n\n${form.message}`,
    });
  };

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
        <section className="rounded-2xl border border-white/20 bg-white p-5 text-slate-900 shadow-xl" aria-labelledby="partner-request-title">
          <h2 id="partner-request-title" className="text-xl font-black text-[#071b3d]">Demander un accès partenaire</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Votre demande est examinée manuellement. Aucun profil candidat n’est visible avant la vérification de votre organisation.</p>
          <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">Nom du contact<Input required maxLength={200} value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-1" /></label>
            <label className="text-sm font-semibold">E-mail professionnel<Input required type="email" maxLength={320} value={form.email} onChange={(event) => update("email", event.target.value)} className="mt-1" /></label>
            <label className="text-sm font-semibold">Raison sociale<Input required maxLength={255} value={form.legalName} onChange={(event) => update("legalName", event.target.value)} className="mt-1" /></label>
            <label className="text-sm font-semibold">Pays d’activité<Input required maxLength={120} value={form.country} onChange={(event) => update("country", event.target.value)} className="mt-1" /></label>
            <label className="text-sm font-semibold md:col-span-2">Type d’organisation<Select value={form.organizationType} onValueChange={(value) => update("organizationType", value)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="placement_partner">Agence de placement</SelectItem><SelectItem value="employer">Employeur international</SelectItem></SelectContent></Select></label>
            <label className="text-sm font-semibold md:col-span-2">Message<textarea required minLength={10} maxLength={3000} value={form.message} onChange={(event) => update("message", event.target.value)} className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" placeholder="Décrivez vos besoins de recrutement ou de placement." /></label>
            <Button type="submit" disabled={requestAccess.isPending} className="min-h-11 bg-indigo-700 text-white hover:bg-indigo-800 md:col-span-2">{requestAccess.isPending ? "Envoi en cours…" : "Envoyer la demande"}</Button>
          </form>
        </section>
        <section className="rounded-2xl border border-white/20 bg-white/10 p-5 text-blue-50" aria-label="Règles de confidentialité partenaire">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><div><h2 className="font-black text-white">Un cadre de partage limité</h2><p className="mt-1 text-sm leading-6">Les portails partenaires ne présentent que des profils anonymisés. Aucun CV brut, numéro, adresse, e-mail ou document d’identité n’est exposé sans contrôle humain et consentement actif.</p></div></div>
        </section>
      </div>
    </main>
  );
}
