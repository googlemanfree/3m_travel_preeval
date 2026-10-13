import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, RefreshCw, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  sessionToken: string;
  /** `candidates.id` — jamais l’id application / dossier agence. */
  candidateId: number;
  destinationHint?: string | null;
  procedureHint?: string | null;
};
type Fields = { headline: string; profileSummary: string; highlights: string; destination: string; procedure: string; sector: string; experience: string; languages: string };

const labels: Record<string, string> = { draft: "Brouillon", approved: "Validée", rejected: "Refusée", needs_revalidation: "À revalider" };
const MAX_HIGHLIGHTS = 5;

const fieldsFromDraft = (draft: Partial<Record<keyof Fields | "highlights", unknown>> & { highlights?: string[] }): Fields => ({
  headline: String(draft.headline ?? ""),
  profileSummary: String(draft.profileSummary ?? ""),
  highlights: (draft.highlights ?? []).join("\n"),
  destination: String(draft.destination ?? ""),
  procedure: String(draft.procedure ?? ""),
  sector: String(draft.sector ?? ""),
  experience: String(draft.experience ?? ""),
  languages: String(draft.languages ?? ""),
});

const highlightLines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

/** Brouillon envoyé au serveur ; l'identité externe et les pièces sont toujours recalculées côté serveur. */
const serialize = (fields: Fields) =>
  JSON.stringify({
    destination: fields.destination.trim(),
    procedure: fields.procedure.trim(),
    sector: fields.sector.trim(),
    experience: fields.experience.trim(),
    languages: fields.languages.trim(),
    profileSummary: fields.profileSummary.trim(),
    ...(fields.headline.trim() ? { headline: fields.headline.trim() } : {}),
    highlights: highlightLines(fields.highlights).slice(0, MAX_HIGHLIGHTS),
  });

