import { ShieldAlert } from "lucide-react";
import { GENERIC_FRAUD_REMINDER, LINKS_VERIFIED_ON } from "@shared/procedureTrust";

/**
 * Bloc commun aux pages de procédure, sous les sources officielles : date de vérification des liens (auparavant invisible pour le
 * visiteur), et rappel anti-arnaque générique. `hasCountrySpecificFraudAlert` masque le rappel générique sur une page qui a déjà
 * sa propre alerte anti-fraude documentée pour ce pays (elle serait redondante, et moins précise).
 */
export default function ProcedureTrustFooter({ hasCountrySpecificFraudAlert = false }: { hasCountrySpecificFraudAlert?: boolean }) {
  return (
    <div className="mt-4 border-t border-slate-200 pt-4" data-testid="procedure-trust-footer">
      <p className="text-xs text-slate-500" data-testid="links-verified-on">Liens vérifiés le {LINKS_VERIFIED_ON.label}. Les conditions officielles évoluent : revérifiez-les au moment de votre démarche.</p>
      {!hasCountrySpecificFraudAlert && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-900" data-testid="generic-fraud-reminder">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />{GENERIC_FRAUD_REMINDER}
        </p>
      )}
    </div>
  );
}
