import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { getAdminSessionToken } from "@/lib/adminSession";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FILTERS = [
  { id: "a_mettre_a_jour", label: "À mettre à jour" },
  { id: "manquant", label: "Pièces manquantes" },
  { id: "doublon", label: "Doublons" },
  { id: "non_controle", label: "Non contrôlés" },
  { id: "tous", label: "Tous" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];
const STATUS: Record<string, string> = { a_fournir: "À fournir", recu: "Reçu", lisible: "Lisible", a_mettre_a_jour: "À mettre à jour", verifie: "Vérifié par l'agence" };
const TONE: Record<string, string> = { a_fournir: "bg-slate-100 text-slate-800", recu: "bg-blue-100 text-blue-900", lisible: "bg-emerald-100 text-emerald-900", a_mettre_a_jour: "bg-amber-100 text-amber-900", verifie: "bg-emerald-200 text-emerald-950" };
const READ: Record<string, string> = { lisible: "lisible", texte_absent: "texte absent", invalide: "illisible" };

export default function AdminDocuments() {
  const sessionToken = getAdminSessionToken();
  const [, setLocation] = useLocation();
  const enabled = Boolean(sessionToken);
  if (!sessionToken) setTimeout(() => setLocation("/admin/login"), 0);
  const [filter, setFilter] = useState<FilterId>("a_mettre_a_jour");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const list = trpc.adminDocuments.overview.useQuery({ sessionToken, filter, search: search || undefined }, { enabled, retry: false });
  const detail = trpc.adminDocuments.detail.useQuery({ sessionToken, evaluationId: openId ?? 1 }, { enabled: enabled && openId !== null, retry: false });
  const refresh = () => { void utils.adminDocuments.overview.invalidate(); void utils.adminDocuments.detail.invalidate(); };
  const onError = (error: { message: string }) => toast.error(error.message);
  const backfill = trpc.adminDocuments.backfill.useMutation({ onSuccess: (r) => { toast.success(`${r.inspected} document(s) contrôlé(s), ${r.unreachable} inaccessible(s), ${r.remaining} restant(s).`); refresh(); }, onError });
  const inspectNow = trpc.adminDocuments.inspectNow.useMutation({ onSuccess: () => { toast.success("Document contrôlé."); refresh(); }, onError });
  const verify = trpc.adminDocuments.setVerification.useMutation({ onSuccess: () => { toast.success("Statut enregistré."); refresh(); }, onError });
  const expiry = trpc.adminDocuments.setExpiry.useMutation({ onSuccess: () => { toast.success("Date de validité enregistrée."); refresh(); }, onError });
  const counts = list.data?.counts as Record<string, number> | undefined;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6" aria-labelledby="documents-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="documents-title" className="text-2xl font-black text-slate-950">Documents des dossiers</h1>
          <p className="mt-1 text-sm text-slate-600">Pièces attendues par projet, lisibilité, doublons, dates de validité et vérification par l'agence. « Lisible » ne veut pas dire « authentique » : seule votre vérification le marque.</p>
        </div>
        <Button variant="outline" onClick={() => backfill.mutate({ sessionToken, limit: 40 })} disabled={backfill.isPending}><FileSearch className="mr-2 h-4 w-4" />Contrôler les documents déjà reçus</Button>
      </header>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrer par problème">
        {FILTERS.map((entry) => (
          <Button key={entry.id} role="tab" aria-selected={filter === entry.id} size="sm" variant={filter === entry.id ? "default" : "outline"} onClick={() => { setFilter(entry.id); setOpenId(null); }}>
            {entry.label}{counts && typeof counts[entry.id] === "number" ? ` (${counts[entry.id]})` : ""}
          </Button>
        ))}
        <Input aria-label="Rechercher un candidat" className="ml-auto w-full sm:w-64" placeholder="Nom, e-mail, dossier" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={120} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-label="Dossiers" className="space-y-2">
          {list.isLoading && <p className="text-sm text-slate-500">Chargement…</p>}
          {list.error && <Card className="p-4 text-sm text-red-800" role="alert">{list.error.message}</Card>}
          {list.data && list.data.rows.length === 0 && <Card className="p-4 text-sm text-slate-600">Aucun dossier dans ce filtre.</Card>}
          {list.data?.rows.map((row) => (
            <Card key={row.evaluationId} className={`cursor-pointer p-3 ${openId === row.evaluationId ? "border-2 border-[#0B2A52]" : ""}`} onClick={() => setOpenId(row.evaluationId)}>
              <p className="font-semibold text-slate-950">{row.fullName}</p>
              <p className="text-xs text-slate-500">{row.referenceCode ?? `Évaluation ${row.evaluationId}`} · {row.projectKind}</p>
              <p className="mt-1 text-xs text-slate-700">{row.summary.missing} manquante(s) · {row.summary.toUpdate} à mettre à jour{row.summary.duplicates ? ` · ${row.summary.duplicates} doublon(s)` : ""}{row.uncontrolled ? ` · ${row.uncontrolled} non contrôlé(s)` : ""}</p>
              {row.problems.slice(0, 2).map((problem, index) => <p key={index} className="mt-1 text-xs text-amber-900">{problem}</p>)}
            </Card>
          ))}
        </section>

        <section aria-label="Détail des documents" className="space-y-3">
          {openId === null && <Card className="p-4 text-sm text-slate-600">Sélectionnez un dossier pour voir ses pièces.</Card>}
          {detail.data && openId !== null && (
            <>
              <Card className="p-4">
                <h2 className="font-bold text-slate-950">Pièces attendues ({detail.data.projectKind})</h2>
                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                  {detail.data.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-2 py-2">
                      <span><strong>{item.label}</strong>{item.required ? "" : " (facultatif)"}{item.reason && <span className="block text-xs text-amber-900">{item.reason}</span>}</span>
                      <Badge className={TONE[item.status]}>{STATUS[item.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-4">
                <h2 className="font-bold text-slate-950">Documents reçus</h2>
                {detail.data.documents.length === 0 && <p className="mt-2 text-sm text-slate-600">Aucun document reçu.</p>}
                <ul className="mt-2 space-y-3">
                  {detail.data.documents.map((doc) => (
                    <li key={`${doc.source}-${doc.id}`} className="rounded-md border border-slate-200 p-3 text-xs">
                      <p className="text-sm font-semibold">{doc.name} <span className="font-normal text-slate-500">({doc.documentType})</span></p>
                      <p className="mt-1 text-slate-600">
                        {doc.intake ? `${READ[doc.intake.status]}${doc.pages ? ` · ${doc.pages} page(s)` : ""}${doc.sizeBytes ? ` · ${Math.round(doc.sizeBytes / 1024)} Ko` : ""}${doc.intake.duplicateOf ? " · doublon" : ""}${doc.intake.verification === "verifie" ? " · vérifié par l'agence" : ""}` : "Non contrôlé"}
                        {doc.intake?.expiresOn ? ` · valable jusqu'au ${doc.intake.expiresOn}` : ""}
                      </p>
                      {doc.issues.length > 0 && <p className="mt-1 text-amber-900">{doc.issues.join(" ; ")}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {!doc.intakeId && <Button size="sm" variant="outline" onClick={() => inspectNow.mutate({ sessionToken, source: doc.source, refId: doc.source === "evaluation_cv" ? openId : doc.id })}>Contrôler maintenant</Button>}
                        {doc.intakeId && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => verify.mutate({ sessionToken, intakeId: doc.intakeId!, verification: doc.intake?.verification === "verifie" ? "non_verifie" : "verifie" })}>{doc.intake?.verification === "verifie" ? "Retirer la vérification" : "Marquer vérifié"}</Button>
                            <Button size="sm" variant="outline" onClick={() => { const note = window.prompt("Motif du remplacement demandé au candidat (5 caractères minimum) :"); if (note) verify.mutate({ sessionToken, intakeId: doc.intakeId!, verification: "a_remplacer", note }); }}>Demander un remplacement</Button>
                            <Button size="sm" variant="outline" onClick={() => { const value = window.prompt("Date de validité (AAAA-MM-JJ), vide pour effacer :", doc.intake?.expiresOn ?? ""); if (value !== null) expiry.mutate({ sessionToken, intakeId: doc.intakeId!, expiresOn: value.trim() || null }); }}>Date de validité</Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
