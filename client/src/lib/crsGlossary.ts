/**
 * Mots techniques de la calculatrice CRS expliqués en français simple. Chaque définition s'appuie sur les pages d'IRCC
 * (« Vérifiez votre note » et « Comment fonctionne le Système de classement global ») ; aucune n'annonce un résultat.
 */
export type CrsGlossaryEntry = { term: string; meaning: string };

export const CRS_GLOSSARY: CrsGlossaryEntry[] = [
  { term: "CRS / SCG", meaning: "Le Système de classement global (Comprehensive Ranking System) : la note sur 1 270 points qu’IRCC attribue à chaque profil Entrée express pour classer les candidats entre eux." },
  { term: "Entrée express", meaning: "Le système d’IRCC qui gère les demandes de résidence permanente de travailleurs qualifiés. Avoir une note ne veut pas dire être admissible : il faut d’abord remplir les conditions d’un des programmes." },
  { term: "Ronde d’invitations", meaning: "Un tirage au sort organisé par IRCC : les candidats les mieux classés reçoivent une invitation à présenter une demande de résidence permanente. La note minimale change à chaque ronde." },
  { term: "CLB / NCLC", meaning: "Niveaux de compétence linguistique canadiens (de 1 à 12). CLB est le sigle anglais, NCLC le sigle français. La calculatrice convertit vos notes de test en niveau CLB, compétence par compétence." },
  { term: "Les quatre compétences", meaning: "Expression orale, compréhension de l’oral, compréhension de l’écrit et expression écrite. Chacune est notée séparément ; c’est le niveau de chaque compétence qui compte, pas la moyenne." },
  { term: "Première et seconde langue officielle", meaning: "La première est celle où votre niveau est le meilleur ; la seconde est l’autre langue officielle (français ou anglais). Une seconde langue bien notée peut rapporter des points, et le français des points supplémentaires." },
  { term: "CNP et TEER", meaning: "La Classification nationale des professions (CNP) range chaque métier dans une catégorie TEER de 0 à 5. L’expérience « qualifiée » d’Entrée express correspond aux catégories TEER 0, 1, 2 ou 3." },
  { term: "Profession à salaire élevé", meaning: "Une profession de la liste d’IRCC dont le salaire médian dépasse un seuil : au moins 2 fois, 1,5 fois ou 1,3 fois le salaire médian de référence. Plus le salaire est élevé, plus les points sont nombreux." },
  { term: "Facteur d’intégration sur le marché du travail", meaning: "Depuis le 3 novembre 2026, il remplace les anciens points d’expérience canadienne et d’offre d’emploi : durée du travail au Canada plus points pour une profession à salaire élevé, OU une offre d’emploi valide dans une profession à salaire élevé. IRCC retient le plus avantageux des deux, jamais les deux." },
  { term: "Offre d’emploi valide", meaning: "Une offre à temps plein, dans une profession à salaire élevé, d’au moins un an à compter de votre résidence permanente. Depuis le 3 novembre 2026, aucune EIMT n’est exigée." },
  { term: "EIMT", meaning: "Étude d’impact sur le marché du travail : l’ancienne autorisation que l’employeur devait obtenir pour que l’offre d’emploi rapporte des points. Elle n’est plus exigée pour le SCG depuis le 3 novembre 2026." },
  { term: "EDE / ECA", meaning: "Évaluation des diplômes d’études (en anglais ECA) : une attestation d’un organisme approuvé par IRCC qui compare un diplôme obtenu hors du Canada à un diplôme canadien. Sans elle, un diplôme étranger ne rapporte pas de points." },
  { term: "Transférabilité des compétences", meaning: "Des points obtenus en combinant deux éléments (par exemple une bonne langue ET un diplôme élevé, ou une bonne langue ET de l’expérience étrangère). Chaque combinaison est plafonnée à 50 points, et la rubrique entière à 100." },
  { term: "Certificat de compétence", meaning: "Un certificat délivré par une province, un territoire ou un organisme fédéral canadien pour exercer un métier spécialisé. Ce n’est pas un diplôme, et ce n’est pas un certificat de désignation provinciale." },
  { term: "Désignation provinciale (PNP / PCP)", meaning: "Le certificat de désignation qu’une province ou un territoire délivre dans le cadre de son Programme des candidats des provinces. Il ajoute 600 points : c’est le facteur qui pèse le plus." },
  { term: "Points supplémentaires", meaning: "Des points ajoutés à la note de base : désignation provinciale (600), études au Canada (15 ou 30), frère ou sœur au Canada (15), compétences en français (25 ou 50). Ils sont plafonnés à 600." },
  { term: "Conjoint qui vous accompagne", meaning: "Les facteurs du conjoint ne comptent que si votre époux ou conjoint de fait n’est ni citoyen ni résident permanent du Canada ET vous accompagne dans votre demande. Sinon, IRCC vous note comme une personne sans conjoint." },
];
