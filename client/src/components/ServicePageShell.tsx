import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

type ServicePageShellProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  primaryHref: string;
  primaryLabel: string;
  officialHref?: string;
  officialLabel?: string;
  notice?: string;
  children: ReactNode;
};

export function ServicePageShell({ eyebrow, title, introduction, primaryHref, primaryLabel, officialHref, officialLabel = "Consulter la source officielle", notice, children }: ServicePageShellProps) {
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <section className="border-b border-blue-900/30 bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-16 pt-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="inline-flex items-center rounded-full border border-blue-200/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-blue-100">{eyebrow}</p>
          <h1 className="!text-white mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="!text-blue-50 mt-6 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">{introduction}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950">{primaryLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>{officialHref && <a href={officialHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"><ExternalLink className="h-4 w-4" aria-hidden="true" />{officialLabel}</a>}</div>
        </div>
        <aside className="rounded-2xl border border-white/20 bg-slate-950/25 p-6 shadow-2xl backdrop-blur-sm"><ShieldCheck className="h-8 w-8 text-blue-200" aria-hidden="true" /><h2 className="!text-white mt-4 text-lg font-black text-white">Une orientation, pas une promesse</h2><p className="!text-blue-50 mt-2 text-sm leading-6 text-blue-50">Chaque projet est examiné au regard des informations disponibles et des exigences officielles. La décision finale appartient toujours aux autorités compétentes.</p></aside>
      </div>
    </section>
    {notice && <section className="border-b border-amber-200 bg-amber-50 px-4 py-4 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl gap-3 text-sm leading-6 text-amber-950"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />{notice}</div></section>}
    {children}
  </main>;
}

export function ServiceSection({ title, introduction, children, tone = "white" }: { title: string; introduction?: string; children: ReactNode; tone?: "white" | "slate" | "blue" }) {
  const tones = { white: "bg-white", slate: "bg-slate-50", blue: "bg-blue-50" };
  return <section className={`${tones[tone]} px-4 py-14 sm:px-6 lg:px-8`}><div className="mx-auto max-w-7xl"><div className="max-w-3xl"><h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h2>{introduction && <p className="mt-3 text-base leading-7 text-slate-600">{introduction}</p>}</div><div className="mt-8">{children}</div></div></section>;
}
