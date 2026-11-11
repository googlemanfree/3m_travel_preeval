import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const API_NETWORK_ERROR_EVENT = "3m:api-network-error";

export default function ApiConnectionFallback() {
  const [visible, setVisible] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    const announceReconnect = () => {
      setVisible(false);
      setReconnected(true);
      window.setTimeout(() => setReconnected(false), 4200);
    };
    window.addEventListener(API_NETWORK_ERROR_EVENT, show);
    window.addEventListener("offline", show);
    window.addEventListener("online", announceReconnect);
    return () => {
      window.removeEventListener(API_NETWORK_ERROR_EVENT, show);
      window.removeEventListener("offline", show);
      window.removeEventListener("online", announceReconnect);
    };
  }, []);

  if (!visible && !reconnected) return null;

  if (reconnected) {
    return (
      <div
        className="fixed bottom-4 left-4 z-[101] flex max-w-sm items-center gap-2 rounded-xl border border-emerald-200 bg-white/95 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2
          className="h-5 w-5 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
        Connexion rétablie. Vos brouillons en attente sont synchronisés.
      </div>
    );
  }

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
          <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            <strong className="text-slate-900">Disponible hors ligne :</strong>{" "}
            consulter les pages déjà ouvertes et continuer à rédiger vos
            brouillons. Les envois, paiements, connexions et mises à jour de
            dossier reprendront dès la reconnexion.
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
