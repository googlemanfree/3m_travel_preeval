export type TourismService = "hotel" | "vehicle" | "pack";

const PRESELECTABLE: ReadonlyArray<TourismService> = ["hotel", "vehicle"];

/**
 * Service présélectionné par un lien de la page d'accueil (`/tourisme?service=vehicle`).
 * Toute autre valeur, absente ou inconnue, retombe sur l'hôtel (comportement historique de la page).
 */
export function initialTourismServices(search: string): TourismService[] {
  const requested = new URLSearchParams(search).get("service");
  return PRESELECTABLE.includes(requested as TourismService) ? [requested as TourismService] : ["hotel"];
}
