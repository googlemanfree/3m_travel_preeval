import { useEffect, useState } from "react";
import { CloudOff, Download, RefreshCw, Wifi, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activatePwaUpdate, isPwaPreviewHost } from "@/lib/pwaClient";

export default function PwaStatusNotice() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if (!("serviceWorker" in navigator) || isPwaPreviewHost()) {
      return () => {
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }

    let activeRegistration: ServiceWorkerRegistration | null = null;
    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      activeRegistration = registration;
      if (registration.waiting) setUpdateRegistration(registration);
      const onUpdateFound = () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateRegistration(registration);
        });
      };
      registration.addEventListener("updatefound", onUpdateFound);
      return () => registration.removeEventListener("updatefound", onUpdateFound);
    };

    let removeUpdateListener: (() => void) | undefined;
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) removeUpdateListener = inspectRegistration(registration);
    }).catch(() => undefined);

    return () => {
      removeUpdateListener?.();
      activeRegistration = null;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[100] flex min-h-10 items-center justify-center gap-2 bg-slate-950 px-4 py-2 text-center text-xs font-bold text-white shadow-lg" role="status" aria-live="polite">
          <CloudOff className="h-4 w-4 shrink-0 text-amber-300" />
          <span>Mode hors connexion — les informations déjà consultées restent disponibles.</span>
        </div>
      )}
      {updateRegistration && !updateDismissed && (
        <div className="fixed bottom-4 right-4 z-[90] flex w-[min(22rem,calc(100%-2rem))] items-center gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-lg shadow-slate-900/10 backdrop-blur" role="status" aria-live="polite">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Download className="h-4 w-4" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">Nouvelle version disponible</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Actualisez quand cela vous convient.</p>
          </div>
          <Button type="button" size="sm" onClick={() => activatePwaUpdate(updateRegistration)} className="h-8 shrink-0 rounded-lg bg-blue-800 px-2.5 text-xs font-bold text-white hover:bg-blue-950">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Actualiser
          </Button>
          <button type="button" onClick={() => setUpdateDismissed(true)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" aria-label="Masquer la notification de mise à jour">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      {online && !updateRegistration && <span className="sr-only"><Wifi /> Connexion active</span>}
    </>
  );
}
