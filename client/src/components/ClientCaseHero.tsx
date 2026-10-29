import { CalendarClock, CheckCircle2, ListChecks, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clientSpacePolling } from "@/lib/clientSpaceSync";
import { clientText } from "@shared/clientCase";
import { Card } from "@/components/ui/card";

/** « Où en est mon dossier ? » : l'état en une phrase, ce que j'ai à faire, ce que fait l'équipe, la dernière action de l'équipe. */
export function ClientCaseHero({ enabled = true }: { enabled?: boolean }) {
  const query = trpc.clientSpace.myCaseOverview.useQuery(undefined, { enabled, ...clientSpacePolling(), retry: 1 });
  const data = query.data;
  if (!enabled || !data) return null;
  const language = data.language;
  const locale = language === "en" ? "en-GB" : "fr-FR";
  return (
    <Card className="overflow-hidden border-2 border-indigo-200 bg-white shadow-md" data-testid="client-case-hero" role="region" aria-labelledby="client-case-hero-title">
      <div className="border-b border-indigo-100 bg-indigo-50 px-4 py-4 sm:px-5">
        <h2 id="client-case-hero-title" className="text-lg font-black text-slate-950">{clientText(language, "heroTitle")}</h2>
        <p className="mt-1 text-base font-semibold text-slate-800" data-testid="case-hero-state">{data.dossierLabel}</p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <section aria-label={clientText(language, "myTurn")} data-testid="case-hero-my-turn">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-amber-800"><ListChecks className="h-4 w-4" aria-hidden="true" />{clientText(language, "myTurn")}</h3>
          {data.myTurn.length === 0
            ? <p className="mt-2 flex items-start gap-2 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{clientText(language, "nothingForMe")}</p>
            : <ul className="mt-2 space-y-2">{data.myTurn.map((item) => <li key={`${item.kind}-${item.text}`} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-slate-900">{item.text}</li>)}</ul>}
        </section>
        <section aria-label={clientText(language, "teamTurn")} data-testid="case-hero-team">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-blue-800"><Users className="h-4 w-4" aria-hidden="true" />{clientText(language, "teamTurn")}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-800">{data.teamDoing ?? "—"}</p>
          <p className="mt-2 text-xs text-slate-600">{clientText(language, "lastActivity")} : {data.lastTeamActivityAt ? new Date(data.lastTeamActivityAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : clientText(language, "noActivity")}</p>
          {data.nextAppointmentAt && <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><CalendarClock className="h-4 w-4 text-blue-700" aria-hidden="true" />{new Date(data.nextAppointmentAt).toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" })}</p>}
        </section>
      </div>
    </Card>
  );
}
