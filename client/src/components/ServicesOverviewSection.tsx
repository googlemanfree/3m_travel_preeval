import { motion } from "framer-motion";
import { Briefcase, Car, GraduationCap, Hotel, IdCard, Plane, ShieldCheck, Sparkles, Stamp, Users2, Globe2 } from "lucide-react";
import { procedures107Complete } from "@/data/procedures107Complete";
import { countUniqueDestinations } from "@shared/procedureCatalogStats";
import { getServiceVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

/** Couverture documentaire réelle du catalogue — affichée sans gonfler le volume. */
const DESTINATION_COUNT = countUniqueDestinations(procedures107Complete.map((country) => country.id));
const PROCEDURE_COUNT = procedures107Complete.length;

type ServiceItem = { label: string; href?: string };

type ServiceCategory = {
  icon: typeof Plane;
  color: string;
  title: string;
  description: string;
  visualId: string;
  items: ServiceItem[];
  cta: { label: string; href: string };
};

const CATEGORIES: ServiceCategory[] = [
  {
    icon: Globe2,
    color: "text-[#1e3a8a] bg-[#dbeafe]",
    title: "Mobilité internationale",
    description: "Études, travail, immigration ou famille : un dossier construit pièce par pièce, avec un suivi jusqu’à la mise en route.",
    visualId: "mobilite",
    items: [{ label: "Études" }, { label: "Travail" }, { label: "Immigration" }, { label: "Regroupement familial" }],
    cta: { label: "Voir les procédures par destination", href: "/procedures" },
  },
  {
    icon: Stamp,
    color: "text-[#7c3aed] bg-[#ede9fe]",
    title: "Visas",
    description: "Visite, études ou travail : checklist, préparation des pièces et accompagnement jusqu’au dépôt auprès des autorités.",
    visualId: "visas",
    items: [{ label: "Visa étudiant" }, { label: "Visa de travail" }, { label: "Visa de visiteur" }, { label: "e-Visa", href: "/evisas" }],
    cta: { label: "Voir les types de visa", href: "/procedures" },
  },
  {
    icon: Plane,
    color: "text-[#2563eb] bg-[#eff6ff]",
    title: "Travel & Booking",
    description: "Vols, hébergement, véhicule et assurance : organisez le départ dans le même accompagnement que votre dossier.",
    visualId: "travel",
    items: [
      { label: "Billets d'avion", href: "/flights" },
      { label: "Hôtels", href: "/tourisme?service=hotel" },
      { label: "Location de véhicules", href: "/tourisme?service=vehicle" },
      { label: "Assurance voyage", href: "/assurance" },
    ],
    cta: { label: "Réserver un vol", href: "/flights" },
  },
  {
    icon: IdCard,
    color: "text-[#0369a1] bg-[#e0f2fe]",
    title: "Démarches administratives",
    description: "CNI, passeport et e-Visa Cameroun : dossier préparé, suivi transparent et conseils pour éviter les allers-retours inutiles.",
    visualId: "cni",
    items: [
      { label: "Pré-enrôlement CNI", href: "/cni-passeport" },
      { label: "Passeport", href: "/cni-passeport" },
      { label: "e-Visa Cameroun", href: "/evisas" },
    ],
    cta: { label: "Préparer ma CNI ou mon passeport", href: "/cni-passeport" },
  },
];

const ITEM_ICONS: Record<string, typeof Plane> = {
  "Billets d'avion": Plane,
  Hôtels: Hotel,
  "Location de véhicules": Car,
  "Assurance voyage": ShieldCheck,
  "Pré-enrôlement CNI": IdCard,
  Passeport: IdCard,
  "e-Visa Cameroun": Globe2,
  "e-Visa": Globe2,
  Études: GraduationCap,
  Travail: Briefcase,
  Immigration: Globe2,
  "Visa étudiant": GraduationCap,
  "Visa de travail": Briefcase,
  "Visa de visiteur": Stamp,
  "Regroupement familial": Users2,
};

/**
 * Vue d'ensemble des quatre pôles d'activité de 3M TRAVEL AGENCY : mobilité internationale, visas,
 * travel & booking, et démarches administratives (CNI, passeport, e-Visa). Les services technologiques
 * (informatique, formations, réseaux, sécurité) ne figurent pas ici : ils vivent sur leur propre page
 * (lien « 3M Solutions » dans le paragraphe ci-dessous et dans le pied de page), pour ne pas surcharger
 * l'accueil avec une activité annexe au métier de mobilité internationale.
 */
export default function ServicesOverviewSection() {
  return (
    <section aria-labelledby="services-overview-title" className="py-14 md:py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Accompagnement complet
          </p>
          <h2 id="services-overview-title" className="premium-section-title mt-4 text-3xl md:text-4xl">Un interlocuteur unique pour un projet international sérieux</h2>
          <p className="premium-section-lead mx-auto text-center">
            Visa, études, travail, voyage : 3M TRAVEL AGENCY structure votre dossier, clarifie les prochaines étapes et vous accompagne jusqu’au départ.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
              variants={fadeUp}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <PremiumCoverImage
                visual={getServiceVisual(category.visualId)}
                className="aspect-[16/10]"
                imgClassName="h-full w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${category.color}`} aria-hidden="true">
                  <category.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-950">{category.title}</h3>
                <p className="premium-copy mt-2 text-[0.95rem]">{category.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {category.items.map((item) => {
                    const ItemIcon = ITEM_ICONS[item.label];
                    const content = (
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        {ItemIcon && <ItemIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
                        {item.label}
                      </span>
                    );
                    return (
                      <li key={item.label}>
                        {item.href ? (
                          <a href={item.href} className="inline-flex rounded-md py-0.5 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                            {content}
                          </a>
                        ) : (
                          content
                        )}
                      </li>
                    );
                  })}
                </ul>
                <a href={category.cta.href} className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-800">
                  {category.cta.label}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Paragraphe descriptif : chaque service cité renvoie vers sa page. */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-xl font-black text-slate-950">Nos services</h3>
          <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
            3M TRAVEL AGENCY est d’abord un <strong>centre de préparation et de suivi de dossiers</strong> : <a href="/procedures" className="font-semibold text-blue-700 underline-offset-2 hover:underline">études</a>, <a href="/procedures" className="font-semibold text-blue-700 underline-offset-2 hover:underline">travail</a>, <a href="/procedures" className="font-semibold text-blue-700 underline-offset-2 hover:underline">immigration</a>, <a href="/procedures" className="font-semibold text-blue-700 underline-offset-2 hover:underline">regroupement familial</a> et <a href="/procedures" className="font-semibold text-blue-700 underline-offset-2 hover:underline">visas</a> — avec un catalogue documenté de {PROCEDURE_COUNT} procédures sur {DESTINATION_COUNT} destinations. Le recrutement passe par des <a href="/partenaires" className="font-semibold text-blue-700 underline-offset-2 hover:underline">canaux autorisés</a> (agences et employeurs vérifiés). Les services de voyage (<a href="/flights" className="font-semibold text-blue-700 underline-offset-2 hover:underline">vols</a>, <a href="/tourisme?service=hotel" className="font-semibold text-blue-700 underline-offset-2 hover:underline">hôtels</a>, <a href="/tourisme?service=vehicle" className="font-semibold text-blue-700 underline-offset-2 hover:underline">véhicules</a>, <a href="/assurance" className="font-semibold text-blue-700 underline-offset-2 hover:underline">assurance</a>), le <a href="/cni-passeport" className="font-semibold text-blue-700 underline-offset-2 hover:underline">pré-enrôlement CNI/passeport</a>, l’<a href="/evisas" className="font-semibold text-blue-700 underline-offset-2 hover:underline">e-Visa</a> et <a href="/3m-solutions" className="font-semibold text-blue-700 underline-offset-2 hover:underline">3M Solutions</a> complètent le parcours sans remplacer la traçabilité du dossier.
          </p>
        </div>

        <p className="mt-8 text-center text-base font-bold italic text-slate-800">
          Une seule ambition : transformer votre projet international en une démarche claire, préparée et crédible.
        </p>

        <p className="mt-6 text-center">
          <a href="/services" className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            Voir tous nos services
          </a>
        </p>
      </div>
    </section>
  );
}
