import { useEffect, useState } from "react";
import { LAZY_PAGE_TIMEOUT_MS } from "@/lib/lazyWithTimeout";

export default function PageLoadingFallback() {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(LAZY_PAGE_TIMEOUT_MS / 1000));

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setSecondsLeft(Math.max(0, Math.ceil((LAZY_PAGE_TIMEOUT_MS - elapsed) / 1000)));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, []);

  const totalSeconds = Math.ceil(LAZY_PAGE_TIMEOUT_MS / 1000);
  const progress = Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100));
  const isRecovering = secondsLeft === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
      className="relative isolate flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-[#06152f] px-5 py-12 text-white sm:px-8"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(32,92,190,.48),transparent_35%),radial-gradient(circle_at_82%_78%,rgba(244,185,66,.18),transparent_30%),linear-gradient(135deg,#06152f_0%,#0d2d6d_54%,#071b3d_100%)]" />
      <div aria-hidden="true" className="absolute -left-24 top-12 -z-10 h-64 w-64 rounded-full border border-white/10 bg-white/5 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-20 right-0 -z-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="w-full max-w-2xl rounded-[2rem] border border-white/15 bg-slate-950/25 p-5 shadow-[0_28px_80px_rgba(0,0,0,.35)] backdrop-blur-sm sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-amber-200/60 bg-white/95 p-2 shadow-[0_0_32px_rgba(244,185,66,.25)]">
            <img src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg" alt="" className="h-full w-full object-contain" />
            <span aria-hidden="true" className="absolute -inset-1 rounded-[1.65rem] border border-amber-200/35 motion-safe:animate-pulse" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs font-black uppercase tracking-[.2em] text-amber-200">3M Travel &amp; Services</p>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Nous préparons votre espace</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">Le contenu demandé est en cours de chargement. Votre navigation et votre session restent actives.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-4 text-xs font-semibold text-blue-100">
                <span className="flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(253,224,71,.95)]" />Chargement sécurisé</span>
                <span className="tabular-nums text-amber-100">{isRecovering ? "Vérification" : `${secondsLeft} s`}</span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full border border-white/15 bg-white/10 p-[2px]"
                role="progressbar"
                aria-label="Temps avant récupération automatique"
                aria-valuemin={0}
                aria-valuemax={totalSeconds}
                aria-valuenow={secondsLeft}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-200 to-blue-300 shadow-[0_0_16px_rgba(244,185,66,.85)] transition-[width] duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs leading-5 text-blue-100" aria-live="assertive">
                <span className="sr-only">Chargement de la page… </span>
            {isRecovering
              ? "Le réseau ne répond pas. Récupération automatique en cours…"
              : `Nouvelle tentative automatique dans ${secondsLeft} seconde${secondsLeft > 1 ? "s" : ""}.`}
              </p>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
          <span className="h-2 rounded-full bg-white/20" />
          <span className="h-2 rounded-full bg-white/15" />
          <span className="h-2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
