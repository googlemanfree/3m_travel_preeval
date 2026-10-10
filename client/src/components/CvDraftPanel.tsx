import React, { useState } from "react";
import { AlertTriangle, Download, FileText, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { downloadCvPdf } from "@/lib/cvPdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CV_LANGUAGES, CV_STYLES, CV_STYLE_KEYS, styleForCountry, type CvDraft, type CvIdentity, type CvLanguage, type CvStyleKey } from "@shared/cvDraft";

type Experience = CvDraft["experiences"][number];
type Education = CvDraft["education"][number];

const emptyExperience = (): Experience => ({ role: "", employer: "", location: null, start: null, end: null, bullets: [] });
const emptyEducation = (): Education => ({ degree: "", institution: null, year: null, details: null });

const lines = (value: string) => value.split("\n");
const orNull = (value: string) => (value.trim() ? value : null);

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Opération impossible pour le moment.";
}

const selectClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900";

/**
 * Générateur de CV assisté par IA (back-office) : part du CV que le candidat a envoyé pour son évaluation.
 * Le serveur refuse sans l'accord distinct du candidat à la lecture de son CV ; le brouillon est à relire et corriger avant export.
 */
export default function CvDraftPanel({ evaluationId, sessionToken, defaultCountry }: { evaluationId: number; sessionToken: string; defaultCountry?: string | null }) {
  const initialStyle = styleForCountry(defaultCountry);
  const [style, setStyle] = useState<CvStyleKey>(initialStyle);
  const [language, setLanguage] = useState<CvLanguage>(CV_STYLES[initialStyle].defaultLanguage);
  const [draft, setDraft] = useState<CvDraft | null>(null);
  const [identity, setIdentity] = useState<CvIdentity | null>(null);
  const [unverified, setUnverified] = useState<string[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [includeContact, setIncludeContact] = useState(false);
  const [exporting, setExporting] = useState(false);

  const logExport = trpc.cvDraft.logExport.useMutation();
  const generate = trpc.cvDraft.generate.useMutation({
    onSuccess: (result) => {
      // (strictNullChecks est désactivé dans ce projet : la comparaison explicite `=== false` est nécessaire pour resserrer l'union)
      if (result.outcome.ok === false) {
        setFailure(result.outcome.error);
        return;
      }
      setDraft(result.outcome.draft);
      setUnverified(result.outcome.unverified);
      setIdentity(result.identity);
      setFailure(null);
    },
    onError: (error) => setFailure(errorMessage(error)),
  });

  const update = (patch: Partial<CvDraft>) => setDraft((current) => (current ? { ...current, ...patch } : current));
  const updateExperience = (index: number, patch: Partial<Experience>) => update({ experiences: (draft?.experiences ?? []).map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  const updateEducation = (index: number, patch: Partial<Education>) => update({ education: (draft?.education ?? []).map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const chooseStyle = (next: CvStyleKey) => {
    setStyle(next);
    setLanguage(CV_STYLES[next].defaultLanguage);
  };

  const download = async () => {
    if (!draft || !identity) return;
    setExporting(true);
    try {
      await downloadCvPdf({ identity, draft, language, includeContact });
      logExport.mutate({ sessionToken, evaluationId, style });
      toast.success("CV exporté en PDF.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="mt-3 space-y-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4" aria-label="CV assisté par IA" data-testid="cv-draft-panel">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-sky-950"><FileText className="h-4 w-4" aria-hidden="true" /> CV assisté par IA — à partir du CV du candidat</h3>
        <p className="mt-1 text-xs leading-5 text-slate-700">
          Le brouillon est établi uniquement à partir du CV que le candidat a envoyé pour son évaluation, avec ses deux accords (analyse IA et lecture du CV). Ses coordonnées sont masquées avant lecture
          par l’IA et son identité n’est pas transmise. Relisez et corrigez tout avant d’exporter : rien n’est enregistré ni envoyé au candidat.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-800">
          Format du CV
          <select className={`${selectClass} mt-1`} value={style} onChange={(event) => chooseStyle(event.target.value as CvStyleKey)} aria-label="Format du CV">
            {CV_STYLE_KEYS.map((key) => <option key={key} value={key}>{CV_STYLES[key].label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-800">
          Langue du CV
          <select className={`${selectClass} mt-1`} value={language} onChange={(event) => setLanguage(event.target.value as CvLanguage)} aria-label="Langue du CV">
            {CV_LANGUAGES.map((code) => <option key={code} value={code}>{code === "fr" ? "Français" : "Anglais"}</option>)}
          </select>
        </label>
        <Button type="button" className="gap-2 bg-sky-800 text-white hover:bg-sky-900" disabled={generate.isPending} onClick={() => { setFailure(null); generate.mutate({ sessionToken, evaluationId, style, language }); }}>
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {draft ? "Régénérer le brouillon" : "Générer depuis le CV du candidat"}
        </Button>
      </div>
      <p className="-mt-2 text-xs text-slate-600">{CV_STYLES[style].guidance}</p>

      {failure && (
        <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {failure}
        </p>
      )}

      {draft && identity && (
        <div className="space-y-4">
          {(unverified.length > 0 || draft.missing.length > 0) && (
            <div role="status" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950" data-testid="cv-draft-warnings">
              {unverified.length > 0 && (
                <div>
                  <p className="font-bold">À vérifier : éléments non retrouvés dans le CV du candidat (supprimez-les s’ils sont faux)</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">{unverified.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
              {draft.missing.length > 0 && (
                <div>
                  <p className="font-bold">À compléter avec le candidat (absent de son CV)</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">{draft.missing.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-800">Titre professionnel
              <Input className="mt-1" value={draft.headline ?? ""} onChange={(event) => update({ headline: orNull(event.target.value) })} />
            </label>
            <div className="text-xs text-slate-700">
              <p className="font-semibold text-slate-800">Candidat</p>
              <p className="mt-2">{identity.fullName}{identity.city ? ` — ${identity.city}` : ""}</p>
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-800">Accroche / profil
            <Textarea className="mt-1 min-h-[88px]" value={draft.summary ?? ""} onChange={(event) => update({ summary: orNull(event.target.value) })} />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-slate-900">Expériences professionnelles</legend>
            {draft.experiences.map((experience, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-800">Poste<Input className="mt-1" value={experience.role} onChange={(event) => updateExperience(index, { role: event.target.value })} /></label>
                  <label className="text-xs font-semibold text-slate-800">Employeur<Input className="mt-1" value={experience.employer} onChange={(event) => updateExperience(index, { employer: event.target.value })} /></label>
                  <label className="text-xs font-semibold text-slate-800">Début<Input className="mt-1" value={experience.start ?? ""} onChange={(event) => updateExperience(index, { start: orNull(event.target.value) })} /></label>
                  <label className="text-xs font-semibold text-slate-800">Fin<Input className="mt-1" value={experience.end ?? ""} onChange={(event) => updateExperience(index, { end: orNull(event.target.value) })} /></label>
                  <label className="text-xs font-semibold text-slate-800 sm:col-span-2">Lieu<Input className="mt-1" value={experience.location ?? ""} onChange={(event) => updateExperience(index, { location: orNull(event.target.value) })} /></label>
                </div>
                <label className="block text-xs font-semibold text-slate-800">Réalisations (une par ligne)
                  <Textarea className="mt-1 min-h-[72px]" value={experience.bullets.join("\n")} onChange={(event) => updateExperience(index, { bullets: lines(event.target.value) })} />
                </label>
                <Button type="button" variant="ghost" size="sm" className="gap-1 text-red-700" onClick={() => update({ experiences: draft.experiences.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Supprimer cette expérience</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => update({ experiences: [...draft.experiences, emptyExperience()] })}><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter une expérience</Button>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-slate-900">Formation</legend>
            {draft.education.map((education, index) => (
              <div key={index} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-slate-800">Diplôme<Input className="mt-1" value={education.degree} onChange={(event) => updateEducation(index, { degree: event.target.value })} /></label>
                  <label className="text-xs font-semibold text-slate-800">Établissement<Input className="mt-1" value={education.institution ?? ""} onChange={(event) => updateEducation(index, { institution: orNull(event.target.value) })} /></label>
                  <label className="text-xs font-semibold text-slate-800">Année<Input className="mt-1" value={education.year ?? ""} onChange={(event) => updateEducation(index, { year: orNull(event.target.value) })} /></label>
                </div>
                <Button type="button" variant="ghost" size="sm" className="gap-1 text-red-700" onClick={() => update({ education: draft.education.filter((_, i) => i !== index) })}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Supprimer cette formation</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => update({ education: [...draft.education, emptyEducation()] })}><Plus className="h-3.5 w-3.5" aria-hidden="true" /> Ajouter une formation</Button>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-800">Compétences (une par ligne)
              <Textarea className="mt-1 min-h-[96px]" value={draft.skills.join("\n")} onChange={(event) => update({ skills: lines(event.target.value) })} />
            </label>
            <label className="text-xs font-semibold text-slate-800">Langues (« Langue : niveau », une par ligne)
              <Textarea
                className="mt-1 min-h-[96px]"
                value={draft.languages.map((entry) => (entry.level ? `${entry.language} : ${entry.level}` : entry.language)).join("\n")}
                onChange={(event) => update({ languages: lines(event.target.value).map((line) => { const [language, ...level] = line.split(":"); return { language, level: orNull(level.join(":").trim()) }; }) })}
              />
            </label>
            <label className="text-xs font-semibold text-slate-800">Certifications (une par ligne)
              <Textarea className="mt-1 min-h-[96px]" value={draft.certifications.join("\n")} onChange={(event) => update({ certifications: lines(event.target.value) })} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-200 pt-3">
            <label className="flex items-center gap-2 text-xs text-slate-800">
              <input type="checkbox" checked={includeContact} onChange={(event) => setIncludeContact(event.target.checked)} />
              Inclure la ville, l’e-mail et le téléphone du dossier dans le PDF
            </label>
            <Button type="button" className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800" disabled={exporting} onClick={download}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} Télécharger le PDF
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
