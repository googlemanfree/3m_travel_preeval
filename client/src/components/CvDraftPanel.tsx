import React, { useState } from "react";
import { AlertTriangle, Download, FileText, Loader2, Plus, Send, Sparkles, Trash2 } from "lucide-react";
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
 * Outil ADMIN uniquement : préparer CV international + lettre pour faire postuler le client.
 * Jamais exposé dans l’espace candidat.
 */
export default function CvDraftPanel({ evaluationId, sessionToken, defaultCountry }: { evaluationId: number; sessionToken: string; defaultCountry?: string | null }) {
  const initialStyle = styleForCountry(defaultCountry);
  const [style, setStyle] = useState<CvStyleKey>(initialStyle);
  const [language, setLanguage] = useState<CvLanguage>(CV_STYLES[initialStyle].defaultLanguage);
  const [targetRole, setTargetRole] = useState("");
  const [draft, setDraft] = useState<CvDraft | null>(null);
  const [identity, setIdentity] = useState<CvIdentity | null>(null);
  const [unverified, setUnverified] = useState<string[]>([]);
  const [supportingFacts, setSupportingFacts] = useState<string[]>([]);
  const [motivationLetter, setMotivationLetter] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [includeContact, setIncludeContact] = useState(true);
  const [exporting, setExporting] = useState(false);

  const logExport = trpc.cvDraft.logExport.useMutation();
  const savePack = trpc.cvDraft.saveApplicationPack.useMutation({
    onSuccess: () => toast.success("Pack candidature enregistré (usage admin pour postuler)."),
    onError: (error) => toast.error(errorMessage(error)),
  });
  const generateMotivation = trpc.cvDraft.generateMotivation.useMutation({
    onSuccess: (result) => {
      if (result.outcome.ok === false) {
        toast.error(result.outcome.error);
        return;
      }
      setMotivationLetter(result.outcome.letter);
      toast.success("Lettre de motivation proposée — relisez avant d’enregistrer le pack.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const generate = trpc.cvDraft.generate.useMutation({
    onSuccess: (result) => {
      if (result.outcome.ok === false) {
        setFailure(result.outcome.error);
        return;
      }
      setDraft(result.outcome.draft);
      setUnverified(result.outcome.unverified);
      setIdentity(result.identity);
      setSupportingFacts(result.supportingFacts ?? []);
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
        <h3 className="flex items-center gap-2 text-sm font-bold text-sky-950"><FileText className="h-4 w-4" aria-hidden="true" /> Pack candidature admin — faire postuler le client</h3>
        <p className="mt-1 text-xs leading-5 text-slate-700">
          Outil réservé à l’administration. Brouillon établi à partir du CV d’évaluation et des pièces fournies (diplômes, attestations…).
          Relisez, ajoutez une lettre si besoin, exportez le PDF, puis enregistrez le pack pour candidater au nom du client. Aucun accès candidat.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_9rem_1fr_auto] lg:items-end">
        <label className="text-xs font-semibold text-slate-800">
          Format du CV
          <select className={`${selectClass} mt-1`} value={style} onChange={(event) => chooseStyle(event.target.value as CvStyleKey)} aria-label="Format du CV">
            {CV_STYLE_KEYS.map((key) => <option key={key} value={key}>{CV_STYLES[key].label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-800">
          Langue
          <select className={`${selectClass} mt-1`} value={language} onChange={(event) => setLanguage(event.target.value as CvLanguage)} aria-label="Langue du CV">
            {CV_LANGUAGES.map((code) => <option key={code} value={code}>{code === "fr" ? "Français" : "Anglais"}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-800">
          Poste / métier visé (optionnel)
          <Input className="mt-1" value={targetRole} onChange={(event) => setTargetRole(event.target.value.slice(0, 160))} placeholder="Ex. Logisticien entrepôt" />
        </label>
        <Button type="button" className="gap-2 bg-sky-800 text-white hover:bg-sky-900" disabled={generate.isPending} onClick={() => { setFailure(null); generate.mutate({ sessionToken, evaluationId, style, language, targetRole: targetRole.trim() || undefined }); }}>
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
          {draft ? "Régénérer" : "Générer le CV"}
        </Button>
      </div>
      <p className="-mt-2 text-xs text-slate-600">{CV_STYLES[style].guidance}</p>
      {supportingFacts.length > 0 && (
        <p className="rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-xs text-slate-700" data-testid="cv-supporting-facts">
          <strong>Pièces prises en compte :</strong> {supportingFacts.slice(0, 8).join(" · ")}{supportingFacts.length > 8 ? ` · +${supportingFacts.length - 8}` : ""}
        </p>
      )}

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
                  <p className="font-bold">À vérifier : éléments non retrouvés dans le CV / les pièces (supprimez-les s’ils sont faux)</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">{unverified.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}
              {draft.missing.length > 0 && (
                <div>
                  <p className="font-bold">À compléter avec le candidat</p>
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
                <label className="block text-xs font-semibold text-slate-800">Précisions
                  <Input className="mt-1" value={education.details ?? ""} onChange={(event) => updateEducation(index, { details: orNull(event.target.value) })} />
                </label>
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
                onChange={(event) => update({ languages: lines(event.target.value).map((line) => { const [lang, ...level] = line.split(":"); return { language: lang, level: orNull(level.join(":").trim()) }; }) })}
              />
            </label>
            <label className="text-xs font-semibold text-slate-800">Certifications (une par ligne)
              <Textarea className="mt-1 min-h-[96px]" value={draft.certifications.join("\n")} onChange={(event) => update({ certifications: lines(event.target.value) })} />
            </label>
          </div>

          <fieldset className="space-y-2 rounded-lg border border-indigo-200 bg-white p-3">
            <legend className="px-1 text-xs font-bold text-indigo-950">Lettre de motivation (optionnelle)</legend>
            <Textarea className="min-h-[120px]" value={motivationLetter} onChange={(event) => setMotivationLetter(event.target.value.slice(0, 4000))} placeholder="Générez une proposition puis relisez, ou rédigez manuellement." />
            <Button type="button" variant="outline" size="sm" className="gap-1" disabled={generateMotivation.isPending} onClick={() => generateMotivation.mutate({ sessionToken, evaluationId, language, targetRole: targetRole.trim() || undefined, draft })}>
              {generateMotivation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Proposer une lettre
            </Button>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-200 pt-3">
            <label className="flex items-center gap-2 text-xs text-slate-800">
              <input type="checkbox" checked={includeContact} onChange={(event) => setIncludeContact(event.target.checked)} />
              Inclure ville, e-mail et téléphone dans le PDF / pack publié
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="gap-2" disabled={exporting} onClick={download}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} PDF admin
              </Button>
              <Button
                type="button"
                className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={savePack.isPending}
                data-testid="cv-save-application-pack"
                onClick={() => savePack.mutate({
                  sessionToken,
                  evaluationId,
                  style,
                  language,
                  includeContact,
                  targetRole: targetRole.trim() || null,
                  draft,
                  motivationLetter: motivationLetter.trim() || null,
                })}
              >
                {savePack.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />} Enregistrer le pack (admin)
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
