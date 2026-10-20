import { useState } from "react";
import { FileLock2, ScrollText, ShieldCheck, Server } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyNotice } from "@/components/PrivacyNotice";

type Tab = "journal" | "processors" | "documents";
type Processor = inferRouterOutputs<AppRouter>["privacyCenter"]["adminProcessors"][number];

const STATUS_LABEL: Record<string, string> = { unreviewed: "Non examiné", reviewed: "Examiné", refused: "Refusé" };

function ProcessorRow({ processor, sessionToken, onSaved }: { processor: Processor; sessionToken: string; onSaved: () => void }) {
  const [country, setCountry] = useState(processor.hostingCountry ?? "");
  const [basis, setBasis] = useState(processor.contractBasis ?? "");
  const [status, setStatus] = useState(processor.safeguardsStatus);
  const [enabled, setEnabled] = useState(processor.integrationEnabled);
  const [notes, setNotes] = useState(processor.notes ?? "");
  const update = trpc.privacyCenter.adminProcessorUpdate.useMutation({
    onSuccess: () => { toast.success("Prestataire enregistré"); onSaved(); },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });
  return (
    <li className="rounded-xl border border-slate-200 p-3" data-testid="processor-row">
      <p className="font-bold text-slate-950">{processor.name}</p>
      <p className="text-xs text-slate-600">{processor.purpose} · Données : {processor.dataCategories}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-4">
        <label className="text-xs font-semibold">Pays d’hébergement<Input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={120} className="mt-1" /></label>
        <label className="text-xs font-semibold">Base contractuelle<Input value={basis} onChange={(event) => setBasis(event.target.value)} maxLength={255} className="mt-1" /></label>
        <label className="text-xs font-semibold">Examen des garanties
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">{Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-xs font-semibold"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />Intégration / transfert activé</label>
      </div>
      <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} aria-label={`Notes sur ${processor.name}`} className="mt-2 min-h-14" />
      <Button type="button" size="sm" className="mt-2" disabled={update.isPending} onClick={() => update.mutate({ sessionToken, id: processor.id, hostingCountry: country, contractBasis: basis, safeguardsStatus: status, integrationEnabled: enabled, notes })}>Enregistrer</Button>
    </li>
  );
}

function DocumentsTab({ sessionToken }: { sessionToken: string }) {
  const [candidateId, setCandidateId] = useState("");
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [issued, setIssued] = useState<{ url: string; expiresAt: string | Date; expiryFromProvider: boolean } | null>(null);
  const files = trpc.privacyCenter.adminCandidateFiles.useQuery({ sessionToken, candidateId: loadedId ?? 1 }, { enabled: loadedId !== null, retry: false });
  const history = trpc.privacyCenter.adminTransmissions.useQuery({ sessionToken, candidateId: loadedId ?? undefined }, { retry: false });
  const issue = trpc.privacyCenter.adminIssueDocumentLink.useMutation({
    onSuccess: (result) => { setIssued({ url: String(result.url), expiresAt: String(result.expiresAt), expiryFromProvider: Boolean(result.expiryFromProvider) }); toast.success("Lien temporaire généré et enregistré"); void history.refetch(); },
    onError: (error) => toast.error("Transmission refusée", { description: error.message }),
  });
  return (
    <div className="space-y-4">
      <PrivacyNotice notice="document_transmission" />
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setIssued(null); setLoadedId(Number(candidateId) || null); }}>
        <label className="text-sm font-semibold">Numéro du candidat<Input value={candidateId} onChange={(event) => setCandidateId(event.target.value)} inputMode="numeric" className="mt-1 w-40" /></label>
        <Button type="submit" variant="outline">Lister les pièces</Button>
      </form>
      {files.error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{files.error.message}</p>}
      {files.data && (
        <div className="rounded-xl border border-slate-200 p-3">
          <p className="font-bold">{files.data.candidateName ?? "Candidat"} — {files.data.files.length} pièce(s)</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <label className="text-xs font-semibold">Motif précis de la transmission (obligatoire)<Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} maxLength={500} className="mt-1 min-h-16" placeholder="Démarche, autorité ou organisation concernée, pièce strictement nécessaire…" /></label>
            <label className="text-xs font-semibold">Destinataire (obligatoire)<Input value={recipient} onChange={(event) => setRecipient(event.target.value)} maxLength={255} className="mt-1" placeholder="Nom de l’organisation ou de la personne" /></label>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {files.data.files.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 p-2"><span>{file.fileType} — {file.fileName} <span className="text-xs text-slate-500">({file.status})</span></span>
                <Button type="button" size="sm" variant="outline" disabled={issue.isPending || purpose.trim().length < 10 || recipient.trim().length < 3} onClick={() => issue.mutate({ sessionToken, fileId: file.id, purpose, recipient })}>Générer un lien temporaire</Button></li>
            ))}
          </ul>
          {issued && <p className="mt-3 break-all rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs" role="status" data-testid="issued-link">Lien : {issued.url}<br />Valable jusqu’à environ {new Date(issued.expiresAt).toLocaleString("fr-FR")} {issued.expiryFromProvider ? "(durée indiquée par le stockage)" : "(délai cible : la durée effective dépend du service de stockage)"}. Ne le partagez qu’avec le destinataire déclaré.</p>}
        </div>
      )}
      <div><p className="font-bold">Transmissions enregistrées</p>
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">
          {(history.data ?? []).map((item) => <li key={item.id} className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("fr-FR")} · {item.issuedByLabel}</span><br />{item.fileLabel} → {item.recipient} — {item.purpose}</li>)}
          {(history.data ?? []).length === 0 && <li className="text-slate-500">Aucune transmission.</li>}
        </ul></div>
    </div>
  );
}

