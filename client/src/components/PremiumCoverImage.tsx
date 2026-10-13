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

/**
 * Image de couverture avec bascule automatique vers le fallback local
 * lorsque /manus-storage est indisponible (dev local, proxy absent).
 */
export function PremiumCoverImage({
  visual,
  className = "",
  imgClassName = "h-full w-full object-cover",
  priority = false,
}: PremiumCoverImageProps) {
  const [src, setSrc] = useState(visual.desktop);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(visual.desktop);
    setFailed(false);
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

  const showMobileSource = Boolean(visual.mobile && visual.mobile !== visual.desktop && src === visual.desktop);

  return (
    <div className={`overflow-hidden ${FAILED_GRADIENT} ${className}`}>
      <picture>
        {showMobileSource ? (
          <source media="(max-width: 767px)" srcSet={visual.mobile} />
        ) : null}
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
            setFailed(true);
          }}
        />
      </picture>
    </div>
  );
}
