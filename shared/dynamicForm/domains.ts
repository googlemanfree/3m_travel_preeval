import { EXPERIENCE_BANDS, YES_NO, YES_NO_UNSURE, RECOGNITION_STATUS, area, opts, sel, txt, when } from "./fieldKit";
import type { ProgramFamily } from "./programs";
import type { DynamicField } from "./types";

/**
 * Domaines métier. Choisir « Santé et soins » ou « Bâtiment » change les questions posées : un infirmier, un soudeur et un
 * développeur n'ont ni les mêmes diplômes, ni les mêmes certificats, ni les mêmes démarches de reconnaissance.
 * Les questions recueillent des déclarations ; elles n'affirment aucune règle propre à un pays.
 */
export type DomainDef = {
  id: string;
  label: string;
  hint: string;
  fields: (family: ProgramFamily) => DynamicField[];
  /** Pièces souvent utiles pour ce domaine (à confirmer sur la source officielle du pays). */
  documents: string[];
};

const LEARNING_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_training", "study_vocational", "study_degree", "study_internship", "study_post", "generic_etudes"]);
export const isLearningFamily = (family: ProgramFamily): boolean => LEARNING_FAMILIES.has(family);

const DRIVING_LICENSE = opts(["aucun", "Aucun"], ["b", "Catégorie B (voiture)"], ["c", "Catégorie C (poids lourd)"], ["d", "Catégorie D (transport de personnes)"], ["e", "Catégorie E (remorque)"], ["autre", "Autre"]);

const SANTE: DomainDef = {
  id: "sante",
  label: "Santé et soins",
  hint: "Infirmier, aide-soignant, sage-femme, aide à domicile, technicien de santé…",
  documents: ["Diplôme de santé et relevés de notes détaillés", "Attestations de stages ou d’emploi en structure de santé", "Inscription à l’ordre ou au registre professionnel, si elle existe dans votre pays", "Preuve de niveau de langue du pays (profession en contact avec les patients)"],
  fields: (family) => {
    if (isLearningFamily(family)) {
      return [
        sel("healthTrainingTrack", "Formation en santé visée", opts(["soins_infirmiers", "Soins infirmiers"], ["aide_soignant", "Aide-soignant(e) / soins de base"], ["sage_femme", "Sage-femme"], ["kine", "Kinésithérapie / rééducation"], ["technicien", "Technicien de santé (laboratoire, imagerie…)"], ["pharmacie", "Pharmacie"], ["aide_domicile", "Aide à domicile / accompagnement des personnes"], ["autre", "Autre"]), { required: true }),
        sel("healthSchoolStatus", "Où en êtes-vous dans cette formation ?", opts(["non_commencee", "Pas encore commencée"], ["en_cours", "Formation en cours dans mon pays"], ["terminee", "Formation terminée, diplôme obtenu"], ["reconversion", "Reconversion depuis un autre métier"])),
        sel("healthPriorCare", "Expérience de soins avant la formation (stage, bénévolat, emploi)", EXPERIENCE_BANDS),
        sel("healthSetting", "Où avez-vous le plus pratiqué ?", opts(["hopital", "Hôpital"], ["clinique", "Clinique privée"], ["maison_retraite", "Maison de retraite / établissement pour personnes âgées"], ["domicile", "Soins à domicile"], ["centre_sante", "Centre de santé / dispensaire"], ["aucun", "Pas encore de pratique"], ["autre", "Autre"])),
        sel("healthRecognitionStatus", "Reconnaissance de votre diplôme de santé dans le pays visé", RECOGNITION_STATUS, { showIf: when("healthSchoolStatus", "terminee", "reconversion") }),
        area("healthDocsAvailable", "Pièces dont vous disposez (diplômes, relevés de notes, attestations de stage)", { placeholder: "Listez ce que vous pouvez fournir." }),
      ];
    }
    return [
      sel("healthProfession", "Votre profession de santé", opts(["infirmier_de", "Infirmier(ère) diplômé(e)"], ["aide_soignant", "Aide-soignant(e)"], ["sage_femme", "Sage-femme"], ["medecin", "Médecin"], ["pharmacien", "Pharmacien(ne)"], ["technicien", "Technicien de santé (laboratoire, imagerie…)"], ["kine", "Kinésithérapeute"], ["aide_domicile", "Aide à domicile / auxiliaire de vie"], ["etudiant_sante", "Étudiant(e) en santé"], ["autre", "Autre"]), { required: true }),
      sel("healthQualification", "Votre niveau de formation en santé", opts(["attestation", "Attestation ou certificat de formation"], ["diplome_etat", "Diplôme d’État ou diplôme professionnel"], ["licence_master", "Licence ou master en santé"], ["specialisation", "Spécialisation ou doctorat"], ["en_cours", "Formation en cours"], ["aucun", "Aucun diplôme de santé pour l’instant"])),
      sel("healthExperienceYears", "Années d’exercice en soins", EXPERIENCE_BANDS),
      sel("healthSetting", "Principal lieu d’exercice", opts(["hopital", "Hôpital"], ["clinique", "Clinique privée"], ["maison_retraite", "Maison de retraite / établissement pour personnes âgées"], ["domicile", "Soins à domicile"], ["centre_sante", "Centre de santé / dispensaire"], ["autre", "Autre"])),
      sel("healthRegistration", "Êtes-vous inscrit(e) à un ordre ou registre professionnel dans votre pays ?", opts(["oui", "Oui"], ["non", "Non"], ["sans_objet", "Il n’y en a pas pour ma profession"], ["inconnu", "Je ne sais pas"])),
      sel("healthRecognitionStatus", "Reconnaissance de votre diplôme dans le pays visé", RECOGNITION_STATUS),
      sel("healthAbroadExperience", "Avez-vous déjà travaillé ou fait un stage dans une structure de santé à l’étranger ?", YES_NO),
      area("healthDocsAvailable", "Pièces dont vous disposez (diplômes, attestations d’emploi, relevés)", { placeholder: "Listez ce que vous pouvez fournir." }),
    ];
  },
};

