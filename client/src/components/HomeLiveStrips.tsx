import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, Newspaper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { procedures107Complete } from "@/data/procedures107Complete";
import { PROOF_CATEGORY_LABELS, PROOF_PHOTOS } from "@/data/proofPhotos";
import { LiveMarquee, type MarqueeItem } from "@/components/LiveMarquee";

/** Parcours les plus demandés, placés en tête du bandeau (mêmes liens que la grille « parcours les plus demandés »). */
const PRIORITY_PROCEDURES = [
  { href: "/procedures/canada-travail", flag: "🇨🇦", name: "Canada", kind: { fr: "Travail", en: "Work" } },
  { href: "/procedures/canada-etudes", flag: "🇨🇦", name: "Canada", kind: { fr: "Études", en: "Studies" } },
  { href: "/procedures/france-etudes", flag: "🇫🇷", name: "France", kind: { fr: "Études", en: "Studies" } },
  { href: "/procedures/allemagne-travail", flag: "🇩🇪", name: "Allemagne", kind: { fr: "Travail", en: "Work" } },
] as const;

const KIND_LABELS = {
  travail: { fr: "Travail", en: "Work" },
  etudes: { fr: "Études", en: "Studies" },
  visiteur: { fr: "Visiteur", en: "Visitor" },
} as const;

export const PROCEDURE_STRIP_LIMIT = 40;

export type ProcedureStripEntry = { href: string; flag: string; name: string; kind: { fr: string; en: string } };

/** Liste des procédures du bandeau : parcours prioritaires d'abord, puis le catalogue, sans doublon de lien. */
export function buildProcedureStrip(limit = PROCEDURE_STRIP_LIMIT): ProcedureStripEntry[] {
  const seen = new Set<string>();
  const entries: ProcedureStripEntry[] = [];
  const push = (entry: ProcedureStripEntry) => {
    if (seen.has(entry.href) || entries.length >= limit) return;
    seen.add(entry.href);
    entries.push(entry);
  };
  PRIORITY_PROCEDURES.forEach((entry) => push({ ...entry, kind: { ...entry.kind } }));
  for (const country of procedures107Complete) {
    push({ href: `/procedures/${country.id}`, flag: country.flag, name: country.name, kind: { ...KIND_LABELS[country.visaType] } });
  }
  return entries;
}

/** Preuves du bandeau « visas obtenus » : uniquement les images de preuve déjà publiées (données personnelles masquées). */
export function buildProofStrip() {
  return PROOF_PHOTOS.filter((photo) => photo.kind !== "context");
}

const FALLBACK_RESOURCES = [
  { href: "/quoi-de-neuf", fr: "Quoi de neuf : règles et contenus mis à jour", en: "What's new: updated rules and content" },
  { href: "/guides", fr: "Guides pratiques par destination", en: "Practical guides by destination" },
  { href: "/blog", fr: "Centre d'information : visas, études, immigration", en: "Information centre: visas, studies, immigration" },
  { href: "/faq", fr: "Questions fréquentes sur les démarches", en: "Frequently asked questions about applications" },
  { href: "/evisas", fr: "e-Visa : démarches en ligne par pays", en: "e-Visa: online applications by country" },
] as const;

const cardBase = "block rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