/** Centre de confidentialité (administration) : journal d'accès, registre des prestataires, transmissions encadrées de pièces. */
export function AdminPrivacyCenter({ sessionToken }: { sessionToken: string }) {
  const [tab, setTab] = useState<Tab>("journal");
  const [prefix, setPrefix] = useState("");
  const events = trpc.privacyCenter.adminAuditEvents.useQuery({ sessionToken, actionPrefix: prefix || undefined, limit: 100 }, { enabled: tab === "journal", retry: false });
  const processors = trpc.privacyCenter.adminProcessors.useQuery({ sessionToken }, { enabled: tab === "processors", retry: false });
  const tabs: Array<[Tab, string, typeof ScrollText]> = [["journal", "Journal d’accès", ScrollText], ["processors", "Prestataires et pays", Server], ["documents", "Transmissions de pièces", FileLock2]];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-privacy-title" data-testid="admin-privacy-center">
      <h2 id="admin-privacy-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />Confidentialité — journal, prestataires, pièces privées</h2>
      <p className="mt-1 text-sm text-slate-600">Aucune mention de conformité n’est affichée sans validation juridique. Ce centre sert à prouver qui a consulté ou transmis quoi, et à n’activer aucune intégration sans examen.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist">{tabs.map(([id, label, Icon]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${tab === id ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-slate-200 text-slate-700"}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</button>)}</div>
      <div className="mt-4">
        {tab === "journal" && (
          <div>
            <label className="text-sm font-semibold">Type d’événement
              <select value={prefix} onChange={(event) => setPrefix(event.target.value)} className="ml-2 h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"><option value="">Tous</option><option value="cvtheque.">CVthèque</option><option value="documents.">Pièces privées</option><option value="processor.">Prestataires</option></select>
            </label>
            {events.error && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{events.error.message}</p>}
            <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-sm" data-testid="audit-events">
              {(events.data ?? []).map((event) => <li key={event.id} className="rounded bg-slate-50 p-2"><span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString("fr-FR")} · {event.actorType} {event.actorLabel ?? `#${event.actorId ?? "?"}`}{event.outcome !== "success" ? ` · ${event.outcome}` : ""}</span><br /><strong>{event.action}</strong>{event.resourceType ? ` — ${event.resourceType} ${event.resourceId ?? ""}` : ""}{event.details ? ` · ${event.details}` : ""}</li>)}
              {!events.isLoading && (events.data ?? []).length === 0 && <li className="text-slate-500">Aucun événement.</li>}
            </ul>
          </div>
        )}
        {tab === "processors" && (
          <div>
            {processors.error && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{processors.error.message}</p>}
            <p className="mb-2 text-sm text-slate-600">Une intégration ou un transfert ne peut être activé qu’après examen des garanties et indication du pays d’hébergement.</p>
            <ul className="space-y-3">{(processors.data ?? []).map((processor) => <ProcessorRow key={`${processor.id}-${processor.updatedAt}`} processor={processor} sessionToken={sessionToken} onSaved={() => void processors.refetch()} />)}</ul>
          </div>
        )}
        {tab === "documents" && <DocumentsTab sessionToken={sessionToken} />}
      </div>
    </section>
  );
}
