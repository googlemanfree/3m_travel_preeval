// Modeles "riches" (en-tete societe, articles numerotes, bloc de signature) pour les
// Protocoles d'Accord N01 et N02, parametres par pays de destination. Le modele complet
// et les montants reels ne sont aujourd'hui disponibles que pour le Luxembourg (procedure
// de placement salarie via agences partenaires) : c'est la seule destination du site ou
// 3M Travel facture un second protocole avec un bareme de paiement chiffre (voir
// client/src/data/countryProcedures/luxembourg.ts, memes montants). Pour toute autre
// destination, tant qu'aucun bareme reel n'a ete communique par l'agence, le modele par
// defaut reste volontairement generique et n'invente aucun chiffre.

export interface CountryProtocolFormula {
  label: string;
  amount: string;
  detail: string;
}

export interface CountryProtocolProfile {
  /** Libelle affiche du pays/de la procedure, ex: "Luxembourg" */
  destinationLabel: string;
  /** Autorite locale de l'emploi qui valide la vacance de poste, ex: "l'Agence pour le Developpement de l'Emploi (ADEM)" */
  employmentAuthority: string;
  /** Autorite d'immigration qui delivre le permis de travail/sejour */
  immigrationAuthority: string;
  /** Poste consulaire competent pour le depot de la demande de visa depuis le Cameroun */
  consulate: string;
  /** Delai indicatif (jours ouvres) avant reorientation si aucune selection n'aboutit */
  reorientationDelayDays: number;
  /** Destinations alternatives proposees en cas de reorientation */
  reorientationAlternatives: string;
  /** Bareme du Protocole N02 : renseigne uniquement quand des montants reels ont ete communiques par l'agence pour cette destination */
  secondProtocolFormulas?: [CountryProtocolFormula, CountryProtocolFormula, CountryProtocolFormula];
  /** Estimation des frais consulaires officiels (hors honoraires agence) */
  consularFeesEstimate?: string;
}

const GENERIC_PROFILE: CountryProtocolProfile = {
  destinationLabel: "la destination retenue",
  employmentAuthority: "l'autorité de l'emploi compétente du pays de destination",
  immigrationAuthority: "l'autorité d'immigration compétente du pays de destination",
  consulate: "le consulat ou l'ambassade compétent(e) pour cette destination",
  reorientationDelayDays: 90,
  reorientationAlternatives: "une autre destination internationale adaptée à son profil",
};

