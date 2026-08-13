export type FlightDateInput = {
  tripType: "ONE_WAY" | "ROUND_TRIP" | "MULTI";
  departureDate: string;
  returnDate?: string;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function isoToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function validateFlightDates(input: FlightDateInput, now = new Date()): string | null {
  const departure = parseIsoDate(input.departureDate);
  if (!departure) return "La date de départ est invalide.";
  if (input.departureDate < isoToday(now)) return "La date de départ ne peut pas être passée.";

  if (input.tripType === "ROUND_TRIP") {
    if (!input.returnDate) return "Une date de retour est requise pour un aller-retour.";
    const returnDate = parseIsoDate(input.returnDate);
    if (!returnDate) return "La date de retour est invalide.";
    if (input.returnDate < input.departureDate) {
      return "La date de retour doit être postérieure ou égale à la date de départ.";
    }
  }

  return null;
}
