import { useEffect, useState } from "react";
import { CloudOff, Download, RefreshCw, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activatePwaUpdate, isPwaPreviewHost } from "@/lib/pwaClient";

export default function PwaStatusNotice() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

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
      {updateRegistration && (
        <div className="fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-blue-100 p-2 text-blue-800"><Download className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-black text-slate-900">Nouvelle version disponible</p>
              <p className="mt-0.5 text-xs text-slate-600">Actualisez maintenant pour profiter des dernières améliorations.</p>
            </div>
          </div>
          <Button type="button" onClick={() => activatePwaUpdate(updateRegistration)} className="h-10 shrink-0 rounded-xl bg-blue-800 font-bold text-white hover:bg-blue-950">
            <RefreshCw className="mr-2 h-4 w-4" /> Actualiser
          </Button>
        </div>
      )}
      {online && !updateRegistration && <span className="sr-only"><Wifi /> Connexion active</span>}
    </>
  );
}