const NUMERIQUE: DomainDef = {
  id: "numerique",
  label: "Informatique et numérique",
  hint: "Développement, données, réseaux, cybersécurité, support, gestion de projet…",
  documents: ["Diplômes et certifications techniques", "Portfolio, dépôt de code ou réalisations", "Attestations d’emploi détaillant les technologies utilisées"],
  fields: () => [
    sel("techRole", "Votre spécialité", opts(["developpement", "Développement logiciel / web / mobile"], ["data", "Données, IA, analyse"], ["reseaux_systemes", "Réseaux et systèmes"], ["cybersecurite", "Cybersécurité"], ["support", "Support et exploitation"], ["chef_projet", "Gestion de projet / produit"], ["design", "Design numérique (UX/UI)"], ["autre", "Autre"]), { required: true }),
    txt("techStack", "Technologies et outils maîtrisés", { placeholder: "Ex. : JavaScript, Python, Linux, Cisco…" }),
    sel("techPortfolio", "Pouvez-vous montrer vos réalisations ?", opts(["code_public", "Oui, code ou projets en ligne"], ["portfolio", "Oui, portfolio ou démonstrations"], ["pro_seulement", "Seulement des projets d’entreprise (non publics)"], ["aucun", "Pas encore"])),
    txt("techCertifications", "Certifications obtenues", { placeholder: "Ex. : Cisco, AWS, Microsoft, CompTIA…" }),
    sel("techExperienceYears", "Années en informatique", EXPERIENCE_BANDS),
  ],
};

const BTP: DomainDef = {
  id: "btp",
  label: "Bâtiment et travaux publics",
  hint: "Maçonnerie, électricité, plomberie, charpente, conduite d’engins, chantier…",
  documents: ["Diplômes ou certificats de métier", "Attestations d’emploi précisant les chantiers et les tâches", "Habilitations et permis (engins, électricité, sécurité)"],
  fields: () => [
    sel("btpTrade", "Votre métier", opts(["macon", "Maçon / coffreur / ferrailleur"], ["electricien", "Électricien"], ["plombier", "Plombier / chauffagiste"], ["charpentier", "Charpentier / couvreur / menuisier"], ["peintre_carreleur", "Peintre / carreleur / plaquiste"], ["conducteur_engins", "Conducteur d’engins"], ["chef_chantier", "Chef d’équipe / de chantier"], ["ingenieur", "Ingénieur / technicien génie civil"], ["autre", "Autre"]), { required: true }),
    sel("btpExperience", "Années de pratique du métier", EXPERIENCE_BANDS),
    txt("btpCertifications", "Habilitations ou certificats de sécurité", { placeholder: "Ex. : habilitation électrique, CACES, travail en hauteur…" }),
    sel("btpDrivingLicense", "Permis de conduire", DRIVING_LICENSE),
    sel("btpToolsOwned", "Maîtrisez-vous la lecture de plans et le travail selon des normes écrites ?", YES_NO_UNSURE),
  ],
};

