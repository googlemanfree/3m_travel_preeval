/**
 * Contenu de la page « Mobilité internationale depuis l'Afrique centrale ». Chaque affirmation reprend ce que le site dit déjà de 3M TRAVEL AGENCY
 * (bureaux, honoraires en FCFA, suivi à distance, évaluation gratuite) ou des règles générales d'état civil : aucune statistique, aucun délai et
 * aucune disponibilité de service tiers n'est annoncé. Les liens pointent uniquement vers des pages publiques existantes.
 */
export type CentralAfricaLink = { label: string; href: string };

export const CENTRAL_AFRICA_COUNTRIES = ["Cameroun", "Gabon", "Congo-Brazzaville", "République démocratique du Congo", "Tchad", "République centrafricaine", "Guinée équatoriale"] as const;

export const CENTRAL_AFRICA_COMMITMENTS = [
  { title: "Une évaluation gratuite d’abord", text: "Vous décrivez votre projet (études, travail, voyage) et un conseiller vous dit honnêtement ce qui est réaliste, ce qui manque et par où commencer, avant tout paiement.", href: "/consultation", label: "Prendre rendez-vous" },
  { title: "Un dossier préparé pièce par pièce", text: "Liste de pièces, cohérence des informations, traduction et légalisation quand elles sont demandées : votre dossier est relu avant d’être déposé auprès du canal officiel.", href: "/outils/liste-de-pieces", label: "Ma liste de pièces" },
  { title: "Un suivi à distance, en français", text: "Depuis le Cameroun, le Gabon, le Congo, la RDC, le Tchad ou ailleurs : vous avancez par WhatsApp et dans votre espace personnel, sans déplacement obligatoire. Bureaux à Yaoundé et Ottawa.", href: "/contact", label: "Nous écrire" },
  { title: "Des honoraires clairs, en FCFA", text: "Les tarifs d’agence sont publiés en FCFA, distincts des frais officiels (visa, établissement, tests), et un devis est confirmé avant tout paiement.", href: "/tarifs", label: "Voir les tarifs" },
] as const;

export const CENTRAL_AFRICA_STEPS = [
  { title: "Évaluer votre projet", text: "Objectif, pays visé, diplômes, expérience, langues, budget : l’évaluation gratuite fait le point.", href: "/outils/parcours-mobilite", label: "Trouver mon parcours" },
  { title: "Réunir les pièces d’état civil et de parcours", text: "Passeport valide, acte de naissance, casier judiciaire, diplômes et relevés, justificatifs d’expérience : plus tôt ils sont prêts, plus le dossier avance sereinement.", href: "/outils/liste-de-pieces", label: "Liste de pièces" },
  { title: "Faire traduire et légaliser si nécessaire", text: "Selon le pays de destination, un document peut devoir être traduit, légalisé ou apostillé. Vérifiez la règle exacte sur la source officielle avant de payer.", href: "/guides/legalisation-apostille-traduction", label: "Guide légalisation et apostille" },
  { title: "Préparer le budget et les tests de langue", text: "Frais officiels, preuve de fonds, tests de langue : estimez le coût total avant de vous engager, et visez le niveau demandé par le programme.", href: "/outils/budget-mobilite", label: "Estimer mon budget" },
  { title: "Déposer par le canal officiel, puis suivre", text: "Le dépôt se fait auprès de l’autorité ou de l’établissement concerné ; nous préparons, vérifions et suivons. La décision finale leur appartient.", href: "/sources-officielles", label: "Sources officielles" },
] as const;

export const CENTRAL_AFRICA_DOCUMENTS = [
  "Passeport en cours de validité (vérifiez la durée de validité exigée par la destination)",
  "Acte de naissance récent, avec les mentions que la destination demande",
  "Casier judiciaire récent si le programme l’exige",
  "Diplômes, relevés de notes et, pour un diplôme étranger, l’évaluation des diplômes si elle est requise",
  "Justificatifs d’expérience : contrats, attestations, bulletins de paie ou relevés",
  "Résultats d’un test de langue reconnu (par exemple TCF, TEF, IELTS) quand le programme l’exige",
  "Photos d’identité conformes et justificatifs de ressources",
] as const;

export const CENTRAL_AFRICA_DESTINATIONS: ReadonlyArray<CentralAfricaLink & { text: string }> = [
  { label: "Canada : études", href: "/procedures/canada-etudes", text: "Permis d’études, admission et fonds : le parcours détaillé." },
  { label: "Canada : calculatrice CRS et grille des 67 points", href: "/canada/crs", text: "Estimez votre note Entrée express et votre admissibilité." },
  { label: "France : études", href: "/procedures/france-etudes", text: "Admission, visa long séjour et pièces à préparer." },
  { label: "Allemagne : travail", href: "/procedures/allemagne-travail", text: "Reconnaissance du profil, offre d’emploi et visa de travail." },
  { label: "Espace Schengen", href: "/schengen", text: "Repères pour les visas de court séjour et les erreurs qui font refuser un dossier." },
  { label: "Gabon : travail", href: "/procedures/gabon-travail", text: "Une destination voisine, avec ses propres règles d’autorisation de travail." },
  { label: "RDC : e-visa", href: "/evisa/rdc", text: "La démarche en ligne et le portail officiel." },
  { label: "Toutes les procédures", href: "/procedures", text: "Plus de cent procédures par pays et par type de projet." },
];

export const CENTRAL_AFRICA_FAQ = [
  { question: "Faut-il venir à Yaoundé pour être accompagné ?", answer: "Non. Le suivi se fait à distance, par WhatsApp et dans votre espace personnel, depuis n’importe quel pays d’Afrique centrale ou d’ailleurs. Les bureaux de Yaoundé et d’Ottawa sont des points d’appui, pas une obligation." },
  { question: "Quels pays d’Afrique centrale accompagnez-vous ?", answer: "Nous accompagnons des candidats de toute l’Afrique centrale (Cameroun, Gabon, Congo-Brazzaville, RDC, Tchad, République centrafricaine, Guinée équatoriale) et d’autres régions d’Afrique. Chaque projet est étudié selon sa situation et les règles de la destination." },
  { question: "Combien coûte l’accompagnement ?", answer: "Les honoraires d’agence sont publiés en FCFA sur la page Tarifs et sont distincts des frais officiels (visa, établissement d’enseignement, tests de langue). Un devis est confirmé avant tout paiement." },
  { question: "Pouvez-vous garantir mon visa ?", answer: "Non, et personne ne le peut : la décision appartient toujours à l’autorité ou à l’établissement concerné. Nous préparons un dossier complet et cohérent, et nous vous disons clairement ce qui est faible avant le dépôt." },
  { question: "Par quoi commencer si je ne sais pas quel pays choisir ?", answer: "Répondez aux cinq questions de l’outil « Quel parcours pour mon projet ? » (gratuit, sans compte), puis demandez une évaluation : un conseiller compare les options avec vous." },
] as const;
