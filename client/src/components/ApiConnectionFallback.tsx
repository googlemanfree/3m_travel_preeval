import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const API_NETWORK_ERROR_EVENT = "3m:api-network-error";

export default function ApiConnectionFallback() {
  const [visible, setVisible] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    window.addEventListener(API_NETWORK_ERROR_EVENT, show);
    window.addEventListener("offline", show);
    window.addEventListener("online", hide);
    return () => {
      window.removeEventListener(API_NETWORK_ERROR_EVENT, show);
      window.removeEventListener("offline", show);
      window.removeEventListener("online", hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <aside
      className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md"
      role="alert"
      aria-live="assertive"
      aria-label="Connexion au serveur indisponible"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700"
          aria-hidden="true"
        >
          {typeof navigator !== "undefined" && !navigator.onLine ? (
            <WifiOff className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950">
            Connexion temporairement indisponible
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Certaines informations ne peuvent pas être chargées pour le moment.
            Vérifiez votre connexion puis réessayez ; vos données déjà saisies
            restent dans votre navigateur.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-blue-800 hover:bg-blue-900"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Réessayer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl text-slate-700"
              onClick={() => setVisible(false)}
            >
              Continuer hors ligne
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Fermer l’alerte de connexion"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
