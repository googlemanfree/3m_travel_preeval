import type { ReactNode } from "react";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import type { VisualSources } from "@/data/premiumVisuals";

type Props = {
  children: ReactNode;
  /** Image de fond très atténuée (optionnel). */
  washVisual?: VisualSources | null;
  className?: string;
  /** Intensité du wash image (0–100). */
  washOpacity?: number;
};

/**
 * Fond de page premium : dégradé atmosphérique + wash photo optionnel.
 * Remplace les fonds plats slate-50 / blue-50.
 */
export function PremiumAtmosphere({
  children,
  washVisual = null,
  className = "",
  washOpacity = 18,
}: Props) {
  return (
    <div
      className={`relative isolate min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_#dbe7f6_0%,_#eef2f7_38%,_#e2e8f0_72%,_#d5dde8_100%)] text-slate-900 ${className}`}
      data-testid="premium-atmosphere"
    >
      {washVisual ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] overflow-hidden" aria-hidden="true">
          <PremiumCoverImage
            visual={washVisual}
            className="absolute inset-0"
            imgClassName="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(241,245,249,0.55)_0%,_rgba(241,245,249,0.92)_55%,_#eef2f7_100%)]"
            style={{ opacity: Math.min(1, Math.max(0.4, 1 - washOpacity / 100)) }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#eef2f7]/70 to-[#eef2f7]" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[48vh] bg-[radial-gradient(circle_at_20%_0%,rgba(14,91,159,0.14),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.10),transparent_36%)]"
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
