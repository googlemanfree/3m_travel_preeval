/**
 * Routeur tRPC pour l'Assistant IA
 * Gère les conversations avec l'assistant IA spécialisé
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { AIAssistant } from "../ai-assistant.service";

/**
 * Schéma de validation pour les messages
 */
const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
});

/**
 * Schéma de réponse IA
 */
const aiResponseSchema = z.object({
  message: z.string(),
  suggestedActions: z.array(z.string()).optional(),
  confidence: z.number(),
});

/**
 * Map pour stocker les sessions d'assistant IA
 * En production, utiliser Redis ou une base de données
 */
const assistantSessions = new Map<string, AIAssistant>();

/**
 * Obtient ou crée une session d'assistant IA
 */
function getOrCreateAssistant(sessionId: string): AIAssistant {
  if (!assistantSessions.has(sessionId)) {
    assistantSessions.set(sessionId, new AIAssistant());
  }
  return assistantSessions.get(sessionId)!;
}

/**
 * Routeur IA Assistant
 */
export const aiAssistantRouter = router({
  /**
   * Envoie un message à l'assistant IA et reçoit une réponse
   */
  chat: publicProcedure
    .input(chatMessageSchema)
    .output(aiResponseSchema)
    .mutation(async ({ input }) => {
      try {
        // Générer un ID de session si non fourni
        const sessionId = input.sessionId || `session_${Date.now()}_${Math.random()}`;

        // Obtenir ou créer l'assistant pour cette session
        const assistant = getOrCreateAssistant(sessionId);

        // Envoyer le message et recevoir la réponse
        const response = await assistant.chat(input.message);

        return {
          message: response.message,
          suggestedActions: response.suggestedActions,
          confidence: response.confidence,
        };
      } catch (error) {
        console.error("Erreur dans le chat IA:", error);
        throw new Error("Impossible de traiter votre message. Veuillez réessayer.");
      }
    }),

  /**
   * Obtient l'historique de la conversation
   */
  getHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => {
      const assistant = getOrCreateAssistant(input.sessionId);
      return assistant.getConversationHistory();
    }),

  /**
   * Réinitialise la conversation
   */
  resetConversation: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => {
      const assistant = getOrCreateAssistant(input.sessionId);
      assistant.resetConversation();
      return { success: true };
    }),

  /**
   * Obtient les informations de base sur les services
   */
  getServiceInfo: publicProcedure
    .input(
      z.object({
        service: z.enum(["travail", "etudes", "visiteur", "residence"]).optional(),
      })
    )
    .query(({ input }) => {
      const services = {
        travail: {
          name: "Visa Travail",
          destinations: ["Canada", "Allemagne", "Luxembourg", "Pologne", "Royaume-Uni", "USA", "Golfe"],
          duration: "2-6 mois",
          cost: "65 000 FCFA",
          documents: ["CV", "Passeport", "Diplômes", "Contrat de travail"],
        },
        etudes: {
          name: "Visa Études",
          destinations: ["Canada", "Schengen", "Royaume-Uni", "USA", "Australie"],
          duration: "3-6 mois",
          cost: "65 000 FCFA",
          documents: ["Diplômes", "Relevés bancaires", "Lettre d'admission"],
        },
        visiteur: {
          name: "Visa Visiteur/Tourisme",
          destinations: ["Schengen", "Royaume-Uni", "USA", "Golfe"],
          duration: "2-4 mois",
          cost: "65 000 FCFA",
          documents: ["Passeport", "Justificatifs financiers", "Itinéraire"],
        },
        residence: {
          name: "Résidence Permanente",
          destinations: ["Canada", "Australie"],
          duration: "4-8 mois",
          cost: "65 000 FCFA",
          documents: ["Profil complet", "Expérience professionnelle"],
        },
      };

      if (input.service) {
        return services[input.service];
      }

      return services;
    }),

  /**
   * Obtient les destinations disponibles
   */
  getDestinations: publicProcedure.query(() => {
    return [
      {
        name: "Canada",
        visaTypes: ["Travail", "Études", "Visiteur", "Résidence Permanente"],
        duration: "2-6 mois",
        highlights: ["Économie stable", "Qualité de vie"],
      },
      {
        name: "Schengen",
        visaTypes: ["Travail", "Études", "Visiteur"],
        duration: "2-4 mois",
        highlights: ["Mobilité européenne", "Opportunités économiques"],
        countries: ["France", "Allemagne", "Belgique", "Pologne", "Italie", "Espagne"],
      },
      {
        name: "Royaume-Uni",
        visaTypes: ["Travail", "Études", "Visiteur"],
        duration: "2-4 mois",
        highlights: ["Économie développée", "Universités prestigieuses"],
      },
      {
        name: "USA",
        visaTypes: ["Travail (H1B)", "Études", "Visiteur"],
        duration: "3-6 mois",
        highlights: ["Économie mondiale", "Opportunités illimitées"],
      },
      {
        name: "Golfe",
        visaTypes: ["Travail"],
        duration: "1-3 mois",
        highlights: ["Salaires élevés", "Avantages sociaux"],
        countries: ["Émirats", "Qatar", "Arabie Saoudite"],
      },
      {
        name: "Océanie",
        visaTypes: ["Travail", "Études", "Résidence"],
        duration: "3-6 mois",
        highlights: ["Qualité de vie", "Économie stable"],
        countries: ["Australie", "Nouvelle-Zélande"],
      },
    ];
  }),

  /**
   * Obtient les critères d'éligibilité
   */
  getEligibilityCriteria: publicProcedure.query(() => {
    return {
      criteria: [
        {
          name: "Formation",
          points: 25,
          levels: [
            { level: "Bac", points: 5 },
            { level: "Licence", points: 15 },
            { level: "Master", points: 25 },
          ],
        },
        {
          name: "Expérience Professionnelle",
          points: 25,
          levels: [
            { level: "0-1 an", points: 5 },
            { level: "1-3 ans", points: 15 },
            { level: "3+ ans", points: 25 },
          ],
        },
        {
          name: "Langues",
          points: 20,
          levels: [
            { level: "Anglais/Français", points: 10 },
            { level: "Bilingue", points: 20 },
          ],
        },
        {
          name: "Secteur d'Activité",
          points: 20,
          levels: [
            { level: "Secteurs demandés", points: 20 },
            { level: "Autres secteurs", points: 10 },
          ],
        },
        {
          name: "Âge",
          points: 10,
          levels: [
            { level: "18-35 ans", points: 10 },
            { level: "35-45 ans", points: 5 },
          ],
        },
      ],
      results: [
        { range: "80-100", label: "Très favorable", description: "Visa très probable" },
        { range: "60-79", label: "Admissible", description: "Visa probable" },
        { range: "40-59", label: "À renforcer", description: "Efforts nécessaires" },
        { range: "0-39", label: "Non évalué", description: "Données insuffisantes" },
      ],
    };
  }),

  /**
   * Obtient les formules de paiement
   */
  getPaymentPlans: publicProcedure.query(() => {
    return [
      {
        name: "Formule Intégrale",
        price: 65000,
        currency: "FCFA",
        installments: 1,
        features: [
          "Évaluation complète",
          "Accord signé",
          "Paiement unique",
          "Suivi jusqu'au visa",
        ],
      },
      {
        name: "Formule Échelonnée",
        price: 75000,
        currency: "FCFA",
        installments: 3,
        installmentAmount: 25000,
        features: [
          "Paiement en 3 fois",
          "Même services que formule intégrale",
          "Flexibilité financière",
        ],
      },
      {
        name: "Formule Permis Garanti",
        price: 85000,
        currency: "FCFA",
        installments: 1,
        features: [
          "Garantie de résultat",
          "Remboursement si refus",
          "Suivi premium",
        ],
      },
    ];
  }),
});

export default aiAssistantRouter;
