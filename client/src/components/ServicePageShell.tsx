import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { PremiumReveal } from "@/components/PremiumReveal";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import type { VisualSources } from "@/data/premiumVisuals";

type ServicePageShellProps = {
  /** Libellé thématique (sous la marque). Si égal à la marque, il est omis. */
  eyebrow?: string;
  title: string;
  introduction: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  officialHref?: string;
  officialLabel?: string;
  notice?: string;
  /** Image premium thématique (visa, destination, service). */
  heroVisual?: VisualSources | null;
  children: ReactNode;
};

const BRAND = "3M TRAVEL AGENCY";

export function ServicePageShell({
  eyebrow,
  title,
  introduction,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel = "Calculatrice CRS Canada",
  officialHref,
  officialLabel = "Consulter la source officielle",
  notice,
  heroVisual,
  children,
}: ServicePageShellProps) {
  const themeLabel = eyebrow?.trim() && eyebrow.trim() !== BRAND ? eyebrow.trim() : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative flex min-h-[88svh] items-end overflow-hidden px-4 pb-16 pt-28 text-white sm:items-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        {heroVisual ? (
          <>
            <PremiumCoverImage
              visual={heroVisual}
              priority
              className="absolute inset-0"
              imgClassName="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/90 via-[#0a2748]/48 to-[#061018]/25 sm:bg-gradient-to-r sm:from-[#061018]/88 sm:via-[#0a2748]/50 sm:to-[#061018]/15" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.35),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)]" />
        )}
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="max-w-xl sm:max-w-lg lg:max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
              {BRAND}
            </h1>
            {themeLabel ? (
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-100/90">{themeLabel}</p>
            ) : null}
            <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-amber-50 sm:text-3xl md:text-4xl">
              {title}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-50/95 sm:text-lg">{introduction}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {primaryHref.startsWith("#") ? (
                <a
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-[#061018]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-[#061018]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {secondaryHref && (
                <Link
                  href={secondaryHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {secondaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {officialHref && (
                <a
                  href={officialHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {officialLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      {notice && (
        <section className="border-b border-amber-200 bg-amber-50 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl gap-3 text-base leading-7 text-amber-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            {notice}
          </div>
        </section>
      )}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SocialShareButtons title={`${BRAND} — ${title}`} />
        </div>
      </div>
      {children}
    </main>
  );
}

export function ServiceSection({ title, introduction, children, tone = "white" }: { title: string; introduction?: string; children: ReactNode; tone?: "white" | "slate" | "blue" }) {
  const tones = { white: "bg-white", slate: "bg-slate-50", blue: "bg-blue-50" };
  return (
    <section className={`${tones[tone]} px-4 py-16 sm:px-6 sm:py-20 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <PremiumReveal>
          <div className="max-w-3xl">
            <h2 className="premium-section-title text-2xl sm:text-3xl md:text-4xl">{title}</h2>
            {introduction && <p className="premium-section-lead mt-4 text-base sm:text-lg">{introduction}</p>}
          </div>
        </PremiumReveal>
        <PremiumReveal delay={0.08} className="mt-10">
          {children}
        </PremiumReveal>
      </div>
    </section>
  );
}