export const COUNTRY_PROTOCOL_PROFILES: Record<string, CountryProtocolProfile> = {
  luxembourg: {
    destinationLabel: "Grand-Duché de Luxembourg",
    employmentAuthority: "l'Agence pour le Développement de l'Emploi (ADEM)",
    immigrationAuthority: "la Direction de l'Immigration du Luxembourg (Ministère des Affaires Étrangères et Européennes)",
    consulate: "l'Ambassade du Royaume de Belgique à Yaoundé (représentation consulaire officielle du Grand-Duché de Luxembourg au Cameroun)",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Canada, Suisse, ou États membres de l'Espace Schengen",
    secondProtocolFormulas: [
      { label: "Règlement Intégral", amount: "2 300 000 FCFA", detail: "Règlement unique à la souscription du présent protocole. Tarif le plus avantageux, traitement prioritaire continu, gestionnaire de compte dédié." },
      { label: "Règlement Échelonné par Tranches (+15%)", amount: "2 645 000 FCFA", detail: "Tranche 1 (à la signature du Protocole N° 02) : 1 000 000 FCFA. Tranche 2 (à l'approbation du Permis de Travail) : 1 000 000 FCFA. Tranche 3 (au dépôt du dossier Visa D) : 645 000 FCFA." },
      { label: "Sortie de Visa Garanti (+25%)", amount: "2 875 000 FCFA", detail: "Acompte d'engagement (à la signature) : 1 000 000 FCFA. Solde de garantie de 1 875 000 FCFA exigible UNIQUEMENT après apposition effective du visa dans le passeport du candidat." },
    ],
    consularFeesEstimate: "environ 131 000 FCFA (Ambassade de Belgique / prestataire biométrique)",
  },
  allemagne: {
    destinationLabel: "Allemagne",
    employmentAuthority: "l'Agentur für Arbeit (agence pour l'emploi allemande) et les chambres professionnelles (IHK/HWK) qui enregistrent le contrat d'Ausbildung",
    immigrationAuthority: "l'Ausländerbehörde (service des étrangers) de la ville d'accueil",
    consulate: "l'ambassade ou le consulat d'Allemagne compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Autriche, Suisse, ou une autre destination européenne adaptée au profil du candidat",
  },
  autriche: {
    destinationLabel: "Autriche",
    employmentAuthority: "les entreprises autrichiennes recrutant dans le cadre de la stratégie 2026 pour les métiers en pénurie",
    immigrationAuthority: "les autorités d'immigration autrichiennes compétentes pour la Red-White-Red Card ou le visa national D formation",
    consulate: "l'ambassade d'Autriche compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Allemagne, Suisse, ou une autre destination européenne adaptée au profil du candidat",
  },
  suisse: {
    destinationLabel: "Suisse",
    employmentAuthority: "l'employeur suisse et la direction cantonale de la formation professionnelle qui approuve le contrat d'apprentissage",
    immigrationAuthority: "le service cantonal des migrations compétent",
    consulate: "l'ambassade ou le consulat de Suisse compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Allemagne, Autriche, ou une autre destination européenne adaptée au profil du candidat",
  },
  "pays-bas": {
    destinationLabel: "Pays-Bas",
    employmentAuthority: "l'employeur ou l'établissement de formation MBO, selon la voie BBL ou le régime Highly Skilled Migrant",
    immigrationAuthority: "l'IND (Immigratie- en Naturalisatiedienst, service néerlandais de l'immigration)",
    consulate: "l'ambassade des Pays-Bas compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  belgique: {
    destinationLabel: "Belgique",
    employmentAuthority: "l'organisme régional compétent (Flandre, Wallonie ou Bruxelles) pour le permis unique",
    immigrationAuthority: "l'Office des étrangers belge",
    consulate: "l'ambassade de Belgique compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  france: {
    destinationLabel: "France",
    employmentAuthority: "les services du ministère du Travail (DREETS) qui délivrent l'autorisation de travail",
    immigrationAuthority: "la préfecture compétente pour la carte de séjour salarié ou passeport talent",
    consulate: "le consulat de France compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  "royaume-uni": {
    destinationLabel: "Royaume-Uni",
    employmentAuthority: "l'employeur titulaire d'une licence de sponsor (Certificate of Sponsorship)",
    immigrationAuthority: "UK Visas and Immigration (UKVI)",
    consulate: "le centre de demande de visa britannique compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Irlande, ou une autre destination anglophone adaptée au profil du candidat",
  },
  irlande: {
    destinationLabel: "Irlande",
    employmentAuthority: "le Département de l'Entreprise, du Commerce et de l'Emploi (DETE), pour le Critical Skills Employment Permit",
    immigrationAuthority: "l'Irish Naturalisation and Immigration Service (INIS)",
    consulate: "l'ambassade d'Irlande compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Royaume-Uni, ou une autre destination anglophone adaptée au profil du candidat",
  },
  portugal: {
    destinationLabel: "Portugal",
    employmentAuthority: "l'employeur ou l'organisme d'accueil au Portugal",
    immigrationAuthority: "l'AIMA (Agência para a Integração, Migrações e Asilo)",
    consulate: "le consulat du Portugal compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Espagne, ou une autre destination européenne adaptée au profil du candidat",
  },
  espagne: {
    destinationLabel: "Espagne",
    employmentAuthority: "l'employeur sponsor en Espagne",
    immigrationAuthority: "l'Oficina de Extranjería compétente",
    consulate: "le consulat d'Espagne compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Portugal, ou une autre destination européenne adaptée au profil du candidat",
  },
  italie: {
    destinationLabel: "Italie",
    employmentAuthority: "l'employeur italien, dans le cadre des quotas annuels du Decreto Flussi",
    immigrationAuthority: "le Sportello Unico per l'Immigrazione (guichet unique pour l'immigration)",
    consulate: "le consulat d'Italie compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  pologne: {
    destinationLabel: "Pologne",
    employmentAuthority: "l'employeur polonais, pour le permis de travail de type A",
    immigrationAuthority: "l'Office des étrangers polonais (Urząd do Spraw Cudzoziemców)",
    consulate: "le consulat de Pologne compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  malte: {
    destinationLabel: "Malte",
    employmentAuthority: "l'employeur maltais, pour le Single Permit",
    immigrationAuthority: "Identity Malta",
    consulate: "l'ambassade ou le consulat de Malte compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  norvege: {
    destinationLabel: "Norvège",
    employmentAuthority: "l'employeur norvégien recrutant pour un métier en tension",
    immigrationAuthority: "l'UDI (Utlendingsdirektoratet, direction norvégienne de l'immigration)",
    consulate: "l'ambassade de Norvège compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination européenne adaptée au profil du candidat",
  },
  canada: {
    destinationLabel: "Canada",
    employmentAuthority: "Emploi et Développement social Canada (EDSC), pour l'étude d'impact sur le marché du travail (EIMT) lorsqu'elle est requise",
    immigrationAuthority: "Immigration, Réfugiés et Citoyenneté Canada (IRCC)",
    consulate: "le Centre de réception des demandes de visa (CRDV) compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "une autre destination internationale adaptée au profil du candidat",
  },
  australie: {
    destinationLabel: "Australie",
    employmentAuthority: "l'employeur australien ou l'organisme d'évaluation des compétences (skills assessment)",
    immigrationAuthority: "le Department of Home Affairs australien",
    consulate: "l'ambassade ou le consulat d'Australie compétent pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Nouvelle-Zélande, ou une autre destination adaptée au profil du candidat",
  },
  "nouvelle-zelande": {
    destinationLabel: "Nouvelle-Zélande",
    employmentAuthority: "l'employeur accrédité (Accredited Employer Work Visa)",
    immigrationAuthority: "Immigration New Zealand",
    consulate: "la représentation diplomatique de Nouvelle-Zélande compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Australie, ou une autre destination adaptée au profil du candidat",
  },
  emirats: {
    destinationLabel: "Émirats Arabes Unis",
    employmentAuthority: "l'employeur aux Émirats, ou le MOHRE (ministère des Ressources Humaines et de l'Émiratisation) pour le Golden Visa",
    immigrationAuthority: "le General Directorate of Residency and Foreigners Affairs (GDRFA)",
    consulate: "l'ambassade des Émirats Arabes Unis compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Qatar, ou une autre destination du Golfe adaptée au profil du candidat",
  },
  qatar: {
    destinationLabel: "Qatar",
    employmentAuthority: "l'employeur sponsor au Qatar",
    immigrationAuthority: "le ministère de l'Intérieur du Qatar",
    consulate: "l'ambassade du Qatar compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Émirats Arabes Unis, ou une autre destination du Golfe adaptée au profil du candidat",
  },
  "arabie-saoudite": {
    destinationLabel: "Arabie Saoudite",
    employmentAuthority: "l'employeur sponsor en Arabie Saoudite",
    immigrationAuthority: "le ministère de l'Intérieur saoudien",
    consulate: "l'ambassade d'Arabie Saoudite compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Émirats Arabes Unis, Qatar, ou une autre destination du Golfe adaptée au profil du candidat",
  },
  "coree-du-sud": {
    destinationLabel: "Corée du Sud",
    employmentAuthority: "l'organisme gouvernemental partenaire de l'accord bilatéral EPS (Employment Permit System)",
    immigrationAuthority: "les services coréens de l'immigration",
    consulate: "l'ambassade de Corée du Sud compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Japon, ou une autre destination asiatique adaptée au profil du candidat",
  },
  japon: {
    destinationLabel: "Japon",
    employmentAuthority: "l'organisme de supervision agréé (TITP) ou l'employeur japonais",
    immigrationAuthority: "les services de l'immigration japonais",
    consulate: "l'ambassade du Japon compétente pour le pays de résidence du candidat",
    reorientationDelayDays: 90,
    reorientationAlternatives: "Corée du Sud, ou une autre destination asiatique adaptée au profil du candidat",
  },
};

