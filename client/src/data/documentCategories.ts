export interface DocumentCategory {
  id: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  required?: boolean;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: "passport",
    name: "Passeport",
    label: "Passeport",
    description: "Copie de votre passeport valide",
    icon: "🛂",
    color: "bg-blue-100 text-blue-800",
    required: true,
  },
  {
    id: "id_card",
    name: "Carte d'Identité",
    label: "Carte d'Identité",
    description: "Copie recto-verso de votre carte d'identité",
    icon: "🆔",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "birth_certificate",
    name: "Acte de Naissance",
    label: "Acte de Naissance",
    description: "Acte de naissance original ou certifié",
    icon: "📜",
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: "proof_of_residence",
    name: "Justificatif de Domicile",
    label: "Justificatif de Domicile",
    description: "Facture, contrat de location ou attestation d'hébergement",
    icon: "🏠",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "financial_documents",
    name: "Documents Financiers",
    label: "Documents Financiers",
    description: "Relevés bancaires, fiches de paie, avis d'imposition",
    icon: "💰",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "employment_letter",
    name: "Lettre d'Emploi",
    label: "Lettre d'Emploi",
    description: "Lettre de l'employeur confirmant l'emploi",
    icon: "💼",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "education_documents",
    name: "Documents Éducatifs",
    label: "Documents Éducatifs",
    description: "Diplômes, relevés de notes, certificats",
    icon: "🎓",
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "medical_documents",
    name: "Documents Médicaux",
    label: "Documents Médicaux",
    description: "Certificat médical, vaccinations, assurance santé",
    icon: "⚕️",
    color: "bg-red-100 text-red-800",
  },
  {
    id: "marriage_certificate",
    name: "Certificat de Mariage",
    label: "Certificat de Mariage",
    description: "Certificat de mariage ou acte de divorce",
    icon: "💍",
    color: "bg-rose-100 text-rose-800",
  },
  {
    id: "police_certificate",
    name: "Certificat de Police",
    label: "Certificat de Police",
    description: "Certificat de bonne conduite ou casier judiciaire",
    icon: "🚔",
    color: "bg-slate-100 text-slate-800",
  },
  {
    id: "visa_documents",
    name: "Documents de Visa",
    label: "Documents de Visa",
    description: "Lettres d'acceptation, invitations, visas antérieurs",
    icon: "✈️",
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    id: "language_test",
    name: "Test de Langue",
    label: "Test de Langue",
    description: "Résultats IELTS, TOEFL, TCF, DELF, etc.",
    icon: "🗣️",
    color: "bg-teal-100 text-teal-800",
  },
  {
    id: "professional_documents",
    name: "Documents Professionnels",
    label: "Documents Professionnels",
    description: "CV, lettres de recommandation, certifications",
    icon: "📋",
    color: "bg-lime-100 text-lime-800",
  },
  {
    id: "travel_documents",
    name: "Documents de Voyage",
    label: "Documents de Voyage",
    description: "Billets d'avion, réservations hôtel, itinéraires",
    icon: "🧳",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "other",
    name: "Autre",
    label: "Autre",
    description: "Tout autre document pertinent",
    icon: "📄",
    color: "bg-gray-100 text-gray-800",
  },
];

export function getCategoryById(id: string): DocumentCategory | undefined {
  return DOCUMENT_CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryLabel(id: string): string {
  const category = getCategoryById(id);
  return category?.label || "Autre";
}

export function getCategoryIcon(id: string): string {
  const category = getCategoryById(id);
  return category?.icon || "📄";
}

export function getCategoryColor(id: string): string {
  const category = getCategoryById(id);
  return category?.color || "bg-gray-100 text-gray-800";
}
