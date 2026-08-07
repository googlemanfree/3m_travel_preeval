import { z } from 'zod';
import { protectedProcedure, publicProcedure } from './../../server/_core/trpc';
import { TRPCError } from '@trpc/server';

// Pricing formulas
export const PRICING_FORMULAS = {
  OPENING_FEE: 65000, // FCFA - Mandatory
  FORMULA_1_COMPLETE: 2300000, // FCFA - Full payment
  FORMULA_2_INSTALLMENTS: 2645000, // FCFA - +15% for installments
  FORMULA_3_VISA_PAYMENT: 2875000, // FCFA - +25% for payment on visa
};

// Country-specific evaluation rules
const COUNTRY_RULES: Record<string, any> = {
  LUXEMBOURG: {
    name: 'Luxembourg',
    flag: '🇱🇺',
    strategy: 'ADEM_GATEWAY',
    description: 'Test du marché du travail ADEM et préférence communautaire européenne',
    fallbackCountry: 'POLOGNE',
    fallbackStrategy: 'EUROPEAN_GATEWAY',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Attestations de travail et fiches de paie',
      'Diplômes légalisés',
    ],
  },
  POLOGNE: {
    name: 'Pologne',
    flag: '🇵🇱',
    strategy: 'EUROPEAN_GATEWAY',
    description: 'Permis Voïvode - Accès à la Carte de Séjour Européenne (Karta Pobytu)',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Contrat de travail ou offre d\'emploi',
      'Diplômes légalisés',
      'Attestation de moyens financiers',
    ],
  },
  CANADA: {
    name: 'Canada',
    flag: '🇨🇦',
    strategy: 'DIRECT_ASSESSMENT',
    description: 'Évaluation directe - Classification métier (Code CNP/TEER)',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Diplômes avec évaluation ECA/WES',
      'Attestations de travail détaillées',
      'Résultats IELTS/TOEFL si applicable',
    ],
  },
  EMIRATES: {
    name: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    strategy: 'DIRECT_ASSESSMENT',
    description: 'Évaluation directe - Secteurs demandés (IT, Santé, BTP)',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Diplômes légalisés',
      'Attestations de travail et références',
      'Certificat médical',
    ],
  },
  FRANCE: {
    name: 'France',
    flag: '🇫🇷',
    strategy: 'DIRECT_ASSESSMENT',
    description: 'Évaluation directe - Marché du travail français',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Diplômes avec reconnaissance NUFFIC',
      'Attestations de travail',
      'Contrat de travail ou offre d\'emploi',
    ],
  },
  AUSTRALIA: {
    name: 'Australie',
    flag: '🇦🇺',
    strategy: 'POINTS_BASED',
    description: 'Système de points - Occupation List et points de compétence',
    documents: [
      'Passeport valide (+18 mois)',
      'Acte de naissance légalisé au MINREX',
      'Casier judiciaire (Bulletin N°3) légalisé',
      'Diplômes avec évaluation ACS/EA',
      'Résultats IELTS (minimum 6.0)',
      'Attestations de travail détaillées',
    ],
  },
};

// Scoring rules
function calculateEligibilityScore(profile: any, country: string): number {
  let score = 0;

  // Education (max 30 points)
  if (profile.education === 'doctorat') score += 30;
  else if (profile.education === 'master') score += 25;
  else if (profile.education === 'licence') score += 20;
  else if (profile.education === 'bac') score += 10;

  // Experience (max 30 points)
  const yearsExp = parseInt(profile.experience) || 0;
  if (yearsExp >= 10) score += 30;
  else if (yearsExp >= 5) score += 25;
  else if (yearsExp >= 2) score += 15;
  else if (yearsExp >= 1) score += 10;

  // Language (max 20 points)
  if (profile.language === 'fluent') score += 20;
  else if (profile.language === 'intermediate') score += 12;
  else if (profile.language === 'basic') score += 5;

  // Sector alignment (max 20 points)
  const inDemandSectors = ['IT', 'Santé', 'BTP', 'Logistique', 'Finance'];
  if (inDemandSectors.includes(profile.sector)) score += 20;
  else score += 10;

  // Country-specific adjustments
  if (country === 'LUXEMBOURG' && yearsExp < 2) score -= 15; // ADEM penalty
  if (country === 'CANADA' && profile.language !== 'fluent') score -= 10;

  return Math.max(0, Math.min(100, score));
}

