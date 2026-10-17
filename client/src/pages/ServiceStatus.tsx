import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, HelpCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

type HealthState = "checking" | "ok" | "degraded" | "unreachable";
type Health = { state: HealthState; checkedAt: Date | null };

const copy = {
  fr: {
    eyebrow: "ÉTAT DU SERVICE",
    title: "Une information claire, au bon moment.",
    intro: "Consultez ici l’état général des services publics de 3M TRAVEL AGENCY. Le contrôle ci-dessous est réalisé en direct, au chargement de la page.",
    updated: "Dernière vérification",
    operational: "Opérationnel",
    degraded: "Service dégradé",
    checking: "Vérification en cours…",
    unreachable: "Vérification impossible depuis votre appareil",
    recheck: "Vérifier à nouveau",
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
    coversTitle: "Ce que couvre cette page",
    covers: [
      "Le site public : si cette page s’affiche, il répond.",
      "Les formulaires et les espaces sécurisés : ils dépendent de la base de données, que nous interrogeons en direct à chaque chargement.",
      "Cette page ne remplace pas une surveillance complète et ne mesure pas les délais de traitement des autorités.",
    ],
    problemTitle: "Un service ne répond pas ?",
    problem: [
      "Actualisez la page puis réessayez dans quelques instants ; vérifiez aussi votre connexion.",
      "Si le problème persiste, écrivez-nous par WhatsApp ou par e-mail en indiquant la page et l’heure : un conseiller peut poursuivre votre démarche par un autre canal.",
      "Vos données déjà enregistrées ne sont pas perdues lors d’une interruption temporaire.",
    ],
  },
  en: {
    eyebrow: "SERVICE STATUS",
    title: "Clear information, when you need it.",
    intro: "Check the general status of 3M TRAVEL AGENCY public services here. The check below is performed live when the page loads.",
    updated: "Last checked",
    operational: "Operational",
    degraded: "Degraded service",
    checking: "Checking…",
    unreachable: "Check not possible from your device",
    recheck: "Check again",
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
    coversTitle: "What this page covers",
    covers: [
      "The public website: if this page displays, it is responding.",
      "Forms and secure spaces: they depend on the database, which we query live each time the page loads.",
      "This page does not replace full monitoring and does not measure authorities' processing times.",
    ],
    problemTitle: "A service is not responding?",
    problem: [
      "Refresh the page and try again in a few moments; also check your connection.",
      "If the problem persists, write to us on WhatsApp or by e-mail with the page and the time: an advisor can continue your procedure through another channel.",
      "Data you have already saved is not lost during a temporary interruption.",
    ],
  },
} as const;

/** Interroge le contrôle public de disponibilité du serveur. */
export function usePublicHealth(): Health & { refresh: () => void } {
  const [health, setHealth] = useState<Health>({ state: "checking", checkedAt: null });
  const refresh = useCallback(() => {
    let cancelled = false;
    setHealth((current) => ({ ...current, state: "checking" }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch("/api/public/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { status?: string; checkedAt?: string } | null;
        if (cancelled) return;
        const checkedAt = body?.checkedAt ? new Date(body.checkedAt) : new Date();
        setHealth({ state: body?.status === "ok" ? "ok" : "degraded", checkedAt });
      })
      .catch(() => {
        if (!cancelled) setHealth({ state: "unreachable", checkedAt: new Date() });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  useEffect(() => refresh(), [refresh]);
  return { ...health, refresh: () => void refresh() };
}

export default function ServiceStatus() {
  const { language } = useLanguage();
  const t = copy[language];
  const { state, checkedAt, refresh } = usePublicHealth();

  const stateLabel = state === "ok" ? t.operational : state === "degraded" ? t.degraded : state === "checking" ? t.checking : t.unreachable;
  const dotClass = (live: boolean) => {
    if (!live) return "bg-emerald-500"; // le site public répond : la page est servie
    return state === "ok" ? "bg-emerald-500" : state === "degraded" ? "bg-red-500" : "bg-slate-400";
  };
  const rows: Array<{ label: string; live: boolean }> = [
    { label: t.publicSite, live: false },
    { label: t.forms, live: true },
    { label: t.secure, live: true },
  ];
  const time = checkedAt ? checkedAt.toLocaleTimeString(language === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;

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
              <p className="mt-1 text-sm text-slate-500" data-testid="status-checked-at">{t.updated} : {time ?? "—"}</p>
            </div>
            <span
              role="status"
              aria-live="polite"
              data-testid="status-badge"
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${state === "ok" ? "bg-emerald-50 text-emerald-700" : state === "degraded" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}
            >
              {state === "ok" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
              {stateLabel}
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 py-4 text-sm font-medium text-slate-700">
                <span>{row.label}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${dotClass(row.live)}`} aria-label={row.live ? stateLabel : t.operational} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={refresh} disabled={state === "checking"} data-testid="status-recheck" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0b2f6f] px-4 py-2 text-sm font-bold text-[#0b2f6f] transition-colors hover:bg-[#eaf1ff] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2f6f] focus-visible:ring-offset-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />{t.recheck}
          </button>
        </div>

        <aside className="rounded-2xl border border-[#d7e3f5] bg-[#fffdf5] p-5 sm:p-7">
          <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#bd7a00]" aria-hidden="true" /><h2 className="text-lg font-bold text-[#071b3d]">{t.planned}</h2></div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{t.none}</p>
          <p className="mt-5 border-t border-[#eedca8] pt-4 text-xs leading-5 text-slate-600">{t.notice}</p>
        </aside>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-10 sm:px-6 md:grid-cols-2" data-testid="status-guidance">
        <div className="rounded-2xl border border-[#d7e3f5] bg-white p-5 sm:p-7">
          <h2 className="text-lg font-bold text-[#071b3d]">{t.coversTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">{t.covers.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="rounded-2xl border border-[#d7e3f5] bg-white p-5 sm:p-7">
          <h2 className="text-lg font-bold text-[#071b3d]">{t.problemTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">{t.problem.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 text-sm text-slate-600"><HelpCircle className="h-5 w-5 text-[#0b2f6f]" aria-hidden="true" /><span>{t.help}</span></div>
        <div className="flex flex-wrap gap-3"><Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f4b942] px-5 py-3 text-sm font-bold text-[#071b3d] transition-colors hover:bg-[#e9aa2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071b3d] focus-visible:ring-offset-2">{t.contact}</Link><Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0b2f6f] px-5 py-3 text-sm font-bold text-[#0b2f6f] transition-colors hover:bg-[#eaf1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2f6f] focus-visible:ring-offset-2">{t.home}</Link></div>
      </section>
    </main>
  );
}
