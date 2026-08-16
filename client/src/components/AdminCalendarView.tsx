import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Hotel, Car, Briefcase, Eye, ChevronLeft, ChevronRight, Download } from "lucide-react";

export function AdminCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const { data: tourismRequests = [], isLoading, refetch } = trpc.tourism.adminList.useQuery();
  const { data: iCalData, refetch: fetchIcal } = trpc.tourism.exportIcal.useQuery(undefined, { enabled: false });

  const confirmedRequests = tourismRequests.filter(r => r.status === "confirmed" || r.status === "completed");

  const handleExportIcal = async () => {
    const res = await fetchIcal();
    if (res.data) {
      const blob = new Blob([res.data.icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Calendrier des Réservations Confirmées ({confirmedRequests.length})
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Visualisez les séjours, locations de véhicules et packs professionnels confirmés par l’agence.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportIcal} className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50">
                <Download className="w-4 h-4" /> Export iCal (.ics)
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={prevMonth} className="gap-1">
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </Button>
                <span className="font-semibold text-gray-800 dark:text-slate-200 capitalize min-w-[130px] text-center">
                  {monthName}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth} className="gap-1">
                  Suivant <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-gray-500">Chargement du calendrier...</div>
          ) : confirmedRequests.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <CalendarIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700 dark:text-slate-300">Aucune réservation confirmée pour le moment</p>
              <p className="text-xs text-gray-500 mt-1">Les demandes passées au statut « Confirmé » apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedRequests.map((req) => {
                const dep = req.departureDate ? new Date(req.departureDate).toLocaleDateString("fr-FR") : "Non spécifiée";
                const ret = req.returnDate ? new Date(req.returnDate).toLocaleDateString("fr-FR") : "Non spécifiée";
                return (
                  <div key={req.id} className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="font-mono text-xs text-blue-700 bg-blue-50 border-blue-200">
                          {req.reference}
                        </Badge>
                        <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
                          Confirmé
                        </Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{req.fullName}</h4>
                      <p className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        Destination : <strong className="text-gray-900 dark:text-white">{req.destination}</strong>
                      </p>
                      <div className="text-xs text-gray-500 dark:text-slate-400 space-y-1 mt-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          Du {dep} au {ret}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          Voyageur(s) : {req.travelersCount}
                        </p>
                        {req.packType && (
                          <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
                            <Briefcase className="w-3.5 h-3.5" /> Pack Pro : {req.packType.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                      <span>{req.quotedPriceXaf ? `${req.quotedPriceXaf.toLocaleString()} XAF` : "Devis en attente"}</span>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(req)} className="h-7 text-blue-600 hover:text-blue-700">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Détails
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale de détails réservation */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Détails Réservation — {selectedRequest.reference}
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
            </div>
            <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
              <p><strong>Client :</strong> {selectedRequest.fullName}</p>
              <p><strong>E-mail :</strong> {selectedRequest.email}</p>
              <p><strong>Téléphone :</strong> {selectedRequest.phone || "Non renseigné"}</p>
              <p><strong>Destination :</strong> {selectedRequest.destination}</p>
              <p><strong>Dates :</strong> Du {selectedRequest.departureDate ? new Date(selectedRequest.departureDate).toLocaleDateString("fr-FR") : "?"} au {selectedRequest.returnDate ? new Date(selectedRequest.returnDate).toLocaleDateString("fr-FR") : "?"}</p>
              {selectedRequest.hotelCategory && <p><strong>Hôtel :</strong> {selectedRequest.hotelCategory}</p>}
              {selectedRequest.vehicleCategory && <p><strong>Véhicule :</strong> {selectedRequest.vehicleCategory}</p>}
              {selectedRequest.notes && <p><strong>Notes client :</strong> {selectedRequest.notes}</p>}
              {selectedRequest.adminNotes && <p><strong>Notes d'agence :</strong> {selectedRequest.adminNotes}</p>}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <Button onClick={() => setSelectedRequest(null)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
