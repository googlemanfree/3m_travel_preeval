import { useMemo, useState } from "react";
import { Eye, EyeOff, PencilLine, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { DOMAINS, OVERRIDE_SECTIONS, PROJECT_KINDS, programsFor, type OverridePayload, type ProjectKind } from "@shared/dynamicForm";
import { getCountryEvaluationProfile } from "@shared/countryEvaluationProfile";
import { CountrySelect } from "@/components/CountryPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const KIND_LABELS: Record<ProjectKind, string> = { travail: "Travail", etudes: "Études", tourisme: "Séjour temporaire", evisa: "e-Visa", immigration: "Installation" };
const SECTION_LABELS: Record<string, string> = { education: "Études et diplômes", experience: "Expérience", languages: "Langues", program: "Visa ou programme", domain: "Domaine", country: "Pays" };
const selectClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm";

const slug = (value: string, max = 40) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, max);

type FieldRow = { key: string; label: string; baseLabel: string; kind: string; required: boolean; hidden: boolean; custom: boolean };

/**
 * Éditeur des questions du formulaire d'évaluation : l'administrateur masque, renomme, rend obligatoire ou facultative, ou ajoute
 * une question pour un type de projet, un visa ou programme, un domaine ou un pays — sans code. Chaque changement est journalisé.
 */
