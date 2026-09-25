import React, { useMemo, useState } from "react";
import { Copy, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  REVIEW_SERVICE_OPTIONS,
  buildReviewInviteMessage,
  buildReviewInviteUrl,
  buildReviewInviteWhatsAppUrl,
} from "@/lib/reviewInvitation";

/**
 * Prépare l'invitation d'un client à donner son avis. Rien n'est envoyé d'ici : l'équipe ouvre WhatsApp ou copie le
 * message. Le client garde la main (accord de publication, nom d'affichage) et la modération reste obligatoire.
 */
export default function ReviewInvitationPanel() {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [destination, setDestination] = useState("");

  const url = useMemo(() => buildReviewInviteUrl({ serviceType, destinationCountry: destination }), [serviceType, destination]);
  const message = useMemo(() => buildReviewInviteMessage({ firstName, url }), [firstName, url]);
  const whatsappUrl = useMemo(() => buildReviewInviteWhatsAppUrl({ phone, message }), [phone, message]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié : collez-le dans WhatsApp ou par e-mail.");
    } catch {
      toast.error("Copie impossible : sélectionnez le message et copiez-le à la main.");
    }
  };

  const fieldClass = "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900";
  return (
    <Card className="mb-6 p-5" aria-labelledby="review-invite-title" data-testid="review-invitation-panel">
      <h2 id="review-invite-title" className="flex items-center gap-2 text-lg font-black text-slate-950"><Send className="h-5 w-5 text-blue-700" aria-hidden="true" /> Inviter un client à donner son avis</h2>
      <p className="mt-1 text-sm text-slate-600">Le client dépose son avis lui-même, avec son accord de publication ; il apparaît ici pour modération. Invitez les clients de façon neutre, y compris ceux dont le dossier s’est mal passé : ne triez pas.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">Prénom du client<input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={40} className={fieldClass} placeholder="Ex. Aïcha" /></label>
        <label className="text-xs font-medium text-slate-700">Numéro WhatsApp (facultatif)<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={20} className={fieldClass} placeholder="Ex. 237 6 98 10 48 32" /></label>
        <label className="text-xs font-medium text-slate-700">Service concerné<select value={serviceType} onChange={(event) => setServiceType(event.target.value)} className={fieldClass}><option value="">Non précisé</option>{REVIEW_SERVICE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-700">Pays de destination (facultatif)<input value={destination} onChange={(event) => setDestination(event.target.value)} maxLength={100} className={fieldClass} placeholder="Ex. Canada" /></label>
      </div>
      <label className="mt-4 block text-xs font-medium text-slate-700">Message à envoyer
        <textarea readOnly value={message} rows={9} className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-900" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Ouvrir WhatsApp</a>
        </Button>
        <Button type="button" variant="outline" onClick={copy}><Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Copier le message</Button>
      </div>
    </Card>
  );
}
