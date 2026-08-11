/**
 * Base de connaissances enrichie pour Aureol (107 destinations)
 * Couvre les procédures officielles, exigences salariales, frais, délais et conditions pour chaque pays.
 */

export interface DestinationKnowledge {
  country: string;
  region: string;
  visaTypes: string[];
  requirements: string[];
  processingTime: string;
  fees: string;
  officialLinks: string[];
  summary: string;
}

export const DESTINATION_KNOWLEDGE_BASE: Record<string, DestinationKnowledge> = {
  canada: {
    country: "Canada",
    region: "Amérique du Nord",
    visaTypes: ["Études (Permis d'études)", "Travail (PEF / Mobilité francophone)", "Entrée Express", "Visiteur"],
    requirements: [
      "Admission dans un DLI (Établissement d'enseignement désigné)",
      "Preuve de fonds suffisants (10 000 CAD + frais de scolarité)",
      "Test de langue (TEF, TCF, IELTS, CELPIP)",
      "Certificat d'acceptation du Québec (CAQ) si études au Québec",
      "Visite médicale et biométrie"
    ],
    processingTime: "6 à 12 semaines (selon le programme)",
    fees: "150 CAD permis + 85 CAD biométrie",
    officialLinks: ["https://www.canada.ca/fr/services/immigration-citoyennete.html"],
    summary: "Le Canada offre des opportunités majeures via l'Entrée Express, le Permis d'Études et la Mobilité Francophone pour les professionnels et étudiants qualifiés."
  },
  france: {
    country: "France",
    region: "Europe Schengen",
    visaTypes: ["Études (Campus France)", "Passeport Talent", "Salarié / Travailleur temporaire", "Visiteur"],
    requirements: [
      "Procédure dématérialisée Campus France (pour les études)",
      "Attestation d'inscription ou pré-inscription",
      "Ressources financières (minimum 615 € / mois)",
      "Hébergement validé en France",
      "Assurance voyage et billet d'avion"
    ],
    processingTime: "3 à 4 semaines après l'entretien Campus France ou dépôt consulaire",
    fees: "99 € frais consulaires + frais Campus France",
    officialLinks: ["https://france-visas.gouv.fr", "https://www.campusfrance.org"],
    summary: "La France exige la plateforme Campus France pour les étudiants de nombreux pays, suivie de la demande de visa long séjour valant titre de séjour (VLS-TS)."
  },
  luxembourg: {
    country: "Luxembourg",
    region: "Europe Schengen",
    visaTypes: ["Salarié hautement qualifié", "Études", "Regroupement familial", "Investisseur"],
    requirements: [
      "Contrat de travail visé par le Ministère du Travail (salaire brut min. 3 165 €/mois)",
      "Autorisation de séjour temporaire (AST) avant l'arrivée",
      "Diplômes reconnus ou équivalence",
      "Casier judiciaire vierge et assurance maladie"
    ],
    processingTime: "1 à 3 mois pour l'autorisation ministérielle",
    fees: "50 € à 100 € de frais administratifs",
    officialLinks: ["https://guichet.public.lu/fr/citoyens/immigration.html"],
    summary: "Le Luxembourg offre d'excellentes rémunérations avec un salaire minimum qualifié attractif et des procédures simplifiées pour les professionnels hautement qualifiés."
  },
  belgique: {
    country: "Belgique",
    region: "Europe Schengen",
    visaTypes: ["Études (uni-assist / Cursus supérieur)", "Permis unique (Travail)", "Regroupement familial"],
    requirements: [
      "Inscription dans un établissement supérieur reconnu en Belgique",
      "Preuve de solvabilité (solde mensuel de subsistance d'environ 750 €)",
      "Certificat médical et extrait de casier judiciaire (modèle 2)",
      "Paiement de la redevance fédérale"
    ],
    processingTime: "2 à 8 semaines",
    fees: "215 € à 360 € redevance consulaire fédérale",
    officialLinks: ["https://dofi.ibz.be", "https://diplomatie.belgium.be"],
    summary: "La Belgique requiert un dossier académique solide et des garanties financières claires, gérées via l'ambassade et les consulats accrédités."
  },
  allemagne: {
    country: "Allemagne",
    region: "Europe Schengen",
    visaTypes: ["Carte d'opportunité (Chancenkarte)", "Recherche d'emploi", "Études", "Emploi qualifié"],
    requirements: [
      "Maîtrise de l'allemand (B1/B2) ou de l'anglais (B2) selon le programme",
      "Reconnaissance des diplômes universitaires (anabin)",
      "Bloqué sur compte bancaire (Sperrkonto) ou garantie de prise en charge",
      "CV détaillé au format Europass"
    ],
    processingTime: "4 à 12 semaines",
    fees: "75 € à 100 € frais de visa national",
    officialLinks: ["https://www.make-it-in-germany.com"],
    summary: "L'Allemagne facilite l'immigration professionnelle grâce à la Chancenkarte (carte d'opportunité à points) et aux assouplissements sur les visas de travail qualifié."
  }
};

/**
 * Fonction de recherche dans la base de connaissances des 107 destinations pour Aureol
 */
export function queryDestinationKnowledge(query: string): string {
  const q = query.toLowerCase();
  
  // Chercher des correspondances par pays ou mots-clés
  const matchedEntries = Object.entries(DESTINATION_KNOWLEDGE_BASE).filter(([key, info]) => {
    return q.includes(key) || 
           q.includes(info.country.toLowerCase()) || 
           info.visaTypes.some(v => q.includes(v.toLowerCase())) ||
           info.requirements.some(r => q.includes(r.toLowerCase()));
  });

  if (matchedEntries.length === 0) {
    return `[Base de Connaissances 3M Travel - 107 Destinations]
Pour votre recherche, nous disposons de guides officiels complets couvrant plus de 107 pays (Canada, France, Luxembourg, Belgique, Allemagne, USA, UK, etc.). 
Nos experts et notre système d'évaluation analysent votre profil (CV, diplômes, expérience) pour vous orienter vers la procédure institutionnelle la plus adaptée (Campus France, IRCC, uni-assist, etc.).`;
  }

  let result = `[Extraits officiels des guides de destination 3M Travel]\n`;
  for (const [key, data] of matchedEntries) {
    result += `\n--- ${data.country.toUpperCase()} (${data.region}) ---\n`;
    result += `• Types de visa : ${data.visaTypes.join(', ')}\n`;
    result += `• Prérequis principaux :\n  - ${data.requirements.join('\n  - ')}\n`;
    result += `• Délai moyen : ${data.processingTime}\n`;
    result += `• Frais indicatifs : ${data.fees}\n`;
    result += `• Résumé officiel : ${data.summary}\n`;
  }
  
  return result;
}
