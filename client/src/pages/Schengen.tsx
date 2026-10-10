import { BriefcaseBusiness, HeartHandshake, Landmark, Plane, Stethoscope, TicketCheck, UsersRound } from "lucide-react";
import { Link } from "wouter";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";

const purposes = [
  { title: "Tourisme", icon: Plane, text: "Pour un séjour temporaire de découverte, de vacances ou de visite privée, sous réserve des conditions applicables." },
  { title: "Affaires", icon: BriefcaseBusiness, text: "Pour une réunion, un salon, une mission ponctuelle ou une activité professionnelle de courte durée autorisée." },
  { title: "Visite familiale ou privée", icon: HeartHandshake, text: "Pour rejoindre temporairement un proche, avec les justificatifs de lien, d’hébergement ou de prise en charge demandés." },
  { title: "Soins médicaux", icon: Stethoscope, text: "Pour une prise en charge médicale planifiée, avec les documents de l’établissement et les garanties financières attendues." },
  { title: "Événement culturel ou sportif", icon: TicketCheck, text: "Pour une invitation, une compétition, une conférence ou une activité culturelle de courte durée." },
  { title: "Transit aéroportuaire", icon: Landmark, text: "Pour certains transits en zone internationale. Les règles dépendent notamment de la nationalité et de l’aéroport concerné." },
];

export default function Schengen() {
  return (
    <ServicePageShell
      eyebrow="Espace Schengen · Séjours de courte durée"
      title="Préparez votre demande de visa Schengen avec méthode"
      introduction="Le visa Schengen concerne généralement les séjours temporaires. 3M TRAVEL AGENCY vous aide à organiser votre projet, à identifier le consulat compétent et à préparer les pièces exigées pour le motif de voyage concerné."
      primaryHref="/evaluation?destination=schengen"
      primaryLabel="Évaluer mon projet Schengen"
      officialHref="https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en"
      officialLabel="Consulter les règles UE"
      notice="Un visa Schengen de court séjour couvre généralement jusqu’à 90 jours sur une période de 180 jours. Les études, le travail ou les séjours longs relèvent de procédures nationales distinctes."
      heroVisual={getServiceVisual("schengen")}
    >
      <ServiceSection
        title="Six motifs de voyage à distinguer"
        introduction="Les exigences ne sont pas identiques selon l’objectif du déplacement. Le consulat peut demander des pièces supplémentaires selon votre situation."
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {purposes.map((purpose) => {
            const Icon = purpose.icon;
            return (
              <article key={purpose.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black text-slate-950">{purpose.title}</h3>
                <p className="premium-copy mt-2 text-[0.95rem]">{purpose.text}</p>
              </article>
            );
          })}
        </div>
      </ServiceSection>

      <ServiceSection
        tone="blue"
        title="Les éléments généralement vérifiés"
        introduction="Passeport, formulaire, photo, assurance, motif du séjour, ressources, hébergement et intention de retour peuvent faire partie du dossier. La liste finale dépend du consulat compétent."
      >
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="rounded-2xl bg-white p-6 sm:p-7">
            <h3 className="text-lg font-black text-slate-950">Choisir le bon consulat</h3>
            <p className="premium-copy mt-3 text-[0.95rem]">En cas de plusieurs destinations, la demande s’effectue en principe auprès du pays du séjour principal ; à durée égale, le premier pays d’entrée peut être déterminant.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 sm:p-7">
            <h3 className="text-lg font-black text-slate-950">Préparer dans les délais</h3>
            <p className="premium-copy mt-3 text-[0.95rem]">Les règles européennes indiquent généralement un dépôt au moins 15 jours avant le voyage et au plus tôt six mois avant. Les rendez-vous et délais consulaires peuvent varier.</p>
          </div>
        </div>
      </ServiceSection>

      <ServiceSection
        title="Votre parcours avec 3M TRAVEL AGENCY"
        introduction="Nous vous aidons à organiser une demande cohérente, sans nous substituer au consulat ni à sa décision."
      >
        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <span className="text-sm font-black text-blue-700">01</span>
            <h3 className="mt-3 text-lg font-black text-slate-950">Clarifier le motif</h3>
            <p className="premium-copy mt-2 text-[0.95rem]">Destination, durée, hébergement et objectif du séjour.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <span className="text-sm font-black text-blue-700">02</span>
            <h3 className="mt-3 text-lg font-black text-slate-950">Préparer les preuves</h3>
            <p className="premium-copy mt-2 text-[0.95rem]">Documents personnels, financiers, professionnels et de voyage selon le cas.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
            <span className="text-sm font-black text-blue-700">03</span>
            <h3 className="mt-3 text-lg font-black text-slate-950">Vérifier avant dépôt</h3>
            <p className="premium-copy mt-2 text-[0.95rem]">Cohérence de la demande et prochaines étapes administratives.</p>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800">
            <UsersRound className="h-4 w-4" />
            Parler à un conseiller
          </Link>
        </div>
      </ServiceSection>

      <ProofGallerySection
        initialFilter="visas"
        lockFilter
        collapsedCount={3}
        hideWhenEmpty
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        titleFr="Preuves de visas obtenus"
        titleEn="Proofs of visas obtained"
        leadFr="Extraits anonymisés de visas Schengen et autres autorisations obtenus par des candidats accompagnés depuis Yaoundé."
        leadEn="Redacted excerpts of Schengen visas and other authorisations obtained by candidates supported from Yaoundé."
      />
    </ServicePageShell>
  );
}
