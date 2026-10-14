import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PROOF_COLLAPSED_COUNT,
  PROOF_PHOTOS,
  filterProofPhotos,
  neighbourIndex,
  proofFilterCounts,
  type ProofFilter,
} from "@/data/proofPhotos";

export type ProofGallerySectionProps = {
  /** Filtre initial (accueil = all). */
  initialFilter?: ProofFilter;
  /** Masque les puces de filtre (page contextuelle). */
  lockFilter?: boolean;
  collapsedCount?: number;
  titleFr?: string;
  titleEn?: string;
  leadFr?: string;
  leadEn?: string;
  className?: string;
  /** N’affiche rien si aucune preuve pour le filtre (après repli). */
  hideWhenEmpty?: boolean;
};

/**
 * Charge l’image dès qu’elle entre dans (ou près de) le viewport.
 * Évite les spinners « Chargement de l’image » sur des lazy-load jamais démarrés.
 */
function ProofImage({ photo, priority = false }: { photo: (typeof PROOF_PHOTOS)[number]; priority?: boolean }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [inView, setInView] = useState(priority);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (priority) {
      setInView(true);
      return;
    }
    const node = frameRef.current;
    if (!node) {
      setInView(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, photo.src]);

  useEffect(() => {
    if (!inView) return;
    setLoading(true);
    setFailed(false);

    const syncFromImg = () => {
      const img = imgRef.current;
      if (!img) return false;
      if (img.complete) {
        if (img.naturalWidth > 0) {
          setLoading(false);
          setFailed(false);
        } else {
          setLoading(false);
          setFailed(true);
        }
        return true;
      }
      return false;
    };

    // Le ref peut n’être posé qu’après le paint qui monte le <img>.
    const raf = window.requestAnimationFrame(() => {
      syncFromImg();
    });

    // Filet de sécurité : si onLoad ne part pas, re-vérifier puis échouer.
    const timer = window.setTimeout(() => {
      if (syncFromImg()) return;
      setLoading((current) => {
        if (!current) return current;
        const img = imgRef.current;
        if (img?.complete && img.naturalWidth > 0) return false;
        setFailed(true);
        return false;
      });
    }, 10_000);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [inView, photo.src]);

  return (
    <div ref={frameRef} className="relative aspect-[4/3] overflow-hidden bg-slate-100" data-testid="proof-image-frame">
      {(!inView || (loading && !failed)) && (
        <span
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/90 text-blue-700"
          data-testid="proof-image-loading"
          aria-label={inView ? "Chargement de l’image" : "Image en attente d’affichage"}
          aria-hidden={!inView}
        >
          {inView ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <span className="h-6 w-6 rounded-full bg-slate-200" aria-hidden="true" />}
        </span>
      )}
      {failed ? (
        <div className="flex h-full items-center justify-center px-4 text-center text-xs font-semibold text-slate-500" role="img" aria-label={photo.alt}>
          Image temporairement indisponible
        </div>
      ) : inView ? (
        <img
          ref={imgRef}
          src={photo.src}
          alt={photo.alt}
          loading="eager"
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => {
            setLoading(false);
            setFailed(false);
          }}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
          className={`h-full w-full object-cover transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none group-hover:scale-105 ${loading ? "opacity-0" : "opacity-100"}`}
        />
      ) : null}
    </div>
  );
}

/** Si études/placements sont vides, on montre les visas (preuves de mobilité). */
function resolveFilter(filter: ProofFilter): ProofFilter {
  const direct = filterProofPhotos(PROOF_PHOTOS, filter);
  if (direct.length > 0 || filter === "all") return filter;
  if (filter === "etudes" || filter === "placements") return "visas";
  return filter;
}

