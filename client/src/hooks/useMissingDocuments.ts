import { useMemo } from 'react';

export interface ApplicationData {
  projectType?: string;
  academicLevel?: string;
  employmentStatus?: string;
  destinationCountry?: string;
}

export interface UploadedDocument {
  fileType: string;
  status: string;
}

/**
 * Détermine les documents requis en fonction du type de projet
 */
function getRequiredDocuments(application: ApplicationData): string[] {
  const required = [
    'Passeport',
    'Photo d\'identité',
    'Extrait de naissance',
  ];

  // Documents spécifiques au type de projet
  if (application.projectType === 'etudes') {
    required.push('Diplôme/Certificat');
    required.push('Relevé de notes');
    required.push('Lettre d\'admission');
  } else if (application.projectType === 'travail') {
    required.push('CV');
    required.push('Lettre de motivation');
    required.push('Contrat de travail ou offre');
  } else if (application.projectType === 'tourisme') {
    required.push('Preuve de moyens financiers');
    required.push('Itinéraire de voyage');
  }

  // Documents pour certains pays
  if (application.destinationCountry === 'Canada') {
    required.push('Certificat de police');
    required.push('Examen médical');
  }

  return required;
}

/**
 * Détecte les documents manquants
 */
export function useMissingDocuments(
  application: ApplicationData | null,
  uploadedDocuments: UploadedDocument[]
): string[] {
  return useMemo(() => {
    if (!application) return [];

    const required = getRequiredDocuments(application);
    const uploadedTypes = uploadedDocuments.map(doc => doc.fileType.toLowerCase());

    // Mapper les types de fichiers aux noms de documents
    const documentMap: Record<string, string[]> = {
      passeport: ['passeport'],
      photo: ['photo', 'photo_identite'],
      naissance: ['naissance', 'extrait_naissance'],
      diplome: ['diplome', 'certificat'],
      notes: ['notes', 'releve_notes', 'transcript'],
      admission: ['admission', 'lettre_admission'],
      cv: ['cv'],
      motivation: ['motivation', 'lettre_motivation'],
      travail: ['travail', 'contrat_travail', 'offre'],
      financier: ['financier', 'preuve_moyens', 'compte_bancaire'],
      itineraire: ['itineraire', 'voyage'],
      police: ['police', 'certificat_police'],
      medical: ['medical', 'examen_medical'],
    };

    return required.filter(doc => {
      const docKey = doc.toLowerCase();
      return !uploadedTypes.some(uploaded => {
        // Chercher si le document est dans la liste des fichiers uploadés
        for (const [key, aliases] of Object.entries(documentMap)) {
          if (docKey.includes(key) || aliases.some(alias => uploaded.includes(alias))) {
            return true;
          }
        }
        return false;
      });
    });
  }, [application, uploadedDocuments]);
}

/**
 * Calcule le pourcentage de complétude du dossier
 */
export function useDocumentCompleteness(
  application: ApplicationData | null,
  uploadedDocuments: UploadedDocument[]
): number {
  return useMemo(() => {
    if (!application) return 0;

    const required = getRequiredDocuments(application);
    if (required.length === 0) return 100;

    const missing = useMissingDocuments(application, uploadedDocuments);
    return Math.round(((required.length - missing.length) / required.length) * 100);
  }, [application, uploadedDocuments]);
}
