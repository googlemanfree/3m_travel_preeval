import { useMemo } from "react";
import { CalendarDays, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clientSpacePolling } from "@/lib/clientSpaceSync";
import { buildIcs, clientText, type AgendaEvent, type ClientLanguage } from "@shared/clientCase";
import { SLOT_CHANNEL_LABELS } from "@shared/remoteSupport";
import { formatXaf } from "@shared/openingFee";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Entry = AgendaEvent & { when: Date; kind: "appointment" | "payment" | "step" };

/** Agenda unique : rendez-vous en ligne, échéances de paiement et date de la prochaine étape, avec export vers l'agenda du téléphone. */
export function ClientAgenda({ enabled = true }: { enabled?: boolean }) {
  const overview = trpc.remoteSupport.myOverview.useQuery(undefined, { enabled, ...clientSpacePolling(), retry: false });
  const plan = trpc.adminOps.myPaymentPlan.useQuery(undefined, { enabled, retry: false });
  const preferences = trpc.clientSpace.myPreferences.useQuery(undefined, { enabled, retry: false });
  const language: ClientLanguage = preferences.data?.language ?? "fr";
  const locale = language === "en" ? "en-GB" : "fr-FR";

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    const now = Date.now();
    for (const slot of overview.data?.myBookings ?? []) {
      if (slot.status !== "booked" || new Date(slot.startsAt).getTime() < now) continue;
      list.push({ uid: `slot-${slot.id}`, kind: "appointment", when: new Date(slot.startsAt), start: slot.startsAt, durationMin: slot.durationMin, title: `${language === "en" ? "Online appointment" : "Rendez-vous en ligne"} — 3M Travel Agency`, description: [SLOT_CHANNEL_LABELS[slot.channel], slot.joinUrl].filter(Boolean).join(" · ") });
    }
    for (const item of plan.data?.items ?? []) {
      if (item.status !== "pending") continue;
      list.push({ uid: `pay-${item.id}`, kind: "payment", when: new Date(item.dueOn), start: item.dueOn, allDay: true, title: `${language === "en" ? "Payment due" : "Échéance"} : ${item.label} (${formatXaf(item.amount, item.currency)})` });
    }
    const dueOn = overview.data?.nextStep?.dueOn;
    if (dueOn && overview.data?.nextStep) list.push({ uid: "next-step", kind: "step", when: new Date(dueOn), start: dueOn, allDay: true, title: overview.data.nextStep.text });
    return list.filter((entry) => !Number.isNaN(entry.when.getTime())).sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [overview.data, plan.data, language]);

  if (!enabled || (!overview.data && !plan.data)) return null;

  const download = () => {
    const url = URL.createObjectURL(new Blob([buildIcs(entries)], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "agenda-3m-travel-agency.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-testid="client-agenda" role="region" aria-labelledby="client-agenda-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="client-agenda-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><CalendarDays className="h-5 w-5 text-blue-700" aria-hidden="true" />{clientText(language, "agendaTitle")}</h2>
        {entries.length > 0 && <Button type="button" variant="outline" className="min-h-11" onClick={download} data-testid="agenda-download"><Download className="mr-2 h-4 w-4" aria-hidden="true" />{clientText(language, "agendaDownload")}</Button>}
      </div>
      {entries.length === 0
        ? <p className="mt-3 text-sm text-slate-600" data-testid="agenda-empty">{clientText(language, "agendaEmpty")}</p>
        : <ul className="mt-3 divide-y divide-slate-100">{entries.map((entry) => (
          <li key={entry.uid} className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm" data-testid={`agenda-${entry.uid}`}>
            <span className="font-semibold text-slate-900">{entry.title}</span>
            <time className="text-slate-600" dateTime={entry.when.toISOString()}>{entry.allDay ? entry.when.toLocaleDateString(locale, { day: "numeric", month: "long" }) : entry.when.toLocaleString(locale, { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" })}</time>
          </li>
        ))}</ul>}
    </Card>
  );
}
