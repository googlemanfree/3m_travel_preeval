/**
 * Infobulles de la calculatrice CRS : une explication en langage simple pour CHAQUE question, adossée aux notes de l'outil officiel d'IRCC
 * (« Vérifiez votre note », relu le 2026-11-04). La clé est l'identifiant du champ. Aucune de ces aides n'annonce un résultat : elles
 * expliquent d'où vient la réponse attendue et à quoi elle sert dans le calcul.
 */
export const CRS_TIPS: Record<string, string> = {
  "crs-q1": "Indiquez votre situation légale actuelle. Seuls « Marié » et « Conjoint de fait » ouvrent les questions sur le conjoint. Divorcé, séparé, veuf ou célibataire : le barème « sans conjoint » s’applique.",
  "crs-q2i": "Si votre époux ou conjoint de fait est citoyen canadien ou résident permanent, IRCC vous note comme une personne sans conjoint : ses études, sa langue et son expérience ne rapportent aucun point.",
  "crs-q2ii": "Répondez « Oui » seulement si votre conjoint sera inclus dans votre demande et viendra avec vous au Canada. Sinon, vous êtes noté comme une personne sans conjoint et les facteurs du conjoint ne comptent pas.",
  "crs-q3": "L’âge rapporte le maximum entre 20 et 29 ans, puis diminue chaque année jusqu’à 0 point à 45 ans. Si vous avez déjà reçu une invitation, indiquez votre âge à la date de l’invitation ; sinon, votre âge actuel.",
  "crs-q4": "Choisissez le niveau le plus élevé pour lequel vous avez un diplôme canadien ou, si vous avez étudié hors du Canada, une évaluation des diplômes d’études (EDE) d’un organisme approuvé par IRCC, datant de moins de cinq ans. Deux licences, ou une licence plus un diplôme de deux ans : choisissez « Au moins deux certificats… ». Un « diplôme professionnel » vise la médecine, la médecine vétérinaire, la médecine dentaire, l’optométrie, le droit, la chiropractie et la pharmacie.",
  "crs-q4b": "Répondez « Oui » seulement si : l’anglais ou le français langue seconde ne représentait pas plus de la moitié de vos études ; vous n’aviez pas à retourner dans votre pays après le diplôme ; vous avez étudié dans un établissement au Canada (pas un campus étranger) ; vous étiez inscrit à temps plein au moins huit mois, avec une présence physique au Canada (des exceptions existent pour 2020 à 2022). Un diplôme canadien rapporte 15 ou 30 points supplémentaires.",
  "crs-q4c": "Choisissez la durée du programme canadien : un ou deux ans (15 points supplémentaires), ou trois ans et plus, ou une maîtrise, un doctorat ou un diplôme professionnel d’au moins une année (30 points supplémentaires).",
  "crs-q5i": "IRCC exige des résultats de test de langue de moins de deux ans pour tous les programmes d’Entrée express, même si l’anglais ou le français est votre langue maternelle. Sans test récent, la calculatrice n’annonce aucune note.",
  "crs-first-test": "Choisissez le test passé pour votre première langue officielle, puis, pour CHAQUE compétence, la tranche de notes de votre relevé : les quatre compétences sont notées séparément. Le niveau le plus bas des quatre sert aussi au calcul de la transférabilité des compétences.",
  "crs-second-test": "Facultatif. Si vous avez aussi passé un test dans l’autre langue officielle (par exemple TEF ou TCF Canada en français quand votre premier test est en anglais), renseignez-le : il rapporte des points de seconde langue (jusqu’à 24) et, avec le niveau NCLC 7 en français dans les quatre compétences, 25 ou 50 points supplémentaires.",
  "crs-q6i": "Comptez le travail rémunéré, à temps plein (ou l’équivalent à temps partiel), accompli AU Canada pour un employeur canadien dans un emploi qualifié (catégories TEER 0, 1, 2 ou 3 de la CNP) au cours des 10 dernières années. Les années à l’étranger se déclarent à la question 6 v.",
  "crs-q6ii": "Question sur la durée dans une profession de la liste d’IRCC des professions à salaire élevé : au moins 1 an (ou 1 560 heures) au Canada, en un ou plusieurs emplois, jusqu’à 30 heures par semaine au total. Le salaire élevé se juge sur le salaire médian de la profession (code CNP), pas sur votre propre salaire.",
  "crs-q6iii": "Si ces emplois relèvent de professions dont le salaire médian est au moins deux fois supérieur au salaire médian moyen, vous obtenez 70 points de salaire élevé. Vérifiez le niveau de votre code CNP dans la liste officielle d’IRCC.",
  "crs-q6iv": "Si ce n’est pas le niveau 2 fois, vérifiez le niveau 1,5 fois (40 points). Si vous ne remplissez pas non plus cette condition, le niveau 1,3 fois s’applique (20 points) puisque vous avez déclaré une profession à salaire élevé.",
  "crs-q6v": "Additionnez, sur les 10 dernières années, le travail qualifié (TEER 0 à 3) accompli hors du Canada. Il ne rapporte pas de points directs : il intervient dans la transférabilité des compétences, avec une bonne maîtrise de la langue ou avec de l’expérience canadienne.",
  "crs-q7": "Un certificat de compétence permet d’exercer certains métiers spécialisés au Canada ; seuls les provinces, les territoires et un organisme fédéral le délivrent, après évaluation de la formation et examen. Ce n’est pas une désignation provinciale (question 9).",
  "crs-q8": "Une offre valide est à temps plein, pour un emploi qualifié dans une profession à salaire élevé, pour un an à compter de votre résidence permanente. Elle n’est pas valide si l’employeur est une ambassade, un haut-commissariat ou un consulat au Canada, ou s’il figure sur la liste des employeurs non admissibles. Depuis le 3 novembre 2026, aucune EIMT n’est exigée.",
  "crs-q8a": "L’offre rapporte 100, 70 ou 50 points selon le niveau de la profession. IRCC compare ces points à ceux de votre expérience canadienne (durée + salaire élevé) et retient le plus élevé : jamais les deux.",
  "crs-q9": "Il s’agit du certificat de désignation d’un programme des candidats des provinces (PCP) : il rapporte 600 points. Ne le confondez pas avec le certificat de compétence (question 7).",
  "crs-q10i": "Le frère ou la sœur doit être citoyen canadien ou résident permanent, vivre au Canada, avoir 18 ans ou plus, être lié à vous (ou à votre conjoint qui vous accompagne) par le sang, le mariage, l’union de fait ou l’adoption, et avoir un parent en commun avec vous. Ce lien rapporte 15 points.",
  "crs-q11": "Même règle que pour vos propres études : diplôme canadien ou évaluation des diplômes d’études (EDE) de moins de cinq ans. Les études du conjoint rapportent au plus 10 points.",
  "crs-q12": "Travail qualifié (TEER 0 à 3) de votre conjoint au Canada au cours des 10 dernières années, rémunéré et à temps plein (ou l’équivalent). Il rapporte au plus 10 points.",
  "crs-q13": "Indiquez le test de langue de votre conjoint et ses notes par compétence (résultats de moins de deux ans). Chaque compétence rapporte jusqu’à 5 points, soit 20 points au plus. Sans test, choisissez « Sans objet ».",
};

/** Première phrase de l'aide : affichée au survol (infobulle native) ; le texte complet s'ouvre au clic ou au clavier. */
export function tipSummary(tip: string): string {
  const first = tip.split(/(?<=[.!?])\s/)[0] ?? tip;
  return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}
