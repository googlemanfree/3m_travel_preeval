import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const DISMISS_KEY = "adminTwoFactorNoticeDismissed";

/**
 * Rappel visible tant que l'administrateur connecté n'a pas activé la double authentification.
 * Sans verrouillage par tentatives (retiré à la demande de l'agence), elle est la protection principale du compte : le rappel
 * revient à chaque nouvelle session (la fermeture n'est mémorisée que pour la session en cours).
 */
export default function AdminTwoFactorNotice({ sessionToken }: { sessionToken: string }) {
  const [location, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    try { return typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  const status = trpc.adminAuth.twoFactorStatus.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchOnWindowFocus: false });

  if (dismissed || !sessionToken || location.startsWith("/admin/securite")) return null;
  // Tant que l'état n'est pas connu, ou si la vérification échoue, aucun faux avertissement n'est affiché.
  if (!status.data || status.data.enabled !== false) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      data-testid="admin-2fa-notice"
      className="fixed bottom-4 left-4 z-[60] max-w-sm rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0 text-sm text-amber-950">
          <p className="font-bold">Protégez votre compte administrateur</p>
          <p className="mt-1 leading-5">La double authentification n’est pas activée. Elle protège les dossiers des candidats et est exigée pour les actions sensibles (CVthèque, pièces privées).</p>
          <Button type="button" size="sm" className="mt-3 bg-amber-700 text-white hover:bg-amber-800" onClick={() => navigate("/admin/securite")}>Activer maintenant</Button>
        </div>
        <button
          type="button"
          aria-label="Fermer ce rappel pour cette session"
          className="rounded-md p-1 text-amber-800 hover:bg-amber-100"
          onClick={() => { try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* le rappel reviendra */ } setDismissed(true); }}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
