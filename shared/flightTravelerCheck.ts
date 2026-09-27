/**
 * Contrôle des données voyageurs d'une réservation de vol (nom tel que sur le passeport, numéro, validité, naissance).
 * Fonctions pures, sans alias `@/` : importées par le serveur ET par l'espace client. Rien n'est deviné : une donnée
 * absente ou illisible est signalée, jamais complétée.
 */

export type TravelerDetails = { fullName: string; passportNumber: string; passportExpiry: string; dateOfBirth: string; nationality?: string };
export type TravelerIssue = { field: keyof TravelerDetails; severity: "error" | "warning"; message: string };

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ'’. -]+$/;
const PASSPORT_PATTERN = /^[A-Z0-9]{5,12}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date « AAAA-MM-JJ » réelle (le 31 février est refusé) ; null sinon. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = ISO_DATE.exec(String(value ?? "").trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

const addMonthsUtc = (date: Date, months: number): Date => {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
};

export const normalizePassportNumber = (value: string | null | undefined): string => String(value ?? "").replace(/\s+/g, "").toUpperCase();
const clean = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * `lastTravelDate` : dernière date de voyage (retour si aller-retour, sinon départ), « AAAA-MM-JJ ».
 * Le passeport doit couvrir tout le voyage (erreur sinon) ; la règle des 6 mois n'est qu'un avertissement, car elle dépend du pays.
 */
export function checkTraveler(traveler: Partial<TravelerDetails>, options: { lastTravelDate: string | null; today: Date }): TravelerIssue[] {
  const issues: TravelerIssue[] = [];
  const fullName = clean(traveler.fullName).replace(/\s+/g, " ");
  if (!fullName) issues.push({ field: "fullName", severity: "error", message: "Indiquez le nom complet tel qu’il est écrit sur le passeport." });
  else if (!NAME_PATTERN.test(fullName)) issues.push({ field: "fullName", severity: "error", message: "Le nom ne doit contenir que des lettres (pas de chiffres ni de symboles)." });
  else if (fullName.split(" ").length < 2) issues.push({ field: "fullName", severity: "warning", message: "Un seul mot : indiquez prénom(s) et nom exactement comme sur le passeport." });

  const passportNumber = normalizePassportNumber(traveler.passportNumber);
  if (!passportNumber) issues.push({ field: "passportNumber", severity: "error", message: "Indiquez le numéro de passeport." });
  else if (!PASSPORT_PATTERN.test(passportNumber)) issues.push({ field: "passportNumber", severity: "error", message: "Numéro de passeport invalide : 5 à 12 lettres ou chiffres, sans symbole." });

  const today = new Date(Date.UTC(options.today.getUTCFullYear(), options.today.getUTCMonth(), options.today.getUTCDate()));
  const expiry = parseIsoDate(traveler.passportExpiry);
  if (!clean(traveler.passportExpiry)) issues.push({ field: "passportExpiry", severity: "error", message: "Indiquez la date d’expiration du passeport." });
  else if (!expiry) issues.push({ field: "passportExpiry", severity: "error", message: "Date d’expiration invalide (format AAAA-MM-JJ)." });
  else {
    const travelEnd = parseIsoDate(options.lastTravelDate) ?? today;
    if (expiry.getTime() < travelEnd.getTime()) issues.push({ field: "passportExpiry", severity: "error", message: parseIsoDate(options.lastTravelDate) ? "Le passeport expire avant la fin du voyage : il doit être renouvelé avant de réserver." : "Ce passeport est expiré." });
    else if (expiry.getTime() < addMonthsUtc(travelEnd, 6).getTime()) issues.push({ field: "passportExpiry", severity: "warning", message: "Le passeport expire moins de 6 mois après la fin du voyage : de nombreux pays refusent l’entrée dans ce cas. Vérifiez les conditions de votre destination." });
  }

  const birth = parseIsoDate(traveler.dateOfBirth);
  if (!clean(traveler.dateOfBirth)) issues.push({ field: "dateOfBirth", severity: "error", message: "Indiquez la date de naissance." });
  else if (!birth) issues.push({ field: "dateOfBirth", severity: "error", message: "Date de naissance invalide (format AAAA-MM-JJ)." });
  else if (birth.getTime() > today.getTime()) issues.push({ field: "dateOfBirth", severity: "error", message: "La date de naissance ne peut pas être dans le futur." });
  else if (today.getUTCFullYear() - birth.getUTCFullYear() > 120) issues.push({ field: "dateOfBirth", severity: "error", message: "Date de naissance improbable : vérifiez l’année." });

  return issues;
}

const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

/** Voyageurs enregistrés : la liste dédiée si elle existe, sinon le passager principal saisi à la réservation (anciennes demandes). */
export function extractTravelers(passengerData: unknown): TravelerDetails[] {
  const passengers = Array.isArray(passengerData) ? passengerData.map(asRecord) : [];
  const dedicated = passengers[0]?.travelerDetails;
  const source = Array.isArray(dedicated) && dedicated.length > 0 ? dedicated.map(asRecord) : passengers.filter((passenger) => clean(passenger.passportNumber) || clean(passenger.passportExpiry));
  return source.map((entry) => ({ fullName: clean(entry.fullName), passportNumber: normalizePassportNumber(clean(entry.passportNumber)), passportExpiry: clean(entry.passportExpiry), dateOfBirth: clean(entry.dateOfBirth), nationality: clean(entry.nationality) || undefined }));
}

/**
 * Nombre de voyageurs attendus : celui saisi à la demande (adultes + enfants), sinon les voyageurs facturés par le fournisseur, sinon 1 ;
 * les bébés (non facturés par le fournisseur) s'y ajoutent : ils voyagent aussi avec leur propre passeport.
 */
export function expectedTravelerCount(flightData: unknown, passengerData: unknown): number {
  const main = asRecord(Array.isArray(passengerData) ? passengerData[0] : null);
  const fromRequest = Number(main.travelers);
  const priced = Number(asRecord(flightData).pricedPassengers);
  const base = Number.isInteger(fromRequest) && fromRequest >= 1 && fromRequest <= 9 ? fromRequest : Number.isInteger(priced) && priced >= 1 && priced <= 9 ? priced : 1;
  const infants = Number(main.infants);
  return Math.min(9, base + (Number.isInteger(infants) && infants >= 1 && infants <= 4 ? infants : 0));
}

/** Dernier jour de voyage : le retour choisi s'il existe, sinon le départ. */
export function lastTravelDateOf(flightData: unknown): string | null {
  const flight = asRecord(flightData);
  const back = clean(asRecord(flight.returnFlight).departureDate);
  const out = clean(flight.departureDate);
  return parseIsoDate(back) ? back : parseIsoDate(out) ? out : null;
}

export type TravelerReadiness = { expected: number; provided: number; complete: boolean; errors: number; warnings: number; messages: string[] };

/** État global : prêt pour l'émission seulement si tous les voyageurs attendus sont saisis, sans aucune erreur. */
export function assessTravelers(input: { flightData: unknown; passengerData: unknown; today: Date }): TravelerReadiness {
  const travelers = extractTravelers(input.passengerData);
  const expected = expectedTravelerCount(input.flightData, input.passengerData);
  const lastTravelDate = lastTravelDateOf(input.flightData);
  const messages: string[] = [];
  let errors = 0;
  let warnings = 0;
  travelers.forEach((traveler, index) => {
    const label = travelers.length > 1 ? `Voyageur ${index + 1} : ` : "";
    for (const issue of checkTraveler(traveler, { lastTravelDate, today: input.today })) {
      if (issue.severity === "error") errors += 1;
      else warnings += 1;
      messages.push(`${label}${issue.message}`);
    }
  });
  if (travelers.length < expected) {
    errors += 1;
    messages.unshift(travelers.length === 0 ? "Aucun voyageur n’est renseigné." : `${travelers.length} voyageur(s) renseigné(s) sur ${expected}.`);
  }
  return { expected, provided: travelers.length, complete: travelers.length >= expected && errors === 0, errors, warnings, messages };
}
