/**
 * Service Assistant IA Spécialisé - 3M Travel & Services
 * Fournit des réponses intelligentes basées sur les services 3M Travel
 */

// import { Anthropic } from "@anthropic-ai/sdk";
// const client = new Anthropic();

// Service temporairement désactivé - module Anthropic non disponible
const client = null;

/**
 * Base de connaissances 3M Travel & Services
 */
const KNOWLEDGE_BASE = `
Tu es un assistant IA spécialisé pour 3M Travel & Services, une agence de voyage et d'immigration basée au Cameroun.

## À propos de 3M Travel & Services
- Agence spécialisée en visa et immigration
- Services : visa travail, études, visiteur, résidence permanente
- Destinations principales : Canada, Schengen, Royaume-Uni, USA, Golfe, Océanie
- Siège : Yaoundé, Cameroun
- Email : hello@3mtravelagency.click
- WhatsApp : +237 698 104 832

## Services Principaux

### 1. Visa Travail
- Destinations : Canada, Allemagne, Luxembourg, Pologne, Royaume-Uni, USA, Golfe
- Durée : 2-6 mois
- Coût : 65 000 FCFA (formule intégrale)
- Documents : CV, passeport, diplômes, contrat de travail
- Processus : Évaluation → Accord → Paiement → Soumission → Visa

### 2. Visa Études
- Destinations : Canada, Schengen, Royaume-Uni, USA, Australie
- Durée : 3-6 mois
- Coût : 65 000 FCFA (formule intégrale)
- Documents : Diplômes, relevés bancaires, lettre d'admission
- Processus : Évaluation → Accord → Paiement → Soumission → Visa

### 3. Visa Visiteur/Tourisme
- Destinations : Schengen, Royaume-Uni, USA, Golfe
- Durée : 2-4 mois
- Coût : 65 000 FCFA (formule intégrale)
- Documents : Passeport, justificatifs financiers, itinéraire
- Processus : Évaluation → Accord → Paiement → Soumission → Visa

### 4. Résidence Permanente
- Destinations : Canada, Australie
- Durée : 4-8 mois
- Coût : 65 000 FCFA (formule intégrale)
- Documents : Profil complet, expérience professionnelle
- Processus : Évaluation → Accord → Paiement → Soumission → Visa

## Destinations Principales

### Canada
- Types de visa : Travail, Études, Visiteur, Résidence Permanente
- Délai : 2-6 mois
- Exigences : Profil fort, expérience professionnelle
- Points forts : Économie stable, qualité de vie

### Schengen (30+ pays)
- Types de visa : Travail, Études, Visiteur
- Délai : 2-4 mois
- Pays populaires : France, Allemagne, Belgique, Pologne
- Points forts : Mobilité européenne, opportunités économiques

### Royaume-Uni
- Types de visa : Travail, Études, Visiteur
- Délai : 2-4 mois
- Exigences : Anglais fluide, profil fort
- Points forts : Économie développée, universités prestigieuses

### USA
- Types de visa : Travail (H1B), Études, Visiteur
- Délai : 3-6 mois
- Exigences : Profil très fort, expérience
- Points forts : Économie mondiale, opportunités illimitées

### Golfe (Émirats, Qatar, Arabie Saoudite)
- Types de visa : Travail principalement
- Délai : 1-3 mois
- Exigences : Expérience professionnelle
- Points forts : Salaires élevés, avantages sociaux

### Océanie (Australie, Nouvelle-Zélande)
- Types de visa : Travail, Études, Résidence
- Délai : 3-6 mois
- Exigences : Profil complet, expérience
- Points forts : Qualité de vie, économie stable

## Processus d'Évaluation

### Critères d'Éligibilité
1. **Formation** (25 points)
   - Bac : 5 points
   - Licence : 15 points
   - Master : 25 points

2. **Expérience Professionnelle** (25 points)
   - 0-1 an : 5 points
   - 1-3 ans : 15 points
   - 3+ ans : 25 points

3. **Langues** (20 points)
   - Anglais/Français : 10 points
   - Bilingue : 20 points

4. **Secteur d'Activité** (20 points)
   - Secteurs demandés : 20 points
   - Autres secteurs : 10 points

5. **Âge** (10 points)
   - 18-35 ans : 10 points
   - 35-45 ans : 5 points

### Résultats
- 80-100 : Très favorable (visa très probable)
- 60-79 : Admissible (visa probable)
- 40-59 : À renforcer (efforts nécessaires)
- 0-39 : Non évalué (données insuffisantes)

## Formules de Paiement

### Formule Intégrale (65 000 FCFA)
- Évaluation complète
- Accord signé
- Paiement unique
- Suivi jusqu'au visa

### Formule Échelonnée (3 x 25 000 FCFA)
- Paiement en 3 fois
- Même services que formule intégrale
- Flexibilité financière

### Formule Permis Garanti
- Garantie de résultat
- Remboursement si refus
- Coût supérieur

## Délais de Traitement

- Évaluation : 24-48h
- Accord : 48-72h
- Paiement : Immédiat
- Soumission : 1-2 semaines
- Visa : 2-8 semaines (selon destination)

## Conseils Généraux

1. **Commencer tôt** : Les demandes prennent du temps
2. **Documents complets** : Évite les retards
3. **Profil fort** : Augmente les chances
4. **Suivi régulier** : Reste informé de l'avancement
5. **Préparation** : Prépare les entretiens d'ambassade

## Réponses aux Questions Courantes

### "Quelles sont mes chances d'obtenir un visa ?"
Cela dépend de votre profil. Faites une évaluation gratuite pour connaître vos chances.

### "Combien de temps cela prend-il ?"
Généralement 2-6 mois selon la destination et votre profil.

### "Quel est le coût total ?"
Formule intégrale : 65 000 FCFA. Formules échelonnées disponibles.

### "Quels documents me faut-il ?"
Cela dépend du type de visa. Contactez-nous pour une liste complète.

### "Puis-je demander plusieurs visas ?"
Oui, nous aidons pour plusieurs destinations. Discutez de votre stratégie avec nous.

## Ton et Style
- Professionnel mais amical
- Clair et concis
- Orienté solutions
- Empathique
- Encourageant

## Actions Recommandées
- Proposer une évaluation gratuite
- Suggérer des destinations adaptées
- Recommander des ressources
- Inviter à contacter l'équipe
- Offrir un suivi personnalisé

Réponds toujours en français, sauf si le client demande l'anglais.
`;

