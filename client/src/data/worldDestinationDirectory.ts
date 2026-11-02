/**
 * Annuaire public des pays du monde (196) pour /destinations et le showcase accueil.
 * Les corridors accompagnés gardent leurs fiches photo ; le reste renvoie vers
 * la procédure catalogue ou l’évaluation gratuite.
 */
import {
  CANDIDATE_DESTINATION_OPTIONS,
  DESTINATION_REGIONS,
  type CandidateDestinationOption,
} from "@shared/candidateDestinationOptions";
import { getPublicDestinationDetail } from "@/lib/publicDestinationCatalog";
import { normalizeDestinationSlug } from "@/data/premiumVisuals";

export const WORLD_DESTINATION_REGION_ORDER = DESTINATION_REGIONS;

export type WorldDestinationEntry = CandidateDestinationOption & {
  href: string;
  visualSlug: string;
  hasProcedurePage: boolean;
};

function resolveHref(option: CandidateDestinationOption): { href: string; hasProcedurePage: boolean } {
  if (option.code === "CA") {
    return { href: "/canada", hasProcedurePage: true };
  }
  const detail = getPublicDestinationDetail(option.name);
  if (detail) {
    return { href: `/procedures/${detail.procedure.id}`, hasProcedurePage: true };
  }
  if (option.hasGuide) {
    return {
      href: `/procedures?q=${encodeURIComponent(option.name)}`,
      hasProcedurePage: false,
    };
  }
  return {
    href: `/?project=travail&destination=${encodeURIComponent(option.name)}#evaluation-multi`,
    hasProcedurePage: false,
  };
}

function toVisualSlug(name: string): string {
  return normalizeDestinationSlug(
    name
      .toLocaleLowerCase("fr")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  );
}

export const WORLD_DESTINATION_DIRECTORY: WorldDestinationEntry[] = CANDIDATE_DESTINATION_OPTIONS.map((option) => {
  const resolved = resolveHref(option);
  return {
    ...option,
    ...resolved,
    visualSlug: toVisualSlug(option.name),
  };
});

export function worldDestinationsByRegion(region: string): WorldDestinationEntry[] {
  return WORLD_DESTINATION_DIRECTORY.filter((entry) => entry.region === region).sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
}

export const WORLD_DESTINATION_COUNT = WORLD_DESTINATION_DIRECTORY.length;
