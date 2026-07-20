/**
 * Catalogue des ressources PDF/DOCX disponibles en téléchargement
 * Organisé par catégorie : Visa Travail, Visa Études, Visa Visiteur, Guides & Procédures
 * URLs S3 générées via manus-upload-file --webdev
 */

export interface PdfResource {
  id: string;
  title: string;
  country: string;
  flag: string;
  type: "pdf" | "docx";
  url: string;
  category: "travail" | "etudes" | "visiteur" | "guide" | "formulaire";
}

export interface PdfCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  resources: PdfResource[];
}

export const PDF_CATEGORIES: PdfCategory[] = [
  {
    id: "travail",
    label: "Visa Travail",
    icon: "Briefcase",
    color: "blue",
    resources: [
      { id: "vt-allemagne", title: "Visa Travail — Allemagne 2026", country: "Allemagne", flag: "🇩🇪", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Allemagne_2026_64549fc5.docx", category: "travail" },
      { id: "vt-australie", title: "Visa Travail — Australie 2026", country: "Australie", flag: "🇦🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Australie_2026_916008e9.pdf", category: "travail" },
      { id: "vt-bulgarie", title: "Visa Travail — Bulgarie 2026", country: "Bulgarie", flag: "🇧🇬", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Bulgarie_2026_75c99ff8.pdf", category: "travail" },
      { id: "vt-canada", title: "Visa Travail — Canada Complet 2026", country: "Canada", flag: "🍁", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Canada_Complet_2026_6ddf7e2c.pdf", category: "travail" },
      { id: "vt-chypre", title: "Visa Travail — Chypre 2026", country: "Chypre", flag: "🇨🇾", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Chypre_2026_ac29e62b.pdf", category: "travail" },
      { id: "vt-croatie", title: "Visa Travail — Croatie 2026", country: "Croatie", flag: "🇭🇷", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Croatie_2026_556f2566.pdf", category: "travail" },
      { id: "vt-estonie", title: "Visa Travail — Estonie 2026", country: "Estonie", flag: "🇪🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Estonie_2026_6faf4d25.pdf", category: "travail" },
      { id: "vt-etats-unis", title: "Visa Travail — États-Unis 2026", country: "États-Unis", flag: "🇺🇸", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_EtatsUnis_2026_bc1ac42d.pdf", category: "travail" },
      { id: "vt-france", title: "Visa Travail — France 2026", country: "France", flag: "🇫🇷", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_France_2026_65fca802.pdf", category: "travail" },
      { id: "vt-hongrie", title: "Visa Travail — Hongrie 2026", country: "Hongrie", flag: "🇭🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Hongrie_2026_a6adcc08.pdf", category: "travail" },
      { id: "vt-irlande", title: "Visa Travail — Irlande 2026", country: "Irlande", flag: "🇮🇪", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Irlande_2026_1612755f.docx", category: "travail" },
      { id: "vt-islande", title: "Visa Travail — Islande 2026", country: "Islande", flag: "🇮🇸", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Islande_2026_0374dd20.pdf", category: "travail" },
      { id: "vt-italie", title: "Visa Travail — Italie Complet 2026", country: "Italie", flag: "🇮🇹", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Italie_Complet_3M_FCFA_2026_4afb5c71.docx", category: "travail" },
      { id: "vt-kenya", title: "Visa Travail — Kenya 2026", country: "Kenya", flag: "🇰🇪", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Kenya_2026_36500e5d.docx", category: "travail" },
      { id: "vt-lettonie", title: "Visa Travail — Lettonie 2026", country: "Lettonie", flag: "🇱🇻", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Lettonie_2026_724960ba.pdf", category: "travail" },
      { id: "vt-liechtenstein", title: "Visa Travail — Liechtenstein 2026", country: "Liechtenstein", flag: "🇱🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Liechtenstein_2026_316445f5.pdf", category: "travail" },
      { id: "vt-lituanie", title: "Visa Travail — Lituanie 2026", country: "Lituanie", flag: "🇱🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Lituanie_2026_ac5cd4ab.pdf", category: "travail" },
      { id: "vt-luxembourg", title: "Visa Travail — Luxembourg 2026", country: "Luxembourg", flag: "🇱🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Luxembourg_2026_6eae8854.pdf", category: "travail" },
      { id: "vt-malaisie", title: "Visa Travail — Malaisie 2026", country: "Malaisie", flag: "🇲🇾", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Malaisie_2026_d55d0436.docx", category: "travail" },
      { id: "vt-malte", title: "Visa Travail — Malte 2026", country: "Malte", flag: "🇲🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Malte_2026_935afe5a.pdf", category: "travail" },
      { id: "vt-maurice", title: "Visa Travail — Maurice 2026", country: "Maurice", flag: "🇲🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Maurice_2026_1_22c9681b.pdf", category: "travail" },
      { id: "vt-norvege", title: "Visa Travail — Norvège 2026", country: "Norvège", flag: "🇳🇴", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Norvege_2026_601b7ba0.pdf", category: "travail" },
      { id: "vt-nz", title: "Visa Travail — Nouvelle-Zélande 2026", country: "Nouvelle-Zélande", flag: "🇳🇿", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_NouvelleZelande_2026_6faad320.pdf", category: "travail" },
      { id: "vt-pologne", title: "Visa Travail — Pologne 2026", country: "Pologne", flag: "🇵🇱", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Pologne_2026_d7fe44ee.pdf", category: "travail" },
      { id: "vt-portugal", title: "Visa Travail — Portugal 2026", country: "Portugal", flag: "🇵🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Portugal_2026_8608abfa.pdf", category: "travail" },
      { id: "vt-qatar", title: "Visa Travail — Qatar 2026", country: "Qatar", flag: "🇶🇦", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Qatar_2026_5de645a8.pdf", category: "travail" },
      { id: "vt-roumanie", title: "Visa Travail — Roumanie 2026", country: "Roumanie", flag: "🇷🇴", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Roumanie_2026_bdb62ec5.pdf", category: "travail" },
      { id: "vt-royaume-uni", title: "Visa Travail — Royaume-Uni 2026", country: "Royaume-Uni", flag: "🇬🇧", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_RoyaumeUni_2026_d17acd9e.pdf", category: "travail" },
      { id: "vt-senegal", title: "Visa Travail — Sénégal 2026", country: "Sénégal", flag: "🇸🇳", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Senegal_2026_1079428a.docx", category: "travail" },
      { id: "vt-slovaquie", title: "Visa Travail — Slovaquie 2026", country: "Slovaquie", flag: "🇸🇰", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Slovaquie_2026_0dc020e6.pdf", category: "travail" },
      { id: "vt-slovenie", title: "Visa Travail — Slovénie 2026", country: "Slovénie", flag: "🇸🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Slovenie_2026_c7d51c34.pdf", category: "travail" },
      { id: "vt-suisse", title: "Visa Travail — Suisse 2026", country: "Suisse", flag: "🇨🇭", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Suisse_2026_5f00cf79.docx", category: "travail" },
      { id: "vt-tcheque", title: "Visa Travail — Rép. Tchèque 2026", country: "Rép. Tchèque", flag: "🇨🇿", type: "pdf", url: "/manus-storage/3MTravel_VisaTravail_Tcheque_2026_a312f39d.pdf", category: "travail" },
      { id: "vt-gabon", title: "Visa Travail — Gabon 2026", country: "Gabon", flag: "🇬🇦", type: "docx", url: "/manus-storage/3MTravel_VisaTravail_Gabon_2026_630965bf.docx", category: "travail" },
    ],
  },
  {
    id: "etudes",
    label: "Visa Études",
    icon: "GraduationCap",
    color: "green",
    resources: [
      { id: "ve-allemagne", title: "Visa Études — Allemagne 2026", country: "Allemagne", flag: "🇩🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Allemagne_2026_9895729b.pdf", category: "etudes" },
      { id: "ve-armenie", title: "Visa Études — Arménie 2026", country: "Arménie", flag: "🇦🇲", type: "pdf", url: "/manus-storage/3MTravel_ProcedureComplete_VisaEtudes_Armenie_2026_28530133.pdf", category: "etudes" },
      { id: "ve-autriche", title: "Visa Études — Autriche 2026", country: "Autriche", flag: "🇦🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Autriche_2026_3416cfaa.pdf", category: "etudes" },
      { id: "ve-belgique", title: "Visa Études — Belgique 2026", country: "Belgique", flag: "🇧🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Belgique_2026_61179d43.pdf", category: "etudes" },
      { id: "ve-bulgarie", title: "Visa Études — Bulgarie 2026", country: "Bulgarie", flag: "🇧🇬", type: "docx", url: "/manus-storage/3MTravel_VisaEtudes_Bulgarie_2026_c72b338d.docx", category: "etudes" },
      { id: "ve-canada", title: "Visa Études — Canada 2026", country: "Canada", flag: "🍁", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Canada_2026_264a723d.pdf", category: "etudes" },
      { id: "ve-danemark", title: "Visa Études — Danemark 2026", country: "Danemark", flag: "🇩🇰", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Danemark_2026_95fb9e7b.pdf", category: "etudes" },
      { id: "ve-espagne", title: "Visa Études — Espagne 2026", country: "Espagne", flag: "🇪🇸", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Espagne_2026_9e2f2cf4.pdf", category: "etudes" },
      { id: "ve-estonie", title: "Visa Études — Estonie 2026", country: "Estonie", flag: "🇪🇪", type: "pdf", url: "/manus-storage/3MTravel_ProcedureComplete_VisaEtudes_Estonie_2026_01f29032.pdf", category: "etudes" },
      { id: "ve-finlande", title: "Visa Études — Finlande 2026", country: "Finlande", flag: "🇫🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Finlande_2026_54039c1e.pdf", category: "etudes" },
      { id: "ve-hongrie", title: "Visa Études — Hongrie 2026", country: "Hongrie", flag: "🇭🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Hongrie_2026_8ec52b9d.pdf", category: "etudes" },
      { id: "ve-italie", title: "Visa Études — Italie 2026", country: "Italie", flag: "🇮🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Italie_2026_99eeb1a3.pdf", category: "etudes" },
      { id: "ve-lettonie", title: "Visa Études — Lettonie 2026", country: "Lettonie", flag: "🇱🇻", type: "docx", url: "/manus-storage/3MTravel_VisaEtudes_Lettonie_2026_58e5d669.docx", category: "etudes" },
      { id: "ve-luxembourg", title: "Visa Études — Luxembourg 2026", country: "Luxembourg", flag: "🇱🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Luxembourg_2026_49e56c69.pdf", category: "etudes" },
      { id: "ve-malte", title: "Visa Études — Malte 2026", country: "Malte", flag: "🇲🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Malte_2026_aaff8378.pdf", category: "etudes" },
      { id: "ve-pays-bas", title: "Visa Études — Pays-Bas 2026", country: "Pays-Bas", flag: "🇳🇱", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_PaysBas_2026_04a4fd0d.pdf", category: "etudes" },
      { id: "ve-pologne", title: "Visa Études — Pologne 2026", country: "Pologne", flag: "🇵🇱", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Pologne_2026_5d8e278c.pdf", category: "etudes" },
      { id: "ve-portugal", title: "Visa Études — Portugal 2026", country: "Portugal", flag: "🇵🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Portugal_2026_48a56076.pdf", category: "etudes" },
      { id: "ve-roumanie", title: "Visa Études — Roumanie 2026", country: "Roumanie", flag: "🇷🇴", type: "docx", url: "/manus-storage/3MTravel_VisaEtudes_Roumanie_2026_2278bfe7.docx", category: "etudes" },
      { id: "ve-slovaquie", title: "Visa Études — Slovaquie 2026", country: "Slovaquie", flag: "🇸🇰", type: "docx", url: "/manus-storage/3MTravel_VisaEtudes_Slovaquie_2026_67896fef.docx", category: "etudes" },
      { id: "ve-suede", title: "Visa Études — Suède 2026", country: "Suède", flag: "🇸🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_Suede_2026_8e44b90e.pdf", category: "etudes" },
      { id: "ve-tcheque", title: "Visa Études — Rép. Tchèque 2026", country: "Rép. Tchèque", flag: "🇨🇿", type: "pdf", url: "/manus-storage/3MTravel_VisaEtudes_RepubliqueTcheque_2026_d6df1fe2.pdf", category: "etudes" },
    ],
  },
  {
    id: "visiteur",
    label: "Visa Visiteur / Tourisme",
    icon: "Globe",
    color: "purple",
    resources: [
      { id: "vv-allemagne", title: "Visa Visiteur — Allemagne 2026", country: "Allemagne", flag: "🇩🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Allemagne_2026_23d698cd.pdf", category: "visiteur" },
      { id: "vv-autriche", title: "Visa Visiteur — Autriche 2026", country: "Autriche", flag: "🇦🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Autriche_2026_8448685f.pdf", category: "visiteur" },
      { id: "vv-belgique", title: "Visa Visiteur — Belgique 2026", country: "Belgique", flag: "🇧🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Belgique_2026_ed1838f7.pdf", category: "visiteur" },
      { id: "vv-danemark", title: "Visa Visiteur — Danemark 2026", country: "Danemark", flag: "🇩🇰", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Danemark_2026_4b2cf00d.pdf", category: "visiteur" },
      { id: "vv-dubai", title: "Visa Visiteur — Dubaï 2026", country: "Dubaï / EAU", flag: "🇦🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Dubai_2026_3_2c579224.pdf", category: "visiteur" },
      { id: "vv-espagne", title: "Visa Visiteur — Espagne 2026", country: "Espagne", flag: "🇪🇸", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Espagne_2026_0b864f1b.pdf", category: "visiteur" },
      { id: "vv-finlande", title: "Visa Visiteur — Finlande 2026", country: "Finlande", flag: "🇫🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Finlande_2026_80e88499.pdf", category: "visiteur" },
      { id: "vv-france", title: "Visa Visiteur — France 2026", country: "France", flag: "🇫🇷", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_France_2026_55cee033.pdf", category: "visiteur" },
      { id: "vv-grece", title: "Visa Visiteur — Grèce 2026", country: "Grèce", flag: "🇬🇷", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Grece_2026_f7e4d894.pdf", category: "visiteur" },
      { id: "vv-hongrie", title: "Visa Visiteur — Hongrie 2026", country: "Hongrie", flag: "🇭🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Hongrie_2026_64653d6d.pdf", category: "visiteur" },
      { id: "vv-islande", title: "Visa Visiteur — Islande 2026", country: "Islande", flag: "🇮🇸", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Islande_2026_9d47b064.pdf", category: "visiteur" },
      { id: "vv-italie", title: "Visa Visiteur — Italie 2026", country: "Italie", flag: "🇮🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Italie_2026_643efc18.pdf", category: "visiteur" },
      { id: "vv-lettonie", title: "Visa Visiteur — Lettonie 2026", country: "Lettonie", flag: "🇱🇻", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Lettonie_2026_cb970802.pdf", category: "visiteur" },
      { id: "vv-liechtenstein", title: "Visa Visiteur — Liechtenstein 2026", country: "Liechtenstein", flag: "🇱🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Liechtenstein_2026_12babaae.pdf", category: "visiteur" },
      { id: "vv-lituanie", title: "Visa Visiteur — Lituanie 2026", country: "Lituanie", flag: "🇱🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Lituanie_2026_cd222fbd.pdf", category: "visiteur" },
      { id: "vv-luxembourg", title: "Visa Visiteur — Luxembourg 2026", country: "Luxembourg", flag: "🇱🇺", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Luxembourg_2026_b404e1fb.pdf", category: "visiteur" },
      { id: "vv-malte", title: "Visa Visiteur — Malte 2026", country: "Malte", flag: "🇲🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Malte_2026_ce5d45b9.pdf", category: "visiteur" },
      { id: "vv-norvege", title: "Visa Visiteur — Norvège 2026", country: "Norvège", flag: "🇳🇴", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Norvege_2026_9a73fe77.pdf", category: "visiteur" },
      { id: "vv-pays-bas", title: "Visa Visiteur — Pays-Bas 2026", country: "Pays-Bas", flag: "🇳🇱", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_PaysBas_2026_cccc1578.pdf", category: "visiteur" },
      { id: "vv-pologne", title: "Visa Visiteur — Pologne 2026", country: "Pologne", flag: "🇵🇱", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Pologne_2026_821dc4fb.pdf", category: "visiteur" },
      { id: "vv-portugal", title: "Visa Visiteur — Portugal 2026", country: "Portugal", flag: "🇵🇹", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Portugal_2026_e1ac1b6f.pdf", category: "visiteur" },
      { id: "vv-slovaquie", title: "Visa Visiteur — Slovaquie 2026", country: "Slovaquie", flag: "🇸🇰", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Slovaquie_2026_b6e52c94.pdf", category: "visiteur" },
      { id: "vv-slovenie", title: "Visa Visiteur — Slovénie 2026", country: "Slovénie", flag: "🇸🇮", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Slovenie_2026_1d356d2b.pdf", category: "visiteur" },
      { id: "vv-suede", title: "Visa Visiteur — Suède 2026", country: "Suède", flag: "🇸🇪", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Suede_2026_0c19153e.pdf", category: "visiteur" },
      { id: "vv-suisse", title: "Visa Visiteur — Suisse 2026", country: "Suisse", flag: "🇨🇭", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Suisse_2026_0f683035.pdf", category: "visiteur" },
      { id: "vv-tcheque", title: "Visa Visiteur — Rép. Tchèque 2026", country: "Rép. Tchèque", flag: "🇨🇿", type: "pdf", url: "/manus-storage/3MTravel_VisaVisiteur_Tcheque_2026_662305e1.pdf", category: "visiteur" },
      { id: "vv-turquie", title: "Visa Visiteur — Turquie 2026", country: "Turquie", flag: "🇹🇷", type: "pdf", url: "/manus-storage/3MTravel_Visa_Turquie_2026_39febd0e.pdf", category: "visiteur" },
    ],
  },
  {
    id: "guide",
    label: "Guides & Procédures",
    icon: "BookOpen",
    color: "amber",
    resources: [
      { id: "g-armenie-schengen", title: "Guide — Stratégie Visa Schengen via Arménie 2026", country: "Arménie / Schengen", flag: "🇦🇲", type: "pdf", url: "/manus-storage/3MTravel_Guide_VisaSchengen_Strategie_Armenie_2026_bfdc4a53.pdf", category: "guide" },
      { id: "g-etudes-complet", title: "Guide Complet Études 2026 — Toutes destinations", country: "Multi-destinations", flag: "📚", type: "pdf", url: "/manus-storage/3MTravel_Guide_Complet_Etudes_2026_Details_fa67107c.pdf", category: "guide" },
      { id: "g-travail-schengen", title: "Guide Visa Travail Schengen 2026", country: "Espace Schengen", flag: "🇪🇺", type: "docx", url: "/manus-storage/3MTravel_Guide_VisaTravail_Schengen2026_c52fbb13.docx", category: "guide" },
      { id: "g-canada-contrat", title: "Procédure Contrat Travail — Canada 2026", country: "Canada", flag: "🍁", type: "pdf", url: "/manus-storage/3MTravel_Procedure_ContratTravail_Canada_2026_1_b43ef651.pdf", category: "guide" },
      { id: "g-canada-etudes", title: "Procédure Visa Études — Canada Complet 2026", country: "Canada", flag: "🍁", type: "pdf", url: "/manus-storage/3MTravel_Procedure_VisaEtudes_Canada_Complet_2026_c3777b2f.pdf", category: "guide" },
      { id: "g-allemagne-formation", title: "Procédure Formation — Allemagne 2026", country: "Allemagne", flag: "🇩🇪", type: "pdf", url: "/manus-storage/3MTravel_Procedure_Formation_Allemagne_2026_c2c8a21f.pdf", category: "guide" },
      { id: "g-estonie-travail", title: "Procédure Complète Visa Travail — Estonie 2026", country: "Estonie", flag: "🇪🇪", type: "pdf", url: "/manus-storage/3MTravel_ProcedureComplete_VisaTravail_Estonie_2026_db3f770f.pdf", category: "guide" },
      { id: "g-armenie-etudes", title: "Procédure Complète Visa Études — Arménie 2026", country: "Arménie", flag: "🇦🇲", type: "pdf", url: "/manus-storage/3MTravel_ProcedureComplete_VisaEtudes_Armenie_2026_28530133.pdf", category: "guide" },
      { id: "g-estonie-etudes", title: "Procédure Complète Visa Études — Estonie 2026", country: "Estonie", flag: "🇪🇪", type: "pdf", url: "/manus-storage/3MTravel_ProcedureComplete_VisaEtudes_Estonie_2026_01f29032.pdf", category: "guide" },
      { id: "g-armenie-general", title: "Fiche Pays — Arménie 2026", country: "Arménie", flag: "🇦🇲", type: "pdf", url: "/manus-storage/3MTravel_Armenie_2026_eeefea9a.pdf", category: "guide" },
      { id: "g-azerbaidjan", title: "Fiche Pays — Azerbaïdjan 2026", country: "Azerbaïdjan", flag: "🇦🇿", type: "pdf", url: "/manus-storage/3MTravel_Azerbaidjan_2026_8a879b79.pdf", category: "guide" },
      { id: "g-bulgarie", title: "Fiche Pays — Bulgarie 2026", country: "Bulgarie", flag: "🇧🇬", type: "pdf", url: "/manus-storage/3MTravel_Bulgarie_2026_a98781eb.pdf", category: "guide" },
      { id: "g-chypre", title: "Fiche Pays — Chypre 2026", country: "Chypre", flag: "🇨🇾", type: "pdf", url: "/manus-storage/3MTravel_Chypre_2026_ee36e1fb.pdf", category: "guide" },
      { id: "g-georgie", title: "Fiche Pays — Géorgie 2026", country: "Géorgie", flag: "🇬🇪", type: "pdf", url: "/manus-storage/3MTravel_Georgie_2026_b48cf3ec.pdf", category: "guide" },
      { id: "g-grece", title: "Fiche Pays — Grèce 2026", country: "Grèce", flag: "🇬🇷", type: "pdf", url: "/manus-storage/3MTravel_Grece_2026_0833905e.pdf", category: "guide" },
      { id: "g-roumanie", title: "Fiche Pays — Roumanie 2026", country: "Roumanie", flag: "🇷🇴", type: "pdf", url: "/manus-storage/3MTravel_Roumanie_2026_8d91c35d.pdf", category: "guide" },
      { id: "g-australie-rp-fr", title: "Résidence Permanente — Australie (FR)", country: "Australie", flag: "🇦🇺", type: "pdf", url: "/manus-storage/3MTravel_RP_Australie_FR_009b820d.pdf", category: "guide" },
      { id: "g-australie-rp-en", title: "Résidence Permanente — Australie (EN)", country: "Australie", flag: "🇦🇺", type: "pdf", url: "/manus-storage/3MTravel_PR_Australia_EN_9a62db11.pdf", category: "guide" },
      { id: "g-nz-rp-fr", title: "Résidence Permanente — Nouvelle-Zélande (FR)", country: "Nouvelle-Zélande", flag: "🇳🇿", type: "pdf", url: "/manus-storage/3MTravel_RP_NouvelleZelande_FR_772f66e4.pdf", category: "guide" },
      { id: "g-nz-rp-en", title: "Résidence Permanente — Nouvelle-Zélande (EN)", country: "Nouvelle-Zélande", flag: "🇳🇿", type: "pdf", url: "/manus-storage/3MTravel_PR_NewZealand_EN_07013b72.pdf", category: "guide" },
      { id: "g-dossier-client", title: "Dossier Client Immigration 2026", country: "Multi-destinations", flag: "📋", type: "docx", url: "/manus-storage/3MTravel_DossierClient_Immigration_2026_a445cced.docx", category: "guide" },
      { id: "g-luxembourg-etudes", title: "Guide Études — Luxembourg 2026", country: "Luxembourg", flag: "🇱🇺", type: "pdf", url: "/manus-storage/Luxembourg_ED2026_a3ddb1c0.pdf", category: "guide" },
      { id: "g-assurance-schengen", title: "Assurances Schengen — Liste des assureurs agréés", country: "Espace Schengen", flag: "🛡️", type: "pdf", url: "/manus-storage/Information_about_the_insurers_and_the_insurances_that_they_offer_which_meet_the_necessary_conditions_8b107a98.pdf", category: "guide" },
    ],
  },
  {
    id: "formulaire",
    label: "Formulaires Officiels",
    icon: "FileText",
    color: "rose",
    resources: [
      { id: "f-mineur", title: "Formulaire Accompagnement Enfant Mineur", country: "Espace Schengen", flag: "👶", type: "pdf", url: "/manus-storage/formulaireaccompagnementenfantmineur_e4df6970.pdf", category: "formulaire" },
    ],
  },
];

/** Retourne toutes les ressources à plat */
export const getAllResources = (): PdfResource[] =>
  PDF_CATEGORIES.flatMap((cat) => cat.resources);

/** Recherche par mot-clé dans titre ou pays */
export const searchResources = (query: string): PdfResource[] => {
  const q = query.toLowerCase();
  return getAllResources().filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q)
  );
};