export function getCountryProtocolProfile(destinationSlugOrLabel?: string | null): CountryProtocolProfile {
  if (!destinationSlugOrLabel) return GENERIC_PROFILE;
  const key = destinationSlugOrLabel.toLowerCase();
  const match = Object.entries(COUNTRY_PROTOCOL_PROFILES).find(([slug, profile]) => key.includes(slug) || key.includes(profile.destinationLabel.toLowerCase()));
  return match ? match[1] : GENERIC_PROFILE;
}

export interface ProtocolOneVariables {
  clientNomComplet: string;
  dossierRef: string;
  destinationProjet: string;
  clientNumeroPiece?: string;
  clientTelephoneWhatsapp?: string;
  clientEmail?: string;
  modePaiement: string;
  dateHeurePaiement: string;
  conseillerEmail: string;
  empreinteSha: string;
  clientIpAddress: string;
  dateDuJour: string;
}

export interface ProtocolTwoVariables {
  clientNomComplet: string;
  clientNumeroPasseport?: string;
  clientTelephoneWhatsapp?: string;
  clientEmail?: string;
  clientEspaceId?: string;
  dossierRef: string;
  employeurNom: string;
  posteRetenu: string;
  formuleChoisie?: 0 | 1 | 2;
  systemTimestamp: string;
  clientIpAddress: string;
  dateDuJour: string;
}

