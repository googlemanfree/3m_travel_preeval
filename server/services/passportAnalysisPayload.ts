export type PassportMediaKind = 'image' | 'pdf';

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PASSPORT_BYTES = 5 * 1024 * 1024;

export function getPassportMediaKind(fileType: string, fileName = ''): PassportMediaKind {
  const normalizedType = fileType.toLowerCase().trim();
  const normalizedName = fileName.toLowerCase().trim();

  if (normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf')) return 'pdf';
  if (SUPPORTED_IMAGE_TYPES.has(normalizedType) || /\.(jpe?g|png|webp)$/.test(normalizedName)) return 'image';

  throw new Error('Format non pris en charge. Utilisez un PDF, JPG, PNG ou WEBP.');
}

export function decodePassportBase64(value: string): Buffer {
  const raw = value.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    throw new Error('Le fichier passeport transmis est invalide.');
  }

  const bytes = Buffer.from(raw, 'base64');
  if (!bytes.length || bytes.length > MAX_PASSPORT_BYTES) {
    throw new Error('Le passeport doit avoir une taille comprise entre 1 octet et 5 Mo.');
  }
  return bytes;
}

export function assertRemotePassportUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Le fichier passeport doit être téléversé avant son analyse.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Le fichier passeport doit être téléversé avant son analyse.');
  }
}

export function buildPassportMediaPart(url: string, fileType: string, fileName = '') {
  const kind = getPassportMediaKind(fileType, fileName);
  if (kind === 'pdf') {
    return { type: 'file_url' as const, file_url: { url, mime_type: 'application/pdf' as const } };
  }
  return { type: 'image_url' as const, image_url: { url, detail: 'high' as const } };
}

export type ExtractedPassportData = {
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  passportNumber: string | null;
  issuingCountry: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  gender: string | null;
  placeOfBirth: string | null;
};

export function parsePassportAnalysisResponse(content: string): ExtractedPassportData {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error('La réponse de l’analyse du passeport n’est pas exploitable.');
  }

  const text = (key: string): string | null => {
    const value = parsed[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  };

  const firstName = text('firstName');
  const lastName = text('lastName');
  const fullName = text('fullName') || [firstName, lastName].filter(Boolean).join(' ') || null;

  if (!fullName) throw new Error('Le nom du titulaire n’a pas pu être extrait.');

  return {
    fullName,
    firstName,
    lastName,
    dateOfBirth: text('dateOfBirth'),
    nationality: text('nationality'),
    passportNumber: text('passportNumber'),
    issuingCountry: text('issuingCountry'),
    issueDate: text('issueDate'),
    expiryDate: text('expiryDate'),
    gender: text('gender'),
    placeOfBirth: text('placeOfBirth'),
  };
}

export const passportAnalysisSchema = {
  type: 'object',
  properties: {
    fullName: { type: ['string', 'null'] },
    firstName: { type: ['string', 'null'] },
    lastName: { type: ['string', 'null'] },
    dateOfBirth: { type: ['string', 'null'] },
    nationality: { type: ['string', 'null'] },
    passportNumber: { type: ['string', 'null'] },
    issuingCountry: { type: ['string', 'null'] },
    issueDate: { type: ['string', 'null'] },
    expiryDate: { type: ['string', 'null'] },
    gender: { type: ['string', 'null'] },
    placeOfBirth: { type: ['string', 'null'] },
  },
  required: ['fullName', 'firstName', 'lastName', 'dateOfBirth', 'nationality', 'passportNumber', 'issuingCountry', 'issueDate', 'expiryDate', 'gender', 'placeOfBirth'],
  additionalProperties: false,
} as const;
