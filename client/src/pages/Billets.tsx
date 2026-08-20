import { CalendarRange, CircleDollarSign, PlaneTakeoff, ShieldCheck, Ticket, Users } from "lucide-react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";

export default function Billets() {
  return <ServicePageShell eyebrow="Billets d’avion · Recherche et accompagnement" title="Recherchez un billet adapté à votre itinéraire" introduction="Comparez votre projet de voyage, préparez une demande de devis et poursuivez avec l’équipe 3M Travel lorsque vous souhaitez une assistance de réservation." primaryHref="/flights" primaryLabel="Rechercher mon billet" notice="Offre promotionnelle annoncée : jusqu’à -20 % sur une sélection et selon les conditions tarifaires applicables. Les disponibilités, taxes, règles de modification et prix finaux doivent être confirmés avant émission.">

    <section aria-labelledby="billets-booking-title" className="mx-auto mb-10 max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-6 text-white shadow-xl md:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1.35fr_0.65fr]">
        <div>
          <p className="inline-flex rounded-full border border-amber-200/40 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-100">3M Booking</p>
          <h2 id="billets-booking-title" className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Ajoutez votre hébergement à votre projet de voyage.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">Recherchez un séjour, précisez vos dates et transmettez votre demande d’hôtel à l’équipe 3M. La disponibilité et le prix final restent confirmés par un conseiller avant toute réservation.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <Link href="/flights#3m-booking" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg hover:bg-orange-600 md:w-auto">Découvrir 3M Booking</Link>
          <p className="text-center text-xs font-medium text-blue-200 md:text-right">Hôtels, séjours et demandes personnalisées</p>
        </div>
      </div>
    </section>
    <ServiceSection title="Un seul moteur de réservation, plusieurs services" introduction="La page Billets oriente vers le moteur de recherche existant : aucun moteur concurrent n’est créé."><div className="grid gap-4 md:grid-cols-3"><article className="rounded-2xl border p-6"><PlaneTakeoff className="h-7 w-7 text-blue-700" /><h3 className="mt-4 font-black">Itinéraire</h3><p className="mt-2 text-sm leading-6 text-slate-600">Aller simple, aller-retour ou parcours multi-destinations selon votre besoin.</p></article><article className="rounded-2xl border p-6"><CircleDollarSign className="h-7 w-7 text-blue-700" /><h3 className="mt-4 font-black">Prix à confirmer</h3><p className="mt-2 text-sm leading-6 text-slate-600">Le tarif et les conditions sont vérifiés au moment de la réservation, avant toute émission.</p></article><article className="rounded-2xl border p-6"><ShieldCheck className="h-7 w-7 text-blue-700" /><h3 className="mt-4 font-black">Suivi de réservation</h3><p className="mt-2 text-sm leading-6 text-slate-600">Après traitement, les documents de voyage sont synchronisés dans l’espace client et par e-mail.</p></article></div></ServiceSection>
    <ServiceSection tone="blue" title="Avant de demander votre devis"><div className="grid gap-4 md:grid-cols-3"><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><CalendarRange className="mb-3 h-5 w-5 text-blue-700" />Dates de voyage et flexibilité éventuelle.</p><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><Users className="mb-3 h-5 w-5 text-blue-700" />Nombre de voyageurs et catégorie de cabine souhaitée.</p><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><Ticket className="mb-3 h-5 w-5 text-blue-700" />Ville de départ, destination et contraintes de bagages.</p></div><div className="mt-8"><Link href="/flights" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">Accéder au moteur de vols</Link></div></ServiceSection>
  </ServicePageShell>;
}
