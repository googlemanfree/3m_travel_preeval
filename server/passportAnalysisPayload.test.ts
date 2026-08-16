import { describe, expect, it } from 'vitest';
import {
  assertRemotePassportUrl,
  buildPassportMediaPart,
  decodePassportBase64,
  getPassportMediaKind,
  parsePassportAnalysisResponse,
} from './services/passportAnalysisPayload';

describe('Passport analysis payload', () => {
  it('prépare une image distante pour la vision', () => {
    expect(getPassportMediaKind('image/jpeg', 'passport.jpg')).toBe('image');
    expect(buildPassportMediaPart('https://storage.example/passport.jpg', 'image/jpeg', 'passport.jpg')).toEqual({
      type: 'image_url',
      image_url: { url: 'https://storage.example/passport.jpg', detail: 'high' },
    });
  });

  it('prépare un PDF distant comme fichier et non comme image', () => {
    expect(getPassportMediaKind('application/pdf', 'passport.pdf')).toBe('pdf');
    expect(buildPassportMediaPart('https://storage.example/passport.pdf', 'application/pdf', 'passport.pdf')).toEqual({
      type: 'file_url',
      file_url: { url: 'https://storage.example/passport.pdf', mime_type: 'application/pdf' },
    });
  });

  it('rejette une URL blob locale qui ne peut pas être lue par le serveur', () => {
    expect(() => assertRemotePassportUrl('blob:https://example.test/123')).toThrow(/téléversé/i);
  });

  it('décode un fichier base64 et refuse un contenu invalide', () => {
    expect(decodePassportBase64(Buffer.from('passport').toString('base64')).toString()).toBe('passport');
    expect(() => decodePassportBase64('not-base64!')).toThrow(/invalide/i);
  });

  it('normalise une réponse JSON structurée de l’analyse', () => {
    const json = JSON.stringify({
      fullName: 'AUREOL DONFACK',
      firstName: 'AUREOL',
      lastName: 'DONFACK',
      dateOfBirth: null,
      nationality: 'Camerounaise',
      passportNumber: null,
      issuingCountry: 'Cameroun',
      issueDate: null,
      expiryDate: null,
      gender: 'M',
      placeOfBirth: null,
    });
    const result = parsePassportAnalysisResponse(`\`\`\`json\n${json}\n\`\`\``);
    expect(result.fullName).toBe('AUREOL DONFACK');
    expect(result.nationality).toBe('Camerounaise');
  });
});
