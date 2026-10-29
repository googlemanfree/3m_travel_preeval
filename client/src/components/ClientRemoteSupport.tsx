import { useMemo, useState } from "react";
import { CalendarCheck, HelpCircle, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { clientSpacePolling } from "@/lib/clientSpaceSync";
import { PROBLEM_TOPICS, SLOT_CHANNEL_LABELS, type ProblemTopic } from "@shared/remoteSupport";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Overview = inferRouterOutputs<AppRouter>["remoteSupport"]["myOverview"];

const when = (value: string) => new Date(value).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });
const dayKey = (value: string) => new Date(value).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Douala" });
const hour = (value: string) => new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });

/**
 * Accompagnement à distance (espace candidat) : l'étape à faire maintenant, un bouton « j'ai un problème », la réservation d'un rendez-vous en ligne
 * et les accusés de réception à confirmer. Tout est utilisable au téléphone (cibles de 44 px au moins).
 */
export function ClientRemoteSupport({ enabled = true }: { enabled?: boolean }) {
  const utils = trpc.useUtils();
  const query = trpc.remoteSupport.myOverview.useQuery(undefined, { enabled, ...clientSpacePolling(), retry: false });
  const [helpOpen, setHelpOpen] = useState(false);
  const [topic, setTopic] = useState<ProblemTopic>("document");
  const [details, setDetails] = useState("");
  const [note, setNote] = useState("");
  const [names, setNames] = useState<Record<number, string>>({});
  const [read, setRead] = useState<Record<number, boolean>>({});
  const [declining, setDeclining] = useState<Record<number, string | undefined>>({});
  const refresh = () => { void utils.remoteSupport.myOverview.invalidate(); };

  const report = trpc.remoteSupport.reportProblem.useMutation({ onSuccess: () => { toast.success("Votre demande d'aide est transmise : votre conseiller vous répond bientôt."); setHelpOpen(false); setDetails(""); }, onError: (error) => toast.error(error.message) });
  const book = trpc.remoteSupport.bookSlot.useMutation({ onSuccess: () => { toast.success("Rendez-vous confirmé : le lien est ci-dessous."); setNote(""); refresh(); }, onError: (error) => { toast.error(error.message); refresh(); } });
  const cancel = trpc.remoteSupport.cancelBooking.useMutation({ onSuccess: () => { toast.success("Rendez-vous annulé"); refresh(); }, onError: (error) => toast.error(error.message) });
  const accept = trpc.remoteSupport.acceptAcknowledgement.useMutation({ onSuccess: () => { toast.success("Confirmation enregistrée"); refresh(); }, onError: (error) => toast.error(error.message) });
  const decline = trpc.remoteSupport.declineAcknowledgement.useMutation({ onSuccess: () => { toast.success("Votre réponse est transmise à votre conseiller"); refresh(); }, onError: (error) => toast.error(error.message) });

  const data = query.data as Overview | undefined;
  const days = useMemo(() => {
    const groups = new Map<string, Overview["openSlots"]>();
    for (const slot of data?.openSlots ?? []) groups.set(dayKey(slot.startsAt), [...(groups.get(dayKey(slot.startsAt)) ?? []), slot]);
    return Array.from(groups.entries()).slice(0, 6);
  }, [data?.openSlots]);

  if (!enabled || !data) return null;
  const bookings = data.myBookings.filter((slot) => slot.status === "booked");
  const pendingAcks = data.acknowledgements.filter((ack) => ack.status === "pending");

  return (
    <Card className="overflow-hidden border-2 border-blue-200 bg-white shadow-md" data-testid="client-remote-support" role="region" aria-labelledby="remote-support-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-700 p-2.5 text-white"><Video className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 id="remote-support-title" className="text-lg font-bold text-slate-900">Accompagnement à distance</h2>
            <p className="text-sm text-slate-600">Vous n'avez pas besoin de venir au bureau : écrivez-nous, réservez un rendez-vous en ligne, confirmez vos documents.</p>
          </div>
        </div>
        <Button type="button" className="min-h-11 bg-violet-700 text-white hover:bg-violet-800" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen} data-testid="remote-help-open"><HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />J'ai un problème</Button>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {data.nextStep && (
          <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4" data-testid="remote-next-step" aria-label="Votre prochaine étape">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Votre prochaine étape</p>
            <p className="mt-1 text-base font-bold text-slate-900">{data.nextStep.text}</p>
            {data.nextStep.dueOn && <p className="mt-1 text-sm text-slate-700">À faire avant le {new Date(data.nextStep.dueOn).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.</p>}
          </section>
        )}

        {helpOpen && (
          <section className="rounded-xl border border-violet-200 bg-violet-50 p-4" data-testid="remote-help-form">
            <p className="text-sm font-semibold text-violet-950">Que se passe-t-il ? Votre conseiller est prévenu et vous répond dans votre espace et par e-mail.</p>
            <div className="mt-3 space-y-2" role="radiogroup" aria-label="Type de difficulté">
              {PROBLEM_TOPICS.map((item) => (
                <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-violet-200 bg-white px-3 text-sm">
                  <input type="radio" name="remote-topic" className="h-5 w-5" checked={topic === item.id} onChange={() => setTopic(item.id)} />
                  {item.label}
                </label>
              ))}
            </div>
            <Textarea className="mt-3 min-h-20" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Précisez en quelques mots (facultatif)" aria-label="Précisions" />
            <Button type="button" className="mt-3 min-h-11 w-full sm:w-auto" disabled={report.isPending} onClick={() => report.mutate({ topic, details: details.trim() || null })} data-testid="remote-help-send">Envoyer ma demande d'aide</Button>
          </section>
        )}

        {pendingAcks.length > 0 && (
          <section className="space-y-3" aria-label="Documents à confirmer" data-testid="remote-acks">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-amber-700" aria-hidden="true" />À confirmer</h3>
            {pendingAcks.map((ack) => (
              <article key={ack.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4" data-testid={`ack-${ack.id}`}>
                <p className="font-bold text-slate-900">{ack.title}</p>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-white p-3 text-sm text-slate-800">{ack.body}</p>
                <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-slate-900">
                  <input type="checkbox" className="h-5 w-5" checked={Boolean(read[ack.id])} onChange={(event) => setRead((current) => ({ ...current, [ack.id]: event.target.checked }))} />
                  J'ai lu ce texte et je suis d'accord.
                </label>
                <label className="mt-2 block text-xs font-semibold text-slate-800">Tapez votre nom complet pour confirmer
                  <Input className="mt-1 h-12" value={names[ack.id] ?? ""} onChange={(event) => setNames((current) => ({ ...current, [ack.id]: event.target.value }))} autoComplete="name" />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" className="min-h-11" disabled={!read[ack.id] || (names[ack.id] ?? "").trim().length < 3 || accept.isPending} onClick={() => accept.mutate({ id: ack.id, typedName: (names[ack.id] ?? "").trim(), confirm: true })} data-testid={`ack-accept-${ack.id}`}>Je confirme</Button>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => setDeclining((current) => ({ ...current, [ack.id]: current[ack.id] === undefined ? "" : undefined }))}>Je ne suis pas d'accord</Button>
                </div>
                {declining[ack.id] !== undefined && (
                  <div className="mt-3 space-y-2">
                    <Textarea value={declining[ack.id] ?? ""} onChange={(event) => setDeclining((current) => ({ ...current, [ack.id]: event.target.value }))} placeholder="Dites-nous ce qui pose problème" aria-label="Motif" />
                    <Button type="button" variant="outline" className="min-h-11" disabled={(declining[ack.id] ?? "").trim().length < 3 || decline.isPending} onClick={() => decline.mutate({ id: ack.id, reason: (declining[ack.id] ?? "").trim() })}>Envoyer mon refus</Button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        <section className="space-y-3" aria-label="Mes rendez-vous" data-testid="remote-bookings">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900"><CalendarCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />Mes rendez-vous en ligne</h3>
          {bookings.length === 0 && <p className="text-sm text-slate-600">Aucun rendez-vous prévu.</p>}
          {bookings.map((slot) => (
            <article key={slot.id} className="rounded-xl border border-blue-200 bg-blue-50 p-4" data-testid={`booking-${slot.id}`}>
              <p className="font-bold text-slate-900">{when(slot.startsAt)} <span className="font-normal text-slate-600">(heure du Cameroun) · {slot.durationMin} min</span></p>
              <p className="text-sm text-slate-700">{SLOT_CHANNEL_LABELS[slot.channel]}{slot.topic ? ` — ${slot.topic}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {slot.joinUrl ? <Button asChild className="min-h-11"><a href={slot.joinUrl} target="_blank" rel="noopener noreferrer">Rejoindre le rendez-vous</a></Button> : <p className="text-sm text-slate-700">Votre conseiller vous appellera à l'heure prévue.</p>}
                {slot.canCancel && <Button type="button" variant="outline" className="min-h-11" disabled={cancel.isPending} onClick={() => { if (window.confirm("Annuler ce rendez-vous ?")) cancel.mutate({ slotId: slot.id }); }}>Annuler</Button>}
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3" aria-label="Réserver un rendez-vous" data-testid="remote-open-slots">
          <h3 className="text-base font-bold text-slate-900">Réserver un rendez-vous</h3>
          {days.length === 0 && <p className="text-sm text-slate-600">Aucun créneau libre pour l'instant. Utilisez « J'ai un problème » pour demander un rendez-vous : votre conseiller vous répond.</p>}
          {days.length > 0 && <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Sujet du rendez-vous (facultatif)" aria-label="Sujet du rendez-vous" className="h-12" maxLength={500} />}
          {days.map(([day, slots]) => (
            <div key={day}>
              <p className="text-sm font-semibold capitalize text-slate-800">{day}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <Button key={slot.id} type="button" variant="outline" className="min-h-11 min-w-24" disabled={book.isPending} onClick={() => book.mutate({ slotId: slot.id, note: note.trim() || null })} data-testid={`slot-book-${slot.id}`}>
                    {hour(slot.startsAt)}<span className="ml-1 text-xs text-slate-500">· {SLOT_CHANNEL_LABELS[slot.channel].split(" ")[0]}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {days.length > 0 && <p className="text-xs text-slate-500">Heures affichées à l'heure du Cameroun (Douala). Deux rendez-vous à venir au maximum.</p>}
        </section>
        <SatisfactionCard enabled={enabled} />
      </div>
    </Card>
  );
}

const SCORES = Array.from({ length: 11 }, (_, index) => index);

/** Une question courte après un rendez-vous ou l'ouverture du dossier : usage interne, jamais publié comme témoignage. */
function SatisfactionCard({ enabled }: { enabled: boolean }) {
  const utils = trpc.useUtils();
  const prompt = trpc.adminInsights.mySatisfactionPrompt.useQuery(undefined, { enabled, retry: false });
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const answer = trpc.adminInsights.answerSatisfaction.useMutation({ onSuccess: () => { toast.success("Merci pour votre avis"); setScore(null); setComment(""); void utils.adminInsights.mySatisfactionPrompt.invalidate(); }, onError: (error) => toast.error(error.message) });
  const data = prompt.data;
  if (!data) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" data-testid="client-satisfaction" aria-label="Votre avis">
      <h3 className="text-base font-bold text-slate-900">Votre avis nous aide : {data.label}</h3>
      <p className="mt-1 text-sm text-slate-600">Sur 10, recommanderiez-vous 3M Travel Agency à un proche ? Votre réponse reste interne.</p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Note sur 10">
        {SCORES.map((value) => (
          <button key={value} type="button" role="radio" aria-checked={score === value} onClick={() => setScore(value)} className={`h-11 w-11 rounded-lg border text-sm font-bold ${score === value ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-800"}`}>{value}</button>
        ))}
      </div>
      <Textarea className="mt-3 min-h-16" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Un commentaire ? (facultatif)" aria-label="Commentaire" maxLength={500} />
      <Button type="button" className="mt-3 min-h-11" disabled={score === null || answer.isPending} onClick={() => score !== null && answer.mutate({ milestone: data.milestone, score, comment: comment.trim() || null })} data-testid="satisfaction-send">Envoyer</Button>
    </section>
  );
}
