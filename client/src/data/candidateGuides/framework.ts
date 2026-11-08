import type { Destination20 } from "@/data/destinations20";
import type { OfficialSource } from "@/data/destinationOfficialSources";
import type { CandidateGuide, GuideBlock, GuideSection } from "./types";

/**
 * Cadre commun du guide candidat, appliqué à toute destination qui n'a pas encore son guide rédigé et sourcé.
 *
 * Règle d'or : on ne fabrique aucun fait propre à un pays. Les rubriques « méthode de l'agence » (évaluation, protocoles, paiements,
 * responsabilités, sécurité) sont celles du guide Luxembourg, débarrassées de tout montant, délai ou règle locale ; les repères du
 * pays viennent des fiches existantes (dispositif, visa, secteurs, étapes clés, portail officiel) ; tout le reste est écrit
 * « à confirmer » plutôt qu'inventé.
 */

const splitSteps = (value: string | undefined): string[] =>
  (value ?? "")
    .split("→")
    .map((part) => part.trim().replace(/\.$/, ""))
    .filter(Boolean);

const confirm = (text: string, title = "À confirmer"): GuideBlock => ({ type: "callout", tone: "confirm", title, text });

export function buildFrameworkGuide(destination: Destination20, officialSources: OfficialSource[]): CandidateGuide {
  const { name } = destination;
  const officialSteps = splitSteps(destination.etapesCles);
  const portalLabel = officialSources[0]?.label ?? `l’autorité d’immigration de ${name}`;

  const sections: GuideSection[] = [
    {
      id: "evaluation",
      number: "01",
      title: "Évaluation en ligne et espace candidat",
      blocks: [
        { type: "text", text: `Commencer sur www.3mtravelagency.com. L’évaluation gratuite peut commencer sans compte : indiquez votre métier, votre projet et ${name} comme destination, déposez votre CV à jour et utilisez une adresse email personnelle et un numéro joignable. [S1]` },
        {
          type: "cards",
          items: [
            { title: "Renseigner un parcours précis", text: "Indiquez dates, formations, missions, outils et langues réellement maîtrisées. Les informations doivent correspondre aux justificatifs disponibles. N’inventez aucun diplôme ou emploi." },
            { title: "Recevoir le bilan et les modalités", text: "Résultats et conditions sont transmis par email et dans l’espace candidat lorsqu’il est accessible. Un complément peut être demandé avant conclusion." },
            { title: "Accéder à l’espace puis activer", text: "L’activation payante intervient après acceptation du protocole d’ouverture et validation des conditions. Le montant des frais d’ouverture dépend du profil et est confirmé par écrit avant tout paiement." },
          ],
        },
        { type: "callout", tone: "warning", text: "Un paiement ne prouve pas la transmission à un employeur ou à un établissement. Le statut doit correspondre à un événement identifiable. Aucun suivi automatique n’est présumé." },
      ],
    },
    {
      id: "dispositif",
      number: "02",
      kicker: `Repères ${name}`,
      title: "Dispositif, visa et secteurs",
      blocks: [
        {
          type: "table",
          headers: ["Rubrique", `Repère pour ${name}`],
          rows: [
            ["Dispositif", destination.dispositif],
            ["Visa / titre", destination.visa],
            ["Secteurs porteurs", destination.secteurs.join(", ")],
            ...(destination.langue ? [["Langue", destination.langue]] : []),
            ...(destination.pointFort ? [["Point fort", destination.pointFort]] : []),
            ...(destination.pointVigilance ? [["Point de vigilance", destination.pointVigilance]] : []),
          ],
          note: `Repères généraux à titre d’orientation. Les conditions d’entrée, de séjour et de travail sont fixées par les autorités de ${name} et évoluent : confirmer auprès de ${portalLabel}. [S2]`,
        },
      ],
    },
    {
      id: "etapes",
      number: "03",
      kicker: "Procédure détaillée",
      title: "Du projet à l’arrivée",
      blocks: [
        { type: "step", number: "01", title: "Présenter le projet", actors: "Candidat et équipe.", action: `Commencez l’évaluation, choisissez ${name} et envoyez votre CV avec vos expériences et coordonnées.`, expected: "Demande exploitable et instructions d’accès.", vigilance: "Un CV reçu ne vaut ni activation ni soumission à un employeur ou à un établissement." },
        { type: "step", number: "02", title: "Recevoir l’évaluation", actors: "Équipe d’évaluation.", action: "Répondez aux demandes ; recevez le bilan : profil pouvant être présenté, pièces à compléter ou réorientation.", expected: "Résultat et modalités par email et dans l’espace lorsqu’il est accessible.", vigilance: "L’évaluation gratuite ne reconnaît pas officiellement un diplôme et ne garantit ni embauche ni admission." },
        { type: "step", number: "03", title: "Signer le protocole d’ouverture", actors: "Candidat et agence.", action: "Lisez prestations, exclusions et conditions d’arrêt. Après accord, signez le protocole d’ouverture et réglez les frais d’ouverture confirmés par écrit pour votre profil.", expected: "Protocole, reçu nominatif et activation confirmée une fois les conditions réunies.", vigilance: "Vérifiez le bénéficiaire ; une promesse orale ne remplace pas le contrat." },
        { type: "step", number: "04", title: "Compléter et mettre en suivi", actors: "Candidat et équipe.", action: "Transmettez les pièces lisibles et répondez aux demandes. L’équipe confirme activation, référence et suivi.", expected: "Dossier activé et informations sur les manquants.", vigilance: "Activation ne signifie pas sélection." },
        { type: "step", number: "05", title: "Monter la candidature", actors: "Candidat et équipe de préparation.", action: "Le CV est structuré et les pièces classées. Les traductions prévues sont réalisées dans les limites du protocole.", expected: "Dossier préparé, contenu validé et compléments identifiés.", vigilance: "Distinguer traduction de candidature et traduction assermentée. Aucun fait inventé." },
        { type: "step", number: "06", title: "Présenter avec votre accord", actors: "Agence et interlocuteurs concernés.", action: "Avec votre accord, la candidature est soumise pour les besoins correspondant au profil. Restez disponible pour les compléments.", expected: "Transmission effective ou retour identifiable et prochaine action.", vigilance: "Une annonce ne constitue pas un poste réservé. Un recruteur réel n’est pas automatiquement partenaire." },
        ...(officialSteps.length > 0
          ? ([
              { type: "text", text: `Étapes de la procédure officielle de ${name} (repères) :` },
              { type: "list", items: officialSteps.map((step, index) => `${index + 7}. ${step}`) },
            ] as GuideBlock[])
          : []),
        confirm(`Délais, pièces exactes, tarifs et autorité compétente pour votre nationalité : à confirmer auprès de ${portalLabel} avant tout dépôt. Aucun délai d’obtention n’est garanti ici. [S2]`),
      ],
    },
    {
      id: "prestations",
      number: "04",
      kicker: "Prestations et pièces",
      title: "Protocoles et pièces à préparer",
      blocks: [
        {
          type: "table",
          headers: ["Prestation du protocole d’ouverture", "Contenu à encadrer"],
          rows: [
            ["Ouverture", "Enregistrement, référence et données de suivi."],
            ["Traitement", "Lisibilité, cohérence et demandes de complément."],
            ["CV", "Présentation au poste sans modification des faits."],
            ["Traduction", "Documents, langues, volume et certification éventuelle."],
            ["Montage", "Classement et harmonisation."],
            ["Soumissions", "Présentation consentie aux employeurs ou établissements concernés."],
            ["Suivi", "Demandes reçues et retours connus."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Pièces à préparer", text: `CV, qualifications, attestations et passeport. Les autres pièces (casier, contrat, assurance, preuves financières, traductions assermentées) dépendent du dispositif de ${name} : liste officielle à confirmer. [S2]` },
            { title: "Deux engagements distincts", text: "Un premier protocole encadre ouverture et candidature. Un second protocole, distinct, encadre l’accompagnement administratif après sélection confirmée. Ne pas exiger les honoraires du second sous le titre du premier." },
          ],
        },
        { type: "callout", tone: "warning", text: "Ces frais n’achètent ni emploi, ni admission, ni visa. Refuser faux diplômes, contrats, casiers et justificatifs bancaires." },
      ],
    },
    {
      id: "paiements",
      number: "05",
      kicker: "Modalités de paiement",
      title: "Frais et paiements",
      blocks: [
        { type: "text", text: `Aucun montant n’est publié sur cette page pour ${name} : les honoraires, la formule de paiement, les échéances et leurs déclencheurs sont fixés au devis écrit, après évaluation de votre profil. Le montant des frais d’ouverture varie selon le profil et est confirmé par écrit avant tout paiement.` },
        {
          type: "table",
          headers: ["Dépense", "Traitement au devis"],
          rows: [
            ["Visa / permis", "Tarif officiel à confirmer auprès de l’autorité compétente."],
            ["Pièces, assurance, examens", "Montants, payeurs et inclusion/exclusion."],
            ["Traductions assermentées", "Volume, langues et inclusion/exclusion."],
            ["Voyage, logement", "Budget, aides et remboursement."],
          ],
        },
        { type: "callout", tone: "warning", text: "Exiger un reçu. Définir annulation, refus, absence d’emploi ou d’admission et remboursement éventuel avant paiement. Un paiement échelonné ou différé ne signifie pas visa garanti." },
      ],
    },
    {
      id: "responsabilites",
      number: "06",
      kicker: "Responsabilités",
      title: "Qui intervient ?",
      blocks: [
        {
          type: "table",
          headers: ["Intervenant", "Mission", "Confirmation / limite"],
          rows: [
            ["Agence accompagnatrice", "Prestations des protocoles.", "Contrats, reçus et suivi ; aucune autorisation délivrée."],
            ["Employeur ou établissement", "Sélection, contrat ou admission.", "Décision finale ; aides non présumées."],
            ["Autorités de " + name, "Autorisation de travail ou d’études, séjour.", `Décision indépendante. Source : ${portalLabel}. [S2]`],
            ["Représentation consulaire", "Dépôt et délivrance du visa selon le circuit applicable.", "Compétence, rendez-vous et tarifs à vérifier."],
            ["Candidat", "Informations et démarches personnelles.", "Obligations maintenues."],
          ],
        },
        { type: "callout", tone: "info", text: "Les missions privées sont contractuelles. Le protocole privé ne remplace pas le contrat de l’employeur ou de l’établissement." },
      ],
    },
    {
      id: "contrat",
      number: "07",
      kicker: "Contrat de travail ou admission",
      title: "Points à contrôler avant de signer",
      blocks: [
        {
          type: "table",
          headers: ["Clause", "Contrôle concret"],
          rows: [
            ["Identités", "Salarié ou étudiant, adresse et employeur ou établissement."],
            ["Début et lieu", "Date effective, site et déplacements."],
            ["Fonctions", "Tâches et qualifications."],
            ["Temps de travail", "Durée et horaires."],
            ["Salaire", "Brut, compléments ; le brut n’est pas le net."],
            ["Congés / préavis", "Durée ou détermination, rupture."],
            ["Essai", "Écrit et durée conforme à la loi du pays."],
            ["Aides", "Pour chaque aide : payeur, montant, date et traitement d’un refus ou d’une rupture."],
          ],
        },
        confirm(`Durée maximale de la période d’essai, préavis et règles de rupture propres à ${name} : non reproduits ici, à confirmer auprès d’une source officielle ou d’un conseil local avant signature.`),
      ],
    },
    {
      id: "installation",
      number: "08",
      kicker: "Logement, visa, voyage et installation",
      title: "De l’accord au premier salaire",
      blocks: [
        {
          type: "table",
          headers: ["Moment", "Action"],
          rows: [
            ["Avant réservation", "Confirmer documents, poste ou admission, logement, trajet et payeur."],
            ["Avant départ", "Billet, bagages, pièces en cabine et copies sécurisées. Éviter le billet non remboursable avant accord."],
            ["À l’arrivée", "Adresse rejointe ; employeur ou établissement informé ; rendez-vous administratifs confirmés."],
            ["Formalités locales", `Déclaration de résidence, titre de séjour, santé : délais et lieux propres à ${name}, à confirmer. [S2]`],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Logement", text: "Confirmer avant départ qui cherche, réserve et paie. Vérifier logement, bailleur, mandat et bénéficiaire avant tout paiement. Aucun logement promis sans écrit." },
            { title: "Avant le premier salaire", text: "Prévoir logement, alimentation, téléphone, transport, démarches et imprévus. Demander la date du premier salaire. Aucune avance, réception à l’aéroport ou prise en charge de billet n’est présumée." },
          ],
        },
        confirm("Durée de validité du visa, délai pour demander le titre de séjour et pièces exigées à l’arrivée : à confirmer auprès de l’autorité compétente. Les durées du visa et du contrat sont distinctes."),
      ],
    },
    {
      id: "postes",
      number: "09",
      kicker: "Offres",
      title: "Postes et recruteurs",
      blocks: [
        { type: "callout", tone: "info", text: `Aucune offre précise n’est publiée sur cette page pour ${name} : une annonce ne vaut pas poste réservé, et un recruteur réel n’est pas automatiquement partenaire. Les opportunités compatibles avec votre profil vous sont présentées après évaluation, avec leurs conditions écrites.` },
      ],
    },
    {
      id: "faq-securite",
      number: "10",
      kicker: "FAQ, sécurité et contacts",
      title: "Questions fréquentes et sécurité",
      blocks: [
        {
          type: "faq",
          items: [
            { question: "Pourquoi deux protocoles ?", answer: "Ouverture et candidature pour le premier ; accompagnement administratif après sélection pour le second." },
            { question: "Profil favorable : suis-je recruté ou admis ?", answer: "Non. La décision finale appartient à l’employeur ou à l’établissement, et la décision de visa aux autorités." },
            { question: "Remboursement sans emploi, admission ou visa ?", answer: "Conditions écrites avant paiement ; aucune automaticité promise." },
            { question: "Comment suivre mon dossier ?", answer: "Consultez l’espace candidat et vos emails après activation ; un paiement ne vaut pas soumission." },
          ],
        },
        { type: "callout", tone: "danger", title: "Sécurité", text: "Vérifier contacts et bénéficiaires, exiger mandat et reçu, confirmer tout changement de compte. Ne partager aucun code, PIN ou mot de passe. Refuser faux documents et résultats garantis. En cas de suspicion : arrêter les versements, conserver les preuves, contacter banque ou opérateur et autorités." },
        {
          type: "cards",
          items: [{ title: "3M TRAVEL AGENCY", text: "Yaoundé — Biyem-Assi, Montée Chapelle Obili, près du collège anglophone EHS. +237 698 104 832 / +237 620 996 045. hello@3mtravelagency.com • www.3mtravelagency.com. [S1]" }],
        },
      ],
    },
  ];

  return {
    slug: destination.slug,
    country: name,
    flag: destination.flag,
    heading: `Guide candidat — ${name}`,
    lead: "Évaluation • Candidature • Formalités • Voyage • Installation. Cadre commun de l’agence et repères propres au pays.",
    edition: "2026",
    maturity: "framework",
    disclaimer:
      "Une évaluation favorable ne garantit ni embauche ni admission. Un contrat ou une admission ne garantit pas un visa. Les sources officielles ne valident pas les tarifs ni les partenariats privés de l’agence. Les rubriques marquées « à confirmer » ne sont pas encore vérifiées pour ce pays : elles sont complétées après relecture des sources officielles.",
    contents: [
      { label: "Évaluation, dispositif et étapes", sectionIds: ["evaluation", "dispositif", "etapes"] },
      { label: "Prestations, paiements et responsabilités", sectionIds: ["prestations", "paiements", "responsabilites"] },
      { label: "Contrat, installation et offres", sectionIds: ["contrat", "installation", "postes"] },
      { label: "FAQ, sécurité et sources", sectionIds: ["faq-securite", "sources"] },
    ],
    sections,
    sources: [
      { key: "S1", text: "www.3mtravelagency.com : contacts et évaluation ; fonctions connectées non vérifiées." },
      ...officialSources.map((source, index) => ({ key: `S${index + 2}`, text: `${source.label} : portail de référence à consulter, page d’accueil de l’autorité (les règles évoluent).` })),
      ...(officialSources.length === 0 ? [{ key: "S2", text: `Portail officiel de ${name} : à identifier et à confirmer.` }] : []),
    ],
    toValidate: [
      `Autorité compétente, pièces, délais et tarifs officiels pour ${name} selon la nationalité du candidat.`,
      "Représentation consulaire compétente, rendez-vous et tarifs de visa.",
      "Période d’essai, préavis et règles de rupture propres au pays.",
      "Formule de paiement, échéances, frais externes, remboursements et traductions : au devis écrit.",
      "Offres et recruteurs : aucune offre n’est publiée tant qu’elle n’a pas été vérifiée.",
    ],
  };
}