export const evaluationEngineRouter = {
  // Generate comprehensive evaluation report
  generateEvaluation: protectedProcedure
    .input(
      z.object({
        destination: z.string(),
        visaType: z.string(),
        education: z.string(),
        experience: z.string(),
        language: z.string(),
        sector: z.string(),
        budget: z.string(),
        timeline: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const countryKey = input.destination.toUpperCase().replace(/\s+/g, '_');
        const countryRules = COUNTRY_RULES[countryKey] || COUNTRY_RULES.CANADA;

        const score = calculateEligibilityScore(input, countryKey);

        // Determine status
        let status = 'ELIGIBLE';
        if (score < 40) status = 'NEEDS_SUPPORT';
        else if (score < 60) status = 'CONDITIONAL';
        else if (score >= 80) status = 'HIGHLY_ELIGIBLE';

        return {
          folderId: `3M-EVAL-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          score,
          status,
          destination: input.destination,
          strategy: countryRules.strategy,
          strategyDescription: countryRules.description,
          fallbackCountry: countryRules.fallbackCountry,
          requiredDocuments: countryRules.documents,
          pricingFormulas: {
            opening: PRICING_FORMULAS.OPENING_FEE,
            formula1: PRICING_FORMULAS.FORMULA_1_COMPLETE,
            formula2: PRICING_FORMULAS.FORMULA_2_INSTALLMENTS,
            formula3: PRICING_FORMULAS.FORMULA_3_VISA_PAYMENT,
          },
          recommendation: score >= 70 ? 'Procéder immédiatement' : 'Renforcer le dossier',
          nextSteps: [
            'Valider l\'ouverture du dossier (65 000 FCFA)',
            'Légaliser les documents au MINREX',
            'Choisir une formule d\'accompagnement',
            'Soumettre les documents complets',
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la génération de l\'évaluation',
        });
      }
    }),

  // Get pricing formulas
  getPricingFormulas: publicProcedure.query(() => {
    return {
      opening: {
        amount: PRICING_FORMULAS.OPENING_FEE,
        description: 'Frais d\'ouverture de dossier (Obligatoire)',
        benefits: [
          'Audit complet',
          'Espace Client sécurisé',
          'Reçu Officiel PDF numéroté',
        ],
      },
      formula1: {
        amount: PRICING_FORMULAS.FORMULA_1_COMPLETE,
        description: 'Option Paiement Complet',
        benefits: [
          'Meilleur tarif',
          'Traitement prioritaire',
          'Règlement à la signature',
        ],
      },
      formula2: {
        amount: PRICING_FORMULAS.FORMULA_2_INSTALLMENTS,
        description: 'Option Paiement par Tranches (+15%)',
        benefits: [
          '65 000 FCFA à la signature',
          'Échéancier flexible par contrat',
          'Accompagnement complet',
        ],
      },
      formula3: {
        amount: PRICING_FORMULAS.FORMULA_3_VISA_PAYMENT,
        description: 'Option Paiement au Résultat / Visa (+25%)',
        benefits: [
          '65 000 FCFA à la signature',
          'Solde réglé à l\'obtention du visa',
          'Garantie de résultat',
        ],
      },
    };
  }),

  // Get country-specific rules
  getCountryRules: publicProcedure
    .input(z.object({ country: z.string() }))
    .query(({ input }) => {
      const countryKey = input.country.toUpperCase().replace(/\s+/g, '_');
      return COUNTRY_RULES[countryKey] || COUNTRY_RULES.CANADA;
    }),
};
