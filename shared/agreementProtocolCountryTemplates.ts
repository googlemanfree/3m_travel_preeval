// Modeles "riches" (en-tete societe, articles numerotes, bloc de signature) pour les
// Protocoles d'Accord N01 et N02, parametres par pays de destination ET par type de visa
// (travail, etudes, visiteurs, regroupement familial). Le bareme chiffre du Protocole N02
// n'est aujourd'hui renseigne que pour le Luxembourg (placement salarie) ; pour les autres
// destinations, le texte s'adapte au visa sans inventer de montants.

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
  /** Libellé du programme / type de procédure (travail, études, visiteur…) */
  procedureProgramLabel?: string;
  /** Phrase d’objet adaptée au type de visa (Article 1) */
  procedureObjectClause?: string;
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
      { label: "Paiement à l'obtention du visa (+25%)", amount: "2 875 000 FCFA", detail: "Acompte d'engagement (à la signature) : 1 000 000 FCFA. Solde de 1 875 000 FCFA exigible UNIQUEMENT après apposition effective du visa dans le passeport du candidat." },
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
    procedureProgramLabel: "Procédure Canada",
    procedureObjectClause: "la préparation et la soumission du dossier auprès des partenaires et autorités compétentes pour le Canada, selon le programme retenu (travail, études ou séjour temporaire)",
    consularFeesEstimate: "frais IRCC / biométrie selon le type de demande (montants officiels à confirmer sur le portail Canada.ca)",
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

