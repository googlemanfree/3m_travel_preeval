import { MessageCircle, ReceiptText } from "lucide-react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import RequirementQuickUpload from "@/components/RequirementQuickUpload";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { proofLabel } from "@shared/paymentProof";

const office = COMPANY_PROFILE.offices.cameroon;

/**
 * Envoyer la preuve d'un virement ou d'un dépôt Mobile Money (capture, reçu) depuis son espace : elle arrive à côté du paiement à
 * vérifier, sous le nom de la référence. La preuve n'est pas un paiement : l'agence confirme la réception avant toute activation.
 * Sans compte connecté, la preuve s'envoie sur WhatsApp avec la référence.
 */
export default function PaymentProofUpload({ reference, className = "" }: { reference: string; className?: string }) {
  const { isAuthenticated } = useCandidateAuth();
  if (!reference) return null;
  const whatsappHref = `https://wa.me/${office.whatsappNumber}?text=${encodeURIComponent(`Bonjour 3M Travel & Services, voici la preuve de mon paiement. Référence : ${reference}`)}`;

  return (
    <div className={`rounded-xl border border-blue-100 bg-white p-4 ${className}`} data-testid="payment-proof-upload">
      <p className="flex items-center gap-2 text-sm font-black text-slate-950"><ReceiptText className="h-4 w-4 text-blue-700" aria-hidden="true" />Envoyer la preuve de paiement</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">Après un virement ou un dépôt Mobile Money, envoyez la capture ou le reçu : l’agence le retrouve avec la référence <strong className="font-mono">{reference}</strong> et confirme la réception. Le paiement n’est pris en compte qu’après cette confirmation.</p>
      {isAuthenticated ? (
        <RequirementQuickUpload label={proofLabel(reference)} buttonLabel="Envoyer ma preuve" doneMessage={() => "Preuve envoyée. L’agence vérifie la réception et vous confirme par e-mail."} />
      ) : (
        <div className="mt-2 text-xs text-slate-700">
          <a href="/login" className="font-bold text-blue-700 underline">Connectez-vous</a> pour envoyer la preuve depuis votre espace, ou envoyez-la sur{" "}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-emerald-700 underline" data-testid="proof-whatsapp"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />WhatsApp</a>.
        </div>
      )}
    </div>
  );
}
