/**
 * Voix de marque internationale — 3M TRAVEL AGENCY.
 * Factuel : pas de faux témoignages, pas de résultat/délai/emploi promis.
 * Utilisé pour enrichir heroes, SEO et sections transverses.
 */

export const INTERNATIONAL_BRAND = {
  publicName: "3M TRAVEL AGENCY",
  groupName: "3M Group SARL",
  corridor: "Yaoundé · Ottawa · partenaires internationaux",
  /** Slogan hero principal — ambition pan-africaine. */
  slogan: {
    fr: "L’Afrique vers le monde.",
    en: "Africa to the world.",
  },
  /** Sous-titre hero. */
  headline: {
    fr: "Votre projet international commence ici.",
    en: "Your international project starts here.",
  },
  /** Ligne de catégories / pôles. */
  categories: {
    fr: "Études · Travail · Voyage · Visas · Immigration · Mobilité internationale",
    en: "Studies · Work · Travel · Visas · Immigration · International mobility",
  },
  /** Corps du hero (maquette). */
  heroBody: {
    fr: "De l’Afrique vers le monde, 3M TRAVEL AGENCY vous accompagne dans vos projets internationaux, de l’orientation à la préparation des démarches, en passant par l’organisation de vos voyages et les services associés. Bénéficiez d’un accompagnement personnalisé, structuré et transparent à chaque étape de votre parcours.",
    en: "From Africa to the world, 3M TRAVEL AGENCY supports your international projects — from orientation and document preparation to travel organisation and related services. Receive personalised, structured and transparent support at every step.",
  },
  /** Ligne de confiance sous les CTA. */
  heroTrust: {
    fr: "Accompagnement personnalisé • Informations vérifiables • Suivi étape par étape",
    en: "Personalised support • Verifiable information • Step-by-step follow-up",
  },
  /** Alias utilisés par d’autres pages (promesse courte). */
  promiseLine: {
    fr: "L’Afrique vers le monde.",
    en: "Africa to the world.",
  },
  heroSupport: {
    fr: "Votre projet international commence ici.",
    en: "Your international project starts here.",
  },
  pageLead: {
    fr: "De l’Afrique vers le monde, 3M TRAVEL AGENCY structure votre dossier, prépare les démarches et organise vos voyages — corridor Yaoundé–Ottawa. Les décisions restent celles des autorités, établissements et employeurs.",
    en: "From Africa to the world, 3M TRAVEL AGENCY structures your file, prepares procedures and organises travel — Yaoundé–Ottawa corridor. Decisions remain with authorities, schools and employers.",
  },
  trustPillars: [
    {
      title: { fr: "Méthode documentée", en: "Documented method" },
      text: {
        fr: "Chaque étape s’appuie sur des exigences vérifiables et des checklists pays × visa, avant tout paiement ou dépôt.",
        en: "Every step follows verifiable requirements and country × visa checklists, before any payment or filing.",
      },
    },
    {
      title: { fr: "Suivi humain", en: "Human follow-up" },
      text: {
        fr: "Un conseiller lit votre dossier, confirme les prochaines actions et journalise les échanges dans votre espace client.",
        en: "An advisor reviews your file, confirms next actions and logs exchanges in your client space.",
      },
    },
    {
      title: { fr: "Corridor international", en: "International corridor" },
      text: {
        fr: "Bureaux Yaoundé et Ottawa, partenaires placement et employeurs vérifiés — un même fil de traçabilité.",
        en: "Yaoundé and Ottawa offices, verified placement partners and employers — one traceable thread.",
      },
    },
    {
      title: { fr: "Transparence des limites", en: "Clear boundaries" },
      text: {
        fr: "Aucun visa, emploi ou admission n’est promis. 3M prépare, oriente et suit — les autorités décident.",
        en: "No visa, job or admission is promised. 3M prepares, guides and follows — authorities decide.",
      },
    },
  ],
  cta: {
    evaluate: { fr: "Évaluer mon projet — gratuit", en: "Evaluate my project — free" },
    advisor: { fr: "Parler à un conseiller", en: "Talk to an advisor" },
    procedures: { fr: "Explorer les procédures", en: "Explore procedures" },
    destinations: { fr: "Voir les destinations", en: "Browse destinations" },
    partners: { fr: "Espace partenaires", en: "Partners area" },
    space: { fr: "Mon espace client", en: "My client space" },
  },
  disclaimer: {
    fr: "Les décisions de visa, d’admission, d’autorisation de travail, d’assurance ou de tarif appartiennent aux autorités et prestataires concernés. 3M TRAVEL AGENCY prépare, oriente et suit votre dossier sans garantir de résultat.",
    en: "Visa, admission, work authorisation, insurance and pricing decisions belong to the relevant authorities and providers. 3M TRAVEL AGENCY prepares, guides and follows your file without guaranteeing an outcome.",
  },
} as const;
