import { describe, expect, it } from 'vitest';
import { buildPassportCorrectionAudit } from './services/passportCorrectionHistory';

describe('Historique des corrections passeport', () => {
  it('identifie précisément les champs corrigés sans stocker les octets du fichier', () => {
    const result = buildPassportCorrectionAudit(
      {
        fullName: 'AUREOL DONFACK',
        passportNumber: 'CMR123456',
        expiryDate: '2031-01-09',
      },
      {
        fullName: 'AUREOL NGONO DONFACK',
        passportNumber: 'CMR987654',
        expiryDate: '2031-01-09',
      },
    );

    expect(result.changedFields).toEqual(['fullName', 'passportNumber']);
    expect(result.previousData).not.toHaveProperty('fileBytes');
    expect(result.nextData).not.toHaveProperty('fileBytes');
  });

  it('conserve les champs ajoutés ou corrigés même lorsque la valeur précédente est absente', () => {
    const result = buildPassportCorrectionAudit(
      { fullName: 'AUREOL DONFACK' },
      { fullName: 'AUREOL DONFACK', placeOfBirth: 'Yaoundé' },
    );

    expect(result.changedFields).toEqual(['placeOfBirth']);
  });
});
