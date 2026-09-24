import { motion } from "framer-motion";
import { Briefcase, Car, Cpu, GraduationCap, Hotel, IdCard, Plane, ShieldCheck, Sparkles, Users2, Globe2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

type ServiceItem = { label: string; href?: string };

type ServiceCategory = {
  icon: typeof Plane;
  color: string;
  title: string;
  description: string;
  items: ServiceItem[];
  cta: { label: string; href: string };
};

const CATEGORIES: ServiceCategory[] = [
  {
    icon: Globe2,
    color: "text-[#1e3a8a] bg-[#dbeafe]",
    title: "Mobilité internationale",
    description: "Notre cœur de métier historique : construire et déposer un dossier solide, du premier renseignement jusqu'à l'installation.",
    items: [{ label: "Études" }, { label: "Travail" }, { label: "Immigration" }, { label: "Visas" }, { label: "Regroupement familial" }],
    cta: { label: "Voir les procédures par destination", href: "/procedures" },
  },
  {
    icon: Plane,
    color: "text-[#2563eb] bg-[#eff6ff]",
    title: "Travel",
    description: "Tout ce qu'il faut pour préparer et sécuriser un déplacement, ici comme à l'étranger.",
    items: [
      { label: "Billets d'avion", href: "/flights" },
      { label: "Hôtels", href: "/tourisme?service=hotel" },
      { label: "Location de véhicules", href: "/tourisme?service=vehicle" },
      { label: "Assurance voyage", href: "/assurance" },
    ],
    cta: { label: "Réserver un vol", href: "/flights" },
  },
  {
    icon: ShieldCheck,
    color: "text-[#0369a1] bg-[#e0f2fe]",
    title: "Services",
    description: "Des démarches administratives et numériques que 3M gère aussi, au-delà du voyage.",
    items: [
      { label: "CNI & passeport", href: "/cni-passeport" },
      { label: "e-Visa Cameroun", href: "/evisas" },
      { label: "Technologies", href: "/3m-digital" },
      { label: "Formations", href: "/formation" },
      { label: "Solutions de sécurité", href: "/3m-digital" },
    ],
    cta: { label: "Découvrir 3M Digital", href: "/3m-digital" },
  },
];

const ITEM_ICONS: Record<string, typeof Plane> = {
  "Billets d'avion": Plane,
  Hôtels: Hotel,
  "Location de véhicules": Car,
  "Assurance voyage": ShieldCheck,
  "CNI & passeport": IdCard,
  "e-Visa Cameroun": Globe2,
  Technologies: Cpu,
  Formations: GraduationCap,
  "Solutions de sécurité": ShieldCheck,
  Études: GraduationCap,
  Travail: Briefcase,
  Immigration: Globe2,
  Visas: IdCard,
  "Regroupement familial": Users2,
};

/**
 * Vue d'ensemble des trois pôles d'activité de 3M Travel & Services : la mobilité internationale
 * n'est qu'une partie de l'offre, à côté du travel (vols, hôtels, location, assurance) et des
 * services administratifs/numériques (CNI, e-Visa, technologies, formations, sécurité).
 */
export default function ServicesOverviewSection() {
  return (
    <section aria-labelledby="services-overview-title" className="py-14 md:py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Nos services
          </p>
          <h2 id="services-overview-title" className="mt-4 text-3xl md:text-4xl font-black text-slate-950">Bien plus qu'une agence d'immigration</h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
            3M Travel &amp; Services accompagne la mobilité internationale, organise vos déplacements et gère des services administratifs et numériques au quotidien.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CATEGORIES.map((category, index) => (
            <motion.div
              key={category.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
              variants={fadeUp}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${category.color}`} aria-hidden="true">
                <category.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{category.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
