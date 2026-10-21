import { useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ClientPhaseGauge from "@/components/ClientPhaseGauge";

function useQueryParam(name: string) {
  const search = useSearch();
  return useMemo(() => new URLSearchParams(search).get(name) || "", [search, name]);
}

/**
 * Aperçu plein écran lecture seule — alimenté par previewClientSpace.
 * Aucune mutation candidat ; aucun rewrite de dossier actif.
 */
export default function AdminClientSpaceLivePreview() {
  const [, navigate] = useLocation();
  const candidateId = useQueryParam("candidateId");
  const previewToken = useQueryParam("previewToken");
  const sessionToken = typeof window !== "undefined" ? (localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "") : "";

  const tokenQuery = trpc.admin.resolveClientSpacePreviewToken.useQuery(
    { sessionToken, previewToken },
    { enabled: Boolean(sessionToken && previewToken), retry: false },
  );
  const effectiveCandidateId = tokenQuery.data?.candidateId || candidateId;
  const previewQuery = trpc.admin.previewClientSpace.useQuery(
    { sessionToken, candidateId: effectiveCandidateId },
    { enabled: Boolean(sessionToken && effectiveCandidateId), retry: 1 },
  );

  if (!sessionToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-3 font-semibold text-slate-900">Session admin requise</p>
          <p className="mt-1 text-sm text-slate-600">Reconnectez-vous à l’administration pour ouvrir l’aperçu.</p>
          <Button className="mt-4" onClick={() => navigate("/admin")}>Retour admin</Button>
        </div>
      </main>
    );
  }

  const data = previewQuery.data;

  return (
    <main className="min-h-screen bg-slate-100" data-testid="admin-client-live-preview">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Aperçu admin — lecture seule</p>
            <p className="text-sm text-amber-950">Rendu fidèle de l’espace client. Aucune action candidat n’est exécutée.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {previewQuery.isLoading || (previewToken && tokenQuery.isLoading) ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l’aperçu…
          </div>
        ) : previewQuery.isError || !data ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {previewQuery.error?.message || tokenQuery.error?.message || "Aperçu indisponible."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#0B2A52] to-[#1d4ed8] px-5 py-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">3M TRAVEL AGENCY · Mon espace</p>
              <h1 className="mt-2 text-2xl font-black">{data.candidate.fullName}</h1>
              <p className="mt-1 text-sm text-blue-100">
                {data.candidate.dossierNumber}
                {data.candidate.destination ? ` · ${data.candidate.destination}` : ""}
                {data.candidate.visaType ? ` · ${data.candidate.visaType}` : ""}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <ClientPhaseGauge
                dossierStatus={data.candidate.dossierStatus}
                destination={data.candidate.destination}
                visaType={data.candidate.visaType}
                programId={data.candidate.programId}
                domainId={data.candidate.domainId}
                paymentConfirmed={data.payment.confirmed}
              />
              <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Prochaine action (vue candidat)</p>
                <p className="mt-1 font-semibold text-slate-950">{data.nextClientAction.label}</p>
                <p className="mt-1 text-sm text-slate-700">{data.nextClientAction.detail}</p>
              </section>
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-3 text-sm"><p className="text-xs text-slate-500">Paiement</p><p className="font-semibold">{data.payment.confirmed ? "Confirmé" : "En attente"}</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="text-xs text-slate-500">Protocole</p><p className="font-semibold">{data.payment.protocolSigned ? "Signé" : "À signer"}</p></div>
                <div className="rounded-xl border p-3 text-sm"><p className="text-xs text-slate-500">Pièces</p><p className="font-semibold">{data.documents.total - data.documents.pending}/{data.documents.total}</p></div>
              </section>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Progression affichée</p>
                <Progress value={data.progress.percent} className="h-2" />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
