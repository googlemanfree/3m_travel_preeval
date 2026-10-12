import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MAX_OPENING_FEE_XAF, MIN_OPENING_FEE_XAF, formatXaf, isValidOpeningFee } from "@shared/openingFee";

type FeePayment = { id: number; dossierNumber: string; fullName: string; expectedAmount: number; currency: string };

/**
 * Fixe le montant des frais d'ouverture d'un dossier. Il dépend du type de profil et doit être confirmé par écrit
 * au candidat avant tout paiement ; le serveur refuse toute modification une fois le paiement validé.
 */
export default function AdminOpeningFeeDialog({ payment, onClose, onSaved }: { payment: FeePayment | null; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const setOpeningFee = trpc.application.adminSetOpeningFee.useMutation();

  useEffect(() => {
    setAmount(payment ? String(payment.expectedAmount) : "");
    setReason("");
  }, [payment]);

  const value = Number(amount);
  const amountOk = isValidOpeningFee(value);
  const reasonOk = reason.trim().length >= 3;

  const save = () => {
    if (!payment || !amountOk || !reasonOk) return;
    setOpeningFee.mutate(
      { id: payment.id, amount: value, reason: reason.trim() },
      {
        onSuccess: (result) => {
          toast.success(result.changed ? `Frais d’ouverture fixés à ${formatXaf(result.amount, payment.currency)}` : "Montant inchangé");
          onSaved();
        },
        onError: (error) => toast.error(error.message || "Le montant n’a pas pu être enregistré."),
      },
    );
  };

  return (
    <Dialog open={payment !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Frais d’ouverture du dossier {payment?.dossierNumber}</DialogTitle>
          <DialogDescription>
            {payment?.fullName} · le montant dépend du type de profil. Confirmez-le par écrit au candidat avant tout paiement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="opening-fee-amount" className="text-xs font-semibold text-slate-800">Montant ({payment?.currency ?? "XAF"})</Label>
            <Input id="opening-fee-amount" type="number" inputMode="numeric" min={MIN_OPENING_FEE_XAF} max={MAX_OPENING_FEE_XAF} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
            {!amountOk && amount !== "" && (
              <p className="mt-1 text-xs text-rose-700" role="alert">Entrez un entier entre {formatXaf(MIN_OPENING_FEE_XAF)} et {formatXaf(MAX_OPENING_FEE_XAF)}.</p>
            )}
            {payment && <p className="mt-1 text-xs text-slate-500">Montant actuel : {formatXaf(payment.expectedAmount, payment.currency)}</p>}
          </div>
          <div>
            <Label htmlFor="opening-fee-reason" className="text-xs font-semibold text-slate-800">Motif (profil, accord du candidat…)</Label>
            <Input id="opening-fee-reason" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={setOpeningFee.isPending}>Annuler</Button>
          <Button onClick={save} disabled={!amountOk || !reasonOk || setOpeningFee.isPending}>
            {setOpeningFee.isPending ? "Enregistrement…" : "Enregistrer le montant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
