import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Image as ImageIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { CountryPhoto } from "@/data/countryPhotos";

type SortMode = "position" | "place";

type Props = {
  photos: CountryPhoto[];
  country: string;
};

function PhotoSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 ${className}`}
      aria-hidden="true"
      data-testid="country-photo-skeleton"
    />
  );
}

function ProgressivePhoto({
  photo,
  className = "h-full w-full object-cover",
  priority = false,
}: {
  photo: CountryPhoto;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {!loaded && <PhotoSkeleton className="absolute inset-0" />}
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function PhotoCredits({ photos, country }: { photos: CountryPhoto[]; country: string }) {
  return (
    <figcaption className="bg-white px-4 py-3 text-[11px] leading-5 text-slate-500 sm:px-5">
      <span className="font-semibold text-slate-700">{photos[0]?.place}.</span> Photos d’illustration ({country}).{" "}
      <span className="font-semibold">Crédits :</span>{" "}
      {photos.map((photo, index) => (
        <span key={photo.src}>
          {index > 0 ? " · " : ""}
          {photo.place},{" "}
          <a href={photo.fileUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">
            {photo.author}
          </a>{" "}
          (
          <a href={photo.licenseUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">
            {photo.license}
          </a>
          )
        </span>
      ))}{" "}
      — via Wikimedia Commons.
    </figcaption>
  );
}

/**
 * Galerie des photos d’une fiche pays. La première photo sert généralement d’en-tête ; les suivantes sont
 * proposées ici avec chargement différé, filtres, crédits complets et visionneuse tactile.
 */
export function CountryPhotoGallery({ photos, country }: Props) {
  const feature = photos[1];
  const [placeFilter, setPlaceFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("position");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const galleryPhotos = useMemo(() => {
    const candidates = photos.slice(1).length > 0 ? photos.slice(1) : photos;
    const filtered = placeFilter === "all" ? candidates : candidates.filter((photo) => photo.place === placeFilter);
    return sortMode === "place"
      ? [...filtered].sort((a, b) => a.place.localeCompare(b.place, "fr"))
      : filtered;
  }, [photos, placeFilter, sortMode]);

  const places = useMemo(() => Array.from(new Set(photos.slice(1).map((photo) => photo.place))).sort((a, b) => a.localeCompare(b, "fr")), [photos]);
  const selectedPhoto = lightboxIndex === null ? null : galleryPhotos[lightboxIndex] ?? null;

  useEffect(() => {
    if (lightboxIndex !== null && !selectedPhoto) setLightboxIndex(null);
  }, [lightboxIndex, selectedPhoto]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") setLightboxIndex((index) => (index === null ? null : (index - 1 + galleryPhotos.length) % galleryPhotos.length));
      if (event.key === "ArrowRight") setLightboxIndex((index) => (index === null ? null : (index + 1) % galleryPhotos.length));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [galleryPhotos.length, lightboxIndex]);

  const moveLightbox = (direction: -1 | 1) => {
    setLightboxIndex((index) => (index === null || galleryPhotos.length === 0 ? null : (index + direction + galleryPhotos.length) % galleryPhotos.length));
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX;
    if (Math.abs(delta) >= 45) moveLightbox(delta < 0 ? 1 : -1);
    setTouchStartX(null);
  };

  if (!feature) {
    const [only] = photos;
    if (!only) return null;
    return (
      <p className="mt-2 text-[11px] leading-5 text-slate-500" data-testid="country-photo-credits">
        <span className="font-semibold text-slate-700">{only.place}.</span> Photo d’illustration ({country}).{" "}
        <span className="font-semibold">Crédit :</span>{" "}
        <a href={only.fileUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">{only.author}</a>{" "}
        (<a href={only.licenseUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">{only.license}</a>) — via Wikimedia Commons.
      </p>
    );
  }

  return (
    <>
      <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900" data-testid="country-photo-gallery">
        <div className="relative aspect-[16/9] w-full bg-slate-100">
          <ProgressivePhoto photo={feature} priority />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-slate-950/75 to-transparent p-4 pt-12 text-white">
            <span className="text-sm font-semibold drop-shadow">{feature.place}</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/90"><ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> {galleryPhotos.length} photo{galleryPhotos.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        {galleryPhotos.length > 0 && (
          <div className="border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-5" data-testid="country-photo-controls">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <SlidersHorizontal className="h-4 w-4 text-blue-300" aria-hidden="true" />
                <span>Filtrer les photos</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="country-photo-place">Lieu</label>
                <select
                  id="country-photo-place"
                  value={placeFilter}
                  onChange={(event) => setPlaceFilter(event.target.value)}
                  className="min-h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300 [&>option]:text-slate-900"
                >
                  <option value="all">Tous les lieux</option>
                  {places.map((place) => <option key={place} value={place}>{place}</option>)}
                </select>
                <label className="sr-only" htmlFor="country-photo-sort">Trier</label>
                <select
                  id="country-photo-sort"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="min-h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300 [&>option]:text-slate-900"
                >
                  <option value="position">Ordre de la galerie</option>
                  <option value="place">Lieu A → Z</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 bg-slate-950 p-2 sm:grid-cols-2" data-testid="country-photo-thumbnails">
          {galleryPhotos.length > 0 ? galleryPhotos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative min-h-40 overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              aria-label={`Ouvrir la photo de ${photo.place}`}
            >
              <ProgressivePhoto photo={photo} className="h-48 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-56" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-3 pb-2 pt-8 text-xs font-semibold text-white">{photo.place}</span>
              <span className="absolute right-2 top-2 rounded-full bg-slate-950/65 p-2 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><Expand className="h-4 w-4" aria-hidden="true" /></span>
            </button>
          )) : (
            <p className="col-span-full px-3 py-6 text-center text-sm text-slate-300">Aucune photo ne correspond à ce filtre.</p>
          )}
        </div>
        <PhotoCredits photos={photos} country={country} />
      </figure>

      {selectedPhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Visionneuse photo ${selectedPhoto.place}`}
          onClick={(event) => { if (event.target === event.currentTarget) setLightboxIndex(null); }}
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={handleTouchEnd}
          data-testid="country-photo-lightbox"
        >
          <button type="button" onClick={() => setLightboxIndex(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white" aria-label="Fermer la visionneuse">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => moveLightbox(-1)} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:left-6" aria-label="Photo précédente">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex max-h-full max-w-5xl flex-col items-center gap-3">
            <div className="max-h-[78vh] overflow-hidden rounded-xl bg-slate-900 shadow-2xl">
              <ProgressivePhoto photo={selectedPhoto} className="max-h-[78vh] w-auto max-w-[92vw] object-contain" priority />
            </div>
            <p className="text-center text-sm font-semibold text-white">{selectedPhoto.place} · {lightboxIndex + 1}/{galleryPhotos.length}</p>
          </div>
          <button type="button" onClick={() => moveLightbox(1)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white sm:right-6" aria-label="Photo suivante">
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70 sm:bottom-6">Glissez pour naviguer · Échap pour fermer</p>
        </div>
      )}
    </>
  );
}

export default CountryPhotoGallery;
