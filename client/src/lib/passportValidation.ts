export type ManualPassportData = {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  issuingCountry?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  gender?: string | null;
  placeOfBirth?: string | null;
};

export type PassportValidationErrors = Record<string, string>;

function isValidDate(value: string | null | undefined): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateManualPassportData(data: ManualPassportData): PassportValidationErrors {
  const errors: PassportValidationErrors = {};
  const fullName = data.fullName?.trim() || '';
  const passportNumber = data.passportNumber?.trim() || '';
  const nationality = data.nationality?.trim() || '';
  const issuingCountry = data.issuingCountry?.trim() || '';

  if (fullName.length < 2) errors.fullName = 'Le nom complet est obligatoire.';
  if (passportNumber.length < 3) errors.passportNumber = 'Le numéro de passeport est obligatoire.';
  if (nationality.length < 2) errors.nationality = 'La nationalité est obligatoire.';
  if (issuingCountry.length < 2) errors.issuingCountry = 'Le pays d’émission est obligatoire.';

  for (const dateField of ['dateOfBirth', 'issueDate', 'expiryDate'] as const) {
    if (data[dateField] && !isValidDate(data[dateField])) {
      errors[dateField] = 'Utilisez une date valide au format AAAA-MM-JJ.';
    }
  }

  if (data.dateOfBirth && isValidDate(data.dateOfBirth)) {
    const today = new Date().toISOString().slice(0, 10);
    if (data.dateOfBirth > today) errors.dateOfBirth = 'La date de naissance ne peut pas être future.';
  }

  if (data.issueDate && data.expiryDate && isValidDate(data.issueDate) && isValidDate(data.expiryDate) && data.expiryDate < data.issueDate) {
    errors.expiryDate = 'La date d’expiration doit être postérieure à la date d’émission.';
  }

  return errors;
}

export function normalizeManualPassportData(data: ManualPassportData): ManualPassportData {
  return {
    ...data,
    fullName: data.fullName.trim(),
    firstName: data.firstName?.trim() || null,
    lastName: data.lastName?.trim() || null,
    nationality: data.nationality?.trim() || null,
    passportNumber: data.passportNumber?.trim() || null,
    issuingCountry: data.issuingCountry?.trim() || null,
    gender: data.gender?.trim() || null,
    placeOfBirth: data.placeOfBirth?.trim() || null,
  };
}
