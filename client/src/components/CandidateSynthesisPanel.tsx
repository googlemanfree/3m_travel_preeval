import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, RefreshCw, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { renderSynthesisPdf, synthesisPdfFileName } from "@/lib/synthesisPdf";
import type { SynthesisContent } from "@shared/candidateSynthesisSheet";
import { formatDisplayName } from "@shared/candidateSynthesisSheet";

type Props = {
  sessionToken: string;
  candidateId: number;
};

async function downloadDraftPdf(content: SynthesisContent, portraitUrl?: string | null) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  let portraitDataUrl: string | null = null;
  if (portraitUrl) {
    try {
      const response = await fetch(portraitUrl);
      const blob = await response.blob();
      portraitDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || null));
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      portraitDataUrl = null;
    }
  }
  renderSynthesisPdf(pdf, { content, portraitDataUrl });
  pdf.save(synthesisPdfFileName(content.displayFirstName, content.displayLastInitial));
}

export default function CandidateSynthesisPanel({ sessionToken, candidateId }: Props) {
  const query = trpc.candidateSynthesis.adminGet.useQuery(
    { sessionToken, candidateId },
    { enabled: Boolean(sessionToken && candidateId), refetchOnWindowFocus: false },
  );
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<SynthesisContent | null>(null);

  useEffect(() => {
    if (query.data?.draft) setDraft(query.data.draft);
  }, [query.data?.draft]);

  const generate = trpc.candidateSynthesis.adminGenerate.useMutation({
    onSuccess: async (result) => {
      setDraft(result.draft);
      toast.success("Brouillon de fiche généré");
      await utils.candidateSynthesis.adminGet.invalidate({ sessionToken, candidateId });
    },
    onError: (error) => toast.error("Génération impossible", { description: error.message }),
  });
  const save = trpc.candidateSynthesis.adminSaveDraft.useMutation({
    onSuccess: async () => {
      toast.success("Brouillon enregistré");
      await utils.candidateSynthesis.adminGet.invalidate({ sessionToken, candidateId });
    },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });
  const validate = trpc.candidateSynthesis.adminValidate.useMutation({
    onSuccess: async () => {
      toast.success("Fiche validée — visible pour les partenaires rattachés");
      await utils.candidateSynthesis.adminGet.invalidate({ sessionToken, candidateId });
    },
    onError: (error) => toast.error("Validation impossible", { description: error.message }),
  });
  const reject = trpc.candidateSynthesis.adminReject.useMutation({
    onSuccess: async () => {
      toast.success("Fiche refusée");
      await utils.candidateSynthesis.adminGet.invalidate({ sessionToken, candidateId });
    },
    onError: (error) => toast.error("Refus impossible", { description: error.message }),
  });

  const statusLabel = query.data?.sheet?.statusLabel || "Aucune fiche";
  const docs = useMemo(() => draft?.documents ?? [], [draft?.documents]);

  return (
    <section className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm lg:p-5" data-testid="candidate-synthesis-panel" aria-labelledby="synthesis-panel-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Employeurs & agences</p>
          <h3 id="synthesis-panel-title" className="mt-1 text-lg font-bold text-slate-950">Fiche de synthèse (PDF 1 page)</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Structurée automatiquement à chaque dépôt de pièce. Prévisualisez le PDF tel que le partenaire le verra, puis validez pour diffusion.
          </p>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-900" data-testid="synthesis-status">
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {query.data?.shareConsent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" /> Consentement partage fiche/photo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">
            <ShieldBan className="h-3.5 w-3.5" /> Consentement partage manquant
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{docs.length} type(s) de pièce structuré(s)</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-indigo-700 hover:bg-indigo-800"
          disabled={generate.isPending || !query.data?.shareConsent}
          onClick={() => generate.mutate({ sessionToken, candidateId })}
          data-testid="synthesis-generate"
        >
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {query.data?.sheet ? "Régénérer le brouillon" : "Générer la fiche"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!draft || save.isPending}
          onClick={() => draft && save.mutate({ sessionToken, candidateId, draft })}
        >
          Enregistrer
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!draft}
          onClick={() => draft && void downloadDraftPdf(draft, query.data?.sheet?.portraitUrl || query.data?.candidate.avatarUrl)}
          data-testid="synthesis-preview-pdf"
        >
          <Download className="h-4 w-4" /> Prévisualiser le PDF
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-emerald-700 hover:bg-emerald-800"
          disabled={!draft || validate.isPending || !query.data?.shareConsent}
          onClick={() => validate.mutate({ sessionToken, candidateId })}
          data-testid="synthesis-validate"
        >
          <CheckCircle2 className="h-4 w-4" /> Valider pour diffusion
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={reject.isPending}
          onClick={() => {
            const reason = window.prompt("Motif du refus (visible en journal admin)") || "";
            if (reason.trim().length >= 3) reject.mutate({ sessionToken, candidateId, reason: reason.trim() });
          }}
        >
          Refuser
        </Button>
      </div>

      {query.isLoading && <p className="mt-4 text-sm text-slate-500">Chargement de la fiche…</p>}
      {query.error && <p className="mt-4 text-sm font-semibold text-rose-700">{query.error.message}</p>}

      {draft && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Identité diffusée</p>
            <p className="text-base font-bold text-slate-950">
              {formatDisplayName(draft.displayFirstName, draft.displayLastInitial)}
            </p>
            <label className="block text-xs font-semibold text-slate-600">
              Titre de profil
              <Input
                className="mt-1 bg-white"
                value={draft.profileTitle || ""}
                maxLength={160}
                onChange={(event) => setDraft({ ...draft, profileTitle: event.target.value || null })}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Résumé (3–4 lignes)
              <Textarea
                className="mt-1 bg-white"
                rows={4}
                maxLength={700}
                value={draft.summary || ""}
                onChange={(event) => setDraft({ ...draft, summary: event.target.value || null })}
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Compétences (séparées par ·)
              <Input
                className="mt-1 bg-white"
                value={draft.skills.join(" · ")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    skills: event.target.value
                      .split("·")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 12),
                  })
                }
              />
            </label>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <FileText className="h-3.5 w-3.5" /> Pièces structurées automatiquement
            </p>
            {docs.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune pièce dans le dossier pour l’instant.</p>
            ) : (
              <ul className="space-y-1.5" data-testid="synthesis-documents">
                {docs.map((doc) => {
                  const statusLabel =
                    doc.status === "verified"
                      ? "vérifiée"
                      : doc.status === "rejected"
                        ? "refusée"
                        : doc.status === "pending"
                          ? "en contrôle"
                          : "déposée";
                  const sourceLabel =
                    doc.source === "candidate" ? "candidat" : doc.source === "agency" ? "agence" : "admin";
                  return (
                    <li key={`${doc.type}-${doc.source}-${doc.uploadedAt || ""}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-800">{doc.label}</span>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">
                        {statusLabel} · {sourceLabel}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {(query.data?.sheet?.unverified?.length || 0) > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <p className="flex items-center gap-1 font-bold"><AlertTriangle className="h-3.5 w-3.5" /> Éléments non retrouvés dans le CV</p>
                <ul className="mt-1 list-disc pl-4">
                  {(query.data?.sheet?.unverified as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
