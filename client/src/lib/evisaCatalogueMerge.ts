import type { EvisaDestination } from "@/data/evisasDatabaseComplete";

export type ManagedEvisaOverride = {
  slug: string;
  country: string;
  capital: string;
  flag: string;
  region: string;
  visaType: string;
  duration: string;
  delay: string;
  requirements: string;
  fee: string;
  notes: string;
  imageUrl?: string;
  officialPortalUrl: string;
  officialPortalLabel: string;
  officialVerifiedAt: string;
  highlights?: string[];
  emblems?: string[];
  steps?: string[];
  isActive: boolean;
};

function isManagedEvisaOverride(value: Partial<ManagedEvisaOverride>): value is ManagedEvisaOverride {
  return Boolean(value.slug && value.country && value.capital && value.flag && value.region && value.visaType && value.duration && value.delay && value.requirements && value.fee && value.notes && value.officialPortalUrl && value.officialPortalLabel && value.officialVerifiedAt && typeof value.isActive === "boolean");
}

export function mergeEvisaCatalogue(base: EvisaDestination[], overrides: Array<Partial<ManagedEvisaOverride>> | undefined): EvisaDestination[] {
  const validOverrides = (overrides ?? []).filter(isManagedEvisaOverride);
  const bySlug = new Map(validOverrides.map((override) => [override.slug, override]));
  const merged = base.flatMap((entry) => {
    const override = bySlug.get(entry.id);
    if (!override) return [entry];
    if (!override.isActive) return [];
    return [{
      ...entry, id: override.slug, country: override.country, capital: override.capital, flag: override.flag, region: override.region,
      type: override.visaType, duration: override.duration, delay: override.delay, docs: override.requirements, fee: override.fee,
      note: override.notes, image: override.imageUrl || entry.image, officialPortalUrl: override.officialPortalUrl,
      officialPortalLabel: override.officialPortalLabel, officialVerifiedAt: override.officialVerifiedAt,
      highlights: override.highlights?.length ? override.highlights : entry.highlights,
      emblems: override.emblems?.length ? override.emblems : entry.emblems,
      steps: override.steps?.length ? override.steps : entry.steps,
    }];
  });
  const custom = validOverrides.filter((override) => override.isActive && !base.some((entry) => entry.id === override.slug)).map((override) => ({
    id: override.slug, country: override.country, capital: override.capital, flag: override.flag, region: override.region,
    type: override.visaType, duration: override.duration, delay: override.delay, docs: override.requirements, fee: override.fee,
    note: override.notes, image: override.imageUrl || "", officialPortalUrl: override.officialPortalUrl,
    officialPortalLabel: override.officialPortalLabel, officialVerifiedAt: override.officialVerifiedAt,
    highlights: override.highlights ?? [], emblems: override.emblems ?? [], steps: override.steps ?? [], culture: "Destination e‑Visa administrée par 3M Travel & Services.", workInfo: "Conditions à confirmer selon le projet de voyage.",
  }));
  return [...merged, ...custom];
}
