/**
 * Contenus de la campagne d'enrichissement, lot 4 : fiche e-Visa par pays (/evisa/:id).
 * Les parties statiques suivent les mêmes règles que contentCampaign.ts (aucun chiffre assorti d'une unité, aucune promesse).
 * La FAQ propre à chaque pays n'utilise QUE les champs déjà présents dans la fiche, et rappelle que délai et frais
 * sont indicatifs et fixés par le portail officiel : aucun fait nouveau n'est introduit sans source.
 */
import type { FaqItem, StepItem } from "@/data/pageEnrichment";

export type EvisaCountryFacts = {
  country: string;
  delay: string;
  fee: string;
  duration: string;
  docs: string;
  officialPortalUrl?: string;
  officialPortalLabel?: string;
  officialVerifiedAt?: string;
};

export const EVISA_COUNTRY_CHECKS: string[] = [
  "Votre nationalité et le type de passeport : l’éligibilité à l’e-Visa dépend de l’un et de l’autre.",
  "Le motif du voyage : tourisme, affaires, transit ou visite familiale n’ouvrent pas toujours les mêmes conditions.",
  "La validité du passeport par rapport à la date d’arrivée et à la durée du séjour prévue.",
  "Les pages vierges disponibles dans le passeport, lorsque le pays les exige.",
  "La date de départ : certains portails demandent de déposer la demande dans une fenêtre de temps précise avant l’arrivée.",
  "La photo d’identité numérique et le scan de la page d’identité du passeport, lisibles et conformes au format demandé.",
];

export const EVISA_COUNTRY_ERRORS: string[] = [
  "Une orthographe du nom ou un numéro de passeport qui diffère de celui du passeport : la décision peut devenir inutilisable à la frontière.",
  "Une photo recadrée, floue ou avec un arrière-plan non conforme.",
  "Une adresse e-mail saisie avec une faute : la décision est envoyée à cette adresse.",
  "Un paiement effectué sur un site qui imite le portail officiel. Passez toujours par le lien officiel indiqué sur cette fiche.",
  "Un départ prévu avant la fin du traitement : ne réservez pas de billet non modifiable tant que la décision n’est pas reçue.",
  "Ne pas imprimer ni enregistrer la décision électronique avant le voyage.",
];

export const EVISA_COUNTRY_REFUSAL_STEPS: StepItem[] = [
  { title: "Lire le motif indiqué", text: "Le portail précise parfois la raison ; conservez le message tel quel sans le modifier." },
  { title: "Ne pas redéposer au hasard", text: "Plusieurs demandes successives avec les mêmes informations peuvent aggraver la situation. Corrigez d’abord ce qui est en cause." },
  { title: "Nous écrire avec la décision", text: "Un conseiller regarde avec vous si une correction suffit, si une autre catégorie de visa convient, ou s’il faut passer par l’ambassade ou le consulat." },
];

/** Question et réponse propres à un pays, construites uniquement à partir des champs de la fiche. */
export function buildEvisaCountryFaq(destination: EvisaCountryFacts): FaqItem[] {
  const { country, delay, fee, duration, docs, officialPortalLabel, officialVerifiedAt } = destination;
  const isConfirmed = (value: string) => value.trim().length > 0 && !/^à confirmer/i.test(value.trim());
  const verified = officialVerifiedAt
    ? `Le portail officiel (${officialPortalLabel ?? "portail du pays"}) a été vérifié le ${officialVerifiedAt}.`
    : "Cette fiche n’a pas fait l’objet d’une vérification récente sur le portail officiel : consultez-le avant de déposer.";
  return [
    {
      question: `Quel est le délai pour obtenir l’e-Visa ${country} ?`,
      answer: isConfirmed(delay)
        ? `Le délai indiqué sur cette fiche est « ${delay} ». Il est indicatif : c’est le portail officiel qui fixe le traitement réel, et il peut varier selon la nationalité, la période et l’affluence. ${verified}`
        : `Le délai n’est pas publié ici parce qu’il dépend de la nationalité, du motif et de la période. Il est donné par le portail officiel au moment du dépôt. ${verified}`,
    },
    {
      question: `Combien coûte l’e-Visa ${country} ?`,
      answer: isConfirmed(fee)
        ? `Les frais indiqués sur cette fiche sont « ${fee} ». Ils sont indicatifs et peuvent changer ou différer selon la catégorie et la nationalité : seul le montant affiché par le portail officiel au moment du paiement fait foi. Les frais d’accompagnement de 3M TRAVEL AGENCY, s’il y en a, sont confirmés par écrit avant tout paiement.`
        : `Les frais officiels ne sont pas publiés ici parce qu’ils dépendent de la catégorie et de la nationalité. Le montant fait foi lorsqu’il est affiché par le portail officiel au moment du paiement. Les frais d’accompagnement de 3M TRAVEL AGENCY, s’il y en a, sont confirmés par écrit avant tout paiement.`,
    },
    {
      question: `Combien de temps puis-je rester avec l’e-Visa ${country} ?`,
      answer: isConfirmed(duration)
        ? `La durée de séjour indiquée sur cette fiche est « ${duration} ». La durée réellement accordée figure sur la décision électronique que vous recevez : c’est elle qu’il faut respecter, et non la durée affichée sur une fiche d’information.`
        : `La durée de séjour dépend de la catégorie accordée et figure sur la décision électronique que vous recevez. C’est elle qu’il faut respecter à l’arrivée et pendant le séjour.`,
    },
    {
      question: `Quels documents préparer pour ${country} ?`,
      answer: `Cette fiche indique : ${docs.replace(/\.$/, "")}. La liste exacte dépend de votre nationalité et du motif du voyage ; elle est confirmée par le portail officiel au moment de la demande.`,
    },
    {
      question: `3M TRAVEL AGENCY peut-elle m’obtenir l’e-Visa ${country} ?`,
      answer: `Nous vérifions votre dossier avant le dépôt, nous vous aidons à le compléter correctement et nous vous expliquons la décision reçue. La décision appartient toujours aux autorités du pays, et nous ne la promettons jamais.`,
    },
    {
      question: `Que faire si ma demande pour ${country} est refusée ?`,
      answer: `Ne redéposez pas tout de suite avec les mêmes informations. Conservez le message reçu et écrivez-nous : nous regardons si une correction suffit ou si une autre démarche, par exemple un visa déposé auprès de l’ambassade ou du consulat, est plus adaptée.`,
    },
  ];
}
