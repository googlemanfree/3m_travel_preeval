import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusLabels: Record<string, string> = { new: "Nouveau", contacted: "Contacté", quote_sent: "Devis envoyé", completed: "Finalisé", cancelled: "Annulé" };

export default function AdminInsuranceRequests() {
  const { data: requests, isLoading, error } = trpc.insuranceRequests.adminList.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.insuranceRequests.updateStatus.useMutation({
    onSuccess: () => { utils.insuranceRequests.adminList.invalidate(); toast.success("Statut mis à jour."); },
    onError: updateError => toast.error(updateError.message || "Mise à jour impossible."),
  });

  return <div className="min-h-screen bg-gray-50 p-6 md:p-8"><div className="mx-auto max-w-7xl"><div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-3 text-blue-700"><ShieldCheck className="h-7 w-7" /></div><div><h1 className="text-3xl font-bold text-gray-900">Demandes d’assurance voyage</h1><p className="text-gray-600">Demandes transmises depuis le formulaire assurance.</p></div></div>{isLoading ? <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-5 w-5 animate-spin" /> Chargement des demandes…</div> : error ? <Card className="p-6 text-red-600">{error.message}</Card> : <Card className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-4">Référence / client</th><th className="p-4">Voyage</th><th className="p-4">Voyageurs</th><th className="p-4">Contact</th><th className="p-4">Statut</th></tr></thead><tbody>{(requests ?? []).map(request => <tr key={request.id} className="border-b align-top"><td className="p-4"><p className="font-semibold text-gray-900">{request.reference}</p><p>{request.fullName}</p><p className="text-xs text-gray-500">Passeport : {request.passportNumber}</p></td><td className="p-4"><p>{request.destinationCountry}</p><p className="text-sm text-gray-600">{new Date(request.departureDate).toLocaleDateString("fr-FR")} → {new Date(request.returnDate).toLocaleDateString("fr-FR")}</p><p className="text-sm text-gray-600">{request.coveragePlan}</p></td><td className="p-4">{request.travelersCount}</td><td className="p-4 text-sm"><p>{request.email}</p><p>{request.phone}</p><p className="mt-1 text-xs text-gray-500">Urgence : {request.emergencyContactName} · {request.emergencyContactPhone}</p></td><td className="p-4"><Select value={request.status} onValueChange={value => updateStatus.mutate({ id: request.id, status: value as "new" | "contacted" | "quote_sent" | "completed" | "cancelled" })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></td></tr>)}{(requests ?? []).length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">Aucune demande d’assurance pour le moment.</td></tr>}</tbody></table></Card>}</div></div>;
}
