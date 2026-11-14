import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, ClipboardCopy, Download, Eye, FilePen, History, Save, Send, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import EvaluationReportView from "@/components/EvaluationReportView";

type Tab = "apercu" | "modifier" | "texte" | "historique";
type EditSection = { id: string; title: string; paragraphs: string[]; bullets: string[]; locked?: boolean; table?: Array<[string, string]> };

const STATUS: Record<string, string> = { brouillon: "Brouillon (invisible du candidat)", publiee: "Publiée", remplacee: "Remplacée" };

/** Copie : texte simple (toujours) et mise en forme (si le navigateur l'autorise). Sans boutons ni éléments d'interface, sans coupure artificielle. */
async function copyBilan(plain: string, html?: string) {
  try {
    if (html && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": new Blob([plain], { type: "text/plain" }), "text/html": new Blob([html], { type: "text/html" }) })]);
    } else await navigator.clipboard.writeText(plain);
    toast.success(html ? "Bilan copié avec sa mise en forme." : "Bilan copié en texte simple.");
  } catch {
    const area = document.createElement("textarea");
    area.value = plain; area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) toast.success("Bilan copié en texte simple."); else toast.error("Copie impossible : sélectionnez le texte et copiez-le à la main.");
  }
}

function downloadBase64(fileName: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url; link.download = fileName; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function BilanEditorPanel({ sessionToken, runId, onChanged }: { sessionToken: string; runId: number; onChanged: () => void }) {
  const utils = trpc.useUtils();
  const editor = trpc.adminBilanAuto.editor.useQuery({ sessionToken, runId }, { retry: false });
  const [tab, setTab] = useState<Tab>("apercu");
  const [sections, setSections] = useState<EditSection[]>([]);
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");
  const [dirty, setDirty] = useState(false);
  const [problems, setProblems] = useState<string | null>(null);
  const [compare, setCompare] = useState<{ from: number; to: number } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [subKey, setSubKey] = useState("");
  const [points, setPoints] = useState("");
  const [justification, setJustification] = useState("");

  const data = editor.data;
  useEffect(() => { if (data && !dirty) { setSections(data.sections as EditSection[]); setText(data.editableText); } }, [data, dirty]);
  const refresh = () => { void utils.adminBilanAuto.editor.invalidate(); void utils.adminBilanAuto.preview.invalidate(); void utils.adminBilanAuto.compare.invalidate(); onChanged(); };
  const fail = (error: { message: string }) => { setProblems(error.message); toast.error("Action refusée : lisez le détail sous les boutons."); };
  const saved = () => { setDirty(false); setProblems(null); toast.success("Brouillon enregistré : le candidat ne voit rien tant que vous ne publiez pas."); refresh(); };
  const saveSections = trpc.adminBilanAuto.saveDraft.useMutation({ onSuccess: saved, onError: fail });
  const saveText = trpc.adminBilanAuto.saveDraftText.useMutation({ onSuccess: saved, onError: fail });
  const score = trpc.adminBilanAuto.changeScore.useMutation({ onSuccess: () => { setDirty(false); setProblems(null); setJustification(""); toast.success("Note modifiée : total, verdict et texte recalculés (brouillon)."); refresh(); }, onError: fail });
  const publish = trpc.adminBilanAuto.publishVersion.useMutation({ onSuccess: (r) => { setDirty(false); setProblems(null); toast.success(r.alreadyPublished ? "Cette version était déjà publiée." : r.notified ? "Version publiée et candidat notifié." : "Version publiée sans notification."); refresh(); }, onError: fail });
  const notify = trpc.adminBilanAuto.notifyCandidate.useMutation({ onSuccess: (r) => { toast.success(r.notified ? "Notification mise en file." : r.reason ?? "Rien à notifier."); refresh(); }, onError: fail });
  const pdf = trpc.adminBilanAuto.downloadPdf.useQuery({ sessionToken, runId }, { enabled: false });
  const preview = trpc.adminBilanAuto.preview.useQuery({ sessionToken, runId }, { enabled: previewOpen, retry: false });
  const diff = trpc.adminBilanAuto.compare.useQuery({ sessionToken, runId, fromVersion: compare?.from ?? 1, toVersion: compare?.to }, { enabled: compare !== null, retry: false });

  const subOptions = useMemo(() => (data?.score?.rubrics ?? []).flatMap((rubric: any) => rubric.subCriteria.map((sub: any) => ({ id: `${rubric.key}.${sub.key}`, label: `${rubric.label} · ${sub.label} (max ${sub.max})` }))), [data]);
  if (editor.isLoading) return <p className="text-sm text-slate-500">Chargement de l'éditeur…</p>;
  if (editor.error || !data) return <Card className="p-4 text-sm text-slate-600">{editor.error?.message ?? "Éditeur indisponible."}</Card>;

  const current = data.currentVersion;
  const isDraft = current?.status === "brouillon";
  const canPublish = data.editable && current && current.status === "brouillon";
  const editable = data.editable;
  const doSave = () => {
    if (tab === "texte") saveText.mutate({ sessionToken, runId, text, reason: reason || undefined });
    else saveSections.mutate({ sessionToken, runId, sections: sections.filter((s) => !s.locked).map(({ id, title, paragraphs, bullets }) => ({ id, title, paragraphs, bullets })), reason: reason || undefined });
  };
  const confirmPublish = (notifyNow: boolean) => {
    if (!current) return;
    const message = notifyNow ? "Publier cette version dans l'espace client et notifier le candidat par e-mail ?" : "Publier cette version dans l'espace client SANS notifier le candidat ?";
    if (window.confirm(message)) publish.mutate({ sessionToken, runId, versionNumber: current.versionNumber, notify: notifyNow });
  };
  const setSection = (id: string, patch: Partial<EditSection>) => { setSections((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s))); setDirty(true); };

  return (
    <Card className="space-y-4 p-4" data-testid="bilan-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-950">Bilan — contrôle éditorial de l'agence</h3>
          <p className="text-xs text-slate-600">Version de travail : n° {current?.versionNumber} · <Badge className={isDraft ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}>{STATUS[current?.status ?? "brouillon"]}</Badge> · {current?.authorKind === "admin" ? `corrigée par ${current.author}` : "proposition du système"}</p>
        </div>
        {dirty && <Badge className="bg-red-100 text-red-900" role="status">Modifications non enregistrées</Badge>}
      </div>

      {data.otherRuns.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950" role="alert">
          Un autre traitement existe pour ce dossier (n° {data.otherRuns.map((o) => `${o.id} · ${o.stateLabel}`).join(", ")}). Une correction manuelle n'est jamais écrasée : comparez avant de publier.
          {data.otherRuns.map((other) => <Button key={other.id} size="sm" variant="outline" className="ml-2" onClick={() => { setTab("historique"); setCompare({ from: current?.versionNumber ?? 1, to: undefined }); toast.info(`Comparaison avec le traitement n° ${other.id} : voir l'historique.`); }}>Comparer</Button>)}
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Actions sur le bilan">
        <Button variant="outline" onClick={() => copyBilan(data.plainText)}><ClipboardCopy className="mr-2 h-4 w-4" />Copier tout le bilan</Button>
        <Button variant="ghost" size="sm" onClick={() => copyBilan(data.plainText, data.html)}>Copier avec mise en forme</Button>
        <Button variant="outline" onClick={() => setTab("modifier")} disabled={!editable}><FilePen className="mr-2 h-4 w-4" />Modifier le bilan</Button>
        <Button variant="outline" onClick={doSave} disabled={!editable || !dirty || saveSections.isPending || saveText.isPending}><Save className="mr-2 h-4 w-4" />Enregistrer le brouillon</Button>
        <Button variant="outline" onClick={() => setPreviewOpen((open) => !open)}><Eye className="mr-2 h-4 w-4" />Prévisualiser</Button>
        <Button onClick={() => confirmPublish(false)} disabled={!canPublish || dirty || publish.isPending} title={dirty ? "Enregistrez d'abord le brouillon" : undefined}><Send className="mr-2 h-4 w-4" />Publier sans notification</Button>
        <Button onClick={() => confirmPublish(true)} disabled={!canPublish || dirty || publish.isPending} title={dirty ? "Enregistrez d'abord le brouillon" : undefined}><Bell className="mr-2 h-4 w-4" />Publier et notifier</Button>
        <Button variant="outline" onClick={async () => { const r = await pdf.refetch(); if (r.data) { downloadBase64(r.data.fileName, r.data.base64); if (r.data.draft) toast.info("PDF de brouillon, marqué « non publié »."); } }}><Download className="mr-2 h-4 w-4" />Télécharger le PDF</Button>
        <Button variant="outline" onClick={() => notify.mutate({ sessionToken, runId })} disabled={current?.status !== "publiee" || current?.notified || notify.isPending}><Bell className="mr-2 h-4 w-4" />Notifier le candidat</Button>
        <Button variant="outline" onClick={() => setTab("historique")}><History className="mr-2 h-4 w-4" />Voir l'historique</Button>
      </div>
      {problems && <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900" data-testid="editor-problems">{problems}</div>}

      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {([["apercu", "Aperçu"], ["modifier", "Modifier"], ["texte", "Texte simple"], ["historique", "Historique"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`px-3 py-2 text-sm font-semibold ${tab === id ? "border-b-2 border-[#0B2A52] text-[#0B2A52]" : "text-slate-600"}`}>{label}</button>
        ))}
      </div>

      {tab === "apercu" && (
        <article className="select-text space-y-4 text-sm leading-6 text-slate-800" data-testid="bilan-apercu" style={{ breakInside: "auto" }}>
          <p className="font-semibold">{data.run.fullName} — {(data.sections as EditSection[]).length} sections</p>
          {(data.sections as EditSection[]).map((section) => (
            <section key={section.id} className="space-y-1">
              <h4 className="font-bold text-slate-950">{section.title}{section.locked && <Lock className="ml-2 inline h-3 w-3 text-slate-400" aria-label="Section calculée" />}</h4>
              {section.paragraphs.map((p, index) => <p key={index} className="text-justify">{p}</p>)}
              {section.table && <ul>{section.table.map(([label, value]) => <li key={label}>{label} : {value}</li>)}</ul>}
              {section.bullets.length > 0 && <ul className="list-disc space-y-1 pl-5">{section.bullets.map((b, index) => <li key={index} className="text-justify">{b}</li>)}</ul>}
            </section>
          ))}
        </article>
      )}

      {tab === "modifier" && (
        <div className="space-y-4">
          {!editable && <p className="text-sm text-slate-600">Ce bilan ne peut pas être modifié dans son état actuel.</p>}
          {sections.map((section) => (
            <fieldset key={section.id} className="space-y-2 rounded-md border border-slate-200 p-3" disabled={!editable || section.locked}>
              <legend className="px-1 text-xs font-semibold text-slate-500">{section.locked ? "Section calculée (modifiable par la note ci-dessous)" : `Section ${section.id}`}</legend>
              <Input aria-label={`Titre ${section.id}`} value={section.title} onChange={(e) => setSection(section.id, { title: e.target.value })} maxLength={200} />
              <Textarea aria-label={`Paragraphes ${section.id}`} className="min-h-24" value={section.paragraphs.join("\n\n")} onChange={(e) => setSection(section.id, { paragraphs: e.target.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) })} placeholder="Paragraphes, séparés par une ligne vide" />
              {!section.locked && <Textarea aria-label={`Puces ${section.id}`} className="min-h-20" value={section.bullets.join("\n")} onChange={(e) => setSection(section.id, { bullets: e.target.value.split("\n").map((b) => b.trim()).filter(Boolean) })} placeholder="Une puce par ligne" />}
            </fieldset>
          ))}
          <Input aria-label="Motif de la modification" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de la modification (conservé dans l'historique)" maxLength={300} />
          <form className="space-y-2 rounded-md border border-slate-200 p-3" onSubmit={(event) => { event.preventDefault(); const [rubric, subCriterion] = subKey.split("."); score.mutate({ sessionToken, runId, rubric, subCriterion, points: Number(points), justification }); }}>
            <p className="text-sm font-semibold">Modifier une note (champ contrôlé : total, verdict, texte et PDF recalculés)</p>
            <select aria-label="Sous-critère" className="w-full rounded-md border border-slate-300 p-2 text-sm" value={subKey} onChange={(e) => setSubKey(e.target.value)} required disabled={!editable}>
              <option value="">Choisir un sous-critère</option>
              {subOptions.map((o: any) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <Input aria-label="Points" type="number" min={0} max={20} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Points" required disabled={!editable} />
            <Textarea aria-label="Justification" value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justification obligatoire (10 caractères minimum)" minLength={10} maxLength={600} required disabled={!editable} />
            <Button type="submit" variant="outline" disabled={!editable || score.isPending || dirty} title={dirty ? "Enregistrez d'abord le brouillon" : undefined}>Appliquer la note</Button>
          </form>
        </div>
      )}

      {tab === "texte" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">Un texte ordinaire : « ## Titre » puis des paragraphes et des lignes « - puce ». La section calculée (verdict, note) n'y figure pas.</p>
          <Textarea aria-label="Texte du bilan" className="min-h-96 font-mono text-xs leading-5" value={text} onChange={(e) => { setText(e.target.value); setDirty(true); }} disabled={!editable} />
          <Input aria-label="Motif de la modification" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de la modification" maxLength={300} />
        </div>
      )}

      {tab === "historique" && (
        <div className="space-y-3">
          <ul className="space-y-2" aria-label="Versions du bilan">
            {data.versions.map((version) => (
              <li key={version.versionNumber} className="rounded-md border border-slate-200 p-3 text-xs">
                <p className="text-sm font-semibold">Version {version.versionNumber} · {STATUS[version.status]} {version.notified && <Badge className="ml-1 bg-blue-100 text-blue-900">Candidat notifié</Badge>}</p>
                <p className="text-slate-600">{version.authorKind === "admin" ? `Administrateur : ${version.author}` : "Système"} · {new Date(version.createdAt).toLocaleString("fr-FR")}{version.publishedAt ? ` · publiée le ${new Date(version.publishedAt).toLocaleString("fr-FR")}` : ""}{version.hasPdf ? " · PDF enregistré" : ""}</p>
                {version.reason && <p className="mt-1">Motif : {version.reason}</p>}
                {version.versionNumber > 1 && <Button size="sm" variant="outline" className="mt-2" onClick={() => setCompare({ from: version.baseVersion ?? version.versionNumber - 1, to: version.versionNumber })}>Comparer avec la version précédente</Button>}
              </li>
            ))}
          </ul>
          {compare && diff.data && (
            <div className="rounded-md border border-slate-200 p-3 text-xs" data-testid="bilan-diff">
              <p className="font-semibold">Différences{compare.to ? ` : version ${compare.from} → ${compare.to}` : ""}</p>
              {diff.data.diff.length === 0 && <p>Aucune différence.</p>}
              {diff.data.diff.map((section) => (
                <div key={section.sectionId} className="mt-2"><p className="font-semibold">{section.title}</p>
                  {section.removed.map((line, index) => <p key={`r${index}`} className="text-red-800">− {line}</p>)}
                  {section.added.map((line, index) => <p key={`a${index}`} className="text-emerald-800">+ {line}</p>)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {previewOpen && (
        <div className="rounded-md border-2 border-dashed border-slate-300 p-3" data-testid="bilan-preview">
          <p className="mb-2 text-xs font-semibold text-slate-600">Prévisualisation : ce que verra le candidat une fois la version publiée{isDraft ? " (brouillon : invisible tant que vous ne publiez pas)" : ""}.</p>
          {preview.isLoading && <p className="text-sm text-slate-500">Chargement…</p>}
          {preview.data && <EvaluationReportView report={preview.data.report} />}
        </div>
      )}
    </Card>
  );
}
