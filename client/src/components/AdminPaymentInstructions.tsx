import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";
import { EMPTY_PAYMENT_INSTRUCTIONS, OPERATOR_LABELS, describePaymentMethods, sanitizePaymentInstructions, type MobileMoneyOperator, type PaymentInstructions } from "@shared/paymentMethods";

const MAX_ACCOUNTS = 4;

/**
 * Coordonnées de paiement affichées au public (virement, dépôt Mobile Money, agence). Saisies ici, jamais dans le code :
 * chaque enregistrement prévient l'agence par e-mail, pour détecter toute modification frauduleuse.
 */
export function AdminPaymentInstructions({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.paymentInstructions.getForAdmin.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: 1 });
  const [draft, setDraft] = useState<PaymentInstructions>(EMPTY_PAYMENT_INSTRUCTIONS);
  const [loaded, setLoaded] = useState(false);
  const mutation = trpc.paymentInstructions.update.useMutation({
    onSuccess: () => {
      toast({ title: "Coordonnées enregistrées", description: "L’agence a été prévenue par e-mail de cette modification." });
      void utils.paymentInstructions.getForAdmin.invalidate();
      void utils.paymentInstructions.getPublic.invalidate();
    },
    onError: (error) => toast({ title: "Enregistrement refusé", description: error.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (query.data && !loaded) {
      setDraft(query.data.instructions);
      setLoaded(true);
    }
  }, [query.data, loaded]);

  const issues = sanitizePaymentInstructions(draft).issues;
  const setBank = (field: keyof PaymentInstructions["bankTransfer"], value: string) => setDraft((current) => ({ ...current, bankTransfer: { ...current.bankTransfer, [field]: value } }));
  const setAgency = (field: keyof PaymentInstructions["agency"], value: string) => setDraft((current) => ({ ...current, agency: { ...current.agency, [field]: value } }));
  const setAccount = (index: number, field: "operator" | "number" | "accountName", value: string) =>
    setDraft((current) => ({ ...current, mobileMoney: current.mobileMoney.map((account, position) => (position === index ? { ...account, [field]: value } : account)) as PaymentInstructions["mobileMoney"] }));

  const save = () => {
    if (issues.length > 0) return;
    if (!window.confirm("Ces coordonnées seront affichées publiquement et envoyées aux clients. Vérifiez-les caractère par caractère : une erreur ferait payer sur un mauvais compte. Enregistrer ?")) return;
    mutation.mutate({ sessionToken, instructions: { bankTransfer: draft.bankTransfer, mobileMoney: draft.mobileMoney, agency: draft.agency, generalNote: draft.generalNote } });
  };

  const preview = describePaymentMethods(draft, Boolean(query.data?.onlineEnabled));

  if (query.isLoading) return <Card className="p-6 text-sm text-slate-500">Chargement des coordonnées de paiement…</Card>;
  if (query.error) return <Card className="p-6 text-sm text-rose-700">Impossible de charger les coordonnées de paiement : {query.error.message}</Card>;

  return (
    <Card className="space-y-6 p-6" data-testid="admin-payment-instructions">
      <div>
        <h2 className="text-lg font-black text-slate-950">Moyens de paiement affichés sur le site</h2>
        <p className="mt-1 text-sm text-slate-600">Renseignez vos coordonnées réelles : virement, numéros Mobile Money de dépôt, agence. Tant qu’une section est vide, le site indique « coordonnées communiquées sur demande ».</p>
        <p className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-xs ${query.data?.onlineEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          {query.data?.onlineEnabled ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          {query.data?.onlineEnabled ? "Passerelle en ligne (CinetPay) configurée : carte et Mobile Money en ligne sont proposés." : "Passerelle en ligne (CinetPay) non configurée : carte et Mobile Money en ligne apparaissent « Bientôt disponibles ». Renseignez CINETPAY_SITE_ID et CINETPAY_API_KEY pour les activer."}
        </p>
        {query.data?.instructions.updatedAt && <p className="mt-2 text-xs text-slate-500">Dernière modification : {new Date(query.data.instructions.updatedAt).toLocaleString("fr-FR")} par {query.data.instructions.updatedBy ?? "—"}.</p>}
      </div>

      <section>
        <h3 className="text-sm font-black text-slate-900">Virement bancaire</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="pi-bank">Banque</Label><Input id="pi-bank" value={draft.bankTransfer.bankName} onChange={(e) => setBank("bankName", e.target.value)} maxLength={120} /></div>
          <div><Label htmlFor="pi-holder">Titulaire du compte</Label><Input id="pi-holder" value={draft.bankTransfer.accountHolder} onChange={(e) => setBank("accountHolder", e.target.value)} maxLength={120} /></div>
          <div><Label htmlFor="pi-iban">IBAN</Label><Input id="pi-iban" value={draft.bankTransfer.iban} onChange={(e) => setBank("iban", e.target.value)} maxLength={40} /></div>
          <div><Label htmlFor="pi-bic">BIC / SWIFT</Label><Input id="pi-bic" value={draft.bankTransfer.bic} onChange={(e) => setBank("bic", e.target.value)} maxLength={15} /></div>
          <div><Label htmlFor="pi-account">Numéro de compte (si pas d’IBAN)</Label><Input id="pi-account" value={draft.bankTransfer.accountNumber} onChange={(e) => setBank("accountNumber", e.target.value)} maxLength={40} /></div>
          <div className="sm:col-span-2"><Label htmlFor="pi-bank-note">Précision (facultatif)</Label><Textarea id="pi-bank-note" value={draft.bankTransfer.note} onChange={(e) => setBank("note", e.target.value)} rows={2} maxLength={500} /></div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Dépôt Mobile Money sur le numéro de l’agence</h3>
          <Button type="button" variant="outline" size="sm" disabled={draft.mobileMoney.length >= MAX_ACCOUNTS} onClick={() => setDraft((current) => ({ ...current, mobileMoney: [...current.mobileMoney, { operator: "mtn", number: "", accountName: "" }] }))}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Ajouter un numéro
          </Button>
        </div>
        {draft.mobileMoney.length === 0 && <p className="mt-2 text-xs text-slate-500">Aucun numéro renseigné.</p>}
        {draft.mobileMoney.map((account, index) => (
          <div key={index} className="mt-3 grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[150px_1fr_1fr_auto]">
            <div>
              <Label htmlFor={`pi-op-${index}`}>Opérateur</Label>
              <select id={`pi-op-${index}`} value={account.operator} onChange={(e) => setAccount(index, "operator", e.target.value as MobileMoneyOperator)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm">
                {(Object.keys(OPERATOR_LABELS) as MobileMoneyOperator[]).map((operator) => <option key={operator} value={operator}>{OPERATOR_LABELS[operator]}</option>)}
              </select>
            </div>
            <div><Label htmlFor={`pi-num-${index}`}>Numéro</Label><Input id={`pi-num-${index}`} inputMode="tel" value={account.number} onChange={(e) => setAccount(index, "number", e.target.value)} maxLength={30} /></div>
            <div><Label htmlFor={`pi-name-${index}`}>Nom du titulaire</Label><Input id={`pi-name-${index}`} value={account.accountName} onChange={(e) => setAccount(index, "accountName", e.target.value)} maxLength={120} /></div>
            <Button type="button" variant="ghost" aria-label={`Supprimer le numéro ${index + 1}`} className="self-end text-rose-600" onClick={() => setDraft((current) => ({ ...current, mobileMoney: current.mobileMoney.filter((_, position) => position !== index) }))}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-sm font-black text-slate-900">Paiement en agence</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="pi-address">Adresse (par défaut : bureau de Yaoundé)</Label><Input id="pi-address" value={draft.agency.address} onChange={(e) => setAgency("address", e.target.value)} maxLength={200} /></div>
          <div><Label htmlFor="pi-hours">Horaires (par défaut : horaires du bureau)</Label><Input id="pi-hours" value={draft.agency.hours} onChange={(e) => setAgency("hours", e.target.value)} maxLength={160} /></div>
          <div className="sm:col-span-2"><Label htmlFor="pi-agency-note">Précision (facultatif)</Label><Textarea id="pi-agency-note" value={draft.agency.note} onChange={(e) => setAgency("note", e.target.value)} rows={2} maxLength={500} /></div>
        </div>
      </section>

      <div><Label htmlFor="pi-general">Note générale affichée sous les moyens de paiement (facultatif)</Label><Textarea id="pi-general" value={draft.generalNote} onChange={(e) => setDraft((current) => ({ ...current, generalNote: e.target.value }))} rows={2} maxLength={600} /></div>

      <section aria-label="Aperçu client">
        <h3 className="text-sm font-black text-slate-900">Ce que verront les clients</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {preview.map((method) => (
            <li key={method.id} className="rounded-xl border border-slate-200 p-3 text-xs"><strong className="text-slate-900">{method.title}</strong> — <span className={method.status === "available" ? "text-emerald-700" : "text-amber-700"}>{method.statusLabel}</span></li>
          ))}
        </ul>
      </section>

      {issues.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          {issues.map((issue) => <li key={issue.field + issue.message}>{issue.message}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={mutation.isPending || issues.length > 0}>{mutation.isPending ? "Enregistrement…" : "Enregistrer les coordonnées"}</Button>
        <p className="text-xs text-slate-500">Chaque enregistrement envoie une alerte à l’agence (sécurité).</p>
      </div>
    </Card>
  );
}
