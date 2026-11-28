import React from "react";
import { FileText, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  sessionToken: string;
  /** « online_12 » ou « agency_7 » */
  candidateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

/** Date ISO → valeur d'un champ « datetime-local » (heure de Douala, UTC+1, sans changement d'heure). */
function toLocalInput(iso: string): string {
  const date = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 16) : "";
}
function fromLocalInput(value: string): string {
  const date = new Date(new Date(`${value}:00.000Z`).getTime() - 60 * 60 * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function openPdf(base64: string) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) toast.error("Autorisez les fenêtres pop-up pour voir l'aperçu PDF.");
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/**
 * Reçu et Protocole d'accord N°01 : valeurs par défaut proposées, modifiables à tout moment, aperçu PDF, enregistrement, puis envoi ensemble.
 * Le montant des frais d'ouverture est propre à chaque dossier. L'envoi reste réservé aux paiements confirmés.
 */
export function AdminReceiptProtocolEditor({ sessionToken, candidateId, open, onOpenChange, onChanged }: Props) {
  const utils = trpc.useUtils();
  const query = trpc.adminDocumentDrafts.get.useQuery(
    { sessionToken, candidateId: candidateId ?? "online_0" },
    { enabled: open && Boolean(candidateId) && Boolean(sessionToken), refetchOnWindowFocus: false, retry: false },
  );
  const data = query.data;

  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("XAF");
  const [paymentDate, setPaymentDate] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [protocol, setProtocol] = React.useState("");
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);

  // Les champs se remplissent une fois par dossier ouvert : la saisie en cours n'est jamais écrasée par une actualisation.
  React.useEffect(() => {
    if (!data || !candidateId || loadedFor === candidateId) return;
    const effective = data.receipt.saved ?? data.receipt.defaults;
    setAmount(String(Math.round(effective.amount)));
    setCurrency(effective.currency);
    setPaymentDate(toLocalInput(effective.paymentDate));
    setMethod(effective.paymentMethod);
    setReference(effective.paymentReference ?? "");
    setProtocol(data.protocol.content);
    setLoadedFor(candidateId);
  }, [data, candidateId, loadedFor]);
  React.useEffect(() => {
    if (!open) setLoadedFor(null);
  }, [open]);

  const receiptPayload = () => ({
    amount: Number(amount.replace(/\s/g, "")),
    currency: currency.trim().toUpperCase(),
    paymentDate: fromLocalInput(paymentDate),
    paymentMethod: method,
    paymentReference: reference.trim() ? reference.trim() : null,
  });

  const refresh = () => {
    void utils.adminDocumentDrafts.get.invalidate();
    onChanged?.();
  };
  const fail = (title: string) => (error: { message: string }) => toast.error(title, { description: error.message });

  const saveReceipt = trpc.adminDocumentDrafts.saveReceipt.useMutation({ onSuccess: () => { toast.success("Reçu enregistré", { description: "C'est cette version qui partira avec le protocole." }); refresh(); }, onError: fail("Reçu non enregistré") });
  const resetReceipt = trpc.adminDocumentDrafts.resetReceipt.useMutation({ onSuccess: () => { toast.success("Reçu rétabli aux valeurs par défaut"); setLoadedFor(null); refresh(); }, onError: fail("Rétablissement impossible") });
  const previewReceipt = trpc.adminDocumentDrafts.previewReceipt.useMutation({ onSuccess: (result) => openPdf(result.pdfBase64), onError: fail("Aperçu du reçu impossible") });
  const saveProtocol = trpc.adminDocumentDrafts.saveProtocol.useMutation({ onSuccess: () => { toast.success("Protocole enregistré", { description: "C'est ce texte qui partira au candidat." }); refresh(); }, onError: fail("Protocole non enregistré") });
  const resetProtocol = trpc.adminDocumentDrafts.resetProtocol.useMutation({ onSuccess: () => { toast.success("Protocole rétabli au texte par défaut"); setLoadedFor(null); refresh(); }, onError: fail("Rétablissement impossible") });
  const previewProtocol = trpc.adminDocumentDrafts.previewProtocol.useMutation({ onSuccess: (result) => openPdf(result.pdfBase64), onError: fail("Aperçu du protocole impossible") });
  const sendPackage = trpc.adminCandidateManagement.sendReceiptAndProtocol.useMutation({
    onSuccess: (result) => { toast.success(result.alreadySent ? "Déjà envoyé" : `Reçu et protocole envoyés à ${result.email}`); refresh(); },
    onError: fail("Envoi impossible"),
  });

  const busy = [saveReceipt, resetReceipt, previewReceipt, saveProtocol, resetProtocol, previewProtocol, sendPackage].some((mutation) => mutation.isPending);
  const sent = Boolean(data?.packageSentAt);

  // Un envoi part toujours avec la version ENREGISTRÉE : on enregistre d'abord ce qui est à l'écran, puis on envoie.
  const handleSend = async () => {
    if (!candidateId || !data) return;
    const verb = sent ? "Renvoyer" : "Envoyer";
    if (!window.confirm(`${verb} le reçu et le protocole d'accord à ${data.fullName} (${data.email}) ?\n\nMontant du reçu : ${amount} ${currency}`)) return;
    try {
      await saveReceipt.mutateAsync({ sessionToken, candidateId, receipt: receiptPayload() });
      await saveProtocol.mutateAsync({ sessionToken, candidateId, content: protocol });
      await sendPackage.mutateAsync({ sessionToken, candidateId, resend: sent });
    } catch {
      /* chaque étape affiche déjà son message d'erreur */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col overflow-hidden" data-testid="receipt-protocol-editor">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-700" />Reçu et protocole d'accord{data ? ` — ${data.fullName}` : ""}</DialogTitle>
          <DialogDescription>
            {data ? `Dossier ${data.dossierNumber} · ${data.email}. ` : ""}
            Les valeurs par défaut sont proposées ; modifiez-les à tout moment avant l'envoi. Le montant des frais d'ouverture est propre à chaque dossier.
          </DialogDescription>
        </DialogHeader>

        {query.isLoading && <p className="py-8 text-center text-sm text-slate-600">Chargement…</p>}
        {query.isError && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{query.error.message}</p>}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs" data-testid="editor-status">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${data.paymentConfirmed ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>
                {data.paymentConfirmed ? "Paiement confirmé" : "Paiement non confirmé — l'envoi sera possible après confirmation"}
              </span>
              {data.receipt.modified && <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-900">Reçu modifié</span>}
              {data.protocol.modified && <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-900">Protocole modifié</span>}
              {sent && <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-900">Déjà envoyé le {new Date(data.packageSentAt as string).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>}
            </div>

            <Tabs defaultValue="receipt" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="receipt" data-testid="editor-tab-receipt">Reçu</TabsTrigger>
                <TabsTrigger value="protocol" data-testid="editor-tab-protocol">Protocole d'accord</TabsTrigger>
              </TabsList>

              <TabsContent value="receipt" className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label htmlFor="receipt-amount">Montant des frais d'ouverture</Label>
                    <Input id="receipt-amount" data-testid="receipt-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d\s]/g, ""))} />
                    <p className="mt-1 text-xs text-slate-500">Proposé : {Math.round(data.receipt.defaults.amount).toLocaleString("fr-FR")} {data.receipt.defaults.currency}</p>
                  </div>
                  <div>
                    <Label htmlFor="receipt-currency">Devise</Label>
                    <Input id="receipt-currency" data-testid="receipt-currency" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="receipt-date">Date et heure du paiement (heure de Douala)</Label>
                    <Input id="receipt-date" data-testid="receipt-date" type="datetime-local" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="receipt-method">Mode de paiement</Label>
                    <Input id="receipt-method" data-testid="receipt-method" maxLength={120} value={method} onChange={(event) => setMethod(event.target.value)} />
                  </div>
                  <div className="sm:col-span-3">
                    <Label htmlFor="receipt-reference">Référence de transaction (facultatif)</Label>
                    <Input id="receipt-reference" data-testid="receipt-reference" maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => candidateId && previewReceipt.mutate({ sessionToken, candidateId, receipt: receiptPayload() })} data-testid="receipt-preview">
                    {previewReceipt.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Aperçu PDF
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => candidateId && saveReceipt.mutate({ sessionToken, candidateId, receipt: receiptPayload() })} data-testid="receipt-save">
                    <Save className="mr-2 h-4 w-4" />Enregistrer le reçu
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy || !data.receipt.modified} onClick={() => { if (candidateId && window.confirm("Rétablir les valeurs par défaut du reçu ?")) resetReceipt.mutate({ sessionToken, candidateId }); }} data-testid="receipt-reset">
                    <RotateCcw className="mr-2 h-4 w-4" />Rétablir les valeurs par défaut
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="protocol" className="flex min-h-0 flex-1 flex-col gap-3">
                <Label htmlFor="protocol-text">Texte du protocole d'accord N°01</Label>
                <Textarea id="protocol-text" data-testid="protocol-text" value={protocol} onChange={(event) => setProtocol(event.target.value)} spellCheck className="min-h-[320px] flex-1 font-mono text-[13px] leading-6" />
                <p className="text-xs text-slate-500">{protocol.length.toLocaleString("fr-FR")} caractères. Les titres en majuscules et les lignes vides sont conservés dans le PDF. Le montant du dossier est repris du reçu.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={busy} onClick={() => candidateId && previewProtocol.mutate({ sessionToken, candidateId, content: protocol })} data-testid="protocol-preview">
                    {previewProtocol.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}Aperçu PDF
                  </Button>
                  <Button type="button" disabled={busy} onClick={() => candidateId && saveProtocol.mutate({ sessionToken, candidateId, content: protocol })} data-testid="protocol-save">
                    <Save className="mr-2 h-4 w-4" />Enregistrer le protocole
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy || !data.protocol.modified} onClick={() => { if (candidateId && window.confirm("Rétablir le texte par défaut du protocole ? Vos modifications seront perdues.")) resetProtocol.mutate({ sessionToken, candidateId }); }} data-testid="protocol-reset">
                    <RotateCcw className="mr-2 h-4 w-4" />Rétablir le texte par défaut
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <p className="text-xs text-slate-600">
                {data.paymentConfirmed
                  ? "L'envoi enregistre d'abord le reçu et le protocole affichés, puis les envoie ensemble au candidat."
                  : "Le reçu et le protocole partent après la confirmation du paiement : vous pouvez les préparer dès maintenant."}
              </p>
              <Button type="button" className="bg-blue-700 hover:bg-blue-800" disabled={busy || !data.paymentConfirmed} onClick={() => void handleSend()} data-testid="editor-send">
                {sendPackage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sent ? "Renvoyer le reçu et le protocole" : "Envoyer le reçu et le protocole"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
