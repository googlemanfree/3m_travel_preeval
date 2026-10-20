import { useState } from "react";
import { Library } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import {
  AVAILABILITY_LABELS,
  CVTHEQUE_STATE_LABELS,
  CVTHEQUE_STATES,
  EDUCATION_LABELS,
  VERIFICATION_FIELDS,
  VERIFICATION_LABELS,
  VERIFICATION_LEVELS,
  WORK_AUTHORIZATION_LABELS,
  type Availability,
  type CvthequeState,
  type EducationLevel,
  type VerificationLevels,
  type WorkAuthorization,
} from "@shared/cvtheque";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Row = inferRouterOutputs<AppRouter>["cvtheque"]["adminQueue"][number];
const FIELD_LABEL: Record<(typeof VERIFICATION_FIELDS)[number], string> = { skills: "Compétences", experience: "Expérience", education: "Formation", languages: "Langues" };

function ReviewRow({ row, sessionToken, onDone }: { row: Row; sessionToken: string; onDone: () => void }) {
  const [verification, setVerification] = useState<VerificationLevels>(row.verification);
  const [note, setNote] = useState(row.reviewNote ?? "");
  const review = trpc.cvtheque.adminReview.useMutation({
    onSuccess: (result) => { toast.success(`Fiche : ${CVTHEQUE_STATE_LABELS[result.state].fr}`); onDone(); },
    onError: (error) => toast.error("Décision non enregistrée", { description: error.message }),
  });
  const eligible = row.placementConsentGranted && row.summaryApproved;
  const decide = (decision: "publish" | "reject" | "request_changes" | "unpublish") => review.mutate({ sessionToken, id: row.id, decision, verification: decision === "publish" ? verification : undefined, note: note || undefined });

  return (
    <li className="rounded-xl border border-slate-200 p-4" data-testid="cvtheque-review-row">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-slate-950">{row.candidateName} <span className="text-sm font-normal text-slate-500">· {row.profileCode} · candidat #{row.candidateId}</span></p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">{CVTHEQUE_STATE_LABELS[row.visibilityState as CvthequeState].fr}</span>
      </div>
      <p className="mt-1 text-sm text-slate-700"><strong>{row.jobTitle ?? "—"}</strong> · {row.experienceYears ?? "?"} an(s) · {row.skills.join(", ") || "aucune compétence"}</p>
      <p className="text-xs text-slate-600">Langues : {row.languages.join(", ") || "—"} · Disponibilité : {row.availability ? AVAILABILITY_LABELS[row.availability as Availability]?.fr : "—"} · Résidence : {row.residenceCountry ?? "—"} · Destinations : {row.destinations.join(", ") || "—"} · Formation : {row.educationLevel ? EDUCATION_LABELS[row.educationLevel as EducationLevel]?.fr : "non précisée"}</p>
      <p className="text-xs text-slate-600">Autorisation de travail : {WORK_AUTHORIZATION_LABELS[row.workAuthorization as WorkAuthorization]?.fr} (déclarée par le candidat)</p>
      <p className={`mt-1 text-xs font-semibold ${eligible ? "text-emerald-700" : "text-amber-800"}`}>{row.placementConsentGranted ? "✔ Partage anonymisé autorisé" : "✘ Partage anonymisé non autorisé"} · {row.summaryApproved ? "✔ Résumé approuvé" : "✘ Résumé non approuvé"}</p>
      {(row.visibilityState === "pending_review" || row.visibilityState === "published") && (
        <div className="mt-3 grid gap-2 sm:grid-cols-4" aria-label="Niveau de vérification">
          {VERIFICATION_FIELDS.map((field) => (
            <label key={field} className="text-xs font-semibold text-slate-800">{FIELD_LABEL[field]}
              <select value={verification[field]} onChange={(event) => setVerification((current) => ({ ...current, [field]: event.target.value as VerificationLevels[typeof field] }))} className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-1 text-xs">
                {VERIFICATION_LEVELS.map((level) => <option key={level} value={level}>{VERIFICATION_LABELS[level].fr}</option>)}
              </select>
            </label>
          ))}
          <p className="text-xs text-slate-500 sm:col-span-4">« Pièce examinée » et « Vérifié par 3M » ne doivent être choisis que si l’examen a réellement eu lieu. « Déclaré » reste le niveau par défaut.</p>
        </div>
      )}
      <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1500} placeholder="Motif ou message au candidat (obligatoire pour refuser, demander des modifications ou retirer)" aria-label="Motif de la décision" className="mt-3 min-h-16" />
      <div className="mt-2 flex flex-wrap gap-2">
        {row.visibilityState === "pending_review" && <Button type="button" size="sm" disabled={review.isPending || !eligible} onClick={() => decide("publish")} className="bg-emerald-700 text-white hover:bg-emerald-800" data-testid="cvtheque-publish">Publier</Button>}
        {row.visibilityState === "pending_review" && <Button type="button" size="sm" variant="outline" disabled={review.isPending || !note.trim()} onClick={() => decide("request_changes")}>Demander des modifications</Button>}
        {row.visibilityState === "pending_review" && <Button type="button" size="sm" variant="outline" className="border-rose-300 text-rose-900" disabled={review.isPending || !note.trim()} onClick={() => decide("reject")}>Refuser</Button>}
        {row.visibilityState === "published" && <Button type="button" size="sm" variant="outline" className="border-rose-300 text-rose-900" disabled={review.isPending || !note.trim()} onClick={() => decide("unpublish")}>Retirer de la CVthèque</Button>}
      </div>
    </li>
  );
}

/** Examen administrateur des fiches avant publication : consentement, résumé approuvé, niveaux de vérification honnêtes. */
export function AdminCvthequeReview({ sessionToken }: { sessionToken: string }) {
  const queue = trpc.cvtheque.adminQueue.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [filter, setFilter] = useState<"all" | CvthequeState>("pending_review");
  const rows = (queue.data ?? []).filter((row) => filter === "all" || row.visibilityState === filter);
  const count = (state: CvthequeState) => (queue.data ?? []).filter((row) => row.visibilityState === state).length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="admin-cvtheque-title" data-testid="admin-cvtheque-review">
      <h2 id="admin-cvtheque-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Library className="h-5 w-5 text-sky-700" aria-hidden="true" />CVthèque — examen avant publication</h2>
      <p className="mt-1 text-sm text-slate-600">Une fiche n’est visible des employeurs que si le candidat a autorisé la diffusion, que son résumé est approuvé et que vous l’avez publiée. La publication peut exiger la double authentification.</p>
      {queue.error && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" role="status">{queue.error.message}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {CVTHEQUE_STATES.map((state) => <button key={state} type="button" onClick={() => setFilter(filter === state ? "all" : state)} aria-pressed={filter === state} className={`rounded-full border px-3 py-1 text-xs font-bold ${filter === state ? "border-sky-600 bg-sky-50 text-sky-950" : "border-slate-200 text-slate-700"}`}>{CVTHEQUE_STATE_LABELS[state].fr} · {count(state)}</button>)}
      </div>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => <ReviewRow key={`${row.id}-${row.updatedAt}`} row={row} sessionToken={sessionToken} onDone={() => void queue.refetch()} />)}
        {!queue.isLoading && rows.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aucune fiche dans cet état.</li>}
      </ul>
    </section>
  );
}