const INDUSTRIE: DomainDef = {
  id: "industrie",
  label: "Industrie, mécanique et maintenance",
  hint: "Soudure, usinage, maintenance, électromécanique, production, qualité…",
  documents: ["Diplômes ou certificats de métier", "Attestations d’emploi précisant les machines et procédés", "Certificats de soudure ou d’habilitation"],
  fields: () => [
    sel("industryTrade", "Votre métier", opts(["soudure", "Soudeur"], ["usinage", "Usinage / tournage / fraisage"], ["maintenance", "Maintenance industrielle"], ["electromecanique", "Électromécanique / automatismes"], ["chaudronnerie", "Chaudronnerie / tuyauterie"], ["mecanique_auto", "Mécanique automobile"], ["production", "Production / conduite de ligne"], ["qualite", "Qualité / contrôle"], ["autre", "Autre"]), { required: true }),
    sel("industryExperience", "Années de pratique du métier", EXPERIENCE_BANDS),
    txt("industryCertifications", "Certificats ou qualifications", { placeholder: "Ex. : qualification de soudage, habilitation, CQP…" }),
    sel("industryShiftWork", "Travail en équipes alternées ou de nuit possible ?", YES_NO_UNSURE),
  ],
};

const HOTELLERIE: DomainDef = {
  id: "hotellerie",
  label: "Hôtellerie, restauration et tourisme",
  hint: "Cuisine, salle, réception, étages, pâtisserie, animation…",
  documents: ["Diplômes ou certificats de cuisine, de service ou d’hôtellerie", "Attestations d’emploi précisant les établissements et fonctions", "Références d’anciens employeurs"],
  fields: () => [
    sel("hospitalityRole", "Votre fonction", opts(["cuisinier", "Cuisinier / chef de partie"], ["patissier", "Pâtissier / boulanger"], ["serveur", "Serveur / commis de salle"], ["reception", "Réception / accueil"], ["gouvernante", "Étages / gouvernante"], ["bar", "Barman / barista"], ["manager", "Responsable d’établissement"], ["animation", "Animation / guide"], ["autre", "Autre"]), { required: true }),
    sel("hospitalityEstablishment", "Type d’établissement", opts(["hotel", "Hôtel"], ["restaurant", "Restaurant"], ["traiteur", "Traiteur / collectivité"], ["resort", "Village de vacances / resort"], ["autre", "Autre"])),
    sel("hospitalityExperience", "Années de pratique", EXPERIENCE_BANDS),
    sel("hospitalitySeasonal", "Disponible pour des contrats saisonniers ?", YES_NO_UNSURE),
  ],
};

const AGRICULTURE: DomainDef = {
  id: "agriculture",
  label: "Agriculture et agroalimentaire",
  hint: "Cultures, élevage, serres, transformation, conduite d’engins agricoles…",
  documents: ["Attestations d’emploi ou de stage agricole", "Diplômes ou certificats agricoles", "Permis de conduire (engins)"],
  fields: () => [
    sel("agriRole", "Votre activité", opts(["ouvrier_agricole", "Ouvrier agricole / récolte"], ["conducteur_engins", "Conducteur d’engins agricoles"], ["elevage", "Élevage"], ["maraichage", "Maraîchage / horticulture / serres"], ["transformation", "Transformation agroalimentaire"], ["agronome", "Technicien / ingénieur agronome"], ["autre", "Autre"]), { required: true }),
    sel("agriExperience", "Années de pratique", EXPERIENCE_BANDS),
    sel("agriAvailability", "Durée de travail souhaitée", opts(["saison_courte", "Une saison (quelques mois)"], ["plusieurs_saisons", "Plusieurs saisons"], ["permanent", "Emploi permanent"], ["a_definir", "À définir"])),
    sel("agriDrivingLicense", "Permis de conduire", DRIVING_LICENSE),
  ],
};

const TRANSPORT: DomainDef = {
  id: "transport",
  label: "Transport et logistique",
  hint: "Chauffeur, livreur, cariste, logisticien, mécanicien poids lourds…",
  documents: ["Permis de conduire et attestations de conduite", "Attestations d’emploi précisant les véhicules conduits", "Certificats professionnels (transport, manutention)"],
  fields: () => [
    sel("transportRole", "Votre fonction", opts(["chauffeur_pl", "Chauffeur poids lourd"], ["chauffeur_bus", "Chauffeur de bus / car"], ["livreur", "Livreur"], ["cariste", "Cariste / magasinier"], ["logisticien", "Logisticien / gestionnaire de stocks"], ["mecanicien", "Mécanicien poids lourds"], ["autre", "Autre"]), { required: true }),
    sel("transportLicense", "Catégorie de permis détenue", DRIVING_LICENSE),
    sel("transportLicenseSince", "Ancienneté du permis", opts(["moins_2", "Moins de 2 ans"], ["2_5", "2 à 5 ans"], ["5_10", "5 à 10 ans"], ["plus_10", "Plus de 10 ans"]), { showIf: when("transportLicense", "b", "c", "d", "e", "autre") }),
    sel("transportExperience", "Années de pratique du métier", EXPERIENCE_BANDS),
  ],
};

