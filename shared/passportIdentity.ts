/**
 * Identité lue sur le passeport et saisie par un agent (jamais déduite automatiquement).
 *
 * Elle sert à deux contrôles :
 *  - la validité du passeport par rapport au voyage prévu ;
 *  - la cohérence du nom et de la date de naissance avec la fiche du candidat.
 *
 * Elle est stockée en JSON dans candidate_files.extractedData du fichier « passeport » (colonne existante).
 * Ces contrôles signalent : c'est toujours un agent qui décide.
 */
export const PASSPORT_IDENTITY_KIND = "passport_identity_v1";

export type PassportIdentity = {
  kind: typeof PASSPORT_IDENTITY_KIND;
  surname: string;
  givenNames: string;
  dateOfBirth: string; // AAAA-MM-JJ
  passportNumber: string;
  expiryDate: string; // AAAA-MM-JJ
  plannedTravelDate: string | null; // AAAA-MM-JJ
  enteredBy: string;
  enteredAt: string; // ISO
};

export type PassportIdentityInput = Omit<PassportIdentity, "kind" | "enteredBy" | "enteredAt">;

/** Nombre de mois de validité exigés après le voyage (règle courante, à vérifier pour chaque destination). */
export const REQUIRED_VALIDITY_MONTHS = 6;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date AAAA-MM-JJ valide (le 31 février n'existe pas) ; null sinon. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = ISO_DATE.exec((value ?? "").trim());
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

/** Accepte AAAA-MM-JJ ou JJ/MM/AAAA (formats déjà présents dans les fiches) ; renvoie AAAA-MM-JJ ou null. */
export function normalizeFlexibleDate(value: string | null | undefined): string | null {
  const text = (value ?? "").trim();
  if (!text) return null;
  const french = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  const iso = french ? `${french[3]}-${french[2].padStart(2, "0")}-${french[1].padStart(2, "0")}` : text.slice(0, 10);
  return parseIsoDate(iso) ? iso : null;
}

function addMonthsUtc(date: Date, months: number): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return result;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export type PassportExpiryStatus = {
  status: "expired" | "too_short" | "ok" | "unknown";
  daysLeft: number | null;
  /** Date à partir de laquelle le passeport ne couvre plus la validité exigée. */
  mustBeValidUntil: string | null;
  message: string;
};

/**
 * Compare la date d'expiration à la date de voyage prévue (ou à aujourd'hui si elle n'est pas connue)
 * augmentée de la validité exigée. Information d'aide : la règle exacte dépend de la destination.
 */
export function passportExpiryStatus(expiryDate: string | null | undefined, today: Date, plannedTravelDate?: string | null): PassportExpiryStatus {
  const expiry = parseIsoDate(expiryDate);
  if (!expiry) return { status: "unknown", daysLeft: null, mustBeValidUntil: null, message: "Date d'expiration du passeport non renseignée." };
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const daysLeft = Math.round((expiry.getTime() - todayUtc.getTime()) / DAY_MS);
  const travel = parseIsoDate(plannedTravelDate) ?? todayUtc;
  const needed = addMonthsUtc(travel, REQUIRED_VALIDITY_MONTHS);
  const neededIso = needed.toISOString().slice(0, 10);
  if (daysLeft < 0) {
    return { status: "expired", daysLeft, mustBeValidUntil: neededIso, message: `Passeport expiré depuis ${Math.abs(daysLeft)} jour(s) : un nouveau passeport est à prévoir.` };
  }
  if (expiry.getTime() < needed.getTime()) {
    return {
      status: "too_short",
      daysLeft,
      mustBeValidUntil: neededIso,
      message: `Passeport valable ${daysLeft} jour(s) : moins de ${REQUIRED_VALIDITY_MONTHS} mois après ${parseIsoDate(plannedTravelDate) ? "le voyage prévu" : "aujourd'hui"}. De nombreuses destinations exigent cette durée : à vérifier pour la destination concernée, renouvellement à anticiper.`,
    };
  }
  return { status: "ok", daysLeft, mustBeValidUntil: neededIso, message: `Passeport valable jusqu'au ${expiry.toISOString().slice(0, 10)} (au moins ${REQUIRED_VALIDITY_MONTHS} mois après la date retenue).` };
}

/** Minuscules, sans accents, tirets et apostrophes traités comme des espaces. */
export function nameTokens(value: string | null | undefined): string[] {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-'’.,]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export type IdentityDiscrepancy = { field: "name" | "dateOfBirth"; message: string };

/**
 * Écarts entre la fiche candidat et le passeport saisi. Le nom est cohérent si les mots de l'un sont tous contenus
 * dans l'autre (ordre libre, prénoms secondaires facultatifs) ; la date de naissance doit être identique.
 */
export function comparePassportWithCandidate(
  candidate: { fullName?: string | null; dateOfBirth?: string | null },
  identity: Pick<PassportIdentity, "surname" | "givenNames" | "dateOfBirth">,
): IdentityDiscrepancy[] {
  const discrepancies: IdentityDiscrepancy[] = [];
  const candidateTokens = nameTokens(candidate.fullName);
  const passportTokens = nameTokens(`${identity.givenNames} ${identity.surname}`);
  if (candidateTokens.length > 0 && passportTokens.length > 0) {
    const candidateSet = new Set(candidateTokens);
    const passportSet = new Set(passportTokens);
    const passportInCandidate = passportTokens.every((token) => candidateSet.has(token));
    const candidateInPassport = candidateTokens.every((token) => passportSet.has(token));
    if (!passportInCandidate && !candidateInPassport) {
      discrepancies.push({
        field: "name",
        message: `Nom de la fiche « ${candidate.fullName} » différent du passeport « ${identity.givenNames} ${identity.surname} » : à confirmer avec le candidat.`,
      });
    }
  }
  const candidateBirth = normalizeFlexibleDate(candidate.dateOfBirth);
  if (candidateBirth && candidateBirth !== identity.dateOfBirth) {
    discrepancies.push({
      field: "dateOfBirth",
      message: `Date de naissance de la fiche (${candidateBirth}) différente du passeport (${identity.dateOfBirth}) : à confirmer avec le candidat.`,
    });
  }
  return discrepancies;
}

/** Validation de la saisie d'un agent ; renvoie un message d'erreur lisible ou null. */
export function validatePassportIdentityInput(input: PassportIdentityInput, today: Date): string | null {
  if (nameTokens(input.surname).length === 0) return "Le nom de famille du passeport est obligatoire.";
  if (nameTokens(input.givenNames).length === 0) return "Les prénoms du passeport sont obligatoires.";
  if (!/^[A-Za-z0-9]{5,20}$/.test(input.passportNumber.trim())) return "Le numéro de passeport doit contenir 5 à 20 lettres ou chiffres.";
  const birth = parseIsoDate(input.dateOfBirth);
  if (!birth) return "La date de naissance doit être une date valide (AAAA-MM-JJ).";
  if (birth.getTime() > today.getTime()) return "La date de naissance ne peut pas être dans le futur.";
  const expiry = parseIsoDate(input.expiryDate);
  if (!expiry) return "La date d'expiration doit être une date valide (AAAA-MM-JJ).";
  if (expiry.getTime() <= birth.getTime()) return "La date d'expiration doit être postérieure à la date de naissance.";
  if (input.plannedTravelDate && !parseIsoDate(input.plannedTravelDate)) return "La date de voyage prévue doit être une date valide (AAAA-MM-JJ).";
  return null;
}

/** Lit l'identité stockée ; ignore tout autre contenu (anciens blocs, JSON invalide). */
export function parsePassportIdentity(extractedData: string | null | undefined): PassportIdentity | null {
  if (!extractedData) return null;
  try {
    const value = JSON.parse(extractedData) as Partial<PassportIdentity> | null;
    if (!value || value.kind !== PASSPORT_IDENTITY_KIND) return null;
    if (typeof value.surname !== "string" || typeof value.givenNames !== "string" || typeof value.expiryDate !== "string") return null;
    return {
      kind: PASSPORT_IDENTITY_KIND,
      surname: value.surname,
      givenNames: value.givenNames,
      dateOfBirth: typeof value.dateOfBirth === "string" ? value.dateOfBirth : "",
      passportNumber: typeof value.passportNumber === "string" ? value.passportNumber : "",
      expiryDate: value.expiryDate,
      plannedTravelDate: typeof value.plannedTravelDate === "string" ? value.plannedTravelDate : null,
      enteredBy: typeof value.enteredBy === "string" ? value.enteredBy : "",
      enteredAt: typeof value.enteredAt === "string" ? value.enteredAt : "",
    };
  } catch {
    return null;
  }
}

export function buildPassportIdentity(input: PassportIdentityInput, enteredBy: string, now: Date): PassportIdentity {
  return {
    kind: PASSPORT_IDENTITY_KIND,
    surname: input.surname.trim().replace(/\s+/g, " "),
    givenNames: input.givenNames.trim().replace(/\s+/g, " "),
    dateOfBirth: input.dateOfBirth,
    passportNumber: input.passportNumber.trim().toUpperCase(),
    expiryDate: input.expiryDate,
    plannedTravelDate: input.plannedTravelDate || null,
    enteredBy,
    enteredAt: now.toISOString(),
  };
}