export default function ProofGallerySection({
  initialFilter = "all",
  lockFilter = false,
  collapsedCount = PROOF_COLLAPSED_COUNT,
  titleFr,
  titleEn,
  leadFr,
  leadEn,
  className = "py-14 px-4 bg-white",
  hideWhenEmpty = false,
}: ProofGallerySectionProps = {}) {
  const { language, t } = useLanguage();
  const [filter, setFilter] = useState<ProofFilter>(() => resolveFilter(initialFilter));
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setFilter(resolveFilter(initialFilter));
    setExpanded(false);
    setOpenIndex(null);
  }, [initialFilter]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSectionInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSectionInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const filters = proofFilterCounts(PROOF_PHOTOS, language);
  const filtered = filterProofPhotos(PROOF_PHOTOS, filter);
  const visible = expanded ? filtered : filtered.slice(0, collapsedCount);
  const hiddenCount = filtered.length - visible.length;
  const open = openIndex !== null ? filtered[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
      else if (event.key === "ArrowRight") setOpenIndex((current) => (current === null ? null : neighbourIndex(current, filtered.length, 1)));
      else if (event.key === "ArrowLeft") setOpenIndex((current) => (current === null ? null : neighbourIndex(current, filtered.length, -1)));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lastFocused.current?.focus();
    };
  }, [openIndex === null, filtered.length]);

  const choose = (next: ProofFilter) => {
    setFilter(next);
    setExpanded(false);
    setOpenIndex(null);
  };

  if (hideWhenEmpty && filtered.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="proof-gallery-title"
      className={className}
      data-testid="proof-gallery-section"
      data-section-ready={sectionInView ? "true" : "false"}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> {t("Preuves et contextes documentaires", "Documentary proofs and context")}
          </p>
          <h2 id="proof-gallery-title" className="premium-section-title mt-4 text-2xl md:text-3xl">
            {t(
              titleFr ?? "Ils ont avancé avec 3M — voici les preuves",
              titleEn ?? "They moved forward with 3M — here is the evidence",
            )}
          </h2>
          <p className="premium-section-lead mx-auto text-center">
            {t(
              leadFr ??
                "Extraits de dossiers traités par 3M TRAVEL AGENCY et illustrations de parcours, classés par procédure. Les documents sont masqués et les illustrations ne constituent pas une promesse de placement.",
              leadEn ??
                "Excerpts from files handled by 3M TRAVEL AGENCY and journey illustrations, sorted by procedure. Documents are redacted; illustrations are not a promise of placement.",
            )}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs font-semibold text-slate-500" data-testid="proof-brand-note">
            {t(
              "Marque publique : 3M TRAVEL AGENCY (tout filigrane « Travel & Services » sur d’anciens extraits désigne la même agence).",
              "Public brand: 3M TRAVEL AGENCY (any legacy “Travel & Services” watermark on excerpts refers to the same agency).",
            )}
          </p>
          {!lockFilter && (
            <p className="mt-3 text-sm font-bold text-blue-800" data-testid="proof-count" aria-live="polite">
              {PROOF_PHOTOS.length} {t("preuves publiées", "published proofs")}
            </p>
          )}
        </div>

        {!lockFilter && (
          <div role="group" aria-label={t("Filtrer les preuves par type de procédure", "Filter proofs by procedure type")} className="mb-6 flex flex-wrap justify-center gap-2">
            {filters.map((entry) => (
              <button
                key={entry.filter}
                type="button"
                aria-pressed={filter === entry.filter}
                onClick={() => choose(entry.filter)}
                className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  filter === entry.filter ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {entry.label} <span className={filter === entry.filter ? "text-blue-100" : "text-slate-500"}>({entry.count})</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-3">
          {visible.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={(event) => {
                lastFocused.current = event.currentTarget;
                setOpenIndex(index);
              }}
              className="group overflow-hidden rounded-2xl border border-slate-200 text-left shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {/* Vignettes affichées : chargement immédiat (pas de lazy) pour éviter les spinners bloqués. */}
              <ProofImage photo={photo} priority />
              <p className="p-3 text-xs font-semibold text-slate-700">
                {photo.kind === "context" && (
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-amber-700">
                    {t("Illustration contextuelle", "Context illustration")}
                  </span>
                )}
                {photo.caption}
              </p>
            </button>
          ))}
        </div>

        {(hiddenCount > 0 || expanded) && filtered.length > collapsedCount && (
          <div className="mt-6 text-center">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {expanded ? t("Réduire la galerie", "Collapse gallery") : t(`Voir les ${hiddenCount} autres preuves`, `See ${hiddenCount} more proofs`)}
            </button>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={open.caption}
          onClick={() => setOpenIndex(null)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
          {filtered.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex(neighbourIndex(openIndex as number, filtered.length, -1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Preuve précédente"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenIndex(neighbourIndex(openIndex as number, filtered.length, 1));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Preuve suivante"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <figure className="flex max-h-[90vh] max-w-full flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <img src={open.src} alt={open.alt} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
            <figcaption className="mt-3 max-w-xl text-center text-sm text-white">
              {open.caption}{" "}
              <span className="text-white/60">
                ({(openIndex as number) + 1}/{filtered.length})
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
