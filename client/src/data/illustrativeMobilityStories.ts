/**
 * Portraits types / exemples illustratifs — personnages fictifs.
 * Ne jamais mélanger avec les avis clients approuvés (/avis).
 * Aucun résultat de visa, d’emploi ou d’admission n’est attribué.
 */

export type IllustrativeStory = {
  id: string;
  /** Prénom + initiale — personnage fictif */
  displayName: string;
  cityOrigin: string;
  countryOrigin: string;
  flag: string;
  projectLabel: string;
  projectHref: string;
  quoteFr: string;
  quoteEn: string;
};

export const ILLUSTRATIVE_MOBILITY_STORIES: IllustrativeStory[] = [
  {
    id: "yaounde-canada-travail",
    displayName: "Aïcha M.",
    cityOrigin: "Yaoundé",
    countryOrigin: "Cameroun",
    flag: "🇨🇲",
    projectLabel: "Projet travail · Canada",
    projectHref: "/canada",
    quoteFr:
      "J’avais besoin d’y voir clair entre LMIA, permis et pièces. L’évaluation a ordonné mon dossier avant tout dépôt — sans me promettre un visa.",
    quoteEn:
      "I needed clarity between LMIA, work permits and documents. The assessment organised my file before any filing — without promising a visa.",
  },
  {
    id: "douala-allemagne-formation",
    displayName: "Jean-Paul N.",
    cityOrigin: "Douala",
    countryOrigin: "Cameroun",
    flag: "🇨🇲",
    projectLabel: "Projet formation · Allemagne",
    projectHref: "/procedures/allemagne-formation",
    quoteFr:
      "On m’a expliqué la différence entre études et Ausbildung. Les étapes étaient listées ; la décision reste aux autorités allemandes.",
    quoteEn:
      "They explained the difference between studies and Ausbildung. Steps were listed; the decision still belongs to German authorities.",
  },
  {
    id: "abidjan-france-etudes",
    displayName: "Aminata K.",
    cityOrigin: "Abidjan",
    countryOrigin: "Côte d’Ivoire",
    flag: "🇨🇮",
    projectLabel: "Projet études · France",
    projectHref: "/etudes",
    quoteFr:
      "Campus France, admission, budget : tout a été cadré. L’équipe a vérifié mes pièces ; l’admission et le visa ne sont jamais garantis.",
    quoteEn:
      "Campus France, admission, budget: everything was framed. The team checked my documents; admission and visa are never guaranteed.",
  },
  {
    id: "bouake-luxembourg-travail",
    displayName: "Koffi D.",
    cityOrigin: "Bouaké",
    countryOrigin: "Côte d’Ivoire",
    flag: "🇨🇮",
    projectLabel: "Projet travail · Luxembourg",
    projectHref: "/travail",
    quoteFr:
      "ADEM, autorisation de séjour, visa D : j’ai compris l’ordre des démarches. Pas de promesse d’employeur — juste un dossier préparé.",
    quoteEn:
      "ADEM, residence permit, D visa: I understood the order of steps. No employer promise — just a prepared file.",
  },
  {
    id: "dakar-schengen-visite",
    displayName: "Fatou S.",
    cityOrigin: "Dakar",
    countryOrigin: "Sénégal",
    flag: "🇸🇳",
    projectLabel: "Projet visite · Schengen",
    projectHref: "/schengen",
    quoteFr:
      "La checklist et les sources officielles m’ont évité des allers-retours inutiles. Le résultat du visa dépend du consulat.",
    quoteEn:
      "The checklist and official sources saved me unnecessary back-and-forth. The visa outcome depends on the consulate.",
  },
  {
    id: "ouaga-canada-etudes",
    displayName: "Issa T.",
    cityOrigin: "Ouagadougou",
    countryOrigin: "Burkina Faso",
    flag: "🇧🇫",
    projectLabel: "Projet études · Canada",
    projectHref: "/ressources/canada",
    quoteFr:
      "Les guides PDF et l’évaluation m’ont aidé à prioriser. 3M structure ; IRCC décide.",
    quoteEn:
      "The PDF guides and assessment helped me prioritise. 3M structures the file; IRCC decides.",
  },
];
