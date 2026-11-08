import { DESTINATIONS_20, getDestination20 } from "@/data/destinations20";
import { DESTINATION_OFFICIAL_SOURCES } from "@/data/destinationOfficialSources";
import { buildFrameworkGuide } from "./framework";
import { luxembourgGuide } from "./luxembourg";
import type { CandidateGuide } from "./types";

/** Guides rédigés et sourcés pays par pays (reprise des guides PDF validés). Les autres destinations utilisent le cadre commun. */
const AUTHORED_GUIDES: Record<string, CandidateGuide> = {
  luxembourg: luxembourgGuide,
};

/** Guide candidat d'une destination du site : rédigé si disponible, sinon cadre commun + repères du pays. `null` si la destination est inconnue. */
export function getCandidateGuide(slug: string): CandidateGuide | null {
  const authored = AUTHORED_GUIDES[slug];
  if (authored) return authored;
  const destination = getDestination20(slug);
  if (!destination) return null;
  return buildFrameworkGuide(destination, DESTINATION_OFFICIAL_SOURCES[destination.slug] ?? []);
}

/** Tous les guides disponibles (une entrée par destination du répertoire). */
export function getAllCandidateGuides(): CandidateGuide[] {
  return DESTINATIONS_20.map((destination) => getCandidateGuide(destination.slug)).filter((guide): guide is CandidateGuide => guide !== null);
}

export type { CandidateGuide } from "./types";
