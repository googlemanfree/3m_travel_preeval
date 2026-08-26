import { CheckCircle2, Clock3, HelpCircle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const copy = {
  fr: {
    eyebrow: "ÉTAT DU SERVICE",
    title: "Une information claire, au bon moment.",
    intro: "Consultez ici l’état général des services publics de 3M Travel & Services.",
    updated: "Dernière vérification : disponibilité publique observée",
    operational: "Opérationnel",
    services: "Services publics",
    publicSite: "Site public et navigation",
    forms: "Formulaires de contact et d’orientation",
    secure: "Accès client et espaces sécurisés",
    planned: "Maintenance planifiée",
    none: "Aucune maintenance planifiée n’est actuellement annoncée.",
    notice: "En cas d’interruption temporaire, cette page reste informative. Les délais de traitement et décisions des autorités ne sont pas garantis par cette page.",
    help: "Besoin d’aide ?",
    contact: "Contacter l’agence",
    home: "Retour à l’accueil",
    trust: "Informations publiques, sans données de dossier",
  },
  en: {
    eyebrow: "SERVICE STATUS",
    title: "Clear information, when you need it.",
    intro: "Check the general status of 3M Travel & Services public services here.",
    updated: "Last checked: public availability observed",
    operational: "Operational",
    services: "Public services",
    publicSite: "Public website and navigation",
    forms: "Contact and guidance forms",
    secure: "Client access and secure spaces",
    planned: "Planned maintenance",
    none: "No planned maintenance is currently announced.",
    notice: "If a temporary interruption occurs, this page remains informational. Processing times and decisions by authorities are not guaranteed by this page.",
    help: "Need help?",
    contact: "Contact the agency",
    home: "Back to home",
    trust: "Public information, no case data",
  },
} as const;

export default function ServiceStatus() {
  const { language } = useLanguage();
  const t = copy[language];
  const statusRows = [t.publicSite, t.forms, t.secure];

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f4f8ff] text-[#102b57]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071b3d] via-[#0b2f6f] to-[#123f82] px-4 pb-16 pt-14 text-white sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full border border-[#f4b942]/25" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-bold tracking-[0.24em] text-[#f4b942]">{t.eyebrow}</p>
          <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">{t.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">{t.intro}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6 shrink-0 text-[#f4b942]" aria-hidden="true" />
              <span className="text-sm text-blue-50">{t.trust}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_.65fr] lg:py-12">
        <div className="rounded-2xl border border-[#d7e3f5] bg-white p-5 shadow-[0_16px_45px_rgba(7,27,61,.08)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-[#071b3d]">{t.services}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.updated}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t.operational}</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {statusRows.map((label) => <li key={label} className="flex items-center justify-between gap-4 py-4 text-sm font-medium text-slate-700"><span>{label}</span><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-label={t.operational} /></li>)}
          </ul>
        </div>

        <aside className="rounded-2xl border border-[#d7e3f5] bg-[#fffdf5] p-5 sm:p-7">
          <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#bd7a00]" aria-hidden="true" /><h2 className="text-lg font-bold text-[#071b3d]">{t.planned}</h2></div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{t.none}</p>
          <p className="mt-5 border-t border-[#eedca8] pt-4 text-xs leading-5 text-slate-600">{t.notice}</p>
        </aside>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-600"><HelpCircle className="h-5 w-5 text-[#0b2f6f]" aria-hidden="true" /><span>{t.help}</span></div>
        <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f4b942] px-5 py-3 text-sm font-bold text-[#071b3d] transition-colors hover:bg-[#e9aa2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071b3d] focus-visible:ring-offset-2">{t.contact}</Link><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0b2f6f] px-5 py-3 text-sm font-bold text-[#0b2f6f] transition-colors hover:bg-[#eaf1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2f6f] focus-visible:ring-offset-2">{t.home}</Link></div>
      </section>
    </main>
  );
}
