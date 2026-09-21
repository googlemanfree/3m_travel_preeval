import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clampScore, linesToList, listToLines, parseOptionalTotal } from "@/lib/evaluationValidationForm";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_LABELS,
  MAX_ALTERNATIVE_COUNTRIES,
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
  ROUTE_KEYS,
  ROUTE_LABELS,
  SCORE_CRITERIA,
  SUGGESTED_STATUSES,
  SUGGESTED_STATUS_LABELS,
  resolveScore,
  type AdminEvaluationVersion,
} from "@shared/evaluationValidation";

const selectClass = "mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 disabled:bg-slate-100";

/** Champ « une ligne par élément » : garde son propre texte pour ne pas perdre les retours à la ligne en cours de saisie. */
function LinesField({ label, hint, value, onChange, rows = 3 }: { label: string; hint?: string; value: string[]; onChange: (next: string[]) => void; rows?: number }) {
  const [text, setText] = useState(listToLines(value));
  useEffect(() => {
    if (JSON.stringify(linesToList(text)) !== JSON.stringify(value)) setText(listToLines(value));
    // la valeur externe ne change que par une réinitialisation (rechargement de la version enregistrée)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="block text-xs font-medium text-slate-700">
      {label}
      {hint && <span className="ml-1 font-normal text-slate-500">— {hint}</span>}
      <Textarea
        value={text}
        rows={rows}
        onChange={(event) => {
          setText(event.target.value);
          onChange(linesToList(event.target.value));
        }}
        className="mt-1 bg-white text-sm"
      />
    </label>
  );
}

function Section({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h4 className="text-sm font-bold text-slate-950">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

type Props = { value: AdminEvaluationVersion; onChange: (next: AdminEvaluationVersion) => void; readOnly: boolean; candidateCountry: string };

export default function EvaluationVersionForm({ value, onChange, readOnly, candidateCountry }: Props) {
  const set = <K extends keyof AdminEvaluationVersion>(key: K, next: AdminEvaluationVersion[K]) => onChange({ ...value, [key]: next });
  const resolution = resolveScore({ scores: value.scores, totalOverride: value.totalOverride, finalStatus: value.finalStatus });
  const countryDiffers = candidateCountry.trim() !== "" && candidateCountry.trim().toLowerCase() !== value.priorityCountry.trim().toLowerCase();

  return (
    <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-90" aria-label="Version administrateur">
      <Section title="Pays prioritaire" description="Le pays choisi par le candidat est toujours le pays prioritaire ; toute modification est tracée.">
        <label className="block text-xs font-medium text-slate-700">
          Pays prioritaire
          <Input value={value.priorityCountry} onChange={(event) => set("priorityCountry", event.target.value)} maxLength={100} className="mt-1 bg-white" />
        </label>
        {countryDiffers && <p className="text-xs font-semibold text-amber-800">Le candidat a choisi : {candidateCountry}. Confirmez ce changement dans la checklist avant de publier.</p>}
      </Section>

      <Section title="Score sur 100" description="Le total est recalculé après chaque modification des notes. Un score global ou un statut fixés à la main ne sont jamais remplacés automatiquement.">
        <div className="grid gap-3 sm:grid-cols-2">
          {SCORE_CRITERIA.map((criterion) => (
            <label key={criterion.key} className="block text-xs font-medium text-slate-700">
              {criterion.label} <span className="font-normal text-slate-500">(0 à {criterion.max})</span>
              <Input
                type="number"
                min={0}
                max={criterion.max}
                step={1}
                inputMode="numeric"
                value={value.scores[criterion.key]}
                onChange={(event) => set("scores", { ...value.scores, [criterion.key]: clampScore(event.target.value, criterion.max) })}
                className="mt-1 bg-white"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 p-3 text-sm" role="status" aria-live="polite">
          <span>
            Total calculé : <strong data-testid="computed-total">{resolution.computedTotal}</strong>/100
          </span>
          <Badge className="bg-slate-200 text-slate-900">Statut suggéré : {SUGGESTED_STATUS_LABELS[resolution.suggestedStatus]}</Badge>
          {resolution.hasManualTotal && <Badge className="bg-amber-100 text-amber-900">Score retenu (manuel) : {resolution.effectiveTotal}/100 · écart {resolution.deviation > 0 ? "+" : ""}{resolution.deviation}</Badge>}
          <Badge className="bg-blue-100 text-blue-900">Statut retenu : {SUGGESTED_STATUS_LABELS[resolution.effectiveStatus]}{resolution.hasManualStatus ? " (manuel)" : ""}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Score global manuel <span className="font-normal text-slate-500">(vide = utiliser le calcul)</span>
            <Input type="number" min={0} max={100} step={1} value={value.totalOverride ?? ""} onChange={(event) => set("totalOverride", parseOptionalTotal(event.target.value))} className="mt-1 bg-white" />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Statut final
            <select value={value.finalStatus ?? ""} onChange={(event) => set("finalStatus", (event.target.value || null) as AdminEvaluationVersion["finalStatus"])} className={selectClass}>
              <option value="">Automatique (suit le score)</option>
              {SUGGESTED_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {SUGGESTED_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section title="Voie principale et niveau de risque">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Voie principale recommandée
            <select value={value.route ?? ""} onChange={(event) => set("route", (event.target.value || null) as AdminEvaluationVersion["route"])} className={selectClass}>
              <option value="">— À choisir —</option>
              {ROUTE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key} — {ROUTE_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Niveau de risque
            <select value={value.riskLevel ?? ""} onChange={(event) => set("riskLevel", (event.target.value || null) as AdminEvaluationVersion["riskLevel"])} className={selectClass}>
              <option value="">— Non renseigné —</option>
              {RISK_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {RISK_LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section title="Analyse du profil">
        <label className="block text-xs font-medium text-slate-700">
          Résumé du profil
          <Textarea value={value.profileSummary} onChange={(event) => set("profileSummary", event.target.value)} rows={5} maxLength={4000} className="mt-1 bg-white text-sm" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <LinesField label="Atouts" hint="un par ligne" value={value.strengths} onChange={(next) => set("strengths", next)} />
          <LinesField label="Points à renforcer" hint="un par ligne" value={value.improvements} onChange={(next) => set("improvements", next)} />
          <LinesField label="Obstacles bloquants" hint="affichés au candidat parmi les points à renforcer" value={value.blockers} onChange={(next) => set("blockers", next)} />
          <LinesField label="Métiers ciblés" hint="un par ligne" value={value.targetJobs} onChange={(next) => set("targetJobs", next)} />
          <LinesField label="Secteurs ciblés" hint="un par ligne" value={value.targetSectors} onChange={(next) => set("targetSectors", next)} />
        </div>
      </Section>

      <Section title="Plan d’action" description="Étapes concrètes proposées au candidat (20 au maximum).">
        {value.actionPlan.map((step, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[2fr_1fr_auto]">
            <Input aria-label={`Étape ${index + 1} : titre`} placeholder="Titre de l’étape" value={step.title} maxLength={600} onChange={(event) => set("actionPlan", value.actionPlan.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))} className="bg-white" />
            <Input aria-label={`Étape ${index + 1} : échéance`} placeholder="Échéance (ex. 3 mois)" value={step.horizon ?? ""} maxLength={80} onChange={(event) => set("actionPlan", value.actionPlan.map((entry, i) => (i === index ? { ...entry, horizon: event.target.value } : entry)))} className="bg-white" />
            <Button type="button" variant="ghost" size="sm" aria-label={`Retirer l’étape ${index + 1}`} onClick={() => set("actionPlan", value.actionPlan.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Textarea aria-label={`Étape ${index + 1} : détail`} placeholder="Détail (facultatif)" rows={2} value={step.detail ?? ""} maxLength={4000} onChange={(event) => set("actionPlan", value.actionPlan.map((entry, i) => (i === index ? { ...entry, detail: event.target.value } : entry)))} className="bg-white text-sm md:col-span-3" />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={value.actionPlan.length >= 20} onClick={() => set("actionPlan", [...value.actionPlan, { title: "" }])}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter une étape
        </Button>
      </Section>

      <Section title="Documents à fournir" description="Statuts : Reçu, À fournir, À mettre à jour, À vérifier. Ils sont visibles du candidat.">
        {value.requiredDocuments.map((document, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_auto]">
            <Input aria-label={`Document ${index + 1}`} placeholder="Intitulé du document" value={document.label} maxLength={600} onChange={(event) => set("requiredDocuments", value.requiredDocuments.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)))} className="bg-white" />
            <select aria-label={`Statut du document ${index + 1}`} value={document.status} onChange={(event) => set("requiredDocuments", value.requiredDocuments.map((entry, i) => (i === index ? { ...entry, status: event.target.value as (typeof DOCUMENT_STATUSES)[number] } : entry)))} className={selectClass}>
              {DOCUMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {DOCUMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" aria-label={`Retirer le document ${index + 1}`} onClick={() => set("requiredDocuments", value.requiredDocuments.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={value.requiredDocuments.length >= 40} onClick={() => set("requiredDocuments", [...value.requiredDocuments, { label: "", status: "a_fournir" }])}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter un document
        </Button>
      </Section>

      <Section title="Pays alternatifs" description={`${MAX_ALTERNATIVE_COUNTRIES} au maximum. Présentés au candidat comme des pistes à étudier, jamais comme une décision.`}>
        {value.alternatives.map((alternative, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <Input aria-label={`Pays alternatif ${index + 1}`} placeholder="Pays" value={alternative.country} maxLength={100} onChange={(event) => set("alternatives", value.alternatives.map((entry, i) => (i === index ? { ...entry, country: event.target.value } : entry)))} className="bg-white" />
            <Input aria-label={`Raison du pays alternatif ${index + 1}`} placeholder="Raison prudente" value={alternative.rationale} maxLength={4000} onChange={(event) => set("alternatives", value.alternatives.map((entry, i) => (i === index ? { ...entry, rationale: event.target.value } : entry)))} className="bg-white" />
            <Button type="button" variant="ghost" size="sm" aria-label={`Retirer le pays alternatif ${index + 1}`} onClick={() => set("alternatives", value.alternatives.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={value.alternatives.length >= MAX_ALTERNATIVE_COUNTRIES} onClick={() => set("alternatives", [...value.alternatives, { country: "", rationale: "" }])}>
          <Plus className="mr-1 h-4 w-4" /> Ajouter un pays alternatif
        </Button>
      </Section>

      <Section title="Rapport client">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Date de l’évaluation
            <Input value={value.evaluationDate} onChange={(event) => set("evaluationDate", event.target.value)} maxLength={40} className="mt-1 bg-white" />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Valable jusqu’au <span className="font-normal text-slate-500">(facultatif)</span>
            <Input value={value.validUntil ?? ""} onChange={(event) => set("validUntil", event.target.value.trim() ? event.target.value : null)} maxLength={40} className="mt-1 bg-white" />
          </label>
        </div>
        <label className="block text-xs font-medium text-slate-700">
          Observations visibles du candidat
          <Textarea value={value.clientRemarks} onChange={(event) => set("clientRemarks", event.target.value)} rows={3} maxLength={4000} className="mt-1 bg-white text-sm" />
        </label>
      </Section>

      <Section title="E-mail de notification" description="Envoyé seulement si vous choisissez « Publier et envoyer l’e-mail », après la publication. Il ne contient ni score détaillé ni donnée sensible.">
        <label className="block text-xs font-medium text-slate-700">
          Objet
          <Input value={value.emailSubject} onChange={(event) => set("emailSubject", event.target.value)} maxLength={200} className="mt-1 bg-white" />
        </label>
        <label className="block text-xs font-medium text-slate-700">
          Corps du message <span className="font-normal text-slate-500">([LIEN_PORTAIL_CLIENT] est remplacé par le lien sécurisé)</span>
          <Textarea value={value.emailBody} onChange={(event) => set("emailBody", event.target.value)} rows={10} maxLength={6000} className="mt-1 bg-white font-mono text-xs" />
        </label>
      </Section>

      <Section title="Commentaire interne">
        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Interne — jamais visible du candidat</p>
        <Textarea aria-label="Commentaire interne" value={value.internalComment} onChange={(event) => set("internalComment", event.target.value)} rows={3} maxLength={4000} className="bg-rose-50/50 text-sm" />
      </Section>
    </fieldset>
  );
}
