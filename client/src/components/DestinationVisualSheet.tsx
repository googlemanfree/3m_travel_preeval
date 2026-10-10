import { getDestinationGallerySheet } from "@/data/destinationGallery";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { CountryPhotoGallery } from "@/components/CountryPhotoGallery";

type DestinationVisualSheetProps = {
  slugOrId: string;
  countryName: string;
  /** Affiche la galerie créditée sous le hero (photos-pays). */
  showGallery?: boolean;
  className?: string;
};

/**
 * Fiche visuelle unique : même hero + galerie partout (hub, procédures, études).
 */
export function DestinationVisualSheet({
  slugOrId,
  countryName,
  showGallery = true,
  className = "",
}: DestinationVisualSheetProps) {
  const sheet = getDestinationGallerySheet(slugOrId);
  if (!sheet) return null;

  return (
    <div className={className} data-testid="destination-visual-sheet" data-slug={sheet.slug}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <PremiumCoverImage
          visual={sheet.hero}
          className="aspect-[21/9] sm:aspect-[2.4/1]"
          imgClassName="h-full w-full object-cover"
        />
      </div>
      {showGallery && sheet.gallery.length > 1 && (
        <CountryPhotoGallery photos={sheet.gallery} country={countryName} />
      )}
    </div>
  );
}
