/**
 * Contenus de la campagne d'enrichissement, lot 8 : /schengen et /about.
 * Mêmes règles que contentCampaign.ts : aucun chiffre assorti d'une unité, aucune promesse de résultat,
 * aucune donnée propre à l'agence que le code ne contienne déjà (équipe, effectifs, statistiques : non publiés).
 */
import type { FaqItem } from "@/data/pageEnrichment";

export const SCHENGEN_COMMON_ERRORS: string[] = [
  "Un motif de voyage qui ne correspond pas aux pièces : par exemple une invitation familiale avec des réservations d’hôtel sans explication.",
  "Un hébergement impossible à vérifier, ou une adresse qui ne concorde pas avec l’itinéraire annoncé.",
  "Des relevés bancaires avec un dépôt important juste avant la demande, sans origine justifiée.",
  "Des dates incohérentes entre le formulaire, l’assurance, l’hébergement et les réservations.",
  "Une assurance qui ne couvre pas toute la durée du séjour ou tous les pays de l’itinéraire.",
  "Un dépôt trop tardif par rapport au voyage, sans marge pour un rendez-vous manqué ou une pièce complémentaire.",
  "Une photo non conforme ou un passeport dont la validité est trop proche de la fin du séjour.",
];

export const SCHENGEN_FAQ: FaqItem[] = [
  {
    question: "Où déposer ma demande de visa Schengen ?",
    answer: "En principe auprès du consulat, ou du centre de dépôt agréé, du pays où vous passerez le plus de temps. Si votre séjour est partagé à égalité entre plusieurs pays, le premier pays d’entrée peut être déterminant. Le consulat compétent et les modalités de rendez-vous sont indiqués sur le site officiel de ce pays.",
  },
  {
    question: "Une assurance voyage est-elle obligatoire ?",
    answer: "Une assurance couvrant les frais médicaux et le rapatriement pendant tout le séjour est généralement exigée pour un visa Schengen. Les conditions précises de couverture sont fixées par les règles européennes et par le consulat : vérifiez-les avant de souscrire, et conservez l’attestation avec le dossier.",
  },
  {
    question: "Dois-je acheter mon billet d’avion avant la décision ?",
    answer: "Évitez d’acheter un billet non modifiable avant la décision. Certains consulats demandent seulement un justificatif de réservation ou un itinéraire : renseignez-vous sur ce que le vôtre accepte, et privilégiez une réservation modifiable ou remboursable.",
  },
  {
    question: "Comment prouver mes ressources financières ?",
    answer: "Par des relevés bancaires récents, des justificatifs de revenus ou d’activité, et, si quelqu’un prend votre séjour en charge, une attestation de prise en charge avec ses propres justificatifs. L’autorité regarde la cohérence et l’origine des fonds, pas seulement un solde.",
  },
  {
    question: "Le visa Schengen me donne-t-il le droit d’entrer ?",
    answer: "Il vous autorise à vous présenter à la frontière, où le contrôle final est fait. Une entrée peut être refusée si les conditions ne sont plus remplies, par exemple en cas de passeport insuffisamment valide, de pièces incohérentes ou d’une menace pour l’ordre public.",
  },
  {
    question: "Puis-je travailler avec un visa Schengen de court séjour ?",
    answer: "Non, en principe. Un visa de court séjour ne donne pas le droit d’exercer une activité salariée. Certaines activités professionnelles ponctuelles (réunion, salon) peuvent être permises au titre du motif « affaires », sans emploi sur place. Pour travailler, il faut une procédure nationale distincte.",
  },
  {
    question: "Que faire en cas de refus de visa Schengen ?",
    answer: "La décision est notifiée avec ses motifs. Lisez-les avec soin : selon le pays, un recours est possible dans un délai précis fixé par la décision. Ne redéposez pas immédiatement sans corriger ce qui est en cause. Nous pouvons relire la décision avec vous, sans promettre l’issue d’une nouvelle demande.",
  },
];

export const ABOUT_FAQ: FaqItem[] = [
  {
    question: "3M TRAVEL AGENCY est-elle une autorité ou une ambassade ?",
    answer: "Non. Nous préparons et suivons des dossiers, nous orientons vers les sources officielles et nous aidons à éviter les erreurs. Les décisions de visa, d’admission ou d’emploi appartiennent toujours aux autorités, aux établissements et aux employeurs.",
  },
  {
    question: "Comment travaille l’agence, concrètement ?",
    answer: "Une évaluation gratuite d’orientation, puis un bilan avec les points forts, les points à clarifier et les pièces à réunir. Si vous décidez de continuer, un dossier est ouvert après un devis écrit, vous déposez vos pièces dans votre espace sécurisé et un conseiller suit chaque étape avec vous.",
  },
  {
    question: "Où l’agence est-elle présente ?",
    answer: "À Yaoundé, avec une réception sur place, et à Ottawa, où un bureau coordonne le Canada sur rendez-vous. Le suivi se fait à distance pour les candidats situés ailleurs en Afrique. Les coordonnées complètes figurent sur la page Contact.",
  },
  {
    question: "Comment vérifier que l’agence est bien enregistrée ?",
    answer: "La raison sociale, le numéro d’immatriculation et l’identifiant fiscal sont publiés sur la page « Vérifier une agence avant de payer », avec un lien vers le registre officiel. Nous vous invitons à les recouper avant tout paiement, comme vous le feriez pour n’importe quelle agence.",
  },
  {
    question: "Publiez-vous des chiffres de réussite ?",
    answer: "Non. Nous ne publions ni taux de réussite, ni statistiques de visas obtenus, ni notes, tant qu’une série de données vérifiable, datée et clairement définie n’existe pas. Les avis publiés sont réels, modérés et autorisés ; sans avis approuvé, la galerie reste vide.",
  },
  {
    question: "À qui puis-je écrire pour une réclamation ?",
    answer: "Directement à l’agence, par e-mail ou par la page Contact, en décrivant le problème et en joignant vos justificatifs. Une réponse écrite vous est adressée et l’historique des échanges est conservé.",
  },
];