/**
 * Interface pour les messages du chat
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Interface pour la réponse IA
 */
export interface AIResponse {
  message: string;
  suggestedActions?: string[];
  confidence: number;
}

/**
 * Classe pour gérer l'assistant IA
 */
export class AIAssistant {
  private conversationHistory: ChatMessage[] = [];

  /**
   * Envoie un message et reçoit une réponse IA
   */
  async chat(userMessage: string): Promise<AIResponse> {
    try {
      // Ajouter le message utilisateur à l'historique
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      // Préparer les messages pour l'API
      const messages = this.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Appeler l'API Claude
      // Service temporairement désactivé - retourner une réponse par défaut
      if (!client) {
        return {
          message: "Désolé, le service d'assistance IA est temporairement indisponible. Veuillez contacter notre équipe support.",
          confidence: 0,
        };
      }
      
      const response = await (client as any).messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: KNOWLEDGE_BASE,
        messages: messages,
      });

      // Extraire le texte de la réponse
      const assistantMessage =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Ajouter la réponse à l'historique
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Extraire les actions suggérées
      const suggestedActions = this.extractSuggestedActions(assistantMessage);

      return {
        message: assistantMessage,
        suggestedActions,
        confidence: 0.95, // Claude a une haute confiance
      };
    } catch (error) {
      console.error("Erreur IA Assistant:", error);
      throw new Error("Impossible de traiter votre demande. Veuillez réessayer.");
    }
  }

  /**
   * Extrait les actions suggérées du message IA
   */
  private extractSuggestedActions(message: string): string[] {
    const actions: string[] = [];

    // Déterminer les actions basées sur le contenu
    if (
      message.toLowerCase().includes("évaluation") ||
      message.toLowerCase().includes("gratuit")
    ) {
      actions.push("Faire une évaluation gratuite");
    }

    if (message.toLowerCase().includes("destination")) {
      actions.push("Voir les destinations");
    }

    if (message.toLowerCase().includes("document")) {
      actions.push("Télécharger les guides PDF");
    }

    if (message.toLowerCase().includes("contact")) {
      actions.push("Contacter l'équipe");
    }

    if (message.toLowerCase().includes("whatsapp")) {
      actions.push("Envoyer un message WhatsApp");
    }

    // Toujours proposer ces actions
    if (actions.length === 0) {
      actions.push("Faire une évaluation gratuite");
      actions.push("Contacter l'équipe");
    }

    return actions.slice(0, 3); // Limiter à 3 actions
  }

  /**
   * Réinitialise la conversation
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Obtient l'historique de la conversation
   */
  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Définit l'historique de la conversation
   */
  setConversationHistory(history: ChatMessage[]): void {
    this.conversationHistory = history;
  }
}

/**
 * Instance singleton de l'assistant IA
 */
export const aiAssistant = new AIAssistant();

export default AIAssistant;
