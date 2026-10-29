import { History } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { clientText } from "@shared/clientCase";
import { PrintBrandedButton } from "@/components/PrintBrandedButton";
import { Card } from "@/components/ui/card";

/** Journal de mon dossier : tout ce qui s'est passé, daté et lisible, avec impression sur papier à en-tête. */
export function ClientTimeline({ enabled = true }: { enabled?: boolean }) {
  const query = trpc.clientSpace.myTimeline.useQuery(undefined, { enabled, retry: 1, refetchOnWindowFocus: false });
  const data = query.data;
  if (!enabled || !data) return null;
  const language = data.language;
  const locale = language === "en" ? "en-GB" : "fr-FR";
  const when = (value: string) => new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-testid="client-timeline" role="region" aria-labelledby="client-timeline-title">
      <details>
        <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2">
          <h2 id="client-timeline-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><History className="h-5 w-5 text-blue-700" aria-hidden="true" />{clientText(language, "timelineTitle")}</h2>
          <span className="text-xs font-semibold text-slate-500">{data.events.length}</span>
        </summary>
        {data.events.length === 0
          ? <p className="mt-3 text-sm text-slate-600">{clientText(language, "timelineEmpty")}</p>
          : <>
            <ol className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
              {data.events.map((event, index) => (
                <li key={`${event.at}-${index}`} className="relative" data-testid="timeline-event">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                  <time className="text-xs font-semibold uppercase tracking-wide text-slate-500" dateTime={event.at}>{when(event.at)}</time>
                  <p className="text-sm font-bold text-slate-900">{event.title}</p>
                  {event.detail && <p className="text-sm text-slate-700">{event.detail}</p>}
                </li>
              ))}
            </ol>
            <div className="mt-4">
              <PrintBrandedButton
                label={clientText(language, "timelinePrint")}
                build={() => ({
                  title: clientText(language, "timelineTitle"),
                  reference: data.reference,
                  intro: data.fullName,
                  sections: [{ rows: data.events.map((event) => ({ label: `${when(event.at)} — ${event.title}${event.detail ? ` (${event.detail})` : ""}`, value: "" })) }],
                  note: language === "en" ? "History of the actions recorded on your file. It is informative and does not guarantee any decision." : "Historique des actions enregistrées sur votre dossier. Il est donné à titre d'information et ne garantit aucune décision.",
                })}
              />
            </div>
          </>}
      </details>
    </Card>
  );
}
