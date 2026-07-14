import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, ExternalLink, Search, Filter,
  MapPin, GraduationCap, Briefcase, Globe, Star,
  ChevronRight, CheckCircle, Clock, Users, Award,
  ArrowRight, Phone, MessageCircle, Shield, BookOpen,
  Plane, Building, Flag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

// ─── LOGO URL ─────────────────────────────────────────────────────────────────
const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";
const WA_NUMBER = "237698104832";

function waLink(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── CATALOGUE DES PROCÉDURES ─────────────────────────────────────────────────
interface Procedure {
  id: string;
  country: string;
  flag: string;
  region: string;
  type: "etudes" | "travail" | "visiteur" | "rp" | "procedure" | "guide";
  title: string;
  description: string;
  url: string;
  featured?: boolean;
  badge?: string;
}

const PROCEDURES: Procedure[] = [
  // ── CANADA ──────────────────────────────────────────────────────────────────
  {
    id: "ca-travail-contrat",
    country: "Canada", flag: "🇨🇦", region: "Amérique du Nord", type: "travail",
    title: "Contrat de Travail Canada",
    description: "Procédure complète pour obtenir un contrat de travail au Canada — Entrée Express, LMIA et formalités employeur.",
    url: "/manus-storage/pasted_file_8tZnY0_3MTravel_Procedure_ContratTravail_Canada_2026_1_3f7d5b2a.pdf",
    featured: true, badge: "⭐ Notre Point Fort"
  },
  {
    id: "ca-etudes",
    country: "Canada", flag: "🇨🇦", region: "Amérique du Nord", type: "etudes",
    title: "Visa Études Canada",
    description: "Dossier complet pour le permis d'études canadien — lettre d'acceptation, preuves financières, biométrie.",
    url: "/manus-storage/pasted_file_zuvtPx_3MTravel_Procedure_VisaEtudes_Canada_Complet_2026_c0316769.pdf",
    featured: true
  },
  {
    id: "ca-travail",
    country: "Canada", flag: "🇨🇦", region: "Amérique du Nord", type: "travail",
    title: "Visa Travail Canada",
    description: "Permis de travail ouvert et fermé — procédure LMIA, Entrée Express, PCP (Programmes des Candidats des Provinces).",
    url: "/manus-storage/pasted_file_SDkncU_3MTravel_VisaTravail_Canada_Complet_2026_6a8f3c1d.pdf",
    featured: true
  },
  {
    id: "ca-renseignements",
    country: "Canada", flag: "🇨🇦", region: "Amérique du Nord", type: "guide",
    title: "Renseignements Supplémentaires Canada",
    description: "Guide complémentaire sur les exigences spécifiques, les délais et les frais pour l'immigration canadienne.",
    url: "/manus-storage/pasted_file_8LsAMT_RENSEIGNEMENTSSUPPLÉMENTAIRESCanada_a2c9d4f8.pdf"
  },

  // ── ALLEMAGNE ────────────────────────────────────────────────────────────────
  {
    id: "de-formation",
    country: "Allemagne", flag: "🇩🇪", region: "Espace Schengen", type: "procedure",
    title: "Formation Allemagne",
    description: "Procédure pour intégrer un programme de formation professionnelle (Ausbildung) en Allemagne.",
    url: "/manus-storage/pasted_file_L8R5vL_3MTravel_Procedure_Formation_Allemagne_2026_9e1f4a7b.pdf",
    featured: true, badge: "Formation Pro"
  },
  {
    id: "de-etudes",
    country: "Allemagne", flag: "🇩🇪", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Allemagne",
    description: "Visa national D pour études universitaires en Allemagne — lettre d'admission, APS, compte bloqué.",
    url: "/manus-storage/pasted_file_qSaYym_3MTravel_VisaEtudes_Allemagne_2026_5cba121d.pdf"
  },
  {
    id: "de-visiteur",
    country: "Allemagne", flag: "🇩🇪", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Allemagne",
    description: "Visa Schengen court séjour pour l'Allemagne — tourisme, visite familiale, affaires.",
    url: "/manus-storage/pasted_file_6PNDP8_3MTravel_VisaVisiteur_Allemagne_2026_ae913c62.pdf"
  },

  // ── FRANCE ───────────────────────────────────────────────────────────────────
  {
    id: "fr-travail",
    country: "France", flag: "🇫🇷", region: "Espace Schengen", type: "travail",
    title: "Visa Travail France",
    description: "Procédure complète pour le visa de travail en France — contrat, autorisation de travail, OFII.",
    url: "/manus-storage/pasted_file_YWIqci_3MTravel_VisaTravail_France_2026_7c3e9b5d.pdf",
    featured: true
  },
  {
    id: "fr-visiteur",
    country: "France", flag: "🇫🇷", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur France",
    description: "Visa Schengen court séjour pour la France — tourisme, visite familiale, affaires.",
    url: "/manus-storage/pasted_file_EM5hFo_3MTravel_VisaVisiteur_France_2026_d4f2a8c1.pdf"
  },

  // ── BELGIQUE ─────────────────────────────────────────────────────────────────
  {
    id: "be-etudes",
    country: "Belgique", flag: "🇧🇪", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Belgique",
    description: "Procédure visa étudiant Belgique — inscription université, preuve financière, assurance.",
    url: "/manus-storage/pasted_file_VFPILb_3MTravel_VisaEtudes_Belgique_2026_b3d7e2f9.pdf"
  },
  {
    id: "be-visiteur",
    country: "Belgique", flag: "🇧🇪", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Belgique",
    description: "Visa Schengen court séjour pour la Belgique.",
    url: "/manus-storage/pasted_file_aamwpp_3MTravel_VisaVisiteur_Belgique_2026_f1c5a3d8.pdf"
  },

  // ── LUXEMBOURG ───────────────────────────────────────────────────────────────
  {
    id: "lu-etudes",
    country: "Luxembourg", flag: "🇱🇺", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Luxembourg",
    description: "Procédure visa étudiant Luxembourg — MAEE, autorisation de séjour, reconnaissance des diplômes.",
    url: "/manus-storage/pasted_file_Ewv8DD_3MTravel_VisaEtudes_Luxembourg_2026_c8f4b1a7.pdf",
    featured: true, badge: "Sélection Élite"
  },
  {
    id: "lu-etudes2",
    country: "Luxembourg", flag: "🇱🇺", region: "Espace Schengen", type: "etudes",
    title: "Études Luxembourg — Guide Complet",
    description: "Guide détaillé pour les études au Luxembourg avec toutes les étapes administratives.",
    url: "/manus-storage/pasted_file_ZL6rtP_Etude_LuxembourgEtudes_2026_2_e9a2c7f4.pdf"
  },
  {
    id: "lu-etudes3",
    country: "Luxembourg", flag: "🇱🇺", region: "Espace Schengen", type: "etudes",
    title: "Études Luxembourg — Dossier 2026",
    description: "Dossier complet 2026 pour l'admission aux universités luxembourgeoises.",
    url: "/manus-storage/pasted_file_Z6zCnC_Luxembourg_ED2026_1b8d5e3c.pdf"
  },
  {
    id: "lu-visiteur",
    country: "Luxembourg", flag: "🇱🇺", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Luxembourg",
    description: "Visa Schengen court séjour pour le Luxembourg.",
    url: "/manus-storage/pasted_file_oLtpOx_3MTravel_VisaVisiteur_Luxembourg_2026_88e2476f.pdf"
  },

  // ── POLOGNE ──────────────────────────────────────────────────────────────────
  {
    id: "pl-travail",
    country: "Pologne", flag: "🇵🇱", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Pologne",
    description: "Permis de travail Type D Pologne — recrutement direct, logistique industrielle, logement inclus.",
    url: "/manus-storage/pasted_file_TFxAuu_3MTravel_VisaTravail_Pologne_2026_a5e8c2d1.pdf",
    featured: true, badge: "Recrutement Direct"
  },
  {
    id: "pl-etudes",
    country: "Pologne", flag: "🇵🇱", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Pologne",
    description: "Procédure visa étudiant Pologne — universités publiques, frais réduits, bourse possible.",
    url: "/manus-storage/pasted_file_wvC9wI_3MTravel_VisaEtudes_Pologne_2026_50997d30.pdf"
  },
  {
    id: "pl-visiteur",
    country: "Pologne", flag: "🇵🇱", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Pologne",
    description: "Visa Schengen court séjour pour la Pologne.",
    url: "/manus-storage/pasted_file_7iglnH_3MTravel_VisaVisiteur_Pologne_2026_862e5b95.pdf"
  },

  // ── ESPAGNE ──────────────────────────────────────────────────────────────────
  {
    id: "es-etudes",
    country: "Espagne", flag: "🇪🇸", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Espagne",
    description: "Visa étudiant Espagne — inscription université, NIE, assurance maladie.",
    url: "/manus-storage/pasted_file_l0JeZn_3MTravel_VisaEtudes_Espagne_2026_8d686047.pdf"
  },
  {
    id: "es-visiteur",
    country: "Espagne", flag: "🇪🇸", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Espagne",
    description: "Visa Schengen court séjour pour l'Espagne.",
    url: "/manus-storage/pasted_file_ruSSYF_3MTravel_VisaVisiteur_Espagne_2026_545a6eb1.pdf"
  },

  // ── ITALIE ───────────────────────────────────────────────────────────────────
  {
    id: "it-etudes",
    country: "Italie", flag: "🇮🇹", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Italie",
    description: "Visa étudiant Italie — permesso di soggiorno, codice fiscale, inscription.",
    url: "/manus-storage/pasted_file_qPk13v_3MTravel_VisaEtudes_Italie_2026_3486082d.pdf"
  },
  {
    id: "it-visiteur",
    country: "Italie", flag: "🇮🇹", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Italie",
    description: "Visa Schengen court séjour pour l'Italie.",
    url: "/manus-storage/pasted_file_BXZvkR_3MTravel_VisaVisiteur_Italie_2026_2e9f7a4c.pdf"
  },

  // ── AUTRICHE ─────────────────────────────────────────────────────────────────
  {
    id: "at-etudes",
    country: "Autriche", flag: "🇦🇹", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Autriche",
    description: "Visa étudiant Autriche — Aufenthaltstitel, inscription université, preuve financière.",
    url: "/manus-storage/pasted_file_qEPVzq_3MTravel_VisaEtudes_Autriche_2026_159fb688.pdf"
  },
  {
    id: "at-visiteur",
    country: "Autriche", flag: "🇦🇹", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Autriche",
    description: "Visa Schengen court séjour pour l'Autriche.",
    url: "/manus-storage/pasted_file_qboepy_3MTravel_VisaVisiteur_Autriche_2026_e9b78b9d.pdf"
  },

  // ── PAYS-BAS ─────────────────────────────────────────────────────────────────
  {
    id: "nl-etudes",
    country: "Pays-Bas", flag: "🇳🇱", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Pays-Bas",
    description: "MVV et permis de séjour Pays-Bas pour étudiants — IND, assurance obligatoire.",
    url: "/manus-storage/pasted_file_iAKOUZ_3MTravel_VisaEtudes_PaysBas_2026_0c653817.pdf"
  },
  {
    id: "nl-visiteur",
    country: "Pays-Bas", flag: "🇳🇱", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Pays-Bas",
    description: "Visa Schengen court séjour pour les Pays-Bas.",
    url: "/manus-storage/pasted_file_YXP29N_3MTravel_VisaVisiteur_PaysBas_2026_5c3a8f2e.pdf"
  },

  // ── PORTUGAL ─────────────────────────────────────────────────────────────────
  {
    id: "pt-etudes",
    country: "Portugal", flag: "🇵🇹", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Portugal",
    description: "Visa étudiant Portugal — SEF, NIF, inscription université, logement.",
    url: "/manus-storage/pasted_file_D0UJC3_3MTravel_VisaEtudes_Portugal_2026_d7b3e9a1.pdf"
  },
  {
    id: "pt-visiteur",
    country: "Portugal", flag: "🇵🇹", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Portugal",
    description: "Visa Schengen court séjour pour le Portugal.",
    url: "/manus-storage/pasted_file_of4ga5_3MTravel_VisaVisiteur_Portugal_2026_98d2a032.pdf"
  },

  // ── DANEMARK ─────────────────────────────────────────────────────────────────
  {
    id: "dk-etudes",
    country: "Danemark", flag: "🇩🇰", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Danemark",
    description: "Permis de séjour étudiant Danemark — SIRI, CPR, assurance.",
    url: "/manus-storage/pasted_file_s1dGNv_3MTravel_VisaEtudes_Danemark_2026_38e4737c.pdf"
  },
  {
    id: "dk-visiteur",
    country: "Danemark", flag: "🇩🇰", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Danemark",
    description: "Visa Schengen court séjour pour le Danemark.",
    url: "/manus-storage/pasted_file_vpc8G2_3MTravel_VisaVisiteur_Danemark_2026_43879c8d.pdf"
  },

  // ── FINLANDE ─────────────────────────────────────────────────────────────────
  {
    id: "fi-etudes",
    country: "Finlande", flag: "🇫🇮", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Finlande",
    description: "Permis de séjour étudiant Finlande — Migri, inscription, preuve financière.",
    url: "/manus-storage/pasted_file_nwihYp_3MTravel_VisaEtudes_Finlande_2026_7dce05a0.pdf"
  },
  {
    id: "fi-visiteur",
    country: "Finlande", flag: "🇫🇮", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Finlande",
    description: "Visa Schengen court séjour pour la Finlande.",
    url: "/manus-storage/pasted_file_SblNbU_3MTravel_VisaVisiteur_Finlande_2026_c2f8b4d9.pdf"
  },

  // ── HONGRIE ──────────────────────────────────────────────────────────────────
  {
    id: "hu-etudes",
    country: "Hongrie", flag: "🇭🇺", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Hongrie",
    description: "Visa étudiant Hongrie — OIF, inscription, bourse Stipendium Hungaricum.",
    url: "/manus-storage/pasted_file_SymWgm_3MTravel_VisaEtudes_Hongrie_2026_4a7c1e9f.pdf"
  },
  {
    id: "hu-travail",
    country: "Hongrie", flag: "🇭🇺", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Hongrie",
    description: "Permis de travail Hongrie — contrat employeur, autorisation de travail.",
    url: "/manus-storage/pasted_file_SCbldS_3MTravel_VisaTravail_Hongrie_2026_8e3f2b7d.pdf"
  },
  {
    id: "hu-visiteur",
    country: "Hongrie", flag: "🇭🇺", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Hongrie",
    description: "Visa Schengen court séjour pour la Hongrie.",
    url: "/manus-storage/pasted_file_qcMEGq_3MTravel_VisaVisiteur_Hongrie_2026_1563c4ba.pdf"
  },

  // ── MALTE ────────────────────────────────────────────────────────────────────
  {
    id: "mt-etudes",
    country: "Malte", flag: "🇲🇹", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Malte",
    description: "Permis de séjour étudiant Malte — Identity Malta, inscription, assurance.",
    url: "/manus-storage/pasted_file_mrImSL_3MTravel_VisaEtudes_Malte_2026_7e5ad27b.pdf"
  },
  {
    id: "mt-travail",
    country: "Malte", flag: "🇲🇹", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Malte",
    description: "Permis de travail Malte — Single Permit, contrat employeur.",
    url: "/manus-storage/pasted_file_4TRucx_3MTravel_VisaTravail_Malte_2026_2c47db8d.pdf"
  },
  {
    id: "mt-visiteur",
    country: "Malte", flag: "🇲🇹", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Malte",
    description: "Visa Schengen court séjour pour Malte.",
    url: "/manus-storage/pasted_file_kl8JTP_3MTravel_VisaVisiteur_Malte_2026_6d666587.pdf"
  },

  // ── GRÈCE ────────────────────────────────────────────────────────────────────
  {
    id: "gr-visiteur",
    country: "Grèce", flag: "🇬🇷", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Grèce",
    description: "Visa Schengen court séjour pour la Grèce.",
    url: "/manus-storage/pasted_file_d3EYry_3MTravel_VisaVisiteur_Grece_2026_7f1a4c8b.pdf"
  },
  {
    id: "gr-guide",
    country: "Grèce", flag: "🇬🇷", region: "Espace Schengen", type: "guide",
    title: "Guide Grèce 2026",
    description: "Guide complet sur les procédures d'immigration en Grèce.",
    url: "/manus-storage/pasted_file_8N87oz_3MTravel_Grece_2026_229ba902.pdf"
  },

  // ── SUISSE ───────────────────────────────────────────────────────────────────
  {
    id: "ch-visiteur",
    country: "Suisse", flag: "🇨🇭", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Suisse",
    description: "Visa court séjour pour la Suisse — tourisme, affaires, visite familiale.",
    url: "/manus-storage/pasted_file_V58aqm_3MTravel_VisaVisiteur_Suisse_2026_3c9e7f2a.pdf"
  },

  // ── SUÈDE ────────────────────────────────────────────────────────────────────
  {
    id: "se-visiteur",
    country: "Suède", flag: "🇸🇪", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Suède",
    description: "Visa Schengen court séjour pour la Suède.",
    url: "/manus-storage/pasted_file_U5ZxUP_3MTravel_VisaVisiteur_Suede_2026_b4f8d3c1.pdf"
  },

  // ── NORVÈGE ──────────────────────────────────────────────────────────────────
  {
    id: "no-travail",
    country: "Norvège", flag: "🇳🇴", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Norvège",
    description: "Permis de travail Norvège — UDI, contrat employeur, qualification professionnelle.",
    url: "/manus-storage/pasted_file_ZXA57z_3MTravel_VisaTravail_Norvege_2026_9d2f5b8e.pdf"
  },
  {
    id: "no-visiteur",
    country: "Norvège", flag: "🇳🇴", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Norvège",
    description: "Visa Schengen court séjour pour la Norvège.",
    url: "/manus-storage/pasted_file_Rb9Wcw_3MTravel_VisaVisiteur_Norvege_2026_1a7e4c9f.pdf"
  },

  // ── ISLANDE ──────────────────────────────────────────────────────────────────
  {
    id: "is-travail",
    country: "Islande", flag: "🇮🇸", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Islande",
    description: "Permis de travail Islande — Directorate of Immigration, contrat.",
    url: "/manus-storage/pasted_file_Qhkh5J_3MTravel_VisaTravail_Islande_2026_c3f7a2d8.pdf"
  },
  {
    id: "is-visiteur",
    country: "Islande", flag: "🇮🇸", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Islande",
    description: "Visa Schengen court séjour pour l'Islande.",
    url: "/manus-storage/pasted_file_8pTmxs_3MTravel_VisaVisiteur_Islande_2026_5e9b3d7f.pdf"
  },

  // ── LIECHTENSTEIN ────────────────────────────────────────────────────────────
  {
    id: "li-travail",
    country: "Liechtenstein", flag: "🇱🇮", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Liechtenstein",
    description: "Permis de travail Liechtenstein — Ausländeramt, quota annuel.",
    url: "/manus-storage/pasted_file_a46Z2b_3MTravel_VisaTravail_Liechtenstein_2026_7b4e1f9c.pdf"
  },
  {
    id: "li-visiteur",
    country: "Liechtenstein", flag: "🇱🇮", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Liechtenstein",
    description: "Visa Schengen court séjour pour le Liechtenstein.",
    url: "/manus-storage/pasted_file_tMl9gJ_3MTravel_VisaVisiteur_Liechtenstein_2026_9571d148.pdf"
  },

  // ── LETTONIE ─────────────────────────────────────────────────────────────────
  {
    id: "lv-travail",
    country: "Lettonie", flag: "🇱🇻", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Lettonie",
    description: "Permis de travail Lettonie — OCMA, contrat employeur.",
    url: "/manus-storage/pasted_file_gJZCvY_3MTravel_VisaTravail_Lettonie_2026_0ad26cde.pdf"
  },
  {
    id: "lv-visiteur",
    country: "Lettonie", flag: "🇱🇻", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Lettonie",
    description: "Visa Schengen court séjour pour la Lettonie.",
    url: "/manus-storage/pasted_file_pUHvss_3MTravel_VisaVisiteur_Lettonie_2026_c5ed37bf.pdf"
  },

  // ── LITUANIE ─────────────────────────────────────────────────────────────────
  {
    id: "lt-travail",
    country: "Lituanie", flag: "🇱🇹", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Lituanie",
    description: "Permis de travail Lituanie — Migration Department, contrat.",
    url: "/manus-storage/pasted_file_xcvEVu_3MTravel_VisaTravail_Lituanie_2026_fc5d71ba.pdf"
  },
  {
    id: "lt-visiteur",
    country: "Lituanie", flag: "🇱🇹", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Lituanie",
    description: "Visa Schengen court séjour pour la Lituanie.",
    url: "/manus-storage/pasted_file_NjULT0_3MTravel_VisaVisiteur_Lituanie_2026_4d8f2c7a.pdf"
  },

  // ── SLOVAQUIE ────────────────────────────────────────────────────────────────
  {
    id: "sk-travail",
    country: "Slovaquie", flag: "🇸🇰", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Slovaquie",
    description: "Permis de travail Slovaquie — Bureau des migrations, contrat.",
    url: "/manus-storage/pasted_file_yITCvS_3MTravel_VisaTravail_Slovaquie_2026_de996062.pdf"
  },
  {
    id: "sk-visiteur",
    country: "Slovaquie", flag: "🇸🇰", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Slovaquie",
    description: "Visa Schengen court séjour pour la Slovaquie.",
    url: "/manus-storage/pasted_file_uO1YKs_3MTravel_VisaVisiteur_Slovaquie_2026_5f04cfee.pdf"
  },

  // ── SLOVÉNIE ─────────────────────────────────────────────────────────────────
  {
    id: "si-travail",
    country: "Slovénie", flag: "🇸🇮", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Slovénie",
    description: "Permis de travail Slovénie — MNZ, contrat employeur.",
    url: "/manus-storage/pasted_file_eMRXR5_3MTravel_VisaTravail_Slovenie_2026_6a1c4f8b.pdf"
  },
  {
    id: "si-visiteur",
    country: "Slovénie", flag: "🇸🇮", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Slovénie",
    description: "Visa Schengen court séjour pour la Slovénie.",
    url: "/manus-storage/pasted_file_PcV45l_3MTravel_VisaVisiteur_Slovenie_2026_2d7f9e3c.pdf"
  },

  // ── TCHÉQUIE ─────────────────────────────────────────────────────────────────
  {
    id: "cz-etudes",
    country: "Rép. Tchèque", flag: "🇨🇿", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Rép. Tchèque",
    description: "Visa étudiant République Tchèque — MVČR, inscription, assurance.",
    url: "/manus-storage/pasted_file_Rb2czA_3MTravel_VisaEtudes_RepubliqueTcheque_2026_8e3a5c1f.pdf"
  },
  {
    id: "cz-travail",
    country: "Rép. Tchèque", flag: "🇨🇿", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Rép. Tchèque",
    description: "Permis de travail République Tchèque — MVČR, contrat employeur.",
    url: "/manus-storage/pasted_file_JOKGVF_3MTravel_VisaTravail_Tcheque_2026_b2f7d4e9.pdf"
  },
  {
    id: "cz-visiteur",
    country: "Rép. Tchèque", flag: "🇨🇿", region: "Espace Schengen", type: "visiteur",
    title: "Visa Visiteur Rép. Tchèque",
    description: "Visa Schengen court séjour pour la République Tchèque.",
    url: "/manus-storage/pasted_file_f4rTNN_3MTravel_VisaVisiteur_Tcheque_2026_999bccac.pdf"
  },

  // ── BULGARIE ─────────────────────────────────────────────────────────────────
  {
    id: "bg-travail",
    country: "Bulgarie", flag: "🇧🇬", region: "Europe de l'Est", type: "travail",
    title: "Visa Travail Bulgarie",
    description: "Permis de travail Bulgarie — Agence pour l'emploi, contrat.",
    url: "/manus-storage/pasted_file_qpTJPT_3MTravel_VisaTravail_Bulgarie_2026_4fcf4603.pdf"
  },
  {
    id: "bg-guide",
    country: "Bulgarie", flag: "🇧🇬", region: "Europe de l'Est", type: "guide",
    title: "Guide Bulgarie 2026",
    description: "Guide complet sur les procédures d'immigration en Bulgarie.",
    url: "/manus-storage/pasted_file_iUD4yo_3MTravel_Bulgarie_2026_3429c3d1.pdf"
  },

  // ── ROUMANIE ─────────────────────────────────────────────────────────────────
  {
    id: "ro-travail",
    country: "Roumanie", flag: "🇷🇴", region: "Europe de l'Est", type: "travail",
    title: "Visa Travail Roumanie",
    description: "Permis de travail Roumanie — IGI, contrat employeur, logement.",
    url: "/manus-storage/pasted_file_s2iHUQ_3MTravel_VisaTravail_Roumanie_2026_402da8dc.pdf"
  },
  {
    id: "ro-guide",
    country: "Roumanie", flag: "🇷🇴", region: "Europe de l'Est", type: "guide",
    title: "Guide Roumanie 2026",
    description: "Guide complet sur les procédures d'immigration en Roumanie.",
    url: "/manus-storage/pasted_file_PGZqhn_3MTravel_Roumanie_2026_7c4e2b9f.pdf"
  },

  // ── CROATIE ──────────────────────────────────────────────────────────────────
  {
    id: "hr-travail",
    country: "Croatie", flag: "🇭🇷", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Croatie",
    description: "Permis de travail Croatie — MUP, contrat employeur.",
    url: "/manus-storage/pasted_file_eBGVTi_3MTravel_VisaTravail_Croatie_2026_5f1a8c3d.pdf"
  },

  // ── CHYPRE ───────────────────────────────────────────────────────────────────
  {
    id: "cy-travail",
    country: "Chypre", flag: "🇨🇾", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Chypre",
    description: "Permis de travail Chypre — Civil Registry, contrat.",
    url: "/manus-storage/pasted_file_b1941d_3MTravel_VisaTravail_Chypre_2026_9e4b7f2c.pdf"
  },
  {
    id: "cy-guide",
    country: "Chypre", flag: "🇨🇾", region: "Espace Schengen", type: "guide",
    title: "Guide Chypre 2026",
    description: "Guide complet sur les procédures d'immigration à Chypre.",
    url: "/manus-storage/pasted_file_x9gYyS_3MTravel_Chypre_2026_e0bc85dc.pdf"
  },

  // ── ESTONIE ──────────────────────────────────────────────────────────────────
  {
    id: "ee-etudes",
    country: "Estonie", flag: "🇪🇪", region: "Espace Schengen", type: "etudes",
    title: "Visa Études Estonie",
    description: "Permis de séjour étudiant Estonie — PPA, inscription, assurance.",
    url: "/manus-storage/pasted_file_xWOfuN_3MTravel_ProcedureComplete_VisaEtudes_Estonie_2026_ec912565.pdf"
  },
  {
    id: "ee-travail",
    country: "Estonie", flag: "🇪🇪", region: "Espace Schengen", type: "travail",
    title: "Visa Travail Estonie",
    description: "Permis de travail Estonie — PPA, contrat employeur.",
    url: "/manus-storage/pasted_file_CsFm7h_3MTravel_VisaTravail_Estonie_2026_4b8e2f7c.pdf"
  },
  {
    id: "ee-travail2",
    country: "Estonie", flag: "🇪🇪", region: "Espace Schengen", type: "travail",
    title: "Procédure Complète Visa Travail Estonie",
    description: "Guide complet étape par étape pour le visa de travail en Estonie.",
    url: "/manus-storage/pasted_file_fwPlwq_3MTravel_ProcedureComplete_VisaTravail_Estonie_2026_0f9c2746.pdf"
  },

  // ── ROYAUME-UNI ──────────────────────────────────────────────────────────────
  {
    id: "gb-travail",
    country: "Royaume-Uni", flag: "🇬🇧", region: "Hors Schengen", type: "travail",
    title: "Visa Travail Royaume-Uni",
    description: "Skilled Worker Visa UK — Certificate of Sponsorship, points system.",
    url: "/manus-storage/pasted_file_JFZ6yQ_3MTravel_VisaTravail_RoyaumeUni_2026_c7a3f9e2.pdf"
  },

  // ── AUSTRALIE ────────────────────────────────────────────────────────────────
  {
    id: "au-rp",
    country: "Australie", flag: "🇦🇺", region: "Océanie", type: "rp",
    title: "Résidence Permanente Australie",
    description: "Visa de résidence permanente Australie — SkillSelect, points test, nomination d'État.",
    url: "/manus-storage/pasted_file_9qm18O_3MTravel_RP_Australie_FR_1e4b8c5f.pdf",
    featured: true
  },
  {
    id: "au-rp-en",
    country: "Australie", flag: "🇦🇺", region: "Océanie", type: "rp",
    title: "Permanent Residency Australia (EN)",
    description: "Complete guide for Australian Permanent Residency — SkillSelect, state nomination.",
    url: "/manus-storage/pasted_file_AisVj2_3MTravel_PR_Australia_EN_2d9f7b4c.pdf"
  },
  {
    id: "au-travail",
    country: "Australie", flag: "🇦🇺", region: "Océanie", type: "travail",
    title: "Visa Travail Australie",
    description: "Visa de travail temporaire Australie — TSS 482, Skilled Worker.",
    url: "/manus-storage/pasted_file_QLKR9n_3MTravel_VisaTravail_Australie_2026_f3c8a1e7.pdf"
  },

  // ── NOUVELLE-ZÉLANDE ─────────────────────────────────────────────────────────
  {
    id: "nz-rp",
    country: "Nouvelle-Zélande", flag: "🇳🇿", region: "Océanie", type: "rp",
    title: "Résidence Permanente Nouvelle-Zélande",
    description: "Visa de résidence permanente Nouvelle-Zélande — Skilled Migrant, points system.",
    url: "/manus-storage/pasted_file_sQOztt_3MTravel_RP_NouvelleZelande_FR_4974629e.pdf",
    featured: true
  },
  {
    id: "nz-rp-en",
    country: "Nouvelle-Zélande", flag: "🇳🇿", region: "Océanie", type: "rp",
    title: "Permanent Residency New Zealand (EN)",
    description: "Complete guide for New Zealand Permanent Residency — Skilled Migrant Category.",
    url: "/manus-storage/pasted_file_QrRf2x_3MTravel_PR_NewZealand_EN_9a5d3c8f.pdf"
  },
  {
    id: "nz-travail",
    country: "Nouvelle-Zélande", flag: "🇳🇿", region: "Océanie", type: "travail",
    title: "Visa Travail Nouvelle-Zélande",
    description: "Visa de travail temporaire Nouvelle-Zélande — Essential Skills, Accredited Employer.",
    url: "/manus-storage/pasted_file_I2zRZ9_3MTravel_VisaTravail_NouvelleZelande_2026_b6e4f2a9.pdf"
  },

  // ── ÉTATS-UNIS ───────────────────────────────────────────────────────────────
  {
    id: "us-travail",
    country: "États-Unis", flag: "🇺🇸", region: "Amérique du Nord", type: "travail",
    title: "Visa Travail États-Unis",
    description: "Visa de travail H-1B, L-1, O-1 — pétition USCIS, employeur sponsor.",
    url: "/manus-storage/pasted_file_ObkKPy_3MTravel_VisaTravail_EtatsUnis_2026_3f7b2e9c.pdf"
  },
  {
    id: "us-travail2",
    country: "États-Unis", flag: "🇺🇸", region: "Amérique du Nord", type: "travail",
    title: "Visa Travail États-Unis — Guide Complet",
    description: "Guide complet sur les visas de travail américains — processus, délais, coûts.",
    url: "/manus-storage/pasted_file_vsYL79_3MTravel_VisaTravail_EtatsUnis_2026_1_4ee27d9f.pdf"
  },

  // ── TURQUIE ──────────────────────────────────────────────────────────────────
  {
    id: "tr-visa",
    country: "Turquie", flag: "🇹🇷", region: "Hors Schengen", type: "visiteur",
    title: "Visa Turquie 2026",
    description: "Visa touristique et de travail pour la Turquie — e-Visa, consulat.",
    url: "/manus-storage/pasted_file_rVjEdO_3MTravel_Visa_Turquie_2026_a3b8348f.pdf"
  },

  // ── QATAR ────────────────────────────────────────────────────────────────────
  {
    id: "qa-travail",
    country: "Qatar", flag: "🇶🇦", region: "Moyen-Orient", type: "travail",
    title: "Visa Travail Qatar",
    description: "Visa de travail Qatar — sponsor employeur, QID, contrat.",
    url: "/manus-storage/pasted_file_oFda1s_3MTravel_VisaTravail_Qatar_2026_49e6428e.pdf"
  },

  // ── DUBAI / EAU ──────────────────────────────────────────────────────────────
  {
    id: "ae-visiteur",
    country: "Dubaï / EAU", flag: "🇦🇪", region: "Moyen-Orient", type: "visiteur",
    title: "Visa Visiteur Dubaï",
    description: "Visa touristique Dubaï — e-Visa, visa on arrival, visa de transit.",
    url: "/manus-storage/pasted_file_bWPqcS_3MTravel_VisaVisiteur_Dubai_2026_3_d4e9b2f7.pdf"
  },

  // ── ÎLE MAURICE ──────────────────────────────────────────────────────────────
  {
    id: "mu-travail",
    country: "Île Maurice", flag: "🇲🇺", region: "Afrique", type: "travail",
    title: "Visa Travail Île Maurice",
    description: "Occupation Permit Maurice — investisseur, professionnel, retraité.",
    url: "/manus-storage/pasted_file_Obvkms_3MTravel_VisaTravail_Maurice_2026_1_c3f8a7d2.pdf"
  },

  // ── ARMÉNIE ──────────────────────────────────────────────────────────────────
  {
    id: "am-etudes",
    country: "Arménie", flag: "🇦🇲", region: "Caucase", type: "etudes",
    title: "Visa Études Arménie",
    description: "Procédure complète visa étudiant Arménie — inscription, résidence.",
    url: "/manus-storage/pasted_file_c9nyRR_3MTravel_ProcedureComplete_VisaEtudes_Armenie_2026_f2a8c4e1.pdf"
  },
  {
    id: "am-guide",
    country: "Arménie", flag: "🇦🇲", region: "Caucase", type: "guide",
    title: "Guide Arménie 2026",
    description: "Guide complet sur les procédures d'immigration en Arménie.",
    url: "/manus-storage/pasted_file_3c725t_3MTravel_Armenie_2026_b9af1586.pdf"
  },
  {
    id: "am-schengen",
    country: "Arménie", flag: "🇦🇲", region: "Caucase", type: "guide",
    title: "Stratégie Visa Schengen via Arménie",
    description: "Guide stratégique pour obtenir un visa Schengen via l'Arménie.",
    url: "/manus-storage/pasted_file_b8PUpr_3MTravel_Guide_VisaSchengen_Strategie_Armenie_2026_7d3f5c9a.pdf"
  },

  // ── AZERBAÏDJAN ──────────────────────────────────────────────────────────────
  {
    id: "az-guide",
    country: "Azerbaïdjan", flag: "🇦🇿", region: "Caucase", type: "guide",
    title: "Guide Azerbaïdjan 2026",
    description: "Guide complet sur les procédures d'immigration en Azerbaïdjan.",
    url: "/manus-storage/pasted_file_LwKq1K_3MTravel_Azerbaidjan_2026_c5f9b3e8.pdf"
  },

  // ── GÉORGIE ──────────────────────────────────────────────────────────────────
  {
    id: "ge-guide",
    country: "Géorgie", flag: "🇬🇪", region: "Caucase", type: "guide",
    title: "Guide Géorgie 2026",
    description: "Guide complet sur les procédures d'immigration en Géorgie.",
    url: "/manus-storage/pasted_file_vNhpzC_3MTravel_Georgie_2026_48039c1b.pdf"
  },

  // ── FORMULAIRES COMPLÉMENTAIRES ──────────────────────────────────────────────
  {
    id: "form-mineur",
    country: "Général", flag: "📋", region: "Formulaires", type: "guide",
    title: "Formulaire Accompagnement Enfant Mineur",
    description: "Formulaire officiel d'accompagnement pour enfant mineur voyageant seul ou avec un tiers.",
    url: "/manus-storage/pasted_file_kWvPqu_formulaireaccompagnementenfantmineur_dc260fb8.pdf"
  },
  {
    id: "form-assurance",
    country: "Général", flag: "📋", region: "Formulaires", type: "guide",
    title: "Guide Assurances Voyage",
    description: "Information sur les assureurs et assurances répondant aux conditions requises pour les visas.",
    url: "/manus-storage/pasted_file_cQ1xSw_Information_about_the_insurers_and_the_insurances_that_they_offer_which_meet_the_necessary_conditions_e7f4a2c9.pdf"
  },
];

// ─── TYPES & CONSTANTES ───────────────────────────────────────────────────────
type TabId = "canada" | "luxembourg" | "pologne" | "catalogue";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  etudes:    { label: "Études",    color: "bg-blue-100 text-blue-700" },
  travail:   { label: "Travail",   color: "bg-green-100 text-green-700" },
  visiteur:  { label: "Visiteur",  color: "bg-orange-100 text-orange-700" },
  rp:        { label: "Résidence", color: "bg-purple-100 text-purple-700" },
  procedure: { label: "Procédure", color: "bg-indigo-100 text-indigo-700" },
  guide:     { label: "Guide",     color: "bg-gray-100 text-gray-700" },
};

