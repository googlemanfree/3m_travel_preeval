/**
 * Grille tarifaire 3M Solutions — packs simples Afrique (FCFA).
 * Fourchette métier : 50 000 à 600 000 FCFA. Pas de tarifs multi-millions.
 */

export type DigitalPricingPlan = {
  title: string;
  subtitle: string;
  launchRange: string;
  annualRange: string;
  delivery: string;
  points: string[];
};

/** Packs les plus demandés pour agences / PME / entrepreneurs en Afrique. */
export const AFRICA_DIGITAL_PRICING_PLANS: DigitalPricingPlan[] = [
  {
    title: "Essentiel",
    subtitle: "Landing page ou mini-vitrine pour présenter l’offre et recevoir des contacts.",
    launchRange: "50 000 – 150 000 FCFA",
    annualRange: "Maintenance légère sur devis",
    delivery: "1 à 2 semaines",
    points: [
      "1 à 3 pages claires (accueil, services, contact)",
      "Design responsive mobile",
      "Formulaire de contact et mise en ligne",
    ],
  },
  {
    title: "Présence digitale",
    subtitle: "Site vitrine complet pour rassurer les clients et générer des demandes.",
    launchRange: "150 000 – 350 000 FCFA",
    annualRange: "80 000 – 150 000 FCFA / an (optionnel)",
    delivery: "2 à 4 semaines",
    points: [
      "Jusqu’à 6–8 pages structurées",
      "Galerie, FAQ, appels à l’action",
      "Prise en main + petits ajustements au lancement",
    ],
  },
  {
    title: "Business+",
    subtitle: "Site + espace simple (devis, suivi de demandes) pour professions et agences.",
    launchRange: "350 000 – 600 000 FCFA",
    annualRange: "150 000 – 250 000 FCFA / an (optionnel)",
    delivery: "4 à 8 semaines",
    points: [
      "Parcours demande / devis ou mini-espace client",
      "Notifications e-mail et suivi basique",
      "Accompagnement au lancement et formation courte",
    ],
  },
];

export const AFRICA_DIGITAL_PRICING_JSON = JSON.stringify(AFRICA_DIGITAL_PRICING_PLANS);

/** Détecte les anciennes grilles hors fourchette Afrique (> 600 000 FCFA). */
export function isUnreasonableDigitalPricing(pricingJson: string | null | undefined): boolean {
  if (!pricingJson?.trim()) return true;
  const amounts = [...pricingJson.matchAll(/(\d[\d\s]*)\s*(?:FCFA|XAF)?/gi)]
    .map((match) => Number(String(match[1]).replace(/\s+/g, "")))
    .filter((value) => Number.isFinite(value) && value >= 1_000);
  if (!amounts.length) return true;
  return Math.max(...amounts) > 600_000;
}

export function sanitizeDigitalPricingJson(pricingJson: string | null | undefined): string {
  if (isUnreasonableDigitalPricing(pricingJson)) return AFRICA_DIGITAL_PRICING_JSON;
  return pricingJson!.trim();
}
