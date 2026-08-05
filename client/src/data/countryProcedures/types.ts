/**
 * Modèle de données pour une fiche procédure pays complète — 3M Travel & Services.
 * Un seul format réutilisable pour toutes les destinations (visa de travail,
 * études, etc.), avec ses volets officiel + anti-arnaque + tarification.
 */

export interface ProcedureStep {
  number: number;
  title: string;
  responsible: string;
  shortDescription: string;
  details: { label: string; value: string; highlight?: boolean }[];
}

export interface FeeLine {
  label: string;
  detail: string;
  amount: string;
  chargedTo: "Client" | "Employeur";
}

export interface PaymentOption {
  name: string;
  amount: string;
  conditions: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CountryProcedure {
  slug: string;
  country: string;
  flag: string;
  visaType: string;
  title: string;
  subtitle: string;
  editionYear: string;
  intro: {
    vision: string;
    eligibility: string;
    sectors: string[];
    requiredDocs: string;
    commitment: string;
    consularRepresentation: string;
  };
  fraudAlert: {
    summary: string;
    fakeExamples: { name: string; description: string }[];
    goldenRule: string;
    sources: string;
    warningSigns: string[];
  };
  steps: ProcedureStep[];
  antiScamMeasures: string[];
  fees: FeeLine[];
  totalBudgetLabel: string;
  transparencyNote: string;
  paymentOptions: PaymentOption[];
  paymentNote: string;
  faq: FaqItem[];
  contact: {
    phones: string[];
    email: string;
    website: string;
    address: string;
    consulate: string;
  };
  documentNote: string;
}