const ENSEIGNEMENT: DomainDef = {
  id: "enseignement",
  label: "Enseignement et formation",
  hint: "Primaire, secondaire, supérieur, formation professionnelle, enseignement des langues…",
  documents: ["Diplôme d’enseignement ou de pédagogie", "Attestations d’enseignement précisant niveaux et matières", "Évaluations ou références d’établissements"],
  fields: () => [
    sel("teachingLevel", "Niveau enseigné", opts(["primaire", "Primaire"], ["secondaire", "Secondaire"], ["superieur", "Enseignement supérieur"], ["formation_pro", "Formation professionnelle"], ["langues", "Enseignement des langues"], ["autre", "Autre"]), { required: true }),
    txt("teachingSubject", "Matière ou spécialité enseignée"),
    sel("teachingCertification", "Diplôme d’enseignement ou de pédagogie", opts(["oui", "Oui"], ["non", "Non"], ["en_cours", "En cours"])),
    sel("teachingExperience", "Années d’enseignement", EXPERIENCE_BANDS),
  ],
};

const COMMERCE: DomainDef = {
  id: "commerce",
  label: "Commerce, gestion et finance",
  hint: "Comptabilité, vente, administration, banque, ressources humaines, marketing…",
  documents: ["Diplômes de gestion, comptabilité ou commerce", "Attestations d’emploi précisant les responsabilités", "Certifications professionnelles ou logiciels maîtrisés"],
  fields: () => [
    sel("businessRole", "Votre fonction", opts(["comptabilite", "Comptabilité / finance"], ["vente", "Vente / commerce"], ["administration", "Gestion / administration"], ["banque_assurance", "Banque / assurance"], ["rh", "Ressources humaines"], ["marketing", "Marketing / communication"], ["autre", "Autre"]), { required: true }),
    txt("businessSoftware", "Logiciels maîtrisés", { placeholder: "Ex. : Sage, Excel, SAP, Odoo…" }),
    txt("businessCertifications", "Certifications professionnelles"),
    sel("businessExperience", "Années de pratique", EXPERIENCE_BANDS),
  ],
};

const ENERGIE: DomainDef = {
  id: "energie",
  label: "Énergie, mines et environnement",
  hint: "Électricité, pétrole et gaz, mines, énergies renouvelables, sécurité-environnement…",
  documents: ["Diplômes techniques", "Certificats de sécurité et d’habilitation", "Attestations d’emploi précisant les sites et fonctions"],
  fields: () => [
    sel("energyRole", "Votre domaine", opts(["electricite", "Électricité / réseaux"], ["petrole_gaz", "Pétrole et gaz"], ["mines", "Mines et carrières"], ["renouvelables", "Énergies renouvelables"], ["hse", "Sécurité – santé – environnement"], ["maintenance", "Maintenance d’installations"], ["autre", "Autre"]), { required: true }),
    txt("energySafetyCertifications", "Certificats de sécurité détenus", { placeholder: "Ex. : habilitation, travail en hauteur, espaces confinés…" }),
    sel("energyExperience", "Années de pratique", EXPERIENCE_BANDS),
  ],
};

const AUTRE: DomainDef = {
  id: "autre",
  label: "Autre domaine",
  hint: "Votre métier n’est pas dans la liste.",
  documents: ["Diplômes ou certificats liés à votre métier", "Attestations d’emploi précisant les tâches"],
  fields: () => [
    area("otherTradeDescription", "Décrivez votre métier ou votre domaine", { required: true, placeholder: "Métier, tâches principales, outils ou équipements utilisés." }),
    sel("otherExperience", "Années de pratique", EXPERIENCE_BANDS),
  ],
};

export const DOMAINS: DomainDef[] = [SANTE, NUMERIQUE, BTP, INDUSTRIE, HOTELLERIE, AGRICULTURE, TRANSPORT, ENSEIGNEMENT, COMMERCE, ENERGIE, AUTRE];
export const getDomain = (id: string | null | undefined): DomainDef | null => DOMAINS.find((domain) => domain.id === id) ?? null;
