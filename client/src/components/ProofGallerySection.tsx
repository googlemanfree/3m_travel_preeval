import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";

const PROOF_PHOTOS = [
  {
    src: "/proof-photos/proof-letter-1.jpg",
    alt: "Lettre de confirmation IRCC — résidence permanente Canada, informations personnelles masquées",
    caption: "Confirmation officielle IRCC — traitement de résidence permanente",
  },
  {
    src: "/proof-photos/proof-passports-letters-1.jpg",
    alt: "Confirmations de résidence permanente et passeports de clients, informations personnelles masquées",
    caption: "Dossiers de résidence permanente Canada traités par 3M Travel & Services",
  },
  {
    src: "/proof-photos/proof-visas-2x2-1.jpg",
    alt: "Visas Canada approuvés dans des passeports de clients, informations personnelles masquées",
    caption: "Visas Canada obtenus par des candidats accompagnés depuis Yaoundé",
  },
  {
    src: "/proof-photos/proof-china-visa-1.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa de travail Chine obtenu grâce à l'accompagnement 3M Travel & Services",
  },
  {
    src: "/proof-photos/proof-china-visa-2.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Dossier de visa Chine traité et validé pour un candidat camerounais",
  },
  {
    src: "/proof-photos/proof-pr-letters-passports-1.jpg",
    alt: "Confirmations de résidence permanente Canada et passeports de clients, informations personnelles masquées",
    caption: "Quatre dossiers de résidence permanente Canada traités simultanément",
  },
  {
    src: "/proof-photos/proof-express-entry-letter-1.jpg",
    alt: "Lettre IRCC de suivi de dossier Entrée express, informations personnelles masquées",
    caption: "Suivi officiel IRCC — dossier Entrée express en voie de finalisation",
  },
  {
    src: "/proof-photos/proof-canada-visa-1.jpg",
    alt: "Visa Canada approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa de résident permanent Canada obtenu par un candidat accompagné",
  },
  {
    src: "/proof-photos/proof-china-visa-3.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa Chine délivré à Yaoundé pour un candidat suivi par 3M Travel & Services",
  },
  {
    src: "/proof-photos/proof-china-visa-4.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Nouveau dossier de visa Chine mené à terme depuis Yaoundé",
  },
];

export default function ProofGallerySection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {PROOF_PHOTOS.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group text-left rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                  className="h-full w-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
                  style={{ WebkitTouchCallout: "none" }}
                />
              </div>
              <p className="p-3 text-xs font-semibold text-slate-700">{photo.caption}</p>
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={PROOF_PHOTOS[openIndex].caption}
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={PROOF_PHOTOS[openIndex].src}
            alt={PROOF_PHOTOS[openIndex].alt}
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain select-none"
            style={{ WebkitTouchCallout: "none" }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
