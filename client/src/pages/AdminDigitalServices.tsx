import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, ClipboardList, Loader2, MessageCircle, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminDigitalContentEditor from "@/components/AdminDigitalContentEditor";
import { COMPANY_CONTACTS, digitalWhatsAppUrl } from "@/lib/companyContacts";
import { toast } from "sonner";

const serviceLabels: Record<string, string> = {
  web_platform: "Site web & plateforme",
  digital_growth: "Croissance digitale",
  it_support: "Infrastructure & support IT",
  professional_training: "Formation professionnelle",
};

const statusLabels: Record<RequestStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  proposal_sent: "Proposition envoyée",
  completed: "Finalisé",
  cancelled: "Annulé",
};

const statusStyles: Record<RequestStatus, string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-sky-100 text-sky-800",
  proposal_sent: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
};

type RequestStatus = "new" | "contacted" | "proposal_sent" | "completed" | "cancelled";

function getSessionToken() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "";
}

export default function AdminDigitalServices() {
  const token = useMemo(getSessionToken, []);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<RequestStatus>("new");
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();

  const { data: requests, isLoading, error } = trpc.digitalServices.adminList.useQuery(
    { sessionToken: token },
    { enabled: Boolean(token), retry: false },
  );

  const selected = requests?.find((request) => request.id === selectedId) ?? requests?.[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    setSelectedId((current) => current ?? selected.id);
    setDraftStatus(selected.status as RequestStatus);
    setNotes(selected.adminNotes ?? "");
  }, [selected?.id, selected?.status, selected?.adminNotes]);

  const updateRequest = trpc.digitalServices.updateRequest.useMutation({
    onSuccess: async () => {
      await utils.digitalServices.adminList.invalidate({ sessionToken: token });
      toast.success("Statut et note interne enregistrés.");
    },
    onError: (updateError) => {
      const message = updateError.message?.includes("session")
        ? "Session expirée : reconnectez-vous puis réessayez."
        : updateError.message || "Mise à jour impossible.";
      toast.error(message);
    },
  });

  const selectRequest = (id: number) => {
    const request = requests?.find((item) => item.id === id);
    if (!request) return;
    setSelectedId(id);
    setDraftStatus(request.status as RequestStatus);
    setNotes(request.adminNotes ?? "");
  };

  const saveRequest = () => {
    if (!selected) return;
    updateRequest.mutate({
      sessionToken: token,
      requestId: selected.id,
      status: draftStatus,
      adminNotes: notes.trim() || undefined,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Card className="mx-auto max-w-xl p-6 text-slate-700">
          Session administrateur introuvable. Connectez-vous de nouveau pour ouvrir les demandes 3M Digital.
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <a href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
          <ArrowLeft className="h-4 w-4" /> Retour au poste administratif
        </a>

        <header className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-800">
              <BriefcaseBusiness className="h-4 w-4" /> Service 3M Digital
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Contenu et demandes à traiter</h1>
            <p className="mt-2 text-slate-600">Modifiez la sous-page publiée et qualifiez chaque demande avant toute proposition.</p>
          </div>
          <Badge className="w-fit bg-slate-900 px-3 py-1.5 text-sm text-white">
            {requests?.length ?? 0} demande{(requests?.length ?? 0) > 1 ? "s" : ""}
          </Badge>
        </header>

        <AdminDigitalContentEditor sessionToken={token} />

        {isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Chargement des demandes…</div>
        ) : error ? (
          <Card className="mt-8 p-6 text-red-700">{error.message}</Card>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
            <Card className="overflow-hidden border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4"><p className="font-black text-slate-950">File opérationnelle</p></div>
              <div className="max-h-[620px] overflow-y-auto">
                {(requests ?? []).map((request) => {
                  const requestStatus = request.status as RequestStatus;
                  return (
                    <button
                      key={request.id}
                      onClick={() => selectRequest(request.id)}
                      className={`w-full border-b border-slate-100 p-5 text-left transition hover:bg-blue-50 ${selected?.id === request.id ? "bg-blue-50" : "bg-white"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-black text-slate-950">{request.fullName}</p><p className="mt-1 text-sm text-slate-600">{serviceLabels[request.service]}</p></div>
                        <Badge className={statusStyles[requestStatus]}>{statusLabels[requestStatus]}</Badge>
                      </div>
                      <p className="mt-3 font-mono text-xs text-slate-500">{request.reference}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(request.createdAt).toLocaleString("fr-FR")}</p>
                    </button>
                  );
                })}
                {(requests ?? []).length === 0 && (
                  <div className="p-10 text-center text-slate-500"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300" />Aucune demande 3M Digital pour le moment.</div>
                )}
              </div>
            </Card>

            {selected && (
              <Card className="border-slate-200 bg-white p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-mono text-xs font-bold text-blue-700">{selected.reference}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{selected.fullName}</h2>
                    <p className="mt-1 text-slate-600">{serviceLabels[selected.service]}</p>
                  </div>
                  <Badge className={statusStyles[draftStatus]}>{statusLabels[draftStatus]}</Badge>
                </div>

                <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5" aria-label="Traitement direct de la demande">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-blue-700">Traitement direct</p>
                      <p className="mt-1 text-sm text-slate-700">Choisissez le statut, consignez la prochaine action, puis enregistrez une seule fois.</p>
                    </div>
                    <Badge className={statusStyles[draftStatus]}>Brouillon : {statusLabels[draftStatus]}</Badge>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[224px_minmax(0,1fr)]">
                    <div>
                      <label className="text-sm font-black text-slate-950" htmlFor="digital-request-status">Statut</label>
                      <Select value={draftStatus} onValueChange={(value) => setDraftStatus(value as RequestStatus)}>
                        <SelectTrigger id="digital-request-status" className="mt-2 bg-white" aria-label="Statut de la demande 3M Digital"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="digital-admin-notes" className="text-sm font-black text-slate-950">Notes internes</label>
                      <Textarea id="digital-admin-notes" className="mt-2 min-h-24 bg-white" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Contexte, prochaine action, conditions proposées…" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={saveRequest} disabled={updateRequest.isPending} className="bg-blue-700 hover:bg-blue-800">
                      <Save className="mr-2 h-4 w-4" /> {updateRequest.isPending ? "Enregistrement…" : "Enregistrer le traitement"}
                    </Button>
                    <a href={digitalWhatsAppUrl(`Bonjour ${selected.fullName}, nous faisons suite à votre demande ${selected.reference} auprès de 3M Digital.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-100"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp client</a>
                  </div>
                </section>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Coordonnées</p><p className="mt-2 font-medium text-slate-950">{selected.email}</p><p className="text-slate-700">{selected.phone}</p>{selected.organization && <p className="mt-2 text-sm text-slate-600">Organisation : {selected.organization}</p>}</div>
                  <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Traitement</p><p className="mt-2 text-sm text-slate-700">Créée le {new Date(selected.createdAt).toLocaleString("fr-FR")}</p>{selected.handledByAdminEmail && <p className="mt-1 text-sm text-slate-700">Dernière action : {selected.handledByAdminEmail}</p>}</div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Besoin exprimé</p><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-800">{selected.message}</p></div>
                <p className="mt-3 text-xs text-slate-500">Relance envoyée via le bureau principal : {COMPANY_CONTACTS.yaounde.label}.</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
