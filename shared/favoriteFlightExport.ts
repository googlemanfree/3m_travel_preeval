export type FavoriteFlightRecord = {
  flight?: {
    originCity?: unknown;
    origin?: unknown;
    destinationCity?: unknown;
    destination?: unknown;
    flightNumber?: unknown;
    departureDate?: unknown;
    airline?: unknown;
  } | null;
};

function airlineName(airline: unknown): string {
  if (typeof airline === "object" && airline !== null && "name" in airline) {
    return String((airline as { name?: unknown }).name ?? "Compagnie aérienne");
  }
  return String(airline ?? "Compagnie aérienne");
}

export function favoriteFlightRows(items: FavoriteFlightRecord[]): string[][] {
  return items.map(({ flight }) => {
    const record = flight ?? {};
    const origin = String(record.originCity ?? record.origin ?? "Départ");
    const destination = String(record.destinationCity ?? record.destination ?? "Arrivée");
    return [
      `${origin} → ${destination}`,
      airlineName(record.airline),
      String(record.flightNumber ?? "Vol"),
      String(record.departureDate ?? "À confirmer"),
    ];
  });
}

export function favoriteFlightsFilename(date = new Date()): string {
  return `3m-vols-favoris-${date.toISOString().slice(0, 10)}.pdf`;
}
