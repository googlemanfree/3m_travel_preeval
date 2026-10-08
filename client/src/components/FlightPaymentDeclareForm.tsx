import { useState } from "react";
import { Loader, Landmark, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

type Props = {
  requestId: number;
  onDeclared?: () => void;
};

/**
 * Déclare un paiement manuel (agence / Orange Money) → statut « en attente de paiement ».
 * Le billet n’est jamais émis automatiquement : l’agence vérifie puis émet.
 */
export default function FlightPaymentDeclareForm({ requestId, onDeclared }: Props) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"agency" | "orange_money">("orange_money");
  const [transactionId, setTransactionId] = useState("");
  const utils = trpc.useUtils();
  const mutation = trpc.flightBooking.clientValidate.useMutation({
    onSuccess: () => {
      toast({
        title: "Paiement déclaré",
        description: "Votre dossier est en attente de paiement : l’agence vérifie la réception, puis prépare l’émission.",
      });
      setTransactionId("");
      void utils.flightBooking.getMyRequests.invalidate();
      onDeclared?.();
    },
    onError: (error) => {
      toast({ title: "Déclaration impossible", description: error.message, variant: "destructive" });
    },
  });

  return (
    <form
      className="mt-3 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-left"
      data-testid="flight-payment-declare-form"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = transactionId.trim();
        if (trimmed.length < 3) {
          toast({ title: "Référence requise", description: "Indiquez l’ID de transaction ou le reçu agence (min. 3 caractères).", variant: "destructive" });
          return;
        }
        mutation.mutate({ requestId, paymentMethod, paymentTransactionId: trimmed });
      }}
    >
      <p className="text-xs font-black uppercase tracking-wide text-amber-900">Déclarer un paiement (hors ligne)</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPaymentMethod("orange_money")}
          className={`touch-target inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${
            paymentMethod === "orange_money" ? "border-amber-500 bg-white text-amber-950" : "border-amber-100 bg-amber-100/40 text-amber-800"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden="true" /> Orange Money
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod("agency")}
          className={`touch-target inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${
            paymentMethod === "agency" ? "border-amber-500 bg-white text-amber-950" : "border-amber-100 bg-amber-100/40 text-amber-800"
          }`}
        >
          <Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Agence
        </button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`payment-tx-${requestId}`} className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
          ID transaction / reçu
        </Label>
        <Input
          id={`payment-tx-${requestId}`}
          value={transactionId}
          onChange={(event) => setTransactionId(event.target.value)}
          placeholder="Ex. OM123456 ou reçu guichet"
          maxLength={120}
          className="h-10 rounded-xl border-amber-200 bg-white font-mono text-sm"
          data-testid="flight-payment-tx-input"
        />
      </div>
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="h-10 w-full rounded-xl bg-amber-700 font-black text-white hover:bg-amber-800"
        data-testid="flight-payment-declare-submit"
      >
        {mutation.isPending ? <Loader className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {mutation.isPending ? "Envoi…" : "Passer en attente de paiement"}
      </Button>
      <p className="text-[11px] leading-4 text-amber-800">
        Aucun billet n’est émis à cette étape. L’agence confirme la réception du paiement avant l’émission.
      </p>
    </form>
  );
}
