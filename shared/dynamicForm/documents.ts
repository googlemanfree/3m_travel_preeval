import type { ProgramFamily } from "./programs";

/**
 * Pièces souvent utiles par famille de programmes. Ce sont des repères de préparation : la liste définitive est confirmée par
 * un conseiller à partir de la source officielle du pays. Elle alimente l'écran du formulaire et l'espace client.
 */
const PASSPORT = "Passeport valide pour toute la durée prévue du séjour";
const PHOTO = "Photos d’identité récentes";
const CV = "CV à jour";
const DIPLOMAS = "Diplômes et relevés de notes";
const EMPLOYMENT = "Attestations d’emploi détaillant les fonctions et les dates";
const FUNDS = "Justificatifs de ressources";
const LANGUAGE = "Preuve de niveau de langue (si disponible)";
const CIVIL = "Actes d’état civil (acte de naissance, acte de mariage si concerné)";

const WORK_BASE = [PASSPORT, PHOTO, CV, DIPLOMAS, EMPLOYMENT, LANGUAGE];

export const FAMILY_DOCUMENTS: Record<ProgramFamily, string[]> = {
  work_employer: [...WORK_BASE, "Offre ou contrat de travail", "Références professionnelles"],
  work_points: [...WORK_BASE, "Évaluation ou reconnaissance des diplômes", FUNDS],
  work_highly_qualified: [...WORK_BASE, "Offre précisant la rémunération", "Évaluation ou reconnaissance du diplôme"],
  work_jobseeker: [...WORK_BASE, FUNDS, "Évaluation ou reconnaissance du diplôme"],
  work_transfer: [PASSPORT, PHOTO, CV, "Attestation de votre employeur actuel (ancienneté, fonction)", "Lettre de transfert", DIPLOMAS],
  work_seasonal: [PASSPORT, PHOTO, "Contrat ou promesse de contrat saisonnier", EMPLOYMENT, "Preuve d’hébergement prévu"],
  work_training: [PASSPORT, PHOTO, CV, DIPLOMAS, "Contrat ou promesse de formation", LANGUAGE, FUNDS],
  work_holiday: [PASSPORT, PHOTO, FUNDS, "Assurance santé pour la durée du séjour", "Billet aller-retour ou preuve de moyens de retour"],
  work_entrepreneur: [PASSPORT, PHOTO, CV, DIPLOMAS, "Plan d’affaires", FUNDS],
  work_remote: [PASSPORT, PHOTO, "Contrat de travail ou contrats clients", "Preuves de revenus", "Assurance santé internationale"],
  work_aupair: [PASSPORT, PHOTO, "Contrat avec la famille d’accueil", "Références d’expériences avec les enfants", "Extrait de casier judiciaire si la procédure le demande"],
  study_degree: [PASSPORT, PHOTO, DIPLOMAS, "Lettre d’admission", FUNDS, LANGUAGE, "Assurance santé", "Preuve de logement"],
  study_language: [PASSPORT, PHOTO, "Inscription dans l’établissement de langue", FUNDS, "Assurance santé"],
  study_exchange: [PASSPORT, PHOTO, DIPLOMAS, "Convention d’échange entre les établissements", FUNDS],
  study_vocational: [PASSPORT, PHOTO, DIPLOMAS, "Contrat ou promesse de formation, ou admission", LANGUAGE, FUNDS],
  study_research: [PASSPORT, PHOTO, DIPLOMAS, "Convention d’accueil du laboratoire", "Preuve de financement de la recherche", CV],
  study_internship: [PASSPORT, PHOTO, "Convention de stage", DIPLOMAS, FUNDS],
  study_short: [PASSPORT, PHOTO, "Preuve d’inscription au programme", FUNDS, "Assurance voyage"],
  study_scholarship: [PASSPORT, PHOTO, DIPLOMAS, "Dossier de candidature à la bourse", "Lettre d’attribution (si obtenue)"],
  study_post: [PASSPORT, PHOTO, "Diplôme obtenu dans le pays", "Offre d’emploi (si disponible)", FUNDS],
  visit_tourist: [PASSPORT, PHOTO, "Itinéraire et réservation d’hébergement", FUNDS, "Assurance voyage", "Justificatifs d’attaches dans votre pays (emploi, famille)"],
  visit_family: [PASSPORT, PHOTO, "Invitation ou attestation d’accueil", "Preuve du statut de la personne qui invite", "Preuve du lien familial", FUNDS, "Justificatifs d’attaches dans votre pays"],
  visit_business: [PASSPORT, PHOTO, "Lettre d’invitation de l’organisation", "Attestation de votre employeur ou registre de votre entreprise", FUNDS, "Assurance voyage"],
  visit_transit: [PASSPORT, PHOTO, "Billet vers la destination finale", "Visa de la destination finale (si exigé)"],
  visit_medical: [PASSPORT, PHOTO, "Attestation de l’établissement de santé", "Preuve de prise en charge des frais", "Justificatif d’hébergement"],
  visit_event: [PASSPORT, PHOTO, "Invitation ou inscription à l’événement", "Justificatif d’hébergement", FUNDS],
  visit_multi: [PASSPORT, PHOTO, "Historique des voyages précédents", "Justificatif du motif récurrent", FUNDS],
  visit_eta: [PASSPORT, PHOTO, "Réservation ou itinéraire", "Moyen de paiement des frais du portail officiel"],
  evisa_tourist: [PASSPORT, PHOTO, "Itinéraire et hébergement", "Moyen de paiement en ligne"],
  evisa_business: [PASSPORT, PHOTO, "Lettre d’invitation", "Moyen de paiement en ligne"],
  evisa_transit: [PASSPORT, PHOTO, "Billet de continuation", "Moyen de paiement en ligne"],
  evisa_arrival: [PASSPORT, PHOTO, "Billet de retour", "Frais à régler à la frontière"],
  evisa_eta: [PASSPORT, PHOTO, "Moyen de paiement en ligne"],
  evisa_multi: [PASSPORT, PHOTO, "Justificatif du motif des entrées répétées", "Moyen de paiement en ligne"],
  imm_points: [PASSPORT, PHOTO, DIPLOMAS, "Évaluation des diplômes", "Résultats de tests de langue", EMPLOYMENT, FUNDS, CIVIL],
  imm_family: [PASSPORT, PHOTO, CIVIL, "Preuves du lien (photos, échanges, voyages)", "Statut et ressources de la personne qui parraine"],
  imm_employer: [PASSPORT, PHOTO, CV, DIPLOMAS, "Offre d’emploi", EMPLOYMENT, LANGUAGE, CIVIL],
  imm_regional: [PASSPORT, PHOTO, DIPLOMAS, "Preuves des liens avec la région", LANGUAGE, EMPLOYMENT],
  imm_investor: [PASSPORT, PHOTO, "Plan d’affaires", "Origine des fonds", FUNDS, CIVIL],
  imm_retirement: [PASSPORT, PHOTO, "Preuves de pension ou de rente", "Assurance santé", "Justificatif de logement"],
  generic_travail: [...WORK_BASE],
  generic_etudes: [PASSPORT, PHOTO, DIPLOMAS, FUNDS],
  generic_tourisme: [PASSPORT, PHOTO, FUNDS],
  generic_evisa: [PASSPORT, PHOTO],
  generic_immigration: [PASSPORT, PHOTO, DIPLOMAS, FUNDS, CIVIL],
};
