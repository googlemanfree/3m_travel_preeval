import { BedDouble, CalendarRange, CircleDollarSign, PlaneTakeoff, ShieldCheck, Sparkles, Ticket, Users } from "lucide-react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";

const HOTEL_VISUALS = {
  pool: "/manus-storage/hotel-pool_36688643.jpg",
  breakfast: "/manus-storage/hotel-breakfast_0629f603.jpg",
  suite: "/manus-storage/hotel-suite_a2e58160.jpg",
};

export default function Billets() {
  return <ServicePageShell eyebrow="3M Booking · Vols, hôtels & séjours" title="Préparez votre voyage dans une seule expérience." introduction="Comparez vos options de vol, choisissez un séjour et transmettez une demande claire à l’équipe 3M Travel. Les disponibilités, taxes et tarifs finaux sont confirmés par un conseiller avant toute émission ou réservation." primaryHref="/flights#3m-booking" primaryLabel="Découvrir 3M Booking" notice="La sélection et les demandes de voyage sont sans engagement. Toute confirmation est soumise à la validation humaine de l’agence.">
    <section aria-labelledby="booking-showcase-title" className="mx-auto mb-10 max-w-6xl overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between p-7 text-white md:p-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-100"><Sparkles className="h-3.5 w-3.5" /> 3M Booking</p>
            <h2 id="booking-showcase-title" className="mt-4 max-w-xl text-3xl font-black tracking-tight md:text-4xl">Des vols, des hôtels et les détails qui font la différence.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">Créez un projet de séjour complet : dates, chambre, catégorie, petit-déjeuner, piscine ou transferts. Un conseiller 3M vérifie ensuite chaque disponibilité et vous confirme les conditions réelles.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/flights#3m-booking" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white hover:bg-orange-600">Rechercher un hôtel</Link><Link href="/flights" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-black text-white hover:bg-white/10">Explorer les vols</Link></div>
        </div>
        <div className="grid min-h-[330px] grid-cols-2 gap-2 bg-slate-900 p-2 md:min-h-[390px]">
          <img src={HOTEL_VISUALS.pool} alt="Piscine d’hôtel" className="h-full min-h-[190px] w-full rounded-2xl object-cover" />
          <div className="grid gap-2"><img src={HOTEL_VISUALS.suite} alt="Suite d’hôtel" className="h-full min-h-0 w-full rounded-2xl object-cover" /><img src={HOTEL_VISUALS.breakfast} alt="Petit-déjeuner d’hôtel" className="h-full min-h-0 w-full rounded-2xl object-cover" /></div>
        </div>
      </div>
    </section>
    <ServiceSection title="Une sélection de services pensée pour le séjour" introduction="3M Booking permet de réunir les informations nécessaires à votre demande, sans afficher de disponibilité ou de prix comme garantis avant validation humaine.">
      <div className="grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-6"><BedDouble className="h-7 w-7 text-orange-500" /><h3 className="mt-4 font-black">Hébergement</h3><p className="mt-2 text-sm leading-6 text-slate-600">Hôtels, suites et appart’hôtels selon vos dates, votre budget et votre catégorie recherchée.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><PlaneTakeoff className="h-7 w-7 text-blue-700" /><h3 className="mt-4 font-black">Vols</h3><p className="mt-2 text-sm leading-6 text-slate-600">Itinéraires, bagages et conditions de voyage confirmés avant émission du billet.</p></article><article className="rounded-2xl border border-slate-200 bg-white p-6"><ShieldCheck className="h-7 w-7 text-emerald-700" /><h3 className="mt-4 font-black">Accompagnement</h3><p className="mt-2 text-sm leading-6 text-slate-600">Un suivi dans votre espace client, avec une prochaine étape claire à chaque mise à jour.</p></article></div>
    </ServiceSection>
    <ServiceSection tone="blue" title="Préparez votre demande en quelques informations"><div className="grid gap-4 md:grid-cols-3"><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><CalendarRange className="mb-3 h-5 w-5 text-blue-700" />Dates, flexibilité et durée du séjour.</p><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><Users className="mb-3 h-5 w-5 text-blue-700" />Nombre de voyageurs, chambres et catégorie souhaitée.</p><p className="rounded-xl bg-white p-5 text-sm text-slate-700"><Ticket className="mb-3 h-5 w-5 text-blue-700" />Vol, petit-déjeuner, piscine ou autres prestations recherchées.</p></div><div className="mt-8"><Link href="/flights#3m-booking" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white hover:bg-orange-600">Démarrer une demande 3M Booking</Link></div></ServiceSection>
  </ServicePageShell>;
}
