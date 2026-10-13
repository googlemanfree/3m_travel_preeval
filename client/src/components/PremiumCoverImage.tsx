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
 * Image de couverture avec source mobile (picture) et bascule vers le fallback local
 * lorsque /manus-storage est indisponible (dev local, proxy absent).
 */
export function PremiumCoverImage({
  visual,
  className = "",
  imgClassName = "h-full w-full object-cover",
  priority = false,
}: PremiumCoverImageProps) {
  const [desktopSrc, setDesktopSrc] = useState(visual.desktop);
  const [mobileSrc, setMobileSrc] = useState(visual.mobile || visual.desktop);
  const [failed, setFailed] = useState(false);

  const fallback = visual.localFallback || null;
  const hasDistinctMobile = Boolean(mobileSrc && mobileSrc !== desktopSrc);

  if (failed) {
    return <div className={`bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 ${className}`} aria-hidden="true" />;
  }

  const handleError = () => {
    if (fallback && desktopSrc !== fallback) {
      setDesktopSrc(fallback);
      setMobileSrc(fallback);
      return;
    }
    setFailed(true);
  };

  return (
    <div className={`overflow-hidden bg-gradient-to-br from-blue-900 to-slate-950 ${className}`}>
      <picture>
        {hasDistinctMobile ? (
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
        ) : null}
        <img
          src={desktopSrc}
          alt={visual.alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={imgClassName}
          onError={handleError}
        />
      </picture>
    </div>
  );
}
