import { useEffect } from "react";
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COMPANY_PROFILE } from "@/lib/companyContacts";

const PRIORITY_DESTINATIONS = [
  { href: "/en/procedures/canada-work", flag: "🇨🇦", title: "Canada — Work Visa", blurb: "Job-offer based work visa process, supported end-to-end from Yaoundé." },
  { href: "/en/procedures/france-study", flag: "🇫🇷", title: "France — Study Visa", blurb: "Admission, documents and visa application for renowned French universities." },
  { href: "/en/procedures/germany-work", flag: "🇩🇪", title: "Germany — Work Visa", blurb: "Qualified-professional work visa route for Germany's job market." },
  { href: "/en/procedures/dubai-evisa", flag: "🇦🇪", title: "Dubai — Tourist e-Visa", blurb: "Fast-track e-Visa processing for the United Arab Emirates." },
];

export default function EnHome() {
  useEffect(() => {
    document.title = "3M Travel & Services | International Mobility from Yaoundé";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "3M Travel & Services supports your international mobility project — visa applications, study abroad, and travel services — from Yaoundé, Cameroon.",
    );
    document.documentElement.lang = "en";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-amber-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Documented mobility support, from Yaoundé
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Your international mobility project, prepared with method
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100">
            3M Travel & Services accompanies candidates through visa, study, and travel projects with clear steps, verified sources, and human review of every sensitive step. Decisions by authorities, employers, and partners remain independent of the agency.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/?project=travail&destination=canada#evaluation-multi">
              <Button className="h-12 rounded-xl bg-amber-500 px-7 font-extrabold text-slate-950 hover:bg-amber-600">
                Start a free evaluation <ArrowRight className="ml-2 h-4 w-4" />
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
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">Most requested procedures from Yaoundé</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRIORITY_DESTINATIONS.map((item) => (
            <a key={item.href} href={item.href} className="block">
              <Card className="h-full rounded-2xl border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className="text-3xl" aria-hidden="true">{item.flag}</span>
                <h3 className="mt-3 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Card>
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          More destinations are being translated. For the full 107-destination catalogue, see the{" "}
          <a href="/procedures" className="font-bold text-blue-700 hover:text-blue-900">French procedures directory</a>.
        </p>
      </section>

      <section aria-label="Why 3M Travel & Services" className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          <Card className="rounded-2xl border-slate-200 p-6">
            <Sparkles className="h-6 w-6 text-amber-500" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-slate-900">Documented preparation</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Each step, document, and requirement is checked against verifiable, institutional sources before you proceed.</p>
          </Card>
          <Card className="rounded-2xl border-slate-200 p-6">
            <ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-slate-900">Human review</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sensitive steps are reviewed by an authorized advisor — no automatic decisions, no guaranteed outcomes.</p>
          </Card>
          <Card className="rounded-2xl border-slate-200 p-6">
            <MessageCircle className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            <h3 className="mt-3 font-bold text-slate-900">Direct support</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Reach our Yaoundé team on WhatsApp for a first orientation on your project, free of charge.</p>
          </Card>
        </div>
      </section>

      <section aria-label="Contact" className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-black text-slate-950">Talk to an advisor</h2>
        <p className="mt-3 text-slate-600">{COMPANY_PROFILE.offices.cameroon.addressLines.join(", ")}, Yaoundé, Cameroon</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer">
            <Button className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp: {COMPANY_PROFILE.offices.cameroon.whatsappDisplay}
            </Button>
          </a>
          <a href={`mailto:${COMPANY_PROFILE.publicEmail}`}>
            <Button variant="outline" className="h-11 rounded-xl border-blue-200 px-6 font-bold text-blue-800 hover:bg-blue-50">
              {COMPANY_PROFILE.publicEmail}
            </Button>
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-400">{COMPANY_PROFILE.legalName} — {COMPANY_PROFILE.legalIdentifiers.registration} · NIU {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p>
      </section>
    </div>
  );
}