const LETTERHEAD = `3M TRAVEL & SERVICES SARL — Société à Responsabilité Limitée au capital enregistré
Registre du Commerce : RC/YAO/2019/A/2567 | Numéro d'Identifiant Unique (NIU) : M112417203369H
Siège social : Biyem-Assi, Montée Chapelle Obili (à 10 mètres du Collège EHS), Yaoundé – République du Cameroun
Téléphones / WhatsApp : +237 698 104 832 / +237 620 996 045 | Courriel : hello@3mtravelagency.com | www.3mtravelagency.com

RÉPUBLIQUE DU CAMEROUN — PAIX - TRAVAIL - PATRIE
DÉPARTEMENT IMMIGRATION & MOBILITÉ PROFESSIONNELLE INTERNATIONALE`;

export function buildProtocolOneRichText(vars: ProtocolOneVariables, destinationSlugOrLabel?: string | null): string {
  const profile = getCountryProtocolProfile(destinationSlugOrLabel || vars.destinationProjet);
  return `${LETTERHEAD}

PROTOCOLE D'ACCORD CONTRACTUEL N° 01
MANDAT D'OUVERTURE DE DOSSIER, DE TRAITEMENT ADMINISTRATIF ET DE SOUMISSION PARTENAIRES
(Destination : ${profile.destinationLabel})

IDENTIFICATION DES PARTIES
D'une part, L'AGENCE MANDATAIRE : 3M TRAVEL & SERVICES SARL, RC/YAO/2019/A/2567, NIU M112417203369H, représentée par la Direction Générale des Opérations et son Conseiller Validateur habilité, ci-après « L'AGENCE ».
D'autre part, LE CLIENT / CANDIDAT : ${vars.clientNomComplet}, Dossier n° ${vars.dossierRef}, Projet/Destination : ${vars.destinationProjet}, Pièce d'identité : ${vars.clientNumeroPiece ?? "à compléter"}, Téléphone/WhatsApp : ${vars.clientTelephoneWhatsapp ?? "à compléter"}, Email : ${vars.clientEmail ?? "à compléter"}, ci-après « LE CANDIDAT » ou « LE CLIENT ».

PRÉAMBULE ET CONTEXTE
LE CLIENT a souscrit à une évaluation via la plateforme www.3mtravelagency.com. Suite à la notification du bilan d'évaluation dans son Espace Client, LE CLIENT a validé le projet ${profile.destinationLabel} et s'est acquitté des frais d'ouverture et de traitement. Le présent protocole donne pleine valeur contractuelle aux mentions du Reçu de Confirmation de Paiement délivré par L'AGENCE.

Article 1 — Objet des frais et nature de la prestation
Conformément au Reçu Officiel de paiement, les frais confirmés d'un montant de 65 000 (soixante-cinq mille) FCFA/XAF couvrent exclusivement : (1) l'ouverture administrative du dossier du CLIENT au sein des registres de L'AGENCE et sur sa plateforme numérique ; (2) le traitement administratif, la vérification d'authenticité et la mise en conformité des pièces documentaires ; (3) la préparation technique et la soumission active du profil auprès des partenaires compétents (agences de placement, établissements ou organismes concernés selon la procédure) pour ${profile.destinationLabel}, selon le projet et l'éligibilité constatée du candidat.

Article 2 — Modalités de règlement, traçabilité et reçu officiel
Le paiement fait l'objet d'un enregistrement automatique sous les références suivantes : Montant validé : 65 000 XAF. Mode de validation : ${vars.modePaiement}. Date et heure de validation : ${vars.dateHeurePaiement}. Conseiller validateur habilité : ${vars.conseillerEmail}. Empreinte cryptographique de sécurité : ${vars.empreinteSha}. Le Reçu de Confirmation de Paiement demeure archivé en permanence dans l'Espace Client du CANDIDAT comme justificatif comptable et juridique.

Article 3 — Caractère strictement non remboursable des frais
Conformément au Reçu de paiement, ces frais sont strictement non remboursables une fois le traitement administratif engagé, car ils rémunèrent les diligences, vérifications et démarches déjà réalisées avant et pendant la soumission. La recherche auprès des partenaires peut aboutir ou non ; les frais d'ouverture et de traitement demeurent acquis à L'AGENCE dès le début des diligences, sauf disposition impérative contraire expressément actée.

Article 4 — Obligation de moyens et absence de garantie de résultat
Ce document et le présent protocole ne garantissent ni emploi, ni contrat de travail, ni visa, ni résultat absolu. L'AGENCE est tenue à une stricte obligation de moyens professionnels dans la prospection et la transmission du profil. Les décisions des employeurs, partenaires et autorités publiques d'immigration restent totalement et souverainement indépendantes de 3M TRAVEL & SERVICES SARL.

Article 5 — Clause de réorientation sans frais complémentaires
Si la prospection menée pour ${profile.destinationLabel} n'aboutit pas à une sélection dans un délai indicatif de ${profile.reorientationDelayDays} jours ouvrés, L'AGENCE s'engage à faire bénéficier LE CLIENT d'une réorientation sans aucun frais d'ouverture supplémentaire vers ${profile.reorientationAlternatives}.

Article 6 — Clause de transparence et protection contre la fraude
L'AGENCE réitère que les formalités relatives à la déclaration de vacance de poste et aux certificats délivrés par ${profile.employmentAuthority} incombent exclusivement à l'employeur ou à l'établissement recruteur : aucun frais à ce titre ne peut être facturé au CANDIDAT. Le contrat ou l'engagement final sera obligatoirement conclu et signé en personne par LE CANDIDAT, jamais par L'AGENCE à sa place.

Article 7 — Condition de transition vers le Protocole d'Accord N° 02
Après obtention effective d'une proposition concrète (contrat de travail, lettre d'admission, promesse d'embauche ou équivalent selon la procédure) et validation du projet par LE CLIENT, un protocole d'accord distinct (Protocole N° 02) devra être signé pour lancer la procédure complète d'accompagnement. Toute prestation ou frais d'honoraires ultérieurs feront l'objet de cet accord distinct, qui précisera le barème de règlement financier applicable à cette destination.

Article 8 — Valeur probante de la signature électronique
L'acceptation numérique du présent protocole dans l'Espace Client, combinée aux données du Reçu de Confirmation de Paiement horodaté, constitue un contrat bilatéral parfait et juridiquement opposable.

Fait à Yaoundé, sous format numérique certifié, le ${vars.dateDuJour}.
Pour 3M TRAVEL & SERVICES SARL : Conseiller ${vars.conseillerEmail} — Empreinte : ${vars.empreinteSha}
Pour LE CLIENT : ${vars.clientNomComplet} — Statut : Lu et approuvé — IP : ${vars.clientIpAddress}`;
}

