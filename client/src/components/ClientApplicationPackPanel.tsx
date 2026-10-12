import React, { useState } from "react";
import { Briefcase, CheckCircle2, Circle, Download, FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { downloadCvPdf } from "@/lib/cvPdf";
import { CV_STYLES } from "@shared/cvDraft";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Espace candidat : préparation + téléchargement du pack candidature
 * (CV international publié par l’agence ± lettre de motivation).
 */
export default function ClientApplicationPackPanel({
  destination,
}: {
  destination?: string | null;
}) {
  const query = trpc.candidate.getApplicationPack.useQuery(undefined, { staleTime: 20_000 });
  const [downloading, setDownloading] = useState(false);
  const data = query.data;

  const downloadPack = async () => {
    if (!data?.pack || !data.identity) return;
    setDownloading(true);
    try {
      await downloadCvPdf({
        identity: data.identity,
        draft: data.pack.draft,
        language: data.pack.language,
        includeContact: data.pack.includeContact,
      });
      toast.success("CV international téléchargé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléchargement impossible.");
    } finally {
      setDownloading(false);
    }
  };

  const downloadLetter = () => {
    const letter = data?.pack?.motivationLetter?.trim();
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lettre-motivation-3m-travel.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Lettre de motivation téléchargée.");
  };

  if (query.isLoading) {
    return (
      <Card className="border-indigo-100 p-6" data-testid="client-application-pack">
        <p className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Chargement du pack candidature…</p>
      </Card>
    );
  }

  if (query.isError || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 p-6" data-testid="client-application-pack">
        <p className="text-sm text-amber-950">Le pack candidature n’est pas encore disponible. Déposez vos pièces puis attendez la publication par l’agence.</p>
      </Card>
    );
  }

  const { readiness, pack } = data;
  const styleLabel = pack ? CV_STYLES[pack.style].label : CV_STYLES[readiness.recommendedStyle].label;

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/50 p-6 shadow-sm" data-testid="client-application-pack" aria-labelledby="application-pack-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Candidature internationale</p>
          <h3 id="application-pack-title" className="mt-1 flex items-center gap-2 text-xl font-black text-slate-950">
            <Briefcase className="h-5 w-5 text-indigo-700" aria-hidden="true" /> Pack pour postuler
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            Préparez un dossier solide avec vos documents fournis. L’agence publie ici votre CV international relu
            {destination ? <> pour <strong>{destination}</strong></> : null}
            {" "}(format recommandé : {styleLabel}).
          </p>
        </div>
        <div className="rounded-2xl bg-indigo-900 px-4 py-3 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">Préparation</p>
          <p className="text-3xl font-black tabular-nums">{readiness.score}%</p>
        </div>
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {readiness.checks.map((check) => {
          const Icon = check.done ? CheckCircle2 : Circle;
          return (
            <li key={check.key} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${check.done ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${check.done ? "text-emerald-700" : "text-slate-400"}`} aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">{check.label}</p>
                <p className="mt-0.5 text-xs text-slate-600">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {pack ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Sparkles className="h-4 w-4" aria-hidden="true" /> Pack publié par l’agence</p>
          <p className="mt-1 text-xs text-slate-600">
            Format {CV_STYLES[pack.style].label} · {pack.language.toUpperCase()}
            {pack.targetRole ? ` · Poste visé : ${pack.targetRole}` : ""}
            {" · "}publié le {new Date(pack.releasedAt).toLocaleDateString("fr-FR")}
          </p>
          {pack.draft.headline && <p className="mt-2 text-sm font-semibold text-slate-900">{pack.draft.headline}</p>}
          {pack.draft.summary && <p className="mt-1 text-sm leading-6 text-slate-700">{pack.draft.summary}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" className="gap-2 bg-indigo-800 text-white hover:bg-indigo-900" disabled={downloading} onClick={() => void downloadPack()}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Télécharger mon CV
            </Button>
            {pack.motivationLetter?.trim() ? (
              <Button type="button" variant="outline" className="gap-2" onClick={downloadLetter}>
                <FileText className="h-4 w-4" /> Lettre de motivation
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-indigo-200 bg-white/70 p-4 text-sm text-slate-700">
          Votre CV international n’est pas encore publié. Continuez à déposer les pièces manquantes : l’agence les utilisera pour préparer un CV prêt à postuler.
        </div>
      )}
    </Card>
  );
}
