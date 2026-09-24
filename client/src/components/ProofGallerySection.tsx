import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, X } from "lucide-react";
import { PROOF_COLLAPSED_COUNT, PROOF_PHOTOS, filterProofPhotos, neighbourIndex, proofFilterCounts, type ProofFilter } from "@/data/proofPhotos";

export default function ProofGallerySection() {
  const [filter, setFilter] = useState<ProofFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const filters = proofFilterCounts(PROOF_PHOTOS);
  const filtered = filterProofPhotos(PROOF_PHOTOS, filter);
  const visible = expanded ? filtered : filtered.slice(0, PROOF_COLLAPSED_COUNT);
  const hiddenCount = filtered.length - visible.length;

  // Le diaporama parcourt les photos du filtre courant, y compris celles repliées dans la grille.
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

  return (
    <section aria-labelledby="proof-gallery-title" className="py-14 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Dossiers réels, résultats vérifiables
          </p>
          <h2 id="proof-gallery-title" className="mt-4 text-2xl md:text-3xl font-black text-slate-950">Des preuves concrètes, pas des promesses</h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-600">
            Extraits de dossiers réellement traités par 3M Travel &amp; Services. Toutes les informations personnelles (noms, numéros de passeport, dates de naissance, codes-barres) ont été masquées avant publication, avec l'accord des candidats concernés.
          </p>
          <p className="mt-3 text-sm font-bold text-blue-800" data-testid="proof-count" aria-live="polite">
            {PROOF_PHOTOS.length} preuves publiées
          </p>
        </div>

        <div role="group" aria-label="Filtrer les preuves par destination" className="mb-6 flex flex-wrap justify-center gap-2">
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
              {entry.label} <span className={filter === entry.filter ? "text-blue-100" : "text-slate-400"}>({entry.count})</span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {visible.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={(event) => {
                lastFocused.current = event.currentTarget;
                setOpenIndex(index);
              }}
              className="group text-left rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="p-3 text-xs font-semibold text-slate-700">{photo.caption}</p>
            </button>
          ))}
        </div>

        {(hiddenCount > 0 || expanded) && filtered.length > PROOF_COLLAPSED_COUNT && (
          <div className="mt-6 text-center">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {expanded ? "Réduire la galerie" : `Voir les ${hiddenCount} autres preuves`}
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
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
              {open.caption} <span className="text-white/60">({(openIndex as number) + 1}/{filtered.length})</span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
