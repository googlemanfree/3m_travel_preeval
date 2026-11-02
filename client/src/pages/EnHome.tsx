import { useEffect } from "react";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { PremiumAtmosphere } from "@/components/PremiumAtmosphere";
import { getServiceVisual } from "@/data/premiumVisuals";

const PRIORITY_DESTINATIONS = [
  { href: "/en/procedures/canada-work", flag: "🇨🇦", title: "Canada — Work Visa", blurb: "Job-offer based work visa process, with remote support from Africa to Ottawa." },
  { href: "/en/procedures/france-study", flag: "🇫🇷", title: "France — Study Visa", blurb: "Admission, documents and visa application for French higher education." },
  { href: "/en/procedures/germany-work", flag: "🇩🇪", title: "Germany — Work Visa", blurb: "Qualified-professional work visa route for Germany's job market." },
  { href: "/en/procedures/dubai-evisa", flag: "🇦🇪", title: "Dubai — Tourist e-Visa", blurb: "Guided e-Visa preparation for the United Arab Emirates." },
];

export default function EnHome() {
  const heroVisual = getServiceVisual("mobilite");

  useEffect(() => {
    document.title = "3M TRAVEL AGENCY | International Mobility from Africa";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "3M TRAVEL AGENCY supports African candidates’ international mobility — visas, study abroad and travel — with remote follow-up and offices in Yaoundé and Ottawa.",
    );
    document.documentElement.lang = "en";
  }, []);

  return (
    <PremiumAtmosphere washVisual={heroVisual} washOpacity={14}>
    <main className="premium-page-shell min-h-screen">
      <section className="relative min-h-[70vh] overflow-hidden px-4 pb-16 pt-20 text-white sm:min-h-[78vh] sm:px-6 sm:pb-24 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90 brightness-105 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041428]/94 via-[#0a3264]/75 to-[#0e5b9f]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/80 via-transparent to-[#041428]/35" />
        <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-5xl flex-col justify-end text-center sm:min-h-[62vh]">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl lg:text-5xl">
            {INTERNATIONAL_BRAND.publicName}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/90">
            {INTERNATIONAL_BRAND.corridorEn}
          </p>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {INTERNATIONAL_BRAND.promiseLine.en}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-50/95 sm:text-lg">
            {INTERNATIONAL_BRAND.heroSupport.en}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/?project=travail&destination=canada#evaluation-multi">
              <Button className="h-12 rounded-xl bg-white px-7 font-extrabold text-blue-950 hover:bg-blue-50">
                {INTERNATIONAL_BRAND.cta.evaluate.en} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-12 rounded-xl border-white/30 bg-white/10 px-7 font-bold text-white hover:bg-white/20">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section aria-label="Priority destinations" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">Most requested procedures from Africa</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-600">
          International destinations with remote support — decisions remain with authorities, schools and employers.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRIORITY_DESTINATIONS.map((item) => (
            <a key={item.href} href={item.href} className="block">
              <article className="premium-surface flex h-full flex-col rounded-2xl p-6 transition-shadow hover:shadow-md">
                <span className="text-3xl" aria-hidden="true">{item.flag}</span>
                <h3 className="mt-3 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </article>
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          More destinations are being translated. For the full documented procedures catalogue, see the{" "}
          <a href="/procedures" className="font-bold text-blue-700 hover:text-blue-900">French procedures directory</a>.
        </p>
      </section>

      <section aria-label="Why 3M TRAVEL AGENCY" className="border-y border-slate-200/70 bg-white/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {INTERNATIONAL_BRAND.trustPillars.map((pillar) => (
            <article key={pillar.title.en} className="rounded-2xl border border-slate-200/80 bg-white/90 p-6">
              <div className="premium-gold-rule" aria-hidden="true" />
              <ShieldCheck className="mt-4 h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="mt-3 font-bold text-slate-900">{pillar.title.en}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.text.en}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Contact" className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-slate-950">{INTERNATIONAL_BRAND.cta.advisor.en}</h2>
        <p className="mt-3 text-slate-600">{COMPANY_PROFILE.offices.cameroon.addressLinesEn.join(", ")}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
            <Button className="h-11 rounded-xl bg-emerald-700 px-6 font-bold text-white hover:bg-emerald-800">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp: {COMPANY_PROFILE.offices.cameroon.whatsappDisplay}
            </Button>
          </a>
          <a href={`mailto:${COMPANY_PROFILE.publicEmail}`}>
            <Button variant="outline" className="h-11 rounded-xl border-blue-200 px-6 font-bold text-blue-800 hover:bg-blue-50">
              {COMPANY_PROFILE.publicEmail}
            </Button>
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-600" data-testid="en-home-help-links">
          <a href="/en/faq" className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900">Frequently asked questions</a>{" · "}
          <a href="/en/verify-an-agency" className="font-bold text-blue-700 underline underline-offset-2 hover:text-blue-900">Check an agency before paying</a>
        </p>
        <p className="mx-auto mt-6 max-w-lg text-xs leading-5 text-slate-500">{INTERNATIONAL_BRAND.disclaimer.en}</p>
        <p className="mt-3 text-xs text-slate-400">{COMPANY_PROFILE.legalName} — {COMPANY_PROFILE.legalIdentifiers.registration} · NIU {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p>
      </section>
    </main>
    </PremiumAtmosphere>
  );
}
