import { OFFER_STATUS, RECEIVED_STATUS, opts, sel, txt, YES_NO } from "./fieldKit";
import type { ProgramFamily } from "./programs";
import type { DynamicField } from "./types";

/**
 * Questions propres à un pays ou à un groupe de pays, ajoutées au programme choisi. Elles reprennent le vocabulaire de la
 * démarche (lettre d'acceptation, CAS, I-20…) sans en affirmer les conditions : celles-ci viennent de la source officielle.
 */
const WORK_OFFER_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_employer", "work_highly_qualified", "work_transfer", "generic_travail", "imm_employer"]);
const WORK_RECOGNITION_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_employer", "work_points", "work_highly_qualified", "work_jobseeker", "generic_travail", "imm_employer", "imm_points"]);
const DEGREE_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["study_degree", "generic_etudes"]);
const SCHENGEN_VISIT_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["visit_tourist", "visit_family", "visit_business", "visit_event", "generic_tourisme"]);
const GULF_WORK_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_employer", "work_seasonal", "work_aupair", "generic_travail"]);
const GULF_CODES = new Set(["AE", "QA", "SA", "KW", "BH", "OM"]);

export function countryFields(countryCode: string | null, schengen: boolean, family: ProgramFamily): DynamicField[] {
  const fields: DynamicField[] = [];

  if (countryCode === "CA") {
    if (DEGREE_FAMILIES.has(family) || family === "study_vocational") {
      fields.push(
        txt("canadaDli", "Établissement ou DLI visé"),
        sel("letterOfAcceptance", "Lettre d’acceptation", RECEIVED_STATUS),
        sel("provincialAttestation", "Lettre d’attestation provinciale (si applicable)", opts(["recue", "Reçue"], ["en_cours", "En cours"], ["a_verifier", "À vérifier"])),
      );
    }
    if (WORK_OFFER_FAMILIES.has(family)) {
      fields.push(
        sel("canadaJobOffer", "Offre d’emploi canadienne", OFFER_STATUS),
        txt("employerCompliance", "Référence employeur ou conformité (si disponible)"),
        sel("workPermitRoute", "Voie de permis de travail envisagée", opts(["employeur", "Avec employeur"], ["mobilite", "Mobilité internationale"], ["a_evaluer", "À évaluer"])),
      );
    }
  }

  if (schengen && SCHENGEN_VISIT_FAMILIES.has(family)) {
    fields.push(
      txt("schengenEntryCountry", "Premier pays d’entrée dans l’espace Schengen"),
      sel("schengenInsurance", "Assurance voyage", opts(["deja_souscrite", "Déjà souscrite"], ["a_souscrire", "À souscrire"])),
      sel("schengenStayProof", "Preuve d’hébergement principale", opts(["hotel", "Réservation d’hôtel"], ["invitation", "Invitation / attestation d’accueil"], ["autre", "Autre justificatif"])),
    );
  }

  if (schengen && WORK_RECOGNITION_FAMILIES.has(family)) {
    fields.push(sel("qualificationRecognition", "Reconnaissance de votre diplôme dans le pays", opts(["faite", "Déjà faite"], ["en_cours", "En cours"], ["a_faire", "À faire"], ["non_concerne", "Non concerné"])));
  }

  if (countryCode === "GB") {
    if (DEGREE_FAMILIES.has(family)) fields.push(sel("casStatus", "Confirmation d’acceptation pour études (CAS)", RECEIVED_STATUS));
    if (WORK_OFFER_FAMILIES.has(family)) fields.push(sel("sponsorshipCertificate", "Certificat de parrainage (Certificate of Sponsorship)", RECEIVED_STATUS));
  }

  if (countryCode === "US") {
    if (DEGREE_FAMILIES.has(family)) fields.push(sel("i20Status", "Formulaire I-20 de l’établissement", RECEIVED_STATUS));
    if (WORK_OFFER_FAMILIES.has(family)) fields.push(sel("usEmployerPetition", "Demande déposée par un employeur américain en votre nom", RECEIVED_STATUS));
  }

  if ((countryCode === "AU" || countryCode === "NZ") && DEGREE_FAMILIES.has(family)) {
    fields.push(sel("enrolmentConfirmation", "Offre d’admission ou confirmation d’inscription", RECEIVED_STATUS));
  }

  if (countryCode && GULF_CODES.has(countryCode) && GULF_WORK_FAMILIES.has(family)) {
    fields.push(
      sel("localSponsor", "Employeur ou sponsor local identifié", YES_NO),
      sel("recruitmentAgency", "Passez-vous par une agence de recrutement ?", opts(["non", "Non"], ["verifiee", "Oui, une agence dont j’ai vérifié l’existence"], ["non_verifiee", "Oui, sans avoir pu la vérifier"], ["inconnu", "Je ne sais pas"]), { help: "Ne versez jamais de frais à un intermédiaire dont vous n’avez pas vérifié l’existence et l’agrément." }),
    );
  }

  return fields;
}
