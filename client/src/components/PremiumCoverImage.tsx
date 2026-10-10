import { useState } from "react";
import type { VisualSources } from "@/data/premiumVisuals";

type PremiumCoverImageProps = {
  visual: VisualSources;
  className?: string;
  imgClassName?: string;
  /** Priorité de chargement pour les héros au-dessus de la ligne de flottaison. */
  priority?: boolean;
};

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

  if (failed) {
    return <div className={`bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 ${className}`} aria-hidden="true" />;
  }

  return (
    <div className={`overflow-hidden bg-gradient-to-br from-blue-900 to-slate-950 ${className}`}>
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
    </div>
  );
}
