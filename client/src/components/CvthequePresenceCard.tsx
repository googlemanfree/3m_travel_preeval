import { useEffect, useMemo, useState } from "react";
import { EyeOff, Library, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_VALUES,
  CVTHEQUE_STATE_LABELS,
  EDUCATION_LABELS,
  EDUCATION_LEVELS,
  WORK_AUTHORIZATION_LABELS,
  WORK_AUTHORIZATION_VALUES,
  type Availability,
  type EducationLevel,
  type WorkAuthorization,
} from "@shared/cvtheque";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyNotice } from "@/components/PrivacyNotice";

type Draft = {
  jobTitle: string;
  skills: string;
  educationLevel: "" | EducationLevel;
  experienceYears: string;
  languages: string;
  availability: "" | Availability;
  destinations: string;
  residenceCountry: string;
  workAuthorization: WorkAuthorization;
};

const emptyDraft: Draft = { jobTitle: "", skills: "", educationLevel: "", experienceYears: "", languages: "", availability: "", destinations: "", residenceCountry: "", workAuthorization: "not_specified" };

/**
 * Présence du candidat dans la CVthèque : il déclare des informations professionnelles, autorise EXPRESSÉMENT leur diffusion
 * (consentement distinct de l'acceptation des conditions du site) et peut se retirer à tout moment, sans supprimer son compte.
 */