function foldProtocolKey(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Kind de procédure pour protocoles N°01 / N°02 (tous pays). */
export type ProtocolVisaKind = "travail" | "etudes" | "visiteurs" | "famille" | "residence" | "autre";

export function detectProtocolVisaKind(visaType?: string | null): ProtocolVisaKind {
  const visa = foldProtocolKey(visaType);
  if (!visa) return "autre";
  if (/etud|study|student|academ|formation|ausbildung|apprentissage/.test(visa)) return "etudes";
  if (/famill|family|regroupement|conjoint|spouse|parrainage familial/.test(visa)) return "famille";
  if (/express|pnp|arrima|resident permanent|residence permanente|installation/.test(visa)) return "residence";
  if (/travail|work|emploi|worker|lmia|eimt|permis de travail|travailleur|salarie|qualified|qualifie/.test(visa)) return "travail";
  if (/visiteur|visitor|touris|ave|eta|court sejour|loisirs|visite/.test(visa)) return "visiteurs";
  if (/\bschengen\b/.test(visa) && !/travail|etud|work|study/.test(visa)) return "visiteurs";
  return "autre";
}

/** Variantes Canada (IRCC / DLI / EIMT) selon le type de visa. */
function canadaProtocolForVisa(base: CountryProtocolProfile, visaType?: string | null): CountryProtocolProfile {
  const kind = detectProtocolVisaKind(visaType);
  if (kind === "etudes") {
    return {
      ...base,
      procedureProgramLabel: "Permis d’études — Canada",
      employmentAuthority: "l’établissement d’enseignement désigné (DLI) et, le cas échéant, le ministère de l’Immigration du Québec pour le CAQ",
      immigrationAuthority: "Immigration, Réfugiés et Citoyenneté Canada (IRCC) — permis d’études",
      procedureObjectClause: "la préparation du dossier d’études (admission DLI, CAQ si Québec, preuve de fonds) et la soumission de la demande de permis d’études auprès d’IRCC, conformément au guide Visa Études Canada publié sur le site",
      reorientationAlternatives: "une autre destination d’études internationale adaptée au profil du candidat",
    };
  }
  if (kind === "visiteurs") {
    return {
      ...base,
      procedureProgramLabel: "Visa visiteur / séjour temporaire — Canada",
      employmentAuthority: "non applicable pour un séjour temporaire sans autorisation de travail",
      immigrationAuthority: "Immigration, Réfugiés et Citoyenneté Canada (IRCC) — visa de visiteur ou AVE",
      procedureObjectClause: "la préparation et le dépôt de la demande de séjour temporaire (visa de visiteur ou AVE selon le cas) auprès d’IRCC, sans promesse d’emploi ni de permis de travail",
      reorientationAlternatives: "une autre destination de séjour temporaire adaptée au profil du candidat",
    };
  }
  if (kind === "famille") {
    return {
      ...base,
      procedureProgramLabel: "Regroupement familial / parrainage — Canada",
      employmentAuthority: "non applicable — procédure de parrainage familial",
      immigrationAuthority: "Immigration, Réfugiés et Citoyenneté Canada (IRCC) — parrainage / regroupement",
      procedureObjectClause: "la préparation du dossier de parrainage ou de regroupement familial et la soumission auprès d’IRCC, sans garantie d’approbation ni de délai",
      reorientationAlternatives: "une autre procédure familiale ou destination adaptée au profil du candidat",
    };
  }
  if (kind === "residence") {
    return {
      ...base,
      procedureProgramLabel: "Sélection permanente / Entrée Express / PNP — Canada",
      employmentAuthority: "le programme fédéral ou provincial de sélection applicable (Entrée Express, PNP ou Arrima)",
      immigrationAuthority: "Immigration, Réfugiés et Citoyenneté Canada (IRCC) et, le cas échéant, le ministère de l’Immigration du Québec",
      procedureObjectClause: "la préparation du profil de sélection et du dossier fédéral/provincial selon le programme retenu, sans garantie d’invitation ni de résidence permanente",
    };
  }
  return {
    ...base,
    procedureProgramLabel: "Permis de travail — Canada",
    procedureObjectClause: "la préparation du dossier de travail (offre, EIMT/LMIA ou exemption, demande de permis) et la soumission auprès d’IRCC / EDSC, conformément au guide Visa Travail Canada publié sur le site",
  };
}

/**
 * Adapte le profil protocole au type de visa pour TOUS les pays
 * (travail, études, visiteurs, regroupement familial) — pas seulement le Canada.
 */
export function protocolProfileForVisa(
  countrySlug: string,
  base: CountryProtocolProfile,
  visaType?: string | null,
): CountryProtocolProfile {
  if (countrySlug === "canada") return canadaProtocolForVisa(base, visaType);

  const kind = detectProtocolVisaKind(visaType);
  const label = base.destinationLabel;

  if (kind === "etudes") {
    return {
      ...base,
      procedureProgramLabel: `Visa études — ${label}`,
      employmentAuthority: `l’établissement d’enseignement et les services d’admission compétents pour ${label}`,
      procedureObjectClause: `la préparation du dossier d’études (parcours scolaire, diplômes, relevés, cycle visé, admission ou candidature, financement) et la soumission auprès des autorités compétentes pour ${label}, sans garantie d’admission ni de visa`,
      reorientationAlternatives: base.reorientationAlternatives.includes("études")
        ? base.reorientationAlternatives
        : `une autre destination d’études internationale adaptée au profil du candidat`,
    };
  }

  if (kind === "visiteurs") {
    return {
      ...base,
      procedureProgramLabel: `Visa visiteurs / séjour temporaire — ${label}`,
      employmentAuthority: "non applicable pour un séjour temporaire sans autorisation de travail",
      procedureObjectClause: `la préparation du dossier de séjour temporaire (statut déclaré — chef d’entreprise, employé ou particulier —, motif, itinéraire, attaches et justificatifs de retour) et le dépôt auprès des autorités compétentes pour ${label}, sans promesse d’emploi ni de permis de travail`,
      reorientationAlternatives: `une autre destination de séjour temporaire adaptée au profil du candidat`,
    };
  }

  if (kind === "famille") {
    return {
      ...base,
      procedureProgramLabel: `Regroupement familial — ${label}`,
      employmentAuthority: "non applicable — procédure de regroupement / parrainage familial",
      procedureObjectClause: `la préparation du dossier de regroupement familial (lien de parenté, pièces d’état civil, garanties du membre de famille) et la soumission auprès des autorités compétentes pour ${label}, sans garantie d’approbation`,
      reorientationAlternatives: `une autre procédure familiale ou destination adaptée au profil du candidat`,
    };
  }

  if (kind === "residence") {
    return {
      ...base,
      procedureProgramLabel: `Résidence / installation — ${label}`,
      procedureObjectClause: `la préparation du dossier d’installation ou de sélection permanente pour ${label}, selon le programme retenu, sans garantie d’invitation ni de résidence`,
    };
  }

  // Travail (défaut explicite) — vacance de poste = poste ouvert côté employeur, pas « vacances ».
  return {
    ...base,
    procedureProgramLabel: base.procedureProgramLabel ?? `Visa travail — ${label}`,
    procedureObjectClause:
      base.procedureObjectClause
      ?? `la préparation et la soumission du profil professionnel auprès des partenaires compétents pour ${label} (dont, le cas échéant, la déclaration de poste ouvert / vacance de poste auprès de ${base.employmentAuthority}), selon le projet et l’éligibilité constatée du candidat`,
  };
}

export function getCountryProtocolProfile(
  destinationSlugOrLabel?: string | null,
  visaType?: string | null,
): CountryProtocolProfile {
  if (!destinationSlugOrLabel) {
    return protocolProfileForVisa("generic", GENERIC_PROFILE, visaType);
  }
  const key = foldProtocolKey(destinationSlugOrLabel);
  const match = Object.entries(COUNTRY_PROTOCOL_PROFILES).find(
    ([slug, profile]) => key.includes(slug) || key.includes(foldProtocolKey(profile.destinationLabel)),
  );
  if (!match) {
    return protocolProfileForVisa(
      "generic",
      {
        ...GENERIC_PROFILE,
        destinationLabel: destinationSlugOrLabel.trim() || GENERIC_PROFILE.destinationLabel,
      },
      visaType,
    );
  }
  const [slug, profile] = match;
  return protocolProfileForVisa(slug, profile, visaType);
}

/** Clauses articles 4 / 6 / 7 du protocole N°01 selon le type de visa. */
export function protocolOneKindClauses(kind: ProtocolVisaKind, profile: CountryProtocolProfile): {
  noGuarantee: string;
  transparency: string;
  transition: string;
  titleSuffix: string;
} {
  if (kind === "etudes") {
    return {
      titleSuffix: "MANDAT D'OUVERTURE DE DOSSIER ÉTUDES ET TRAITEMENT ADMINISTRATIF",
      noGuarantee:
        "Ce document et le présent protocole ne garantissent ni admission scolaire, ni place en établissement, ni visa études, ni résultat absolu. L'AGENCE est tenue à une stricte obligation de moyens professionnels dans la préparation du dossier académique. Les décisions des établissements et des autorités d'immigration restent totalement et souverainement indépendantes de 3M Travel Agency SARL.",
      transparency: `L'AGENCE réitère que les frais d'inscription, de scolarité et les formalités propres à ${profile.employmentAuthority} incombent à l'établissement ou au candidat selon les règles publiées : aucun frais « caché » d'admission ne peut être inventé par L'AGENCE. Tout engagement officiel avec l'établissement sera conclu par LE CANDIDAT, jamais par L'AGENCE à sa place.`,
      transition:
        "Après obtention effective d'une proposition concrète (lettre d'admission, confirmation d'inscription ou équivalent) et validation du projet par LE CLIENT, un protocole d'accord distinct (Protocole N° 02) devra être signé pour lancer la procédure complète d'accompagnement visa études. Toute prestation ou frais d'honoraires ultérieurs feront l'objet de cet accord distinct.",
    };
  }
  if (kind === "visiteurs") {
    return {
      titleSuffix: "MANDAT D'OUVERTURE DE DOSSIER VISITEURS / SÉJOUR TEMPORAIRE",
      noGuarantee:
        "Ce document et le présent protocole ne garantissent ni visa, ni entrée sur le territoire, ni durée de séjour, ni résultat absolu. L'AGENCE est tenue à une stricte obligation de moyens professionnels dans la préparation du dossier de séjour temporaire. Les décisions des autorités consulaires et d'immigration restent totalement et souverainement indépendantes de 3M Travel Agency SARL.",
      transparency: `L'AGENCE réitère qu'aucun frais d'employeur ni de « placement » ne s'applique à une procédure visiteurs. Les justificatifs (statut, motif, hébergement, attaches, retour) incombent au CANDIDAT ; les formalités officielles relèvent de ${profile.immigrationAuthority}. Aucune promesse d'emploi n'est associée à ce mandat.`,
      transition:
        "Après validation du projet de séjour et, le cas échéant, obtention des justificatifs complémentaires demandés, un protocole d'accord distinct (Protocole N° 02) pourra être signé si un accompagnement consulaire étendu est requis. Toute prestation ou frais d'honoraires ultérieurs feront l'objet de cet accord distinct.",
    };
  }
  if (kind === "famille") {
    return {
      titleSuffix: "MANDAT D'OUVERTURE DE DOSSIER REGROUPEMENT FAMILIAL",
      noGuarantee:
        "Ce document et le présent protocole ne garantissent ni approbation du regroupement, ni visa, ni délai d'instruction, ni résultat absolu. L'AGENCE est tenue à une stricte obligation de moyens professionnels dans la préparation du dossier familial. Les décisions des autorités d'immigration restent totalement et souverainement indépendantes de 3M Travel Agency SARL.",
      transparency: `L'AGENCE réitère que les pièces d'état civil, preuves de lien et garanties du membre de famille incombent aux parties concernées. Les formalités auprès de ${profile.immigrationAuthority} ne peuvent donner lieu à des frais inventés par L'AGENCE.`,
      transition:
        "Après constitution du dossier familial et validation du projet par LE CLIENT, un protocole d'accord distinct (Protocole N° 02) pourra être signé pour l'accompagnement jusqu'au dépôt consulaire. Toute prestation ou frais d'honoraires ultérieurs feront l'objet de cet accord distinct.",
    };
  }
  return {
    titleSuffix: "MANDAT D'OUVERTURE DE DOSSIER, DE TRAITEMENT ADMINISTRATIF ET DE SOUMISSION PARTENAIRES",
    noGuarantee:
      "Ce document et le présent protocole ne garantissent ni emploi, ni contrat de travail, ni visa, ni résultat absolu. L'AGENCE est tenue à une stricte obligation de moyens professionnels dans la prospection et la transmission du profil. Les décisions des employeurs, partenaires et autorités publiques d'immigration restent totalement et souverainement indépendantes de 3M Travel Agency SARL.",
    transparency: `L'AGENCE réitère que les formalités relatives à la déclaration de poste ouvert (vacance de poste) et aux certificats délivrés par ${profile.employmentAuthority} incombent exclusivement à l'employeur ou à l'établissement recruteur : aucun frais à ce titre ne peut être facturé au CANDIDAT. Le contrat ou l'engagement final sera obligatoirement conclu et signé en personne par LE CANDIDAT, jamais par L'AGENCE à sa place.`,
    transition:
      "Après obtention effective d'une proposition concrète (contrat de travail, promesse d'embauche ou équivalent selon la procédure) et validation du projet par LE CLIENT, un protocole d'accord distinct (Protocole N° 02) devra être signé pour lancer la procédure complète d'accompagnement. Toute prestation ou frais d'honoraires ultérieurs feront l'objet de cet accord distinct, qui précisera le barème de règlement financier applicable à cette destination.",
  };
}

/** Textes du reçu de paiement alignés sur le type de visa (tous pays). */
export function paymentReceiptCopyForVisa(visaType?: string | null): {
  objectText: string;
  importantText: string;
  emailFeesLine: string;
  emailImportant: string;
} {
  const kind = detectProtocolVisaKind(visaType);
  if (kind === "etudes") {
    return {
      objectText:
        "Les frais confirmés couvrent l’ouverture du dossier, le traitement administratif et la préparation du dossier d’études (parcours scolaire, diplômes, relevés, cycle visé, admission ou candidature) selon le projet et l’éligibilité du candidat. Ces frais sont non remboursables une fois le traitement administratif engagé, car ils rémunèrent les diligences déjà réalisées.",
      importantText:
        "Ce reçu ne garantit ni admission scolaire, ni place en établissement, ni visa études, ni résultat. Après obtention d’une lettre d’admission ou équivalent et validation du projet, un protocole d’accord distinct pourra être signé pour lancer la procédure complète. Toute prestation ou tout frais supplémentaire fera l’objet d’un accord distinct.",
      emailFeesLine:
        "Ouverture du dossier, traitement administratif et préparation de votre dossier d’études (diplômes, relevés, cycle, admission).",
      emailImportant:
        "ce reçu ne constitue pas une garantie d’admission, de place en établissement, de visa études ou de résultat. Toute prestation ou tout frais supplémentaire doit faire l’objet d’un accord distinct et explicite.",
    };
  }
  if (kind === "visiteurs") {
    return {
      objectText:
        "Les frais confirmés couvrent l’ouverture du dossier, le traitement administratif et la préparation du dossier de séjour temporaire (statut, motif, attaches, justificatifs de retour) selon le projet et l’éligibilité du candidat. Ces frais sont non remboursables une fois le traitement administratif engagé.",
      importantText:
        "Ce reçu ne garantit ni visa, ni entrée sur le territoire, ni durée de séjour, ni résultat. Aucune promesse d’emploi n’est associée à une procédure visiteurs. Un protocole d’accord distinct pourra être signé si un accompagnement consulaire étendu est requis.",
      emailFeesLine:
        "Ouverture du dossier, traitement administratif et préparation de votre dossier visiteurs / séjour temporaire (statut, motif, attaches).",
      emailImportant:
        "ce reçu ne constitue pas une garantie de visa, d’entrée ou de résultat, et ne comporte aucune promesse d’emploi. Toute prestation ou tout frais supplémentaire doit faire l’objet d’un accord distinct et explicite.",
    };
  }
  if (kind === "famille") {
    return {
      objectText:
        "Les frais confirmés couvrent l’ouverture du dossier, le traitement administratif et la préparation du dossier de regroupement familial selon le projet et l’éligibilité du candidat. Ces frais sont non remboursables une fois le traitement administratif engagé.",
      importantText:
        "Ce reçu ne garantit ni approbation du regroupement, ni visa, ni délai, ni résultat. Un protocole d’accord distinct pourra être signé pour l’accompagnement jusqu’au dépôt consulaire.",
      emailFeesLine:
        "Ouverture du dossier, traitement administratif et préparation de votre dossier de regroupement familial.",
      emailImportant:
        "ce reçu ne constitue pas une garantie d’approbation, de visa ou de résultat. Toute prestation ou tout frais supplémentaire doit faire l’objet d’un accord distinct et explicite.",
    };
  }
  return {
    objectText:
      "Les frais confirmés couvrent l’ouverture du dossier, le traitement administratif et la préparation/soumission du profil auprès d’agences de placement partenaires pour la recherche d’un contrat de travail, selon le projet et l’éligibilité du candidat. Ces frais sont non remboursables une fois le traitement administratif engagé, car ils rémunèrent les diligences déjà réalisées avant la soumission.",
    importantText:
      "La recherche peut aboutir ou non. Les frais d’ouverture et de traitement sont non remboursables après le début des diligences, sauf disposition impérative contraire applicable au dossier. Ce reçu ne garantit ni emploi, ni contrat de travail, ni visa, ni résultat. Après obtention d’un contrat de travail ou d’une lettre d’invitation et validation du projet, un protocole d’accord distinct devra être signé pour lancer la procédure complète de visa. Toute prestation ou tout frais supplémentaire fera l’objet d’un accord distinct.",
    emailFeesLine:
      "Ouverture du dossier, traitement administratif et préparation/soumission de votre profil auprès d’agences de placement partenaires pour la recherche d’un contrat de travail.",
    emailImportant:
      "ce reçu ne constitue pas une garantie d’emploi, de contrat de travail, de visa ou de résultat. Toute prestation ou tout frais supplémentaire doit faire l’objet d’un accord distinct et explicite.",
  };
}

export interface ProtocolOneVariables {
  clientNomComplet: string;
  dossierRef: string;
  destinationProjet: string;
  clientNumeroPiece?: string;
  clientTelephoneWhatsapp?: string;
  clientEmail?: string;
  /** Montant confirmé du dossier (XAF). Absent : le protocole renvoie au Reçu Officiel au lieu d'afficher un chiffre. */
  montantValide?: number;
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

const LETTERHEAD = `3M Travel Agency SARL — Société à Responsabilité Limitée au capital enregistré
Registre du Commerce : RC/YAO/2019/A/2567 | Numéro d'Identifiant Unique (NIU) : M112417203369H
Siège social : Biyem-Assi, Montée Chapelle Obili (à 10 mètres du Collège EHS), Yaoundé – République du Cameroun
Téléphones / WhatsApp : +237 698 104 832 / +237 620 996 045 | Courriel : hello@3mtravelagency.com | www.3mtravelagency.com

RÉPUBLIQUE DU CAMEROUN — PAIX - TRAVAIL - PATRIE
DÉPARTEMENT IMMIGRATION & MOBILITÉ PROFESSIONNELLE INTERNATIONALE`;

export function buildProtocolOneRichText(
  vars: ProtocolOneVariables,
  destinationSlugOrLabel?: string | null,
  visaType?: string | null,
): string {
  const profile = getCountryProtocolProfile(destinationSlugOrLabel || vars.destinationProjet, visaType);
  const kind = detectProtocolVisaKind(visaType);
  const clauses = protocolOneKindClauses(kind, profile);
  const program = profile.procedureProgramLabel ?? `Procédure ${profile.destinationLabel}`;
  // Le montant vient du dossier (il varie selon le profil) : jamais un chiffre unique écrit en dur dans un texte contractuel.
  const amountLabel = typeof vars.montantValide === "number" && Number.isFinite(vars.montantValide) && vars.montantValide > 0
    ? `${Math.round(vars.montantValide).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} XAF`
    : null;
  const amountClause = amountLabel ? `d'un montant de ${amountLabel}` : "dont le montant est celui indiqué sur le Reçu Officiel de paiement";
  const amountValidated = amountLabel ?? "tel qu'indiqué sur le Reçu Officiel de paiement";
  const objectClause = profile.procedureObjectClause
    ?? `la préparation et la soumission du profil auprès des partenaires compétents pour ${profile.destinationLabel}, selon le projet et l'éligibilité constatée du candidat`;
  const article3Tail =
    kind === "travail" || kind === "autre"
      ? "La recherche auprès des partenaires peut aboutir ou non ; les frais d'ouverture et de traitement demeurent acquis à L'AGENCE dès le début des diligences, sauf disposition impérative contraire expressément actée."
      : "Les diligences de préparation du dossier peuvent aboutir ou non auprès des autorités ; les frais d'ouverture et de traitement demeurent acquis à L'AGENCE dès le début des diligences, sauf disposition impérative contraire expressément actée.";
  const article5Lead =
    kind === "etudes" || kind === "visiteurs" || kind === "famille"
      ? `Si le projet ${profile.destinationLabel} (${program}) ne peut aboutir dans un délai indicatif de ${profile.reorientationDelayDays} jours ouvrés`
      : `Si la prospection menée pour ${profile.destinationLabel} n'aboutit pas à une sélection dans un délai indicatif de ${profile.reorientationDelayDays} jours ouvrés`;
  return `${LETTERHEAD}

PROTOCOLE D'ACCORD CONTRACTUEL N° 01
${clauses.titleSuffix}
(Destination : ${profile.destinationLabel} — Programme : ${program})

IDENTIFICATION DES PARTIES
D'une part, L'AGENCE MANDATAIRE : 3M Travel Agency SARL, RC/YAO/2019/A/2567, NIU M112417203369H, représentée par la Direction Générale des Opérations et son Conseiller Validateur habilité, ci-après « L'AGENCE ».
D'autre part, LE CLIENT / CANDIDAT : ${vars.clientNomComplet}, Dossier n° ${vars.dossierRef}, Projet/Destination : ${vars.destinationProjet}${visaType ? `, Type de procédure : ${visaType}` : ""}, Pièce d'identité : ${vars.clientNumeroPiece ?? "à compléter"}, Téléphone/WhatsApp : ${vars.clientTelephoneWhatsapp ?? "à compléter"}, Email : ${vars.clientEmail ?? "à compléter"}, ci-après « LE CANDIDAT » ou « LE CLIENT ».

PRÉAMBULE ET CONTEXTE
LE CLIENT a souscrit à une évaluation via la plateforme www.3mtravelagency.com. Suite à la notification du bilan d'évaluation dans son Espace Client, LE CLIENT a validé le projet ${profile.destinationLabel} (${program}) et s'est acquitté des frais d'ouverture et de traitement. Le présent protocole donne pleine valeur contractuelle aux mentions du Reçu de Confirmation de Paiement délivré par L'AGENCE. Les étapes de traitement suivent le guide de procédure publié pour ce programme sur www.3mtravelagency.com, synchronisé avec l'Espace Client.

Article 1 — Objet des frais et nature de la prestation
Conformément au Reçu Officiel de paiement, les frais confirmés ${amountClause} couvrent exclusivement : (1) l'ouverture administrative du dossier du CLIENT au sein des registres de L'AGENCE et sur sa plateforme numérique ; (2) le traitement administratif, la vérification d'authenticité et la mise en conformité des pièces documentaires ; (3) ${objectClause}.

Article 2 — Modalités de règlement, traçabilité et reçu officiel
Le paiement fait l'objet d'un enregistrement automatique sous les références suivantes : Montant validé : ${amountValidated}. Mode de validation : ${vars.modePaiement}. Date et heure de validation : ${vars.dateHeurePaiement}. Conseiller validateur habilité : ${vars.conseillerEmail}. Empreinte cryptographique de sécurité : ${vars.empreinteSha}. Le Reçu de Confirmation de Paiement demeure archivé en permanence dans l'Espace Client du CANDIDAT comme justificatif comptable et juridique.

Article 3 — Caractère strictement non remboursable des frais
Conformément au Reçu de paiement, ces frais sont strictement non remboursables une fois le traitement administratif engagé, car ils rémunèrent les diligences, vérifications et démarches déjà réalisées avant et pendant le traitement. ${article3Tail}

Article 4 — Obligation de moyens et absence de garantie de résultat
${clauses.noGuarantee}

Article 5 — Clause de réorientation sans frais complémentaires
${article5Lead}, L'AGENCE s'engage à faire bénéficier LE CLIENT d'une réorientation sans aucun frais d'ouverture supplémentaire vers ${profile.reorientationAlternatives}.

Article 6 — Clause de transparence et protection contre la fraude
${clauses.transparency}

Article 7 — Condition de transition vers le Protocole d'Accord N° 02
${clauses.transition}

Article 8 — Valeur probante de la signature électronique
L'acceptation numérique du présent protocole dans l'Espace Client, combinée aux données du Reçu de Confirmation de Paiement horodaté, constitue un contrat bilatéral parfait et juridiquement opposable.

Fait à Yaoundé, sous format numérique certifié, le ${vars.dateDuJour}.
Pour 3M Travel Agency SARL : Conseiller ${vars.conseillerEmail} — Empreinte : ${vars.empreinteSha}
Pour LE CLIENT : ${vars.clientNomComplet} — Statut : Lu et approuvé — IP : ${vars.clientIpAddress}`;
}

export function buildProtocolTwoRichText(
  vars: ProtocolTwoVariables,
  destinationSlugOrLabel?: string | null,
  visaType?: string | null,
): string {
  // Ne pas utiliser posteRetenu pour détecter le visa (sinon un intitulé de poste « études » pollue le kind).
  const profile = getCountryProtocolProfile(destinationSlugOrLabel, visaType);
  const kind = detectProtocolVisaKind(visaType);
  const program = profile.procedureProgramLabel ?? `Procédure ${profile.destinationLabel}`;
  const formulas = profile.secondProtocolFormulas;
  const formulasBlock = formulas
    ? formulas.map((formula, index) => {
        const marker = vars.formuleChoisie === index ? "[x]" : "[ ]";
        return `${marker} FORMULE ${index + 1} : ${formula.label.toUpperCase()} — ${formula.amount}\n    ${formula.detail}`;
      }).join("\n\n")
    : "Le barème de règlement financier de cette destination n'a pas encore été communiqué par l'agence : il sera précisé et injecté ici avant toute proposition de signature au candidat.";

  const partnerLabel =
    kind === "etudes" ? "Établissement / partenaire d'accueil"
      : kind === "visiteurs" || kind === "famille" ? "Partenaire / hébergeur / membre de famille"
        : "Employeur/Partenaire d'accueil";
  const projectLabel =
    kind === "etudes" ? "Programme / cycle retenu"
      : kind === "visiteurs" ? "Motif / projet de séjour"
        : kind === "famille" ? "Lien familial / projet"
          : "Poste/Projet retenu";

  const mission =
    kind === "etudes"
      ? `L'AGENCE reçoit mandat d'assister, coordonner et représenter LE CANDIDAT dans : (1) l'examen de la lettre d'admission ou de l'offre de formation ; (2) le suivi auprès de ${profile.employmentAuthority} lorsque applicable ; (3) l'instruction du permis d'études / séjour auprès de ${profile.immigrationAuthority} ; (4) la constitution de la requête consulaire et la prise de rendez-vous auprès de ${profile.consulate} ; (5) la préparation à l'installation étudiante.`
      : kind === "visiteurs"
        ? `L'AGENCE reçoit mandat d'assister LE CANDIDAT dans : (1) la finalisation du dossier de séjour temporaire ; (2) la vérification des justificatifs (statut, motif, attaches) ; (3) l'instruction auprès de ${profile.immigrationAuthority} ; (4) la constitution de la requête consulaire et la prise de rendez-vous auprès de ${profile.consulate} ; (5) le suivi jusqu'à la décision.`
        : kind === "famille"
          ? `L'AGENCE reçoit mandat d'assister LE CANDIDAT dans : (1) la constitution du dossier de regroupement ; (2) le suivi auprès de ${profile.immigrationAuthority} ; (3) la constitution de la requête consulaire et la prise de rendez-vous auprès de ${profile.consulate} ; (4) le suivi jusqu'à la décision.`
          : `L'AGENCE reçoit mandat d'assister, coordonner et représenter LE CANDIDAT dans : (1) l'examen du contrat ou de l'offre proposée ; (2) le suivi des démarches auprès de ${profile.employmentAuthority} lorsque applicable ; (3) l'instruction du permis de travail ou de séjour auprès de ${profile.immigrationAuthority} ; (4) la constitution de la requête consulaire et la prise de rendez-vous auprès de ${profile.consulate} ; (5) la préparation à l'installation (démarches locales à l'arrivée).`;

  const article2 =
    kind === "travail" || kind === "autre"
      ? `Les frais relatifs à l'autorisation de recrutement et aux démarches légales incombant à l'employeur ou à l'établissement d'accueil (y compris la déclaration de poste ouvert / vacance de poste auprès de ${profile.employmentAuthority} lorsque applicable) sont supportés en totalité par celui-ci. LE CANDIDAT signe lui-même son contrat ou engagement officiel ; L'AGENCE n'est en aucun cas habilitée à signer à sa place.`
      : kind === "etudes"
        ? `Les frais d'inscription, de scolarité et les formalités propres à l'établissement incombent à l'établissement ou au candidat selon les règles publiées. LE CANDIDAT signe lui-même son engagement officiel ; L'AGENCE n'est en aucun cas habilitée à signer à sa place.`
        : `Aucun frais d'employeur ni de placement ne s'applique à cette procédure. LE CANDIDAT reste responsable de ses justificatifs personnels ; L'AGENCE n'est en aucun cas habilitée à signer à sa place auprès des autorités.`;

  return `${LETTERHEAD}

PROTOCOLE D'ACCORD CONTRACTUEL N° 02
MANDAT D'ACCOMPAGNEMENT CONTRACTUEL ET PROCÉDURE DE VISA
(Procédure Post-Sélection — Destination : ${profile.destinationLabel} — Programme : ${program})

IDENTIFICATION DES PARTIES
D'une part, L'AGENCE : 3M Travel Agency SARL, RC/YAO/2019/A/2567, NIU M112417203369H, ci-après « L'AGENCE ».
D'autre part, LE REQUÉRANT SÉLECTIONNÉ : ${vars.clientNomComplet}, Passeport : ${vars.clientNumeroPasseport ?? "à compléter"}, Téléphone/WhatsApp : ${vars.clientTelephoneWhatsapp ?? "à compléter"}, Email : ${vars.clientEmail ?? "à compléter"}, Identifiant Espace Client : ${vars.clientEspaceId ?? "à compléter"}, Dossier : ${vars.dossierRef}, ${partnerLabel} : ${vars.employeurNom}, ${projectLabel} : ${vars.posteRetenu}, ci-après « LE CANDIDAT ».

PRÉAMBULE
LE CANDIDAT a régulièrement souscrit au Protocole d'Accord N° 01 pour le programme ${program} à destination de ${profile.destinationLabel}. Par notification archivée dans son Espace Client, LE CANDIDAT a été formellement retenu ou validé pour la suite. Les parties conviennent de formaliser les modalités juridiques, financières et opérationnelles destinées à sécuriser la suite de la procédure jusqu'à l'obtention du visa ou permis concerné.

Article 1 — Mission d'assistance et portée de l'accompagnement
${mission}

Article 2 — Transparence des frais tiers et interdiction de frais induits
${article2}

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