export function AdminEvaluationFormEditor({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [kind, setKind] = useState<ProjectKind>("etudes");
  const [programId, setProgramId] = useState("");
  const [domainId, setDomainId] = useState("");
  const [country, setCountry] = useState("");
  const [renaming, setRenaming] = useState<{ key: string; value: string } | null>(null);
  const [draft, setDraft] = useState({ label: "", kind: "text" as "text" | "textarea" | "select" | "date", options: "", required: false, section: "program" as (typeof OVERRIDE_SECTIONS)[number], help: "" });

  const countryCode = country ? getCountryEvaluationProfile(country)?.code ?? "" : "";
  const scope = { projectKind: kind, programId: programId || null, domainId: domainId || null, countryCode: countryCode || null };
  const scopeLabel = [KIND_LABELS[kind], programsFor(kind).find((program) => program.id === programId)?.label, DOMAINS.find((domain) => domain.id === domainId)?.label, country].filter(Boolean).join(" · ");

  const preview = trpc.evaluationForms.adminPreview.useQuery({ sessionToken, projectType: kind, country: country || undefined, programId: programId || undefined, domainId: domainId || undefined }, { enabled: Boolean(sessionToken), retry: false });
  const list = trpc.evaluationForms.adminList.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => { void preview.refetch(); void list.refetch(); void utils.evaluationForms.activeOverrides.invalidate(); };
  const save = trpc.evaluationForms.adminSave.useMutation({ onSuccess: () => { toast.success("Règle enregistrée"); refresh(); }, onError: (error) => toast.error("Règle refusée", { description: error.message }) });
  const setActive = trpc.evaluationForms.adminSetActive.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const remove = trpc.evaluationForms.adminDelete.useMutation({ onSuccess: () => { toast.success("Règle supprimée"); refresh(); }, onError: (error) => toast.error(error.message) });

  const overrides = list.data ?? [];
  const sameScope = (override: (typeof overrides)[number]) => (override.projectKind ?? null) === scope.projectKind && (override.programId ?? null) === scope.programId && (override.domainId ?? null) === scope.domainId && (override.countryCode ?? null) === scope.countryCode;
  const rule = (fieldKey: string, action: string) => overrides.find((override) => override.fieldKey === fieldKey && override.action === action && sameScope(override));
  const send = (fieldKey: string, action: "hide" | "relabel" | "require" | "optional" | "add", payload?: OverridePayload) => save.mutate({ sessionToken, fieldKey, action, ...scope, payload });

  const addQuestion = () => {
    const labels = draft.options.split("\n").map((line) => line.trim()).filter(Boolean);
    const options = labels.map((label, index) => ({ value: slug(label) || `choix_${index + 1}`, label }));
    save.mutate({ sessionToken, fieldKey: `custom_${slug(draft.label, 36)}_${Date.now().toString(36).slice(-4)}`, action: "add", ...scope, payload: { label: draft.label.trim(), kind: draft.kind, ...(draft.kind === "select" ? { options } : {}), required: draft.required, section: draft.section, ...(draft.help.trim() ? { help: draft.help.trim() } : {}) } }, { onSuccess: () => setDraft({ label: "", kind: "text", options: "", required: false, section: "program", help: "" }) });
  };

  const sections = useMemo(() => preview.data?.sections ?? [], [preview.data]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-form-editor-title" data-testid="admin-evaluation-form-editor">
      <h2 id="admin-form-editor-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><SlidersHorizontal className="h-5 w-5 text-sky-700" aria-hidden="true" />Questions du formulaire d’évaluation</h2>
      <p className="mt-1 text-sm text-slate-600">Choisissez un contexte, puis masquez, renommez, rendez obligatoire ou ajoutez une question. La règle s’applique au contexte choisi (les champs laissés vides valent « tous »). Aucune question ne doit promettre un visa, une admission ou un emploi.</p>
      {(preview.error || list.error) && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{(preview.error ?? list.error)?.message}</p>}

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm font-semibold text-slate-800">Type de projet<select className={selectClass} value={kind} onChange={(event) => { setKind(event.target.value as ProjectKind); setProgramId(""); }}>{PROJECT_KINDS.map((value) => <option key={value} value={value}>{KIND_LABELS[value]}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-800">Visa ou programme<select className={selectClass} value={programId} onChange={(event) => setProgramId(event.target.value)}><option value="">Tous</option>{programsFor(kind).map((program) => <option key={program.id} value={program.id}>{program.label}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-800">Domaine<select className={selectClass} value={domainId} onChange={(event) => setDomainId(event.target.value)}><option value="">Tous</option>{DOMAINS.map((domain) => <option key={domain.id} value={domain.id}>{domain.label}</option>)}</select></label>
        <div className="text-sm font-semibold text-slate-800"><span>Pays</span><div className="mt-1"><CountrySelect id="form-editor-country" ariaLabel="Pays de la règle" placeholder="Tous les pays" value={country} onChange={setCountry} /></div>{country && <button type="button" className="mt-1 text-xs font-bold text-sky-800 underline" onClick={() => setCountry("")}>Tous les pays</button>}</div>
      </div>
      <p className="mt-2 text-xs text-slate-600" data-testid="editor-scope">Contexte des règles : <strong>{scopeLabel || "Tous les parcours"}</strong></p>

      <div className="mt-4 space-y-4" data-testid="editor-fields">
        {preview.isLoading && <p className="text-sm text-slate-600">Chargement…</p>}
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-slate-200 p-3">
            <h3 className="text-sm font-black text-slate-900">{section.title}</h3>
            <ul className="mt-2 divide-y divide-slate-100">
              {section.fields.map((field: FieldRow) => (
                <li key={field.key} className="flex flex-wrap items-center gap-2 py-2 text-sm" data-field-row={field.key}>
                  <div className="min-w-0 flex-1">
                    {renaming?.key === field.key
                      ? <div className="flex gap-2"><Input value={renaming.value} onChange={(event) => setRenaming({ key: field.key, value: event.target.value })} maxLength={200} aria-label={`Nouveau libellé de ${field.baseLabel}`} /><Button type="button" size="sm" onClick={() => { send(field.key, "relabel", { label: renaming.value }); setRenaming(null); }}>Enregistrer</Button><Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(null)}>Annuler</Button></div>
                      : <><span className={field.hidden ? "text-slate-400 line-through" : "font-semibold text-slate-900"}>{field.label}</span> <span className="text-xs text-slate-400">({field.key})</span>{field.label !== field.baseLabel && <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-900">renommée</span>}{field.required && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">obligatoire</span>}{field.hidden && <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">masquée</span>}{field.custom && <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">ajoutée</span>}</>}
                  </div>
                  {renaming?.key !== field.key && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.hidden
                        ? <Button type="button" size="sm" variant="outline" disabled={!rule(field.key, "hide") || save.isPending} title={rule(field.key, "hide") ? "Réafficher" : "Masquée par une règle d’un autre contexte : modifiez-la dans la liste ci-dessous"} onClick={() => { const found = rule(field.key, "hide"); if (found?.id) remove.mutate({ sessionToken, id: found.id }); }}><Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Afficher</Button>
                        : <Button type="button" size="sm" variant="outline" disabled={save.isPending} onClick={() => send(field.key, "hide")}><EyeOff className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Masquer</Button>}
                      {!field.hidden && !field.custom && <Button type="button" size="sm" variant="outline" onClick={() => setRenaming({ key: field.key, value: field.label })}><PencilLine className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Renommer</Button>}
                      {!field.hidden && !field.custom && <Button type="button" size="sm" variant="outline" disabled={save.isPending} onClick={() => send(field.key, field.required ? "optional" : "require")}>{field.required ? "Rendre facultative" : "Rendre obligatoire"}</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form className="mt-5 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); addQuestion(); }} aria-label="Ajouter une question" data-testid="editor-add-form">
        <h3 className="flex items-center gap-2 text-sm font-black text-emerald-950 md:col-span-2"><Plus className="h-4 w-4" aria-hidden="true" />Ajouter une question à ce contexte</h3>
        <label className="text-sm font-semibold text-slate-800 md:col-span-2">Libellé de la question *<Input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} maxLength={200} className="mt-1" placeholder="Ex. : Avez-vous déjà travaillé dans une clinique ?" /></label>
        <label className="text-sm font-semibold text-slate-800">Type de réponse<select className={selectClass} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as typeof draft.kind })}><option value="text">Texte court</option><option value="textarea">Texte long</option><option value="select">Liste de choix</option><option value="date">Date</option></select></label>
        <label className="text-sm font-semibold text-slate-800">Section<select className={selectClass} value={draft.section} onChange={(event) => setDraft({ ...draft, section: event.target.value as typeof draft.section })}>{OVERRIDE_SECTIONS.map((value) => <option key={value} value={value}>{SECTION_LABELS[value]}</option>)}</select></label>
        {draft.kind === "select" && <label className="text-sm font-semibold text-slate-800 md:col-span-2">Choix proposés (un par ligne, 2 à 12)<Textarea value={draft.options} onChange={(event) => setDraft({ ...draft, options: event.target.value })} className="mt-1 min-h-20 bg-white" /></label>}
        <label className="text-sm font-semibold text-slate-800 md:col-span-2">Aide affichée sous la question (facultatif)<Input value={draft.help} onChange={(event) => setDraft({ ...draft, help: event.target.value })} maxLength={400} className="mt-1" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.required} onChange={(event) => setDraft({ ...draft, required: event.target.checked })} />Réponse obligatoire</label>
        <div className="md:text-right"><Button type="submit" className="bg-emerald-700 text-white hover:bg-emerald-800" disabled={save.isPending || draft.label.trim().length < 3}>Ajouter la question</Button></div>
      </form>

      <div className="mt-5">
        <h3 className="text-sm font-black text-slate-900">Règles enregistrées ({overrides.length})</h3>
        <ul className="mt-2 space-y-1.5" data-testid="editor-rules">
          {overrides.map((override) => (
            <li key={override.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm">
              <span className={override.active ? "font-semibold text-slate-900" : "text-slate-400 line-through"}>{override.action === "add" ? "Ajout" : override.action === "hide" ? "Masquer" : override.action === "relabel" ? "Renommer" : override.action === "require" ? "Rendre obligatoire" : "Rendre facultative"} · {(override.payload as OverridePayload | null | undefined)?.label ?? override.fieldKey}</span>
              <span className="text-xs text-slate-500">{[override.projectKind && KIND_LABELS[override.projectKind as ProjectKind], override.programId && programsFor((override.projectKind ?? kind) as ProjectKind).find((program) => program.id === override.programId)?.label, override.domainId && DOMAINS.find((domain) => domain.id === override.domainId)?.label, override.countryCode].filter(Boolean).join(" · ") || "Tous les parcours"}</span>
              <span className="ml-auto flex gap-1.5">
                <Button type="button" size="sm" variant="outline" onClick={() => override.id && setActive.mutate({ sessionToken, id: override.id, active: !override.active })}>{override.active ? "Désactiver" : "Activer"}</Button>
                <Button type="button" size="sm" variant="outline" className="border-rose-300 text-rose-900" aria-label="Supprimer la règle" onClick={() => override.id && remove.mutate({ sessionToken, id: override.id })}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>
              </span>
            </li>
          ))}
          {!list.isLoading && overrides.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">Aucune règle : le formulaire est celui du moteur.</li>}
        </ul>
      </div>
    </section>
  );
}
