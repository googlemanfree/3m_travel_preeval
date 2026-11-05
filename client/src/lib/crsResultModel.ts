import { computeCrsScore, type CrsBreakdown, type CrsProfile } from "@shared/crsScore";

/**
 * Modèle d'affichage du résultat CRS, commun à l'écran et au PDF : mêmes sections, mêmes lignes et mêmes libellés que l'outil officiel
 * d'IRCC « Vérifiez votre note ». Aucun calcul ici : tout vient de `computeCrsScore` (shared/crsScore.ts).
 */
export type ResultLine = { label: string; points: number; sub?: boolean };
export type ResultSection = { title: string; lines: ResultLine[]; subtotalLabel: string; subtotal: number };

export function resultSections(b: CrsBreakdown, withSpouse: boolean): ResultSection[] {
  return [
    {
      title: "Facteurs de base/du capital humain",
      lines: [
        { label: "Âge", points: b.age },
        { label: "Niveau de scolarité", points: b.education },
        { label: "Langues officielles", points: b.firstLanguage + b.secondLanguage },
        { label: "Première langue officielle", points: b.firstLanguage, sub: true },
        { label: "Deuxième langue officielle", points: b.secondLanguage, sub: true },
        { label: "Facteur d’intégration sur le marché du travail", points: b.labourMarketIntegration },
      ],
      subtotalLabel: "Sous-total – Facteurs de base/du capital humain",
      subtotal: b.coreHumanCapital,
    },
    {
      title: "Facteurs de l’époux ou du conjoint de fait",
      lines: withSpouse
        ? [{ label: "Niveau de scolarité", points: b.spouseEducation }, { label: "Première langue officielle", points: b.spouseLanguage }, { label: "Expérience de travail au Canada", points: b.spouseExperience }]
        : [{ label: "Sans objet : le barème « sans conjoint » s’applique", points: 0 }],
      subtotalLabel: "Sous-total – Facteurs de l’époux",
      subtotal: b.spouseFactors,
    },
    {
      title: "Facteurs liés au transfert des compétences",
      lines: [
        { label: "Études (jusqu’à un maximum de 50 points)", points: b.transferabilityEducation },
        { label: "A) Maîtrise d’une langue officielle et niveau de scolarité", points: b.transferabilityEducationLanguage, sub: true },
        { label: "B) Expérience de travail au Canada et niveau de scolarité", points: b.transferabilityEducationExperience, sub: true },
        { label: "Expérience de travail à l’étranger (jusqu’à un maximum de 50 points)", points: b.transferabilityForeignExperience },
        { label: "A) Maîtrise d’une langue officielle et expérience de travail à l’étranger", points: b.transferabilityForeignExperienceLanguage, sub: true },
        { label: "B) Expérience de travail au Canada et à l’étranger", points: b.transferabilityForeignExperienceCanadianExperience, sub: true },
        { label: "Certificat de compétence (pour les personnes exerçant un métier spécialisé)", points: b.transferabilityCertificate },
      ],
      subtotalLabel: "Sous-total – Facteurs liés au transfert des compétences (maximum 100)",
      subtotal: b.skillTransferability,
    },
    {
      title: "Points supplémentaires (jusqu’à un maximum de 600 points)",
      lines: [
        { label: "Désignation provinciale", points: b.provincialNomination },
        { label: "Études au Canada", points: b.canadianEducationBonus },
        { label: "Frère/sœur au Canada", points: b.siblingBonus },
        { label: "Compétences linguistiques en français", points: b.frenchBonus },
      ],
      subtotalLabel: "Sous-total – Points supplémentaires",
      subtotal: b.additionalPoints,
    },
  ];
}


/** Gains possibles, calculés avec la même grille : jamais une promesse, seulement l'écart que produirait chaque changement. */
export function improvementLevers(profile: CrsProfile, current: CrsBreakdown): Array<{ label: string; gain: number }> {
  const levers: Array<{ label: string; modified: CrsProfile }> = [];
  const first = profile.firstLanguageAbilities;
  if (first && Object.values(first).some((clb) => clb < 9)) {
    levers.push({ label: "Atteindre le niveau CLB 9 dans les quatre compétences de votre première langue officielle", modified: { ...profile, firstLanguageAbilities: { speaking: Math.max(first.speaking, 9), listening: Math.max(first.listening, 9), reading: Math.max(first.reading, 9), writing: Math.max(first.writing, 9) } } });
  }
  const second = profile.secondLanguageAbilities;
  if (profile.firstOfficialLanguage === "english" && second && Object.values(second).some((clb) => clb < 7)) {
    levers.push({ label: "Passer un test de français (TEF ou TCF Canada) et atteindre le NCLC 7 dans les quatre compétences", modified: { ...profile, secondLanguageAbilities: { speaking: Math.max(second.speaking, 7), listening: Math.max(second.listening, 7), reading: Math.max(second.reading, 7), writing: Math.max(second.writing, 7) } } });
  }
  if (profile.canadianExperienceYears < 5) {
    levers.push({ label: "Acquérir une année de plus d’expérience de travail qualifié au Canada", modified: { ...profile, canadianExperienceYears: (profile.canadianExperienceYears + 1) as CrsProfile["canadianExperienceYears"] } });
  }
  if (!profile.hasProvincialNomination) levers.push({ label: "Obtenir une désignation d’une province ou d’un territoire (+600 points)", modified: { ...profile, hasProvincialNomination: true } });
  return levers
    .map(({ label, modified }) => ({ label, gain: computeCrsScore(modified).total - current.total }))
    .filter((lever) => lever.gain > 0);
}

