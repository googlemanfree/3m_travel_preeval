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
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-6 text-foreground"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        />
        <div className="w-full space-y-2">
          <p className="text-sm font-medium text-foreground">Chargement de la page…</p>
          <p className="text-xs text-muted-foreground" aria-live="assertive">
            {isRecovering
              ? "Le réseau ne répond pas. Récupération automatique en cours…"
              : `Nouvelle tentative automatique dans ${secondsLeft} seconde${secondsLeft > 1 ? "s" : ""}.`}
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Temps avant récupération automatique"
            aria-valuemin={0}
            aria-valuemax={totalSeconds}
            aria-valuenow={secondsLeft}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
