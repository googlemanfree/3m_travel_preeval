import { describe, expect, it } from 'vitest';
import {
  PUBLIC_DESTINATION_DETAILS,
  PUBLIC_DESTINATION_PAGE_COUNT,
  getPublicDestinationDetail,
  getPublicDestinationPath,
} from '../client/src/lib/publicDestinationCatalog';

describe('catalogue public des procédures', () => {
  it('expose une route canonique et une date de mise à jour pour chaque destination', () => {
    expect(PUBLIC_DESTINATION_PAGE_COUNT).toBeGreaterThanOrEqual(107);

    for (const detail of PUBLIC_DESTINATION_DETAILS) {
      expect(getPublicDestinationPath(detail.procedure.id)).toBe(`/procedures/${detail.procedure.id}`);
      expect(getPublicDestinationDetail(detail.procedure.name)?.lastUpdatedAt).toBeTruthy();
    }
  });

  it('conserve une résolution par pays et type de procédure pour les filtres publics', () => {
    const germanyWork = getPublicDestinationDetail('allemagne-travail');
    const canadaStudy = getPublicDestinationDetail('canada-etudes');

    expect(germanyWork?.procedure.name).toBe('Allemagne');
    expect(germanyWork?.procedure.visaType).toBe('travail');
    expect(canadaStudy?.procedure.name).toBe('Canada');
    expect(canadaStudy?.procedure.visaType).toBe('etudes');
  });
});