export default function AdminCandidateSummaryCard({ sessionToken, candidateId, destinationHint, procedureHint }: Props) {
  const query = trpc.placementPortal.adminGetCandidateSummary.useQuery(
    {
      sessionToken,
      candidateId,
      destinationHint: destinationHint?.trim() || undefined,
      procedureHint: procedureHint?.trim() || undefined,
    },
    { enabled: candidateId > 0, retry: false },
  );
  const [fields, setFields] = useState<Fields | null>(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [cvNotice, setCvNotice] = useState<{ unverified: string[]; missing: string[] } | null>(null);
  const [cvFailure, setCvFailure] = useState<string | null>(null);

  const ensure = trpc.placementPortal.adminEnsureCandidateSummary.useMutation({
    onSuccess: () => { toast.success("Fiche synthèse préparée."); void query.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const review = trpc.placementPortal.adminReviewCandidateSummary.useMutation({
    onSuccess: (result) => { toast.success(result.status === "approved" ? "Fiche validée et PDF généré." : "Fiche refusée avec motif enregistré."); setPreview(null); void query.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const previewMutation = trpc.placementPortal.adminPreviewCandidateSummary.useMutation({
    onSuccess: (result) => setPreview(result.previewPdfDataUrl),
    onError: (error) => toast.error(error.message),
  });
  const fromCv = trpc.placementPortal.adminGenerateSummaryFromCv.useMutation({
    onSuccess: (result) => {
      if (result.ok === false) { setCvFailure(result.error); setCvNotice(null); return; }
      setCvFailure(null);
      setCvNotice({ unverified: result.unverified, missing: result.missing });
      setFields((current) => current && ({
        ...current,
        headline: result.fields.headline ?? current.headline,
        profileSummary: result.fields.profileSummary,
        highlights: (result.fields.highlights ?? []).join("\n"),
        languages: result.fields.languages || current.languages,
      }));
      toast.success("Résumé proposé à partir du CV : relisez-le avant de valider.");
    },
    onError: (error) => { setCvFailure(error.message); setCvNotice(null); },
  });

  useEffect(() => { if (query.data?.draft) { setFields(fieldsFromDraft(query.data.draft as never)); setPreview(null); } }, [query.data?.draft]);

  if (candidateId <= 0) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950" data-testid="admin-candidate-summary-card" role="status">
        <h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Fiche synthèse employeur / agence</h4>
        <p className="mt-2">Aucun compte candidat lié à ce dossier : la fiche synthèse sera disponible dès qu’un compte (e-mail) est associé.</p>
      </section>
    );
  }

  if (query.error) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-950" data-testid="admin-candidate-summary-card" role="alert">
        <h4 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Fiche synthèse employeur / agence</h4>
        <p className="mt-2">{query.error.message || "Impossible de charger la fiche synthèse."}</p>
        <Button
          type="button"
          size="sm"
          className="mt-3 bg-indigo-700 text-white hover:bg-indigo-800"
          disabled={ensure.isPending}
          data-testid="summary-ensure-profile"
          onClick={() => ensure.mutate({
            sessionToken,
            candidateId,
            destinationHint: destinationHint?.trim() || undefined,
            procedureHint: procedureHint?.trim() || undefined,
          })}
        >
          {ensure.isPending ? "Préparation…" : "Préparer la fiche synthèse"}
        </Button>
      </section>
    );
  }

  if (query.isLoading || !query.data || !fields) {
    return <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-indigo-900" data-testid="admin-candidate-summary-card">Chargement de la fiche synthèse…</section>;
  }

  const data = query.data;
  const status = data.status;
  const pdfUrl = (data as { pdfUrl?: string }).pdfUrl;
  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields({ ...fields, [key]: event.target.value });
  const id = (name: string) => `summary-${candidateId}-${name}`;
  const lines = highlightLines(fields.highlights);
  const summaryOk = fields.profileSummary.trim().length >= 10;
  const draftJson = serialize(fields);
  const busy = review.isPending || previewMutation.isPending || fromCv.isPending;
  const portraitMessage = !data.photoShareConsent
    ? "Portrait : non autorisé par le candidat, la fiche part sans photo."
    : data.portraitIncluded
      ? "Portrait : inclus (photo du dossier, accord du candidat)."
      : data.portraitAvailable
        ? "Portrait : une photo existe mais elle est illisible (JPEG ou PNG de 5 Mo au plus attendu)."
        : "Portrait : autorisé par le candidat, mais aucune photo exploitable dans le dossier.";

  return <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm" data-testid="admin-candidate-summary-card">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 className="flex items-center gap-2 font-semibold text-slate-950"><FileText className="h-4 w-4 text-indigo-700" />Fiche synthèse employeur / agence</h4>
        <p className="mt-1 text-sm text-slate-600">Une page avec le portrait (si autorisé), identité externe « prénom + initiale », résumé tiré du CV et contact via 3M uniquement. Relue et validée ici avant toute diffusion.</p>
      </div>
      <Badge className={status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "needs_revalidation" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700"}>{labels[status] || status}</Badge>
    </div>

    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <p><strong>Accord de partage du PDF :</strong> {data.pdfShareConsent ? "Oui" : "Non"}</p>
      <p><strong>Accord photo :</strong> {data.photoShareConsent ? "Oui" : "Non"}</p>
      <p><strong>Soumissions :</strong> {data.submissionCount}</p>
      <p><strong>Profil :</strong> {data.profileCode}</p>
    </div>
    <p className="mt-2 text-xs text-slate-700" data-testid="summary-portrait-status">{portraitMessage}</p>
    {status === "needs_revalidation" && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900" role="status">Le dossier ou l’accord photo a changé depuis la dernière validation : la fiche n’est plus diffusée tant qu’elle n’est pas revalidée.</p>}

    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-2">
      <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">Prévisualisation PDF avant validation</p>
      <iframe title="Prévisualisation de la fiche synthèse PDF" src={preview ?? data.previewPdfDataUrl} className="mt-2 h-96 w-full rounded border bg-slate-50" />
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" className="border-indigo-300 text-indigo-900" disabled={busy} onClick={() => fromCv.mutate({ sessionToken, candidateId })} data-testid="summary-from-cv">
        <Sparkles className="mr-1 h-4 w-4" />{fromCv.isPending ? "Lecture du CV…" : "Proposer le résumé depuis le CV"}
      </Button>
      <span className="text-xs text-slate-600">Nécessite l’accord du candidat à la lecture de son CV par l’IA. Rien n’est enregistré avant votre validation.</span>
    </div>
    {cvFailure && <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900" role="alert">{cvFailure}</p>}
    {cvNotice && (cvNotice.unverified.length > 0 || cvNotice.missing.length > 0) && (
      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" data-testid="summary-cv-warnings">
        {cvNotice.unverified.length > 0 && <><p className="font-bold">Éléments non retrouvés dans le CV : à vérifier ou supprimer</p><ul className="ml-4 list-disc">{cvNotice.unverified.map((item) => <li key={item}>{item}</li>)}</ul></>}
        {cvNotice.missing.length > 0 && <><p className="mt-2 font-bold">Informations absentes du CV</p><ul className="ml-4 list-disc">{cvNotice.missing.map((item) => <li key={item}>{item}</li>)}</ul></>}
      </div>
    )}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label htmlFor={id("headline")} className="text-sm font-semibold text-slate-800">Intitulé du profil</Label><Input id={id("headline")} value={fields.headline} maxLength={160} onChange={set("headline")} className="mt-1 bg-white" placeholder="Ex. Gestionnaire logistique" /></div>
      <div className="sm:col-span-2"><Label htmlFor={id("summary")} className="text-sm font-semibold text-slate-800">Résumé du profil (3 à 4 lignes)</Label><Textarea id={id("summary")} value={fields.profileSummary} maxLength={900} rows={4} onChange={set("profileSummary")} className="mt-1 bg-white" /></div>
      <div className="sm:col-span-2"><Label htmlFor={id("highlights")} className="text-sm font-semibold text-slate-800">Points clés (une ligne chacun, {MAX_HIGHLIGHTS} au plus)</Label><Textarea id={id("highlights")} value={fields.highlights} rows={5} onChange={set("highlights")} className="mt-1 bg-white" />{lines.length > MAX_HIGHLIGHTS && <p className="mt-1 text-xs text-rose-700" role="alert">Seules les {MAX_HIGHLIGHTS} premières lignes seront imprimées.</p>}</div>
      <div><Label htmlFor={id("destination")} className="text-sm font-semibold text-slate-800">Destination</Label><Input id={id("destination")} value={fields.destination} maxLength={200} onChange={set("destination")} className="mt-1 bg-white" /></div>
      <div><Label htmlFor={id("procedure")} className="text-sm font-semibold text-slate-800">Procédure</Label><Input id={id("procedure")} value={fields.procedure} maxLength={200} onChange={set("procedure")} className="mt-1 bg-white" /></div>
      <div><Label htmlFor={id("sector")} className="text-sm font-semibold text-slate-800">Secteur</Label><Input id={id("sector")} value={fields.sector} maxLength={200} onChange={set("sector")} className="mt-1 bg-white" /></div>
      <div><Label htmlFor={id("experience")} className="text-sm font-semibold text-slate-800">Expérience</Label><Input id={id("experience")} value={fields.experience} maxLength={200} onChange={set("experience")} className="mt-1 bg-white" /></div>
      <div className="sm:col-span-2"><Label htmlFor={id("languages")} className="text-sm font-semibold text-slate-800">Langues</Label><Input id={id("languages")} value={fields.languages} maxLength={300} onChange={set("languages")} className="mt-1 bg-white" /></div>
    </div>
    <p className="mt-2 text-xs text-slate-600">Les coordonnées (e-mail, téléphone, numéros de pièces) sont masquées automatiquement. Le nom affiché est toujours « prénom + initiale » ; les pièces et leurs statuts viennent du dossier.</p>

    <div className="mt-3"><Label htmlFor={id("note")} className="text-sm font-semibold text-slate-800">Note de revue</Label><Textarea id={id("note")} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1500} rows={2} className="mt-1 bg-white" placeholder="Motif de correction ou décision admin…" /></div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching || busy}><RefreshCw className="mr-1 h-4 w-4" />Reconstruire les pièces</Button>
      <Button type="button" variant="outline" disabled={busy || !summaryOk} onClick={() => previewMutation.mutate({ sessionToken, candidateId, draft: draftJson })} data-testid="summary-refresh-preview">Mettre à jour l’aperçu</Button>
      <Button type="button" className="bg-emerald-700 hover:bg-emerald-800" disabled={busy || !summaryOk || !data.pdfShareConsent} onClick={() => review.mutate({ sessionToken, profileId: data.profileId, action: "approve", draft: draftJson, note: note.trim() || undefined })} data-testid="summary-approve"><CheckCircle2 className="mr-1 h-4 w-4" />Valider et générer le PDF</Button>
      <Button type="button" variant="outline" className="border-rose-300 text-rose-800 hover:bg-rose-50" disabled={busy || !summaryOk} onClick={() => review.mutate({ sessionToken, profileId: data.profileId, action: "reject", draft: draftJson, note: note.trim() || undefined })}><XCircle className="mr-1 h-4 w-4" />Refuser</Button>
      {pdfUrl && <a href={pdfUrl} download className="inline-flex h-9 items-center rounded-md border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"><Download className="mr-1 h-4 w-4" />Télécharger le PDF validé</a>}
    </div>
    {!data.pdfShareConsent && <p className="mt-2 text-xs text-amber-900" role="status">La validation est bloquée : le candidat n’a pas donné son accord au partage de sa fiche PDF.</p>}
    <p className="mt-3 text-xs leading-5 text-slate-600">Le téléchargement partenaire reste bloqué tant que la fiche n’est pas validée, que l’accord de partage n’est pas actif et qu’une soumission contrôlée n’existe pas.</p>
  </section>;
}
