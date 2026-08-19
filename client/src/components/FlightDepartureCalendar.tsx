import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plane } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FlightDepartureCalendarProps = {
  sessionToken: string;
  onSelectRequest: (requestId: number) => void;
};

type DepartureItem = {
  id: number;
  requestRef: string;
  airline: string;
  route: string;
  departureAt: Date;
  priority: string;
};

function getDepartureItem(request: any): DepartureItem | null {
  const flight = request.flightData && typeof request.flightData === "object" ? request.flightData as Record<string, unknown> : {};
  const departureDate = typeof flight.departureDate === "string" ? flight.departureDate : "";
  const departureTime = typeof flight.departureTime === "string" ? flight.departureTime : "23:59";
  const departureAt = new Date(`${departureDate}T${departureTime}`);
  if (Number.isNaN(departureAt.getTime())) return null;
  const airlineData = flight.airline && typeof flight.airline === "object" ? flight.airline as Record<string, unknown> : {};
  const airline = typeof airlineData.name === "string" ? airlineData.name : "Compagnie à confirmer";
  const origin = typeof flight.originCity === "string" ? flight.originCity : typeof flight.origin === "string" ? flight.origin : "Départ";
  const destination = typeof flight.destinationCity === "string" ? flight.destinationCity : typeof flight.destination === "string" ? flight.destination : "Destination";
  return { id: request.id, requestRef: request.requestRef, airline, route: `${origin} → ${destination}`, departureAt, priority: request.priority };
}

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function FlightDepartureCalendar({ sessionToken, onSelectRequest }: FlightDepartureCalendarProps) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const queueQuery = trpc.flightBooking.getQueue.useQuery(
    { sessionToken, status: "ALL", priority: "ALL", limit: 100, offset: 0 },
    { enabled: Boolean(sessionToken), retry: false, refetchInterval: 30_000 },
  );
  const departures = useMemo(() => (queueQuery.data?.requests ?? []).map(getDepartureItem).filter((item): item is DepartureItem => Boolean(item)), [queueQuery.data?.requests]);
  const itemsByDay = useMemo(() => departures.reduce<Record<string, DepartureItem[]>>((acc, item) => {
    const key = isoDay(item.departureAt);
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {}), [departures]);
  const monthName = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const firstWeekday = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index < firstWeekday ? null : new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1));
  const imminentCount = departures.filter((item) => item.departureAt.getTime() - Date.now() <= 7 * 24 * 3_600_000 && item.departureAt.getTime() >= Date.now()).length;

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900"><CalendarDays className="h-5 w-5 text-sky-600" /> Calendrier des départs vols</h2>
          <p className="mt-1 text-sm text-slate-500">Cliquez sur une réservation pour ouvrir son traitement. Les départs dans les 7 jours sont mis en évidence.</p>
        </div>
        <Badge className="w-fit bg-amber-100 text-amber-800">{imminentCount} départ(s) imminent(s)</Badge>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button>
        <p className="font-black capitalize text-slate-800">{monthName}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-l border-t border-slate-200 bg-slate-50 text-center text-[11px] font-black uppercase tracking-wide text-slate-500">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <div key={day} className="border-b border-r border-slate-200 px-2 py-2">{day}</div>)}</div>
          <div className="grid grid-cols-7 border-l border-slate-200">{cells.map((date, index) => {
            if (!date) return <div key={`blank-${index}`} className="min-h-28 border-b border-r border-slate-200 bg-slate-50/60" />;
            const dayItems = itemsByDay[isoDay(date)] ?? [];
            return <div key={isoDay(date)} className="min-h-28 border-b border-r border-slate-200 bg-white p-2"><p className="mb-1 text-xs font-black text-slate-500">{date.getDate()}</p><div className="space-y-1">{dayItems.slice(0, 3).map((item) => {
              const urgent = item.priority === "urgent" || item.departureAt.getTime() - Date.now() <= 48 * 3_600_000;
              return <button key={item.id} type="button" onClick={() => onSelectRequest(item.id)} className={`block w-full rounded-lg px-2 py-1.5 text-left text-[10px] font-bold transition hover:brightness-95 ${urgent ? "bg-red-100 text-red-800" : "bg-sky-100 text-sky-800"}`}><span className="flex items-center gap-1"><Plane className="h-3 w-3" /> {item.airline}</span><span className="block truncate">{item.route}</span><span className="block opacity-75">{item.requestRef}</span></button>;
            })}{dayItems.length > 3 && <p className="text-[10px] font-bold text-slate-500">+{dayItems.length - 3} autre(s)</p>}</div></div>;
          })}</div>
        </div>
      </div>
    </Card>
  );
}
