/**
 * Voix de marque internationale — 3M TRAVEL AGENCY.
 * Factuel : pas de faux témoignages, pas de résultat/délai/emploi promis.
 * Positionnement panafricain : candidats africains, destinations internationales, suivi à distance.
 */

export const INTERNATIONAL_BRAND = {
  publicName: "3M TRAVEL AGENCY",
  groupName: "3M Group SARL",
  /** Public cible — pas une ville seule. */
  corridor: "Afrique · destinations internationales · suivi à distance",
  corridorEn: "Africa · international destinations · remote follow-up",
  officesLine: {
    fr: "Bureaux Yaoundé · Ottawa · partenaires internationaux",
    en: "Yaoundé · Ottawa offices · international partners",
  },
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
    fr: "De l’Afrique vers le monde, 3M TRAVEL AGENCY vous accompagne — candidats et projets africains, destinations internationales, orientation, démarches, voyages et suivi à distance. Bureaux à Yaoundé et Ottawa : des points d’appui, pas une limite géographique.",
    en: "From Africa to the world, 3M TRAVEL AGENCY supports you — African candidates and projects, international destinations, orientation, procedures, travel and remote follow-up. Offices in Yaoundé and Ottawa are support points, not a geographic limit.",
  },
  /** Ligne de confiance sous les CTA. */
  heroTrust: {
    fr: "Sans compte pour démarrer et envoyer l’évaluation — compte ensuite pour le suivi et le dépôt de CV • Informations vérifiables",
    en: "No account to start and submit the assessment — account afterwards for follow-up and CV upload • Verifiable information",
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
  audienceLine: {
    fr: "Candidats et projets africains, destinations internationales, accompagnement à distance — Yaoundé et Ottawa restent nos bureaux, pas une limite géographique.",
    en: "African candidates and projects, international destinations, remote support — Yaoundé and Ottawa are our offices, not a geographic limit.",
  },
  pageLead: {
    fr: "De l’Afrique vers le monde, 3M TRAVEL AGENCY structure votre dossier, prépare les démarches et organise vos voyages — suivi à distance, destinations internationales, bureaux à Yaoundé et Ottawa. Les décisions restent celles des autorités, établissements et employeurs.",
    en: "From Africa to the world, 3M TRAVEL AGENCY structures your file, prepares procedures and organises travel — remote follow-up, international destinations, offices in Yaoundé and Ottawa. Decisions remain with authorities, schools and employers.",
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
      title: { fr: "Suivi humain à distance", en: "Human remote follow-up" },
      text: {
        fr: "Un conseiller lit votre dossier où que vous soyez en Afrique, confirme les prochaines actions et journalise les échanges dans votre espace client.",
        en: "An advisor reviews your file wherever you are in Africa, confirms next actions and logs exchanges in your client space.",
      },
    },
    {
      title: { fr: "Corridors internationaux", en: "International corridors" },
      text: {
        fr: "Destinations Canada, Europe, Golfe et au-delà ; bureaux Yaoundé et Ottawa ; partenaires placement vérifiés — un même fil de traçabilité.",
        en: "Canada, Europe, Gulf and beyond; Yaoundé and Ottawa offices; verified placement partners — one traceable thread.",
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
    evaluateHint: {
      fr: "Sans compte pour démarrer — compte ensuite pour le suivi",
      en: "No account to start — account later for follow-up",
    },
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