// ─── TIMELINE STEPS ───────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    number: "01", icon: Award, color: "from-blue-600 to-blue-800",
    title: "Évaluation Initiale & Score",
    subtitle: "65 000 FCFA",
    description: "Audit complet de votre profil, traduction de vos justificatifs et soumission de votre rapport de scoring officiel.",
    duration: "24-48h"
  },
  {
    number: "02", icon: Star, color: "from-amber-500 to-amber-700",
    title: "Choix de Votre Formule",
    subtitle: "3 options de paiement",
    description: "Sélection de votre niveau de garantie : Règlement Intégral, Paiement Échelonné ou Option Permis Garanti.",
    duration: "1 jour"
  },
  {
    number: "03", icon: BookOpen, color: "from-indigo-600 to-indigo-800",
    title: "Préparation du Livret de Compétences",
    subtitle: "Certification & dossier",
    description: "Vérification et certification de vos diplômes, constitution de votre dossier professionnel, préparation linguistique.",
    duration: "2-4 semaines"
  },
  {
    number: "04", icon: Users, color: "from-teal-600 to-teal-800",
    title: "Recherche d'Employeur & Soumission",
    subtitle: "Mise en avant du profil",
    description: "Mise en avant de votre profil auprès de nos employeurs partenaires et soumission officielle dans les bassins de sélection étatiques.",
    duration: "4-12 semaines"
  },
  {
    number: "05", icon: Plane, color: "from-green-600 to-green-800",
    title: "Obtention du Visa & Départ",
    subtitle: "Visa + billet d'avion",
    description: "Réception de votre permis de travail ou visa de résidence, et organisation de votre vol via notre plateforme intégrée.",
    duration: "Variable"
  },
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function Procedures() {
  const [activeTab, setActiveTab] = useState<TabId>("canada");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  // Filtres pour le catalogue
  const filteredProcedures = PROCEDURES.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || p.type === filterType;
    const matchRegion = filterRegion === "all" || p.region === filterRegion;
    const matchCountry = filterCountry === "all" || p.country === filterCountry;
    return matchSearch && matchType && matchRegion && matchCountry;
  });

  const regions = Array.from(new Set(PROCEDURES.map((p) => p.region))).sort();
  const countries = Array.from(new Set(PROCEDURES.map((p) => p.country))).sort();

  return (
    <div className="min-h-screen bg-white">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#1E3A8A] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="3M Travel" className="h-12 w-12 rounded-full object-cover border-2 border-white/30" />
            <div className="text-white">
              <div className="font-bold text-lg leading-tight">3M Travel & Services</div>
              <div className="text-xs text-blue-200">Votre mobilité, notre expertise</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-blue-200 hover:text-white text-sm transition-colors">Accueil</Link>
            <Link href="/flights" className="text-blue-200 hover:text-white text-sm transition-colors">Vols</Link>
            <a href={waLink("Bonjour 3M Travel, je souhaite des informations sur les procédures.")}
              target="_blank" rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1e4faa] to-[#2563EB] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-6">
              <Globe className="w-4 h-4 text-yellow-300" />
              <span>Hub de Mobilité Internationale — 88 procédures disponibles</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Votre Guide Complet<br />
              <span className="text-[#7CB9E8]">d'Immigration & Visa</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
              Accédez à toutes nos procédures officielles, téléchargez vos guides et démarrez votre dossier accompagné par nos experts.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => setActiveTab("catalogue")}
                className="bg-white text-[#1E3A8A] px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" /> Explorer le Catalogue
              </button>
              <a href={waLink("Bonjour 3M Travel, je souhaite faire mon évaluation d'éligibilité.")}
                target="_blank" rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Évaluation Gratuite
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ONGLETS PRINCIPAUX ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {[
            { id: "canada" as TabId, label: "Canada 🇨🇦", subtitle: "Notre Point Fort" },
            { id: "luxembourg" as TabId, label: "Luxembourg 🇱🇺", subtitle: "Sélection Élite" },
            { id: "pologne" as TabId, label: "Pologne & Europe 🇵🇱", subtitle: "Recrutement Direct" },
            { id: "catalogue" as TabId, label: "Catalogue Complet 📚", subtitle: "88 procédures" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex flex-col items-start ${
                activeTab === tab.id
                  ? "bg-[#1E3A8A] text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              <span>{tab.label}</span>
              <span className={`text-xs font-normal ${activeTab === tab.id ? "text-blue-200" : "text-gray-400"}`}>{tab.subtitle}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── ONGLET CANADA ─────────────────────────────────────────────────── */}
          {activeTab === "canada" && (
            <motion.div key="canada" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🇨🇦</span>
                    <div>
                      <h2 className="text-2xl font-black text-[#1E3A8A]">Immigration Économique & Résidence Permanente</h2>
                      <p className="text-gray-500 text-sm">Notre domaine d'excellence depuis 2019</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">Le Canada est notre destination phare. Grâce à notre réseau d'employeurs partenaires et notre maîtrise des programmes fédéraux et provinciaux, nous vous accompagnons de A à Z.</p>
                  <a href={waLink("Bonjour 3M Travel, je souhaite faire mon évaluation pour le Canada.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2563EB] transition-colors">
                    <ArrowRight className="w-4 h-4" /> Faire mon évaluation Canada
                  </a>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Star, title: "Entrée Express (Fédéral)", desc: "Travailleurs qualifiés — score CRS, invitation à présenter une demande (ITA), résidence permanente en 6 mois.", badge: "Prioritaire" },
                    { icon: MapPin, title: "Programmes des Candidats des Provinces (PCP)", desc: "Volets régionaux sur-mesure — Ontario, Québec, Alberta, Colombie-Britannique et plus.", badge: "Régional" },
                    { icon: Briefcase, title: "Volet Métiers Spécialisés", desc: "Soudure, Chaudronnerie, Vente B2B, Logistique — demande élevée, traitement accéléré.", badge: "Métiers" },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#1E3A8A] p-2 rounded-lg flex-shrink-0">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1E3A8A] text-sm">{item.title}</h3>
                            <span className="bg-[#1E3A8A] text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                          </div>
                          <p className="text-gray-600 text-xs">{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Procédures Canada */}
              <h3 className="font-bold text-[#1E3A8A] text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Nos Procédures Canada
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROCEDURES.filter(p => p.country === "Canada").map((p, i) => (
                  <ProcedureCard key={p.id} procedure={p} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ONGLET LUXEMBOURG ─────────────────────────────────────────────── */}
          {activeTab === "luxembourg" && (
            <motion.div key="luxembourg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🇱🇺</span>
                    <div>
                      <h2 className="text-2xl font-black text-[#1E3A8A]">Salariés Qualifiés & Cadres Supérieurs</h2>
                      <p className="text-gray-500 text-sm">Sélection d'élite — Salaire minimum garanti</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">Le Luxembourg offre les meilleures conditions salariales d'Europe pour les travailleurs qualifiés non-UE. Nous auditons votre dossier et vous positionnons auprès des employeurs luxembourgeois.</p>
                  <a href={waLink("Bonjour 3M Travel, je souhaite soumettre mon dossier pour audit Luxembourg.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2563EB] transition-colors">
                    <ArrowRight className="w-4 h-4" /> Soumettre mon dossier pour audit
                  </a>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Building, title: "Introduction Main-d'Œuvre Qualifiée", desc: "Procédure MAEE — autorisation de travail pour ressortissants non-UE hautement qualifiés.", badge: "MAEE" },
                    { icon: Award, title: "Salaire Minimum Légal Garanti", desc: "3 165 EUR/mois brut obligatoire — parmi les plus élevés d'Europe.", badge: "€€€" },
                    { icon: CheckCircle, title: "Audit de Conformité des Diplômes", desc: "Vérification et reconnaissance officielle de vos diplômes et certifications locales.", badge: "Audit" },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#1E3A8A] p-2 rounded-lg flex-shrink-0">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1E3A8A] text-sm">{item.title}</h3>
                            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                          </div>
                          <p className="text-gray-600 text-xs">{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-[#1E3A8A] text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Nos Procédures Luxembourg
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROCEDURES.filter(p => p.country === "Luxembourg").map((p, i) => (
                  <ProcedureCard key={p.id} procedure={p} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ONGLET POLOGNE & EUROPE ───────────────────────────────────────── */}
          {activeTab === "pologne" && (
            <motion.div key="pologne" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🇵🇱</span>
                    <div>
                      <h2 className="text-2xl font-black text-[#1E3A8A]">Placement Rapide & Logistique Industrielle</h2>
                      <p className="text-gray-500 text-sm">Recrutement direct — Logement inclus</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6">La Pologne et l'Europe de l'Est offrent des opportunités de placement rapide dans la logistique et l'industrie lourde. Contrats directs, logement pris en charge, permis accéléré.</p>
                  <a href={waLink("Bonjour 3M Travel, je souhaite voir les offres d'emploi disponibles en Pologne et Europe.")}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-full font-bold hover:bg-[#2563EB] transition-colors">
                    <ArrowRight className="w-4 h-4" /> Voir les offres d'emploi disponibles
                  </a>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: Briefcase, title: "Contrats d'Embauche Directe", desc: "Filière logistique et industrie lourde — contrats signés avant départ.", badge: "Direct" },
                    { icon: Building, title: "Logement Entièrement Pris en Charge", desc: "Hébergement fourni par l'employeur et encadrement sur place à l'arrivée.", badge: "Logement" },
                    { icon: Clock, title: "Permis de Travail Accéléré Type D", desc: "Procédure accélérée de permis de travail national — délai réduit à 4-6 semaines.", badge: "Rapide" },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="bg-blue-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="bg-[#1E3A8A] p-2 rounded-lg flex-shrink-0">
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#1E3A8A] text-sm">{item.title}</h3>
                            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                          </div>
                          <p className="text-gray-600 text-xs">{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-[#1E3A8A] text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Procédures Pologne & Europe de l'Est
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROCEDURES.filter(p => ["Pologne", "Bulgarie", "Roumanie", "Croatie", "Chypre", "Estonie"].includes(p.country)).map((p, i) => (
                  <ProcedureCard key={p.id} procedure={p} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── CATALOGUE COMPLET ─────────────────────────────────────────────── */}
          {activeTab === "catalogue" && (
            <motion.div key="catalogue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {/* Filtres */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Rechercher un pays, un visa..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white border-gray-200" />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                  <option value="all">Tous les types</option>
                  <option value="etudes">Études</option>
                  <option value="travail">Travail</option>
                  <option value="visiteur">Visiteur</option>
                  <option value="rp">Résidence Permanente</option>
                  <option value="procedure">Procédure</option>
                  <option value="guide">Guide</option>
                </select>
                <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                  <option value="all">Toutes les régions</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                  <option value="all">Tous les pays</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-sm text-gray-500 font-medium">{filteredProcedures.length} résultat{filteredProcedures.length > 1 ? "s" : ""}</span>
              </div>

              {filteredProcedures.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Aucune procédure trouvée pour "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProcedures.map((p, i) => (
                    <ProcedureCard key={p.id} procedure={p} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── TIMELINE DU PARCOURS CANDIDAT ───────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0f2460] to-[#1E3A8A] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-blue-200 text-sm mb-4">
              <Clock className="w-4 h-4" /> Processus transparent et structuré
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Votre Parcours Candidat
            </h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              De l'évaluation initiale à l'obtention de votre visa — 5 étapes claires et rassurantes.
            </p>
          </div>

          {/* Desktop: horizontal | Mobile: vertical */}
          <div className="hidden lg:flex items-start gap-0 relative">
            {/* Ligne de connexion */}
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-white/20 z-0" />
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex-1 flex flex-col items-center text-center px-3 relative z-10">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center shadow-xl mb-4 border-4 border-white/20`}>
                  <step.icon className="w-8 h-8 text-white mb-1" />
                  <span className="text-white/60 text-xs font-bold">{step.number}</span>
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{step.title}</h3>
                <span className="text-yellow-300 text-xs font-semibold mb-2">{step.subtitle}</span>
                <p className="text-blue-200 text-xs leading-relaxed">{step.description}</p>
                <span className="mt-2 bg-white/10 text-blue-100 text-xs px-2 py-1 rounded-full">{step.duration}</span>
              </motion.div>
            ))}
          </div>

          {/* Mobile vertical */}
          <div className="lg:hidden space-y-4">
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center flex-shrink-0`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{step.title}</h3>
                    <span className="bg-white/10 text-blue-200 text-xs px-2 py-0.5 rounded-full">{step.duration}</span>
                  </div>
                  <span className="text-yellow-300 text-xs font-semibold block mb-1">{step.subtitle}</span>
                  <p className="text-blue-200 text-xs">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href={waLink("Bonjour 3M Travel, je souhaite démarrer mon parcours candidat.")}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-xl">
              <MessageCircle className="w-5 h-5" /> Démarrer Mon Parcours
            </a>
          </div>
        </div>
      </section>

      {/* ── BANDEAU DE CONFORMITÉ JURIDIQUE ─────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="bg-[#1E3A8A] p-3 rounded-xl flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E3A8A] mb-2 flex items-center gap-2">
                <span>Bandeau de Conformité Juridique & Éthique</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Agence Agréée</span>
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                <strong>3M Travel & Services SARL (RC/YAO/2019/A/2567 | NIU : M112417203369H)</strong> s'engage au strict respect des réglementations d'immigration. Notre rôle se limite au conseil technique, à la préparation administrative rigoureuse de vos dossiers et à la mise en relation avec des employeurs partenaires agréés. L'octroi final des visas et permis de travail relève de la compétence souveraine des services d'immigration de chaque État d'accueil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1E3A8A] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="3M Travel" className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
            <div>
              <div className="font-bold">3M Travel & Services SARL</div>
              <div className="text-blue-200 text-xs">Yaoundé Biyem-Assi, Montée chapelle Obili</div>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-blue-200">
            <a href="tel:+237620996045" className="hover:text-white flex items-center gap-1"><Phone className="w-3 h-3" /> +237 620-996-045</a>
            <a href="tel:+237698104832" className="hover:text-white flex items-center gap-1"><Phone className="w-3 h-3" /> +237 698-104-832</a>
          </div>
          <Link href="/" className="text-blue-200 hover:text-white text-sm">← Retour à l'accueil</Link>
        </div>
      </footer>

      {/* ── BOUTON WHATSAPP FLOTTANT ─────────────────────────────────────────── */}
      <a href={waLink("Bonjour 3M Travel, j'ai une question sur les procédures.")}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:block text-sm font-bold">WhatsApp</span>
      </a>
    </div>
  );
}

// ─── COMPOSANT CARTE PROCÉDURE ────────────────────────────────────────────────
function ProcedureCard({ procedure: p, index }: { procedure: Procedure; index: number }) {
  const typeInfo = TYPE_LABELS[p.type] ?? { label: p.type, color: "bg-gray-100 text-gray-700" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Card header */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-4 flex items-center gap-3">
        <span className="text-3xl">{p.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{p.country}</div>
          <div className="text-blue-200 text-xs">{p.region}</div>
        </div>
        {p.featured && (
          <Star className="w-4 h-4 text-yellow-300 flex-shrink-0" />
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          {p.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold flex-shrink-0">
              {p.badge}
            </span>
          )}
        </div>
        <h3 className="font-bold text-[#1E3A8A] text-sm mb-2 leading-tight">{p.title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed flex-1">{p.description}</p>
      </div>

      {/* Card footer */}
      <div className="px-4 pb-4 flex gap-2">
        <a href={p.url} target="_blank" rel="noopener noreferrer"
          className="flex-1 bg-[#1E3A8A] hover:bg-[#2563EB] text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors">
          <Download className="w-3 h-3" /> Télécharger
        </a>
        <a href={waLink(`Bonjour 3M Travel, je suis intéressé(e) par la procédure : ${p.title} (${p.country}). Pouvez-vous m'aider ?`)}
          target="_blank" rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors">
          <MessageCircle className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
