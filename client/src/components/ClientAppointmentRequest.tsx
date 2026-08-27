import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type AppointmentMessage = {
  id?: number;
  content?: string;
  createdAt?: Date | string;
  senderRole?: string;
};

type ClientAppointmentRequestProps = {
  dossierNumber: string | null;
  messages: AppointmentMessage[];
  onRequested: () => Promise<unknown> | void;
};

const todayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export default function ClientAppointmentRequest({ dossierNumber, messages, onRequested }: ClientAppointmentRequestProps) {
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [preferredContact, setPreferredContact] = useState<"phone" | "whatsapp" | "email">("whatsapp");
  const [reason, setReason] = useState("");

  const recentRequests = useMemo(
    () => messages
      .filter((message) => message.senderRole === "candidate" && (message.content ?? "").startsWith("[RENDEZ-VOUS]"))
      .slice(0, 2),
    [messages],
  );

  const requestAppointment = trpc.candidate.requestBilanAppointment.useMutation({
    onSuccess: async () => {
      setPreferredDate("");
      setPreferredTime("");
      setReason("");
      toast.success("Votre demande a été transmise à l’agence pour confirmation.");
      await onRequested();
    },
    onError: (error) => toast.error(error.message || "La demande n’a pas pu être transmise. Réessayez."),
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preferredDate || !preferredTime || reason.trim().length < 4) {
      toast.error("Indiquez une date, une heure et le motif de votre demande.");
      return;
    }
    requestAppointment.mutate({
      preferredDate,
      preferredTime,
      preferredContact,
      reason: reason.trim(),
    });
  };

  return (
    <section aria-labelledby="appointment-request-title">
      <Card className="border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-3">
            <span className="shrink-0 rounded-xl bg-sky-100 p-3 text-sky-800"><CalendarDays className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Accompagnement 3M</p>
              <h3 id="appointment-request-title" className="mt-1 text-lg font-black text-slate-950">Demander un rendez-vous</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Proposez un créneau : l’agence le confirme, l’ajuste ou vous répond dans la messagerie. Aucun rendez-vous n’est réservé automatiquement.</p>
              <p className="mt-2 text-xs font-semibold text-sky-900">Dossier concerné : <span className="font-mono">{dossierNumber || "en cours d’attribution"}</span></p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-900"><ShieldCheck className="h-3.5 w-3.5" /> Confirmation humaine</span>
        </div>

        <form className="mt-5 grid gap-3 border-t border-sky-100 pt-5 md:grid-cols-2" onSubmit={submit}>
          <div>
            <Label htmlFor="appointment-date" className="text-xs font-bold text-slate-800">Date souhaitée</Label>
            <Input id="appointment-date" type="date" min={todayLocal()} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="mt-1 h-11 bg-white" required />
          </div>
          <div>
            <Label htmlFor="appointment-time" className="text-xs font-bold text-slate-800">Heure souhaitée</Label>
            <Input id="appointment-time" type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="mt-1 h-11 bg-white" required />
          </div>
          <div>
            <Label htmlFor="appointment-contact" className="text-xs font-bold text-slate-800">Canal préféré</Label>
            <select id="appointment-contact" value={preferredContact} onChange={(event) => setPreferredContact(event.target.value as "phone" | "whatsapp" | "email")} className="mt-1 h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Téléphone</option>
              <option value="email">E-mail</option>
            </select>
          </div>
          <div>
            <Label htmlFor="appointment-reason" className="text-xs font-bold text-slate-800">Motif du rendez-vous</Label>
            <Textarea id="appointment-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={280} placeholder="Ex. Clarifier les documents à compléter" className="mt-1 min-h-11 resize-none bg-white" required />
          </div>
          <div className="md:col-span-2 flex flex-col justify-between gap-3 rounded-xl border border-sky-100 bg-white/80 p-3 sm:flex-row sm:items-center">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-600"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" /> La demande apparaît dans la file de l’agence avec votre dossier. Une confirmation vous sera communiquée après revue.</p>
            <Button type="submit" disabled={requestAppointment.isPending} className="h-11 shrink-0 bg-sky-800 font-bold text-white hover:bg-sky-900">
              {requestAppointment.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmission…</> : <><CalendarDays className="mr-2 h-4 w-4" /> Envoyer la demande</>}
            </Button>
          </div>
        </form>

        {recentRequests.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white/75 p-3" aria-live="polite">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700"><MessageSquare className="h-3.5 w-3.5" /> Dernières demandes transmises</p>
            <div className="mt-2 space-y-1.5">
              {recentRequests.map((request, index) => <p key={request.id ?? `appointment-${index}`} className="text-xs text-slate-600">Demande envoyée le {request.createdAt ? new Date(request.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" }) : "récemment"} — en attente d’une confirmation ou réponse de l’agence.</p>)}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