export function CvthequePresenceCard() {
  const candidateToken = useMemo(() => getCandidateToken(), []);
  const utils = trpc.useUtils();
  const stateQuery = trpc.cvtheque.myState.useQuery({ candidateToken: candidateToken ?? "" }, { enabled: Boolean(candidateToken), retry: false });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [consent, setConsent] = useState(false);
  const entry = stateQuery.data?.entry ?? null;
  const eligibility = stateQuery.data?.eligibility;

  useEffect(() => {
    if (!entry) return;
    setDraft({
      jobTitle: entry.jobTitle,
      skills: entry.skills,
      educationLevel: (entry.educationLevel || "") as Draft["educationLevel"],
      experienceYears: entry.experienceYears === null || entry.experienceYears === undefined ? "" : String(entry.experienceYears),
      languages: entry.languages,
      availability: (entry.availability || "") as Draft["availability"],
      destinations: entry.destinations,
      residenceCountry: entry.residenceCountry,
      workAuthorization: entry.workAuthorization as WorkAuthorization,
    });
  }, [entry?.visibilityState, entry?.jobTitle, entry?.skills]);

  const refresh = () => utils.cvtheque.myState.invalidate();
  const save = trpc.cvtheque.saveDeclared.useMutation({
    onSuccess: (result) => { toast.success(result.state === "pending_review" ? "Modifications enregistrées — votre fiche repasse en examen." : "Informations enregistrées"); void refresh(); },
    onError: (error) => toast.error("Enregistrement impossible", { description: error.message }),
  });
  const request = trpc.cvtheque.requestPublication.useMutation({
    onSuccess: () => { setConsent(false); toast.success("Demande envoyée : 3M examine votre fiche avant toute publication."); void refresh(); },
    onError: (error) => toast.error("Demande impossible", { description: error.message }),
  });
  const withdraw = trpc.cvtheque.withdraw.useMutation({
    onSuccess: () => { toast.success("Votre fiche est retirée de la CVthèque. Votre compte reste actif."); void refresh(); },
    onError: (error) => toast.error("Retrait impossible", { description: error.message }),
  });

  if (!candidateToken || stateQuery.error) return stateQuery.error ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{stateQuery.error.message}</p> : null;

  const state = entry?.visibilityState ?? "draft";
  const ready = Boolean(eligibility?.hasProfile && eligibility.placementConsentGranted);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <Card className="border-sky-200 bg-sky-50/50" data-testid="cvtheque-presence-card" aria-label="Ma présence dans la CVthèque">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-sky-950"><Library className="h-5 w-5 text-sky-700" aria-hidden="true" />Ma fiche dans la CVthèque</CardTitle>
        <CardDescription>Vous décidez si votre fiche professionnelle est visible des employeurs vérifiés. Ce choix est distinct de l’acceptation des conditions du site.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PrivacyNotice notice="cvtheque_candidate" />
        {!eligibility?.hasProfile && <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700" role="status">Votre fiche professionnelle sera préparée par 3M après la validation de votre évaluation. Vous pourrez alors décider de sa diffusion.</p>}
        {eligibility?.hasProfile && !eligibility.placementConsentGranted && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">Activez d’abord « Autoriser le partage anonymisé » dans la carte « Opportunités de placement ».</p>}
        {ready && (
          <>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sky-950" data-testid="cvtheque-state">État : {CVTHEQUE_STATE_LABELS[state].fr}</p>
            {entry?.reviewNote && (state === "rejected" || state === "draft") && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Retour de 3M : {entry.reviewNote}</p>}
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate({
                  candidateToken,
                  jobTitle: draft.jobTitle,
                  skills: draft.skills,
                  educationLevel: draft.educationLevel || undefined,
                  experienceYears: draft.experienceYears === "" ? undefined : Number(draft.experienceYears),
                  languages: draft.languages || undefined,
                  availability: draft.availability || undefined,
                  destinations: draft.destinations || undefined,
                  residenceCountry: draft.residenceCountry || undefined,
                  workAuthorization: draft.workAuthorization,
                });
              }}
            >
              <label className="text-sm font-semibold text-slate-800">Métier ou poste visé *
                <Input required minLength={2} maxLength={160} value={draft.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} className="mt-1" placeholder="Ex. : aide-soignant, soudeur, comptable" />
              </label>
              <label className="text-sm font-semibold text-slate-800">Années d’expérience
                <Input type="number" min={0} max={60} value={draft.experienceYears} onChange={(event) => set("experienceYears", event.target.value)} className="mt-1" />
              </label>
              <label className="text-sm font-semibold text-slate-800 md:col-span-2">Compétences * <span className="font-normal text-slate-500">(séparées par des virgules)</span>
                <Textarea required minLength={2} maxLength={800} value={draft.skills} onChange={(event) => set("skills", event.target.value)} className="mt-1 min-h-16" placeholder="Soins aux personnes, manutention, Excel…" />
              </label>
              <label className="text-sm font-semibold text-slate-800">Niveau de formation <span className="font-normal text-slate-500">(facultatif)</span>
                <select value={draft.educationLevel} onChange={(event) => set("educationLevel", event.target.value as Draft["educationLevel"])} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
                  <option value="">Non précisé</option>
                  {EDUCATION_LEVELS.map((level) => <option key={level} value={level}>{EDUCATION_LABELS[level].fr}</option>)}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">Le diplôme n’est pas obligatoire : l’expérience et les compétences comptent.</span>
              </label>
              <label className="text-sm font-semibold text-slate-800">Langues <span className="font-normal text-slate-500">(avec niveau)</span>
                <Input maxLength={400} value={draft.languages} onChange={(event) => set("languages", event.target.value)} className="mt-1" placeholder="Français courant, anglais B1" />
              </label>
              <label className="text-sm font-semibold text-slate-800">Disponibilité
                <select value={draft.availability} onChange={(event) => set("availability", event.target.value as Draft["availability"])} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
                  <option value="">Non précisée</option>
                  {AVAILABILITY_VALUES.map((value) => <option key={value} value={value}>{AVAILABILITY_LABELS[value].fr}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">Pays de résidence actuel
                <Input maxLength={120} value={draft.residenceCountry} onChange={(event) => set("residenceCountry", event.target.value)} className="mt-1" placeholder="Cameroun" />
              </label>
              <label className="text-sm font-semibold text-slate-800 md:col-span-2">Destinations souhaitées <span className="font-normal text-slate-500">(séparées par des virgules)</span>
                <Input maxLength={400} value={draft.destinations} onChange={(event) => set("destinations", event.target.value)} className="mt-1" placeholder="Canada, Allemagne" />
              </label>
              <label className="text-sm font-semibold text-slate-800 md:col-span-2">Votre situation d’autorisation de travail <span className="font-normal text-slate-500">(déclaration facultative)</span>
                <select value={draft.workAuthorization} onChange={(event) => set("workAuthorization", event.target.value as WorkAuthorization)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
                  {WORK_AUTHORIZATION_VALUES.map((value) => <option key={value} value={value}>{WORK_AUTHORIZATION_LABELS[value].fr}</option>)}
                </select>
                <span className="mt-1 block text-xs font-normal text-slate-500">Cette information est présentée aux employeurs comme « déclarée par le candidat ». Elle n’est pas vérifiée et n’indique aucune admissibilité à un visa.</span>
              </label>
              <div className="md:col-span-2"><Button type="submit" disabled={save.isPending} aria-busy={save.isPending} variant="outline" className="border-sky-300">{save.isPending ? "Enregistrement…" : "Enregistrer mes informations"}</Button></div>
            </form>

            {entry && (state === "draft" || state === "withdrawn" || state === "rejected") && (
              <div className="rounded-xl border border-sky-200 bg-white p-3">
                <label className="flex items-start gap-2 text-sm text-slate-800">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4" data-testid="cvtheque-consent" />
                  <span>J’autorise 3M TRAVEL AGENCY à rendre ma fiche professionnelle (sans nom, coordonnées, nationalité ni pièce d’identité) visible des employeurs et agences vérifiés, y compris à l’étranger, après examen. Je peux la retirer à tout moment. <span className="text-slate-500">(texte provisoire, version {stateQuery.data?.consentVersion})</span></span>
                </label>
                <Button type="button" className="mt-3 bg-sky-700 text-white hover:bg-sky-800" disabled={!consent || request.isPending} onClick={() => stateQuery.data && request.mutate({ candidateToken, consent: true, consentVersion: stateQuery.data.consentVersion })}><Send className="mr-2 h-4 w-4" aria-hidden="true" />{request.isPending ? "Envoi…" : "Demander la publication de ma fiche"}</Button>
              </div>
            )}
            {entry && (state === "published" || state === "pending_review") && (
              <Button type="button" variant="outline" className="border-rose-300 text-rose-900 hover:bg-rose-50" disabled={withdraw.isPending} onClick={() => withdraw.mutate({ candidateToken })} data-testid="cvtheque-withdraw"><EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />{withdraw.isPending ? "Retrait…" : "Retirer ma fiche de la CVthèque"}</Button>
            )}
            {state === "published" && entry?.nextReviewAt && <p className="text-xs text-slate-600">Votre fiche sera réexaminée avant le {new Date(entry.nextReviewAt).toLocaleDateString("fr-FR")}. Retirer votre fiche ne supprime pas votre compte.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
