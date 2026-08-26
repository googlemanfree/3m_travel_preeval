import { useMemo, useState } from "react";
import { Heart, Loader2, Plane, Search, Trash2, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { trpc } from "@/lib/trpc";
import { favoriteFlightRows, favoriteFlightsFilename } from "@shared/favoriteFlightExport";
import { toast } from "sonner";
import ClientSpaceNavigation from "@/components/ClientSpaceNavigation";

function getAirlineName(flight: Record<string, unknown>) {
  const airline = flight.airline;
  if (typeof airline === "object" && airline !== null && "name" in airline) {
    return String((airline as { name?: unknown }).name ?? "Compagnie aérienne");
  }
  return String(airline ?? "Compagnie aérienne");
}

export default function FlightFavorites() {
  const { isAuthenticated } = useCandidateAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const favoritesQuery = trpc.flights.getFavoriteFlights.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const deleteMutation = trpc.flights.deleteFavoriteFlight.useMutation({
    onSuccess: async () => {
      await utils.flights.getFavoriteFlights.invalidate();
      toast.success("Vol retiré des favoris");
    },
    onError: () => toast.error("Impossible de retirer ce vol des favoris"),
  });

  const exportFavoritesPdf = () => {
    const items = favoritesQuery.data ?? [];
    if (!items.length) {
      toast.error("Aucun vol favori à exporter");
      return;
    }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(18);
    doc.setTextColor(15, 36, 96);
    doc.text("3M Travel & Services — Mes vols favoris", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 115);
    doc.text(`Export généré le ${new Date().toLocaleString("fr-FR")}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Itinéraire", "Compagnie", "Vol", "Départ"]],
      body: favoriteFlightRows(items),
      theme: "grid",
      headStyles: { fillColor: [15, 36, 96], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    });
    doc.save(favoriteFlightsFilename());
    toast.success("Export PDF téléchargé", { description: "La liste affichée de vos vols favoris a été exportée." });
  };

  const favorites = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return (favoritesQuery.data ?? []).filter((item) => {
      if (!normalized) return true;
      const flight = item.flight ?? {};
      return [flight.originCity, flight.origin, flight.destinationCity, flight.destination, flight.flightNumber, getAirlineName(flight)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [favoritesQuery.data, search]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-5xl py-8">
        <ClientSpaceNavigation />
        <Card className="border-rose-100 shadow-sm">
          <CardHeader className="flex flex-col gap-4 border-b border-rose-100 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="flex items-center gap-2 text-2xl font-black text-slate-900"><Heart className="h-6 w-6 fill-rose-500 text-rose-500" /> Mes vols favoris</CardTitle><p className="mt-1 text-sm text-slate-600">Retrouvez, comparez et relancez rapidement vos itinéraires enregistrés.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">{favoritesQuery.data?.length ?? 0} enregistré(s)</span>
              <Button type="button" variant="outline" onClick={exportFavoritesPdf} disabled={favoritesQuery.isLoading || !(favoritesQuery.data?.length)} className="h-10 rounded-xl border-blue-200 font-bold text-blue-800 hover:bg-blue-50">
                <Download className="mr-2 h-4 w-4" /> Exporter PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <label className="relative block" htmlFor="favorite-flight-search"><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><span className="sr-only">Rechercher dans mes vols favoris</span><input id="favorite-flight-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par ville, compagnie ou numéro de vol" className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" /></label>

            {favoritesQuery.isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement de vos favoris…</div> : !favorites.length ? <div className="py-16 text-center"><Plane className="mx-auto h-12 w-12 text-blue-200" /><h2 className="mt-4 text-lg font-black text-slate-800">{search ? "Aucun résultat" : "Aucun vol favori"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{search ? "Modifiez votre recherche pour retrouver un itinéraire." : "Depuis la page Vols, utilisez le bouton Sauvegarder pour conserver un itinéraire ici."}</p><Button type="button" onClick={() => setLocation("/flights")} className="mt-5 h-12 rounded-xl bg-blue-700 font-bold hover:bg-blue-800">Rechercher un vol</Button></div> : <div className="mt-5 space-y-3">{favorites.map((item) => { const flight = item.flight ?? {}; const origin = String(flight.originCity ?? flight.origin ?? "Départ"); const destination = String(flight.destinationCity ?? flight.destination ?? "Arrivée"); const airline = getAirlineName(flight); const flightNumber = String(flight.flightNumber ?? "Vol"); return <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 transition hover:bg-rose-50 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><span className="rounded-xl bg-white p-3 shadow-sm"><Plane className="h-5 w-5 text-blue-700" /></span><div><h3 className="font-black text-slate-900">{origin} → {destination}</h3><p className="mt-1 text-sm text-slate-600">{airline} · {flightNumber}</p><p className="mt-1 text-xs text-slate-500">Enregistré le {new Date(item.createdAt).toLocaleDateString("fr-FR")}</p></div></div><div className="flex flex-wrap gap-2 md:justify-end"><Button type="button" variant="outline" onClick={() => setLocation(`/flights?origin=${encodeURIComponent(String(flight.origin ?? ""))}&destination=${encodeURIComponent(String(flight.destination ?? ""))}&date=${encodeURIComponent(String(flight.departureDate ?? ""))}`)} className="h-11 rounded-xl font-bold">Rechercher à nouveau</Button><Button type="button" variant="ghost" aria-label={`Supprimer ${origin} vers ${destination}`} disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate({ id: item.id })} className="h-11 rounded-xl text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></Button></div></article>; })}</div>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
