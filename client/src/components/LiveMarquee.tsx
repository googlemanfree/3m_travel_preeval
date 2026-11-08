import { useState, type CSSProperties, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type MarqueeDetail = { title: string; eyebrow?: string; description: string; href: string; linkLabel?: string };
export type MarqueeItem = { key: string; node: ReactNode; detail?: MarqueeDetail };

/** Durée d'un tour complet : proportionnelle au nombre d'éléments pour garder une vitesse de lecture constante. */
export function marqueeDuration(count: number, secondsPerItem = 6): number {
  return Math.min(240, Math.max(30, Math.round(count * secondsPerItem)));
}

/**
 * Bandeau défilant en boucle, en CSS pur (aucune boucle JavaScript).
 *  - Mouvement coupé si le visiteur réduit les animations (système ou réglage du site) : la liste devient
 *    alors défilable à la main, sans copie.
 *  - Pause au survol, au focus clavier et par un bouton (le texte qui bouge plus de 5 s doit pouvoir s'arrêter).
 *  - La copie qui assure la boucle est masquée aux lecteurs d'écran et inerte (pas de doublon au clavier).
 */
export function LiveMarquee({ items, label, secondsPerItem = 6, testId }: { items: MarqueeItem[]; label: string; secondsPerItem?: number; testId?: string }) {
  const { t } = useLanguage();
  const motionAllowed = useMotionAllowed();
  const [paused, setPaused] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<MarqueeDetail | null>(null);
  if (items.length === 0) return null;

  const interactive = items.some((item) => Boolean(item.detail));
  const moving = motionAllowed && items.length > 1 && !interactive;
  const style = { "--marquee-duration": `${marqueeDuration(items.length, secondsPerItem)}s` } as CSSProperties;

  const renderItem = (item: MarqueeItem) => item.detail ? (
    <button type="button" className="block w-full text-left" onMouseEnter={() => setPaused(true)} onFocus={() => setPaused(true)} onPointerDown={() => setPaused(true)} onClick={() => setSelectedDetail(item.detail!)} data-testid={testId ? `${testId}-detail-${item.key}` : undefined}>
      {item.node}
      <span className="sr-only">{t("Afficher les détails", "Show details")}</span>
    </button>
  ) : item.node;

  return (
    <div className="relative" data-testid={testId}>
      <div className="live-marquee" data-moving={moving ? "true" : "false"} data-paused={paused ? "true" : "false"} style={style}>
        <div className="live-marquee__track">
          <ul className="live-marquee__group" aria-label={label}>
            {items.map((item) => (
              <li key={item.key} className="live-marquee__item">{renderItem(item)}</li>
            ))}
          </ul>
          {moving && (
            <ul className="live-marquee__group" aria-hidden="true" inert data-testid={testId ? `${testId}-copy` : undefined}>
              {items.map((item) => (
                <li key={`copy-${item.key}`} className="live-marquee__item">{item.node}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {moving && (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? t("Reprendre le défilement", "Resume scrolling") : t("Mettre le défilement en pause", "Pause scrolling")}
          className="absolute -top-9 right-0 inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          data-testid={testId ? `${testId}-toggle` : undefined}
        >
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Pause className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{paused ? t("Reprendre", "Resume") : t("Pause", "Pause")}</span>
        </button>
      )}
      <Dialog open={Boolean(selectedDetail)} onOpenChange={(open) => !open && setSelectedDetail(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            {selectedDetail?.eyebrow ? <p className="text-xs font-black uppercase tracking-wider text-blue-700">{selectedDetail.eyebrow}</p> : null}
            <DialogTitle>{selectedDetail?.title}</DialogTitle>
            <DialogDescription>{selectedDetail?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <DialogClose asChild><Button type="button" variant="outline">{t("Fermer", "Close")}</Button></DialogClose>
            {selectedDetail ? <a href={selectedDetail.href} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">{selectedDetail.linkLabel ?? t("Ouvrir la fiche", "Open the page")}</a> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
