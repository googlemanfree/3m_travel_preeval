import { useEffect, useState } from "react";
import type { VisualSources } from "@/data/premiumVisuals";

type PremiumCoverImageProps = {
  visual: VisualSources;
  className?: string;
  imgClassName?: string;
  /** Priorité de chargement pour les héros au-dessus de la ligne de flottaison. */
  priority?: boolean;
};

const FAILED_GRADIENT =
  "bg-[radial-gradient(ellipse_at_30%_20%,rgba(14,91,159,0.55),transparent_50%),radial-gradient(ellipse_at_80%_70%,rgba(245,158,11,0.22),transparent_45%),linear-gradient(145deg,#041428_0%,#0a3264_48%,#0e5b9f_100%)]";

const isHostedLocalPhoto = (path: string | undefined) =>
  Boolean(path && /^\/(photos-pays|photos-canada)\//.test(path));

/**
 * Affiche d’abord le fallback local (fiable hors manus-storage).
 * Ne bascule vers manus que si aucune photo locale fiable n’est disponible —
 * certains endpoints manus renvoient un placeholder bleu en HTTP 200.
 */
export function PremiumCoverImage({
  visual,
  className = "",
  imgClassName = "h-full w-full object-cover",
  priority = false,
}: PremiumCoverImageProps) {
  const reliable = visual.localFallback || visual.desktop;
  const preferred = visual.desktop;
  const [src, setSrc] = useState(reliable);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const nextReliable = visual.localFallback || visual.desktop;
    setFailed(false);
    setSrc(nextReliable);

    if (!visual.desktop || visual.desktop === nextReliable) return;
    // Ne jamais remplacer une photo Wikimedia locale par manus-storage.
    if (isHostedLocalPhoto(nextReliable) && !isHostedLocalPhoto(visual.desktop)) return;

    let cancelled = false;
    const probe = new Image();
    probe.decoding = "async";
    probe.onload = () => {
      if (!cancelled) setSrc(visual.desktop);
    };
    probe.onerror = () => {
      /* garder le fallback local */
    };
    probe.src = visual.desktop;

    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [visual.desktop, visual.localFallback, visual.mobile]);

  if (failed) {
    return (
      <div
        className={`${FAILED_GRADIENT} ${className}`}
        aria-hidden="true"
        data-testid="premium-cover-fallback"
      />
    );
  }

  const showMobileSource = Boolean(
    visual.mobile && visual.mobile !== preferred && src === preferred,
  );

  return (
    <div className={`overflow-hidden ${FAILED_GRADIENT} ${className}`}>
      <picture>
        {showMobileSource ? <source media="(max-width: 767px)" srcSet={visual.mobile} /> : null}
        <img
          src={src}
          alt={visual.alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={imgClassName}
          onError={() => {
            if (visual.localFallback && src !== visual.localFallback) {
              setSrc(visual.localFallback);
              return;
            }
            if (src !== reliable && reliable) {
              setSrc(reliable);
              return;
            }
            setFailed(true);
          }}
        />
      </picture>
    </div>
  );
}
