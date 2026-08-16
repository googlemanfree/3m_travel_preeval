import { describe, expect, it } from 'vitest';
import { normalizeManualPassportData, validateManualPassportData } from '../client/src/lib/passportValidation';

describe('Vérification manuelle des données de passeport', () => {
  it('signale les champs obligatoires manquants et les dates incohérentes', () => {
    const errors = validateManualPassportData({
      fullName: '',
      nationality: 'C',
      passportNumber: '12',
      issuingCountry: 'CM',
      issueDate: '2030-01-01',
      expiryDate: '2029-01-01',
    });

    expect(errors.fullName).toBeTruthy();
    expect(errors.nationality).toBeTruthy();
    expect(errors.passportNumber).toBeTruthy();
    expect(errors.expiryDate).toMatch(/postérieure/i);
  });

  it('autorise les corrections valides et normalise les espaces', () => {
    const data = {
      fullName: '  AUREOL DONFACK  ',
      firstName: ' AUREOL ',
      lastName: ' DONFACK ',
      nationality: ' Camerounaise ',
      passportNumber: ' CMR123456 ',
      issuingCountry: ' Cameroun ',
      dateOfBirth: '1990-01-10',
    };

    expect(validateManualPassportData(data)).toEqual({});
    expect(normalizeManualPassportData(data)).toMatchObject({
      fullName: 'AUREOL DONFACK',
      firstName: 'AUREOL',
      lastName: 'DONFACK',
      nationality: 'Camerounaise',
      passportNumber: 'CMR123456',
      issuingCountry: 'Cameroun',
    });
  });
});