function StripHeader({ id, icon, title, linkHref, linkLabel }: { id: string; icon: ReactNode; title: string; linkHref: string; linkLabel: string }) {
  return (
    <div className="mb-11 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:pr-28">
      <h3 id={id} className="flex items-center gap-2 text-lg font-black text-slate-950 md:text-xl">
        {icon}
        {title}
      </h3>
      <a href={linkHref} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:text-blue-900">
        {linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function HomeLiveStrips() {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "fr";
  const updates = trpc.adminContent.publicUpdates.useQuery(undefined, { retry: false });
  const published = updates.data ?? [];

  const newsItems: MarqueeItem[] = published.length > 0
    ? published.map((item) => ({
        key: `news-${item.id}`,
        node: (
          <a href={item.pagePath || "/quoi-de-neuf"} className={`${cardBase} w-72 sm:w-80`}>
            {item.publishedAt && (
              <time dateTime={item.publishedAt} className="text-[11px] font-black uppercase tracking-wide text-blue-700">
                {new Date(item.publishedAt).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </time>
            )}
            <span className="mt-0.5 block line-clamp-2 text-sm font-bold leading-snug text-slate-900">{item.title}</span>
          </a>
        ),
      }))
    : FALLBACK_RESOURCES.map((item) => ({
        key: `resource-${item.href}`,
        node: (
          <a href={item.href} className={`${cardBase} w-72 sm:w-80`}>
            <span className="block text-sm font-bold leading-snug text-slate-900">{item[lang]}</span>
          </a>
        ),
      }));

  const procedureItems: MarqueeItem[] = buildProcedureStrip().map((entry) => ({
    key: `procedure-${entry.href}`,
    node: (
      <a href={entry.href} className={`${cardBase} flex items-center gap-3 whitespace-nowrap`}>
        <span className="text-2xl leading-none" aria-hidden="true">{entry.flag}</span>
        <span>
          <span className="block text-sm font-black text-slate-950">{entry.name}</span>
          <span className="block text-xs font-semibold text-slate-600">{entry.kind[lang]}</span>
        </span>
      </a>
    ),
  }));

  const proofItems: MarqueeItem[] = buildProofStrip().map((photo) => ({
    key: `proof-${photo.src}`,
    node: (
      <a href="#preuves-dossiers" className={`${cardBase} w-48 overflow-hidden p-0`}>
        <span className="block aspect-[4/3] overflow-hidden bg-slate-100">
          <img src={photo.src} alt={photo.alt} width={192} height={144} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </span>
        <span className="block px-3 py-2">
          <span className="block text-[11px] font-black uppercase tracking-wide text-amber-700">{PROOF_CATEGORY_LABELS[photo.category][lang]}</span>
          <span className="mt-0.5 block line-clamp-2 text-xs font-semibold leading-snug text-slate-700">{photo.caption}</span>
        </span>
      </a>
    ),
  }));

  return (
    <section aria-labelledby="home-live-title" className="border-y border-slate-200 bg-slate-50 py-10 md:py-12" data-testid="home-live-strips">
      <div className="mx-auto max-w-6xl space-y-10 px-4">
        <h2 id="home-live-title" className="sr-only">{t("Actualités, procédures et dossiers traités", "News, procedures and processed files")}</h2>

        <div>
          <StripHeader
            id="home-live-news-title"
            icon={<Newspaper className="h-5 w-5 text-blue-700" aria-hidden="true" />}
            title={published.length > 0 ? t("Actualités des règles et des procédures", "Rule and procedure updates") : t("Nos guides et ressources", "Our guides and resources")}
            linkHref="/quoi-de-neuf"
            linkLabel={t("Tout voir", "See all")}
          />
          <LiveMarquee items={newsItems} label={t("Actualités et ressources", "News and resources")} secondsPerItem={7} testId="live-strip-news" />
          {published.length > 0 && (
            <p className="mt-3 text-xs text-slate-600">{t("Mises à jour rédigées par notre équipe, avec leur date. Vérifiez toujours auprès de l'autorité concernée avant de déposer un dossier.", "Updates written by our team, with their date. Always check with the relevant authority before filing.")}</p>
          )}
        </div>

        <div>
          <StripHeader
            id="home-live-procedures-title"
            icon={<ArrowRight className="h-5 w-5 text-blue-700" aria-hidden="true" />}
            title={t("Les procédures que nous accompagnons", "The procedures we support")}
            linkHref="/procedures"
            linkLabel={t("Toutes les procédures", "All procedures")}
          />
          <LiveMarquee items={procedureItems} label={t("Procédures par destination", "Procedures by destination")} secondsPerItem={3} testId="live-strip-procedures" />
        </div>

        <div>
          <StripHeader
            id="home-live-proofs-title"
            icon={<BadgeCheck className="h-5 w-5 text-amber-700" aria-hidden="true" />}
            title={t("Visas et dossiers obtenus", "Visas and files obtained")}
            linkHref="#preuves-dossiers"
            linkLabel={t("Voir les preuves", "See the proofs")}
          />
          <LiveMarquee items={proofItems} label={t("Preuves de dossiers traités", "Proofs of processed files")} secondsPerItem={6} testId="live-strip-proofs" />
          <p className="mt-3 text-xs text-slate-600">{t("Documents publiés avec les informations personnelles masquées. Chaque dossier est unique : un exemple passé ne garantit ni visa ni délai.", "Documents published with personal information masked. Every file is unique: a past example guarantees neither a visa nor a timeline.")}</p>
        </div>
      </div>
    </section>
  );
}
