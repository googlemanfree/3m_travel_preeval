export type EvaluationProjectType = "travail" | "etudes" | "tourisme";

export type EvaluationResponseTemplate = {
  key: EvaluationProjectType;
  label: string;
  description: string;
  build: (input: { fullName: string; destinationCountry?: string | null }) => string;
};

const intro = (fullName: string) => [
  `Bonjour ${fullName},`,
  "",
  "Merci pour les informations déclarées dans votre demande. Après une première revue humaine, voici les éléments à préparer et à confirmer avec votre conseiller.",
  "",
];

const outro = [
  "",
  "Cette réponse est préparatoire : les conditions applicables et les pièces seront vérifiées avec vous sur les sources officielles avant toute démarche.",
  "",
  "Cordialement,",
  "3M Travel & Services",
];

export const EVALUATION_RESPONSE_TEMPLATES: EvaluationResponseTemplate[] = [
  {
    key: "travail",
    label: "Projet professionnel",
    description: "Cadre de revue pour expérience, qualifications, langue et pièces professionnelles.",
    build: ({ fullName, destinationCountry }) => [
      ...intro(fullName),
      `Pour votre projet professionnel${destinationCountry ? ` vers ${destinationCountry}` : ""}, nous vous invitons à confirmer la cohérence de votre expérience, de vos qualifications et de votre niveau de langue avec le poste visé.`,
      "",
      "Éléments à préparer ou à vérifier :",
      "• CV actualisé et chronologique ;",
      "• diplômes et qualifications disponibles ;",
      "• expérience professionnelle et références mobilisables ;",
      "• conditions communiquées par l’employeur ou le partenaire compétent.",
      ...outro,
    ].join("\n"),
  },
  {
    key: "etudes",
    label: "Projet d’études",
    description: "Cadre de revue pour parcours académique, admission et préparation documentaire.",
    build: ({ fullName, destinationCountry }) => [
      ...intro(fullName),
      `Pour votre projet d’études${destinationCountry ? ` vers ${destinationCountry}` : ""}, nous vous invitons à confirmer votre parcours académique et l’avancement de votre démarche auprès de l’établissement visé.`,
      "",
      "Éléments à préparer ou à vérifier :",
      "• diplômes, relevés et, si nécessaire, traductions recevables ;",
      "• projet de formation et établissement ciblé ;",
      "• situation d’admission ou calendrier de candidature ;",
      "• justificatifs financiers et pièces demandées par l’autorité compétente.",
      ...outro,
    ].join("\n"),
  },
  {
    key: "tourisme",
    label: "Projet de visite",
    description: "Cadre de revue pour objet du voyage, cohérence du séjour et justificatifs à confirmer.",
    build: ({ fullName, destinationCountry }) => [
      ...intro(fullName),
      `Pour votre projet de visite${destinationCountry ? ` vers ${destinationCountry}` : ""}, nous vous invitons à préciser l’objet du séjour et à préparer les justificatifs cohérents avec votre situation.`,
      "",
      "Éléments à préparer ou à vérifier :",
      "• objectif et période envisagée du voyage ;",
      "• hébergement, itinéraire ou invitation lorsque cela est applicable ;",
      "• justificatifs de situation personnelle et professionnelle ;",
      "• pièces demandées par le portail officiel compétent.",
      ...outro,
    ].join("\n"),
  },
];

export function getEvaluationResponseTemplates() {
  return EVALUATION_RESPONSE_TEMPLATES.map(({ key, label, description }) => ({ key, label, description }));
}

export function buildEvaluationResponseTemplate(
  projectType: string | null | undefined,
  input: { fullName: string; destinationCountry?: string | null },
) {
  const template = EVALUATION_RESPONSE_TEMPLATES.find((item) => item.key === projectType);
  return template?.build(input) ?? null;
}