export function buildProtocolTwoRichText(vars: ProtocolTwoVariables, destinationSlugOrLabel?: string | null): string {
  const profile = getCountryProtocolProfile(destinationSlugOrLabel);
  const formulas = profile.secondProtocolFormulas;
  const formulasBlock = formulas
    ? formulas.map((formula, index) => {
        const marker = vars.formuleChoisie === index ? "[x]" : "[ ]";
        return `${marker} FORMULE ${index + 1} : ${formula.label.toUpperCase()} — ${formula.amount}\n    ${formula.detail}`;
      }).join("\n\n")
    : "Le barème de règlement financier de cette destination n'a pas encore été communiqué par l'agence : il sera précisé et injecté ici avant toute proposition de signature au candidat.";

  return `${LETTERHEAD}

PROTOCOLE D'ACCORD CONTRACTUEL N° 02
MANDAT D'ACCOMPAGNEMENT CONTRACTUEL ET PROCÉDURE DE VISA
(Procédure Post-Sélection — Destination : ${profile.destinationLabel})

IDENTIFICATION DES PARTIES
D'une part, L'AGENCE : 3M TRAVEL & SERVICES SARL, RC/YAO/2019/A/2567, NIU M112417203369H, ci-après « L'AGENCE ».
D'autre part, LE REQUÉRANT SÉLECTIONNÉ : ${vars.clientNomComplet}, Passeport : ${vars.clientNumeroPasseport ?? "à compléter"}, Téléphone/WhatsApp : ${vars.clientTelephoneWhatsapp ?? "à compléter"}, Email : ${vars.clientEmail ?? "à compléter"}, Identifiant Espace Client : ${vars.clientEspaceId ?? "à compléter"}, Dossier : ${vars.dossierRef}, Employeur/Partenaire d'accueil : ${vars.employeurNom}, Poste/Projet retenu : ${vars.posteRetenu}, ci-après « LE CANDIDAT ».

PRÉAMBULE
LE CANDIDAT a régulièrement souscrit au Protocole d'Accord N° 01, ayant permis l'audit de son profil et sa transmission officielle aux partenaires compétents pour ${profile.destinationLabel}. Par notification archivée dans son Espace Client, LE CANDIDAT a été formellement retenu. Les parties conviennent de formaliser les modalités juridiques, financières et opérationnelles destinées à sécuriser la suite de la procédure jusqu'à l'obtention du visa ou permis concerné.

Article 1 — Mission d'assistance et portée de l'accompagnement
L'AGENCE reçoit mandat d'assister, coordonner et représenter LE CANDIDAT dans : (1) l'examen du contrat ou de l'offre proposée ; (2) le suivi des démarches auprès de ${profile.employmentAuthority} lorsque applicable ; (3) l'instruction du permis de travail ou de séjour auprès de ${profile.immigrationAuthority} ; (4) la constitution de la requête consulaire et la prise de rendez-vous auprès de ${profile.consulate} ; (5) la préparation à l'installation (démarches locales à l'arrivée).

Article 2 — Réglementation de l'autorité de l'emploi et interdiction de frais employeur
Les frais relatifs à l'autorisation de recrutement et aux démarches légales incombant à l'employeur ou à l'établissement d'accueil sont supportés en totalité par celui-ci. LE CANDIDAT signe lui-même son contrat ou engagement officiel ; L'AGENCE n'est en aucun cas habilitée à signer à sa place.

Article 3 — Choix de la formule tarifaire
LE CANDIDAT déclare opter pour l'une des modalités financières suivantes, validée au moment de la signature électronique du présent acte :

${formulasBlock}

Article 4 — Débours externes et frais directs
Les montants de l'Article 3 rémunèrent les prestations d'expertise et de conciergerie de L'AGENCE. Restent à la charge directe du CANDIDAT : les frais consulaires officiels${profile.consularFeesEstimate ? ` (${profile.consularFeesEstimate})` : ""}, les frais médicaux exigés par les autorités sanitaires, et le coût du billet d'avion.

Article 5 — Engagements de ponctualité et loyauté du candidat
LE CANDIDAT s'engage à se présenter personnellement aux rendez-vous fixés (biométrie, dépôt de pièces), à régler les échéances convenues à l'Article 3 sous peine de suspension de l'instruction du dossier, et à ne dissimuler aucun antécédent judiciaire, médical ou migratoire pertinent.

Article 6 — Clause de souveraineté institutionnelle et garantie
La décision finale d'octroi du permis ou du visa relève de la compétence exclusive des autorités du pays de destination et, le cas échéant, du poste consulaire compétent. En cas de refus formel non imputable à une faute, une fausse déclaration ou un renoncement volontaire du CANDIDAT, les conditions de recours ou de remboursement partiel applicables sont celles précisées dans la formule choisie à l'Article 3.

Article 7 — Sécurisation numérique et notifications
Toutes les pièces contractuelles et décisions administratives sont numérisées et conservées dans l'Espace Client sécurisé du CANDIDAT sur www.3mtravelagency.com.

Fait à Yaoundé, sous forme de contrat électronique opposable, le ${vars.dateDuJour}.
Horodatage d'engagement : ${vars.systemTimestamp}
Pour LE CANDIDAT : ${vars.clientNomComplet} — Mention : « Bon pour accord, lu et approuvé » — IP : ${vars.clientIpAddress}`;
}
