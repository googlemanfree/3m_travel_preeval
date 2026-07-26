/**
 * Système de Gestion des Langues (i18n)
 * Support Français et Anglais
 */

export type Language = 'fr' | 'en';

/**
 * Dictionnaire de traductions
 */
export const translations = {
  fr: {
    // Navigation
    nav: {
      procedures: 'Procédures',
      resources: 'Ressources',
      evaluation: 'Évaluation gratuite',
      mySpace: 'Mon Espace',
      admin: 'Admin',
      logout: 'Déconnexion',
      login: 'Connexion',
      register: 'Inscription',
    },

    // Assistant IA
    assistant: {
      title: '3M Travel Assistant',
      subtitle: 'Spécialisé en visa & immigration',
      welcome: 'Bonjour! 👋 Je suis l\'assistant IA de 3M Travel & Services. Je suis spécialisé dans les services de visa et d\'immigration. Comment puis-je vous aider aujourd\'hui?',
      placeholder: 'Posez votre question...',
      thinking: 'L\'assistant réfléchit...',
      error: 'Erreur lors de la communication avec l\'assistant',
      tip: '💡 Conseil: Posez des questions sur les visas, destinations, ou éligibilité',
      suggestedActions: [
        'Informations sur les visas',
        'Destinations disponibles',
        'Évaluation d\'éligibilité',
      ],
    },

    // Services
    services: {
      workVisa: 'Visa Travail',
      studyVisa: 'Visa Études',
      visitorVisa: 'Visa Visiteur/Tourisme',
      permanentResidence: 'Résidence Permanente',
      duration: 'Durée',
      cost: 'Coût',
      documents: 'Documents',
      destinations: 'Destinations',
    },

    // Destinations
    destinations: {
      canada: 'Canada',
      schengen: 'Schengen',
      uk: 'Royaume-Uni',
      usa: 'USA',
      gulf: 'Golfe',
      oceania: 'Océanie',
    },

    // Eligibility
    eligibility: {
      title: 'Critères d\'Éligibilité',
      education: 'Formation',
      experience: 'Expérience Professionnelle',
      languages: 'Langues',
      sector: 'Secteur d\'Activité',
      age: 'Âge',
      veryFavorable: 'Très favorable',
      admissible: 'Admissible',
      toReinforce: 'À renforcer',
      notEvaluated: 'Non évalué',
    },

    // Payment
    payment: {
      title: 'Formules de Paiement',
      integral: 'Formule Intégrale',
      staggered: 'Formule Échelonnée',
      guaranteed: 'Formule Permis Garanti',
      installments: 'Paiements',
      perMonth: 'par mois',
    },

    // Home page
    home: {
      title: '3M Travel Agency',
      subtitle: 'Votre Pré-Évaluation Visa & Immigration',
      description: 'Remplissez notre formulaire gratuit. Nos experts analysent votre profil et vous proposent les meilleures options pour réaliser votre projet d\'études ou de mobilité internationale.',
      evaluate: 'Évaluer mon éligibilité',
      contactWhatsApp: 'Contact WhatsApp',
      connect: 'Se Connecter',
      createAccount: 'Créer un Compte',
      dossiers: 'Dossiers Évalués',
      satisfaction: 'Satisfaction',
      responseTime: 'Délai de Réponse',
    },

    // Common
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      close: 'Fermer',
      send: 'Envoyer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      submit: 'Soumettre',
      language: 'Langue',
    },
  },

  en: {
    // Navigation
    nav: {
      procedures: 'Procedures',
      resources: 'Resources',
      evaluation: 'Free Evaluation',
      mySpace: 'My Space',
      admin: 'Admin',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
    },

    // Assistant IA
    assistant: {
      title: '3M Travel Assistant',
      subtitle: 'Specialized in visa & immigration',
      welcome: 'Hello! 👋 I\'m the AI assistant for 3M Travel & Services. I specialize in visa and immigration services. How can I help you today?',
      placeholder: 'Ask your question...',
      thinking: 'The assistant is thinking...',
      error: 'Error communicating with the assistant',
      tip: '💡 Tip: Ask questions about visas, destinations, or eligibility',
      suggestedActions: [
        'Information about visas',
        'Available destinations',
        'Eligibility evaluation',
      ],
    },

    // Services
    services: {
      workVisa: 'Work Visa',
      studyVisa: 'Study Visa',
      visitorVisa: 'Visitor/Tourism Visa',
      permanentResidence: 'Permanent Residence',
      duration: 'Duration',
      cost: 'Cost',
      documents: 'Documents',
      destinations: 'Destinations',
    },

    // Destinations
    destinations: {
      canada: 'Canada',
      schengen: 'Schengen',
      uk: 'United Kingdom',
      usa: 'USA',
      gulf: 'Gulf',
      oceania: 'Oceania',
    },

    // Eligibility
    eligibility: {
      title: 'Eligibility Criteria',
      education: 'Education',
      experience: 'Professional Experience',
      languages: 'Languages',
      sector: 'Activity Sector',
      age: 'Age',
      veryFavorable: 'Very favorable',
      admissible: 'Admissible',
      toReinforce: 'To reinforce',
      notEvaluated: 'Not evaluated',
    },

    // Payment
    payment: {
      title: 'Payment Plans',
      integral: 'Integral Plan',
      staggered: 'Staggered Plan',
      guaranteed: 'Guaranteed Permit Plan',
      installments: 'Payments',
      perMonth: 'per month',
    },

    // Home page
    home: {
      title: '3M Travel Agency',
      subtitle: 'Your Visa & Immigration Pre-Evaluation',
      description: 'Fill out our free form. Our experts analyze your profile and suggest the best options to achieve your study or international mobility project.',
      evaluate: 'Evaluate my eligibility',
      contactWhatsApp: 'WhatsApp Contact',
      connect: 'Login',
      createAccount: 'Create Account',
      dossiers: 'Evaluated Files',
      satisfaction: 'Satisfaction',
      responseTime: 'Response Time',
    },

    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      close: 'Close',
      send: 'Send',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      language: 'Language',
    },
  },
};

/**
 * Obtient la langue stockée ou la langue par défaut
 */
export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';
  
  const stored = localStorage.getItem('language') as Language | null;
  if (stored && (stored === 'fr' || stored === 'en')) {
    return stored;
  }

  // Déterminer la langue du navigateur
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'en' ? 'en' : 'fr';
}

/**
 * Définit la langue et la stocke
 */
export function setLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = lang;
  }
}

/**
 * Obtient une traduction
 */
export function t(key: string, lang: Language = getStoredLanguage()): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback à la clé en français si non trouvé
      value = translations.fr;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Retourner la clé si non trouvé
        }
      }
      return value;
    }
  }

  return typeof value === 'string' ? value : key;
}

export default {
  translations,
  getStoredLanguage,
  setLanguage,
  t,
};
