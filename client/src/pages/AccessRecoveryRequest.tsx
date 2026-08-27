import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Headphones, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type FormState = { fullName: string; dossierNumber: string; newEmail: string; phone: string; preferredContact: "phone" | "whatsapp" | "email"; details: string; website: string };
const initialForm: FormState = { fullName: "", dossierNumber: "", newEmail: "", phone: "", preferredContact: "whatsapp", details: "", website: "" };

export default function AccessRecoveryRequest() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }));
  const submit = trpc.accessRecovery.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: () => toast.error("La demande ne peut pas être enregistrée pour le moment. Réessayez plus tard."),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit.mutate(form);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <Card className="mx-auto max-w-2xl border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="access-recovery-title">
        <div className="flex gap-4 border-b border-slate-100 pb-5">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-800"><Headphones className="h-6 w-6" /></div>
          <div><h1 id="access-recovery-title" className="text-2xl font-black text-slate-950">Assistance pour récupérer l’accès</h1><p className="mt-1 text-sm leading-6 text-slate-600">Utilisez ce formulaire si vous n’avez plus accès à votre ancienne adresse e-mail.</p></div>
        </div>
        {submitted ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950" role="status"><CheckCircle2 className="mr-2 inline h-5 w-5" /><strong>Votre demande a été enregistrée.</strong><p className="mt-2">Un conseiller vous contactera selon le moyen choisi après vérification humaine. Pour votre sécurité, ce message ne confirme ni l’existence d’un compte ni l’état d’un dossier, et aucune adresse n’est modifiée automatiquement.</p><Button type="button" variant="outline" className="mt-4 border-emerald-300 bg-white text-emerald-900" onClick={() => navigate("/login")}>Retour à la connexion</Button></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={submit.isPending}>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><ShieldCheck className="mr-2 inline h-4 w-4" />Un conseiller vérifie votre identité par des informations déjà présentes au dossier ou par un échange officiel. Ne transmettez pas de pièce d’identité, mot de passe, code ou document dans ce formulaire.</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="recovery-full-name">Nom complet</Label><Input id="recovery-full-name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" required /></div>
              <div className="space-y-2"><Label htmlFor="recovery-dossier">Numéro de dossier <span className="font-normal text-slate-500">(si connu)</span></Label><Input id="recovery-dossier" value={form.dossierNumber} onChange={(event) => update("dossierNumber", event.target.value)} placeholder="3M-AAAA-0000" /></div>
              <div className="space-y-2"><Label htmlFor="recovery-new-email">Nouvelle adresse e-mail</Label><Input id="recovery-new-email" type="email" value={form.newEmail} onChange={(event) => update("newEmail", event.target.value)} autoComplete="email" required /></div>
              <div className="space-y-2"><Label htmlFor="recovery-phone">Téléphone / WhatsApp</Label><Input id="recovery-phone" type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="recovery-contact">Moyen de contact souhaité</Label><Select value={form.preferredContact} onValueChange={(value: FormState["preferredContact"]) => update("preferredContact", value)}><SelectTrigger id="recovery-contact"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="phone">Téléphone</SelectItem><SelectItem value="email">Nouvel e-mail</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="recovery-details">Informations utiles <span className="font-normal text-slate-500">(facultatif, 500 caractères maximum)</span></Label><Textarea id="recovery-details" value={form.details} onChange={(event) => update("details", event.target.value)} maxLength={500} placeholder="Expliquez brièvement votre situation, sans document ni information sensible." /></div>
            <div className="sr-only" aria-hidden="true"><Label htmlFor="recovery-website">Site internet</Label><Input id="recovery-website" value={form.website} onChange={(event) => update("website", event.target.value)} tabIndex={-1} autoComplete="off" /></div>
            <div className="flex flex-wrap gap-3"><Button type="submit" disabled={submit.isPending} className="bg-blue-700 hover:bg-blue-800">{submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}{submit.isPending ? "Enregistrement…" : "Demander une assistance"}</Button><Button type="button" variant="outline" onClick={() => navigate("/login")}>Retour à la connexion</Button></div>
          </form>
        )}
      </Card>
    </main>
  );
}
