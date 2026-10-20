import React from "react";
import type { CountryPhoto } from "@/data/countryPhotos";

type Props = {
  photos: CountryPhoto[];
  country: string;
};

/**
 * Photo de galerie d'un guide pays (la première photo sert d'en-tête de page) et crédits de TOUTES les photos du
 * pays : les licences CC BY et CC BY-SA imposent de citer l'auteur et la licence, avec un lien vers chacun.
 */
export function CountryPhotoGallery({ photos, country }: Props) {
  const feature = photos[1];
  // Une seule photo (déjà affichée en en-tête) : on garde obligatoirement son crédit, exigé par la licence.
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
    <figure className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900" data-testid="country-photo-gallery">
      <img
        src={feature.src}
        alt={feature.alt}
        width={feature.width}
        height={feature.height}
        loading="lazy"
        decoding="async"
        className="aspect-[16/9] w-full object-cover"
      />
      <figcaption className="bg-white px-4 py-3 text-[11px] leading-5 text-slate-500 sm:px-5">
        <span className="font-semibold text-slate-700">{feature.place}.</span> Photos d’illustration ({country}).{" "}
        <span className="font-semibold">Crédits :</span>{" "}
        {photos.map((photo, index) => (
          <span key={photo.src}>
            {index > 0 ? " · " : ""}
            {photo.place},{" "}
            <a href={photo.fileUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">{photo.author}</a>{" "}
            (<a href={photo.licenseUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-blue-700">{photo.license}</a>)
          </span>
        ))}{" "}
        — via Wikimedia Commons.
      </figcaption>
    </figure>
  );
}

export default CountryPhotoGallery;
