/**
 * ProcedureDetailModal — Étape 1 du tunnel de conversion
 * Affiche la fiche complète d'une procédure avant le formulaire d'inscription.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Clock, DollarSign, ArrowRight, FileText,
  AlertTriangle, Info, Briefcase, GraduationCap, Eye, Home,
  X, Shield
} from "lucide-react";

// ─── Types (dupliqués ici pour éviter les imports circulaires) ─────────────────
export interface ProcedureInfo {
  id: string;
  type: "travail" | "etudes" | "visiteur" | "residence";
  title: string;
  budget: string;
  delai: string;
  points: string[];
  destination: string;  // Canada, Luxembourg, etc.
  flag: string;
}

// ─── Données enrichies par procédure ─────────────────────────────────────────
const PROCEDURE_DETAILS: Record<string, {
  description: string;
  prerequisites: string[];
  documents: string[];
  budgetDetail: string;
  processSteps: string[];
}> = {
  // Canada
  "ca-t1": {
    description: "Express Entry est le système de gestion des demandes de résidence permanente du Canada pour les travailleurs qualifiés. C'est la voie la plus rapide vers la résidence permanente canadienne.",
    prerequisites: [
      "Diplôme universitaire (Bac+3 minimum) ou équivalent reconnu par l'IQAS/WES",
      "Minimum 1 an d'expérience professionnelle dans un métier qualifié (CNP 0, A ou B)",
      "Score IELTS ou TEF Canada — minimum CLB 7 en anglais ou NCLC 7 en français",
      "Fonds suffisants pour s'établir (preuve de liquidités selon la taille de la famille)",
      "Casier judiciaire vierge — certificat de bonne vie et mœurs",
    ],
    documents: [
      "Passeport en cours de validité (min. 2 ans de validité restante)",
      "Curriculum Vitae détaillé (expériences, postes, dates, employeurs)",
      "Diplôme le plus élevé + relevés de notes officiels",
      "Résultats IELTS/TEF Canada (moins de 2 ans)",
      "Lettres de référence des employeurs précédents",
      "Relevés bancaires des 6 derniers mois",
    ],
    budgetDetail: "Frais gouvernementaux : ~1 500 CAD (≈ 700 000 FCFA) + frais d'établissement recommandés : 12 960 CAD (≈ 6 000 000 FCFA) pour une personne seule",
    processSteps: [
      "Évaluation de votre profil CRS par nos conseillers",
      "Création du profil Express Entry dans le système IRCC",
      "Attente d'une Invitation à Présenter une Demande (ITA)",
      "Constitution du dossier complet (90 jours après ITA)",
      "Traitement par IRCC (6 mois en moyenne)",
      "Obtention de la résidence permanente",
    ],
  },
  "ca-t2": {
    description: "Le Programme des Candidats des Provinces (PNP) permet aux provinces canadiennes de sélectionner des immigrants selon leurs besoins économiques spécifiques. La nomination provinciale ajoute +600 points CRS.",
    prerequisites: [
      "Diplôme universitaire ou formation professionnelle reconnue",
      "Expérience professionnelle dans un secteur en demande dans la province cible",
      "Niveau de langue selon les exigences provinciales (variable)",
      "Intention sincère de s'établir dans la province qui vous nomme",
      "Offre d'emploi dans certains flux provinciaux (recommandé)",
    ],
    documents: [
      "Passeport en cours de validité",
      "CV détaillé avec historique professionnel complet",
      "Diplômes et attestations de formation",
      "Preuves d'expérience professionnelle (contrats, fiches de paie)",
      "Résultats de tests linguistiques",
      "Lettre de motivation pour la province choisie",
    ],
    budgetDetail: "Frais de nomination provinciale : 500–2 000 CAD (variable) + frais fédéraux RP : ~1 500 CAD",
    processSteps: [
      "Identification de la province la plus adaptée à votre profil",
      "Soumission de la manifestation d'intérêt provinciale (EOI)",
      "Réception de l'invitation provinciale",
      "Dépôt de la demande de nomination provinciale",
      "Création du profil Express Entry avec nomination (+600 pts CRS)",
      "Demande de résidence permanente fédérale",
    ],
  },
  "ca-t3": {
    description: "Le volet Métiers Spécialisés cible les travailleurs des secteurs en pénurie : soudure, électricité, plomberie, transport, logistique. Moins de compétition que Express Entry classique.",
    prerequisites: [
      "Formation professionnelle ou apprentissage dans un métier spécialisé",
      "Minimum 2 ans d'expérience dans le métier (dans les 5 dernières années)",
      "Niveau de langue CLB 5 minimum (moins exigeant qu'Express Entry classique)",
      "Offre d'emploi canadienne ou certification professionnelle reconnue",
    ],
    documents: [
      "Passeport en cours de validité",
      "Diplôme ou certificat de formation professionnelle",
      "Attestations d'expérience professionnelle",
      "Résultats IELTS/TEF (niveau B1 minimum)",
      "Certification professionnelle si disponible",
    ],
    budgetDetail: "Frais gouvernementaux : ~1 500 CAD + frais d'établissement selon la province",
    processSteps: [
      "Évaluation de votre métier dans la liste des professions éligibles",
      "Reconnaissance des qualifications par l'organisme provincial",
      "Soumission du profil Express Entry (volet Métiers Spécialisés)",
      "Invitation à présenter une demande",
      "Traitement de la demande de résidence permanente",
    ],
  },
  "ca-e1": {
    description: "Le permis d'études canadien permet d'étudier dans les meilleures universités du monde. Le Canada offre des voies directes vers la résidence permanente après les études.",
    prerequisites: [
      "Lettre d'acceptation d'un établissement d'enseignement désigné (EED)",
      "Preuve de ressources financières suffisantes (frais de scolarité + 10 000 CAD/an)",
      "Intention de quitter le Canada à la fin des études (ou plan d'immigration légal)",
      "Casier judiciaire vierge",
      "Examen médical si séjour > 6 mois",
    ],
    documents: [
      "Passeport en cours de validité",
      "Lettre d'acceptation officielle de l'université/collège",
      "Relevés bancaires prouvant les fonds disponibles",
      "Diplômes et relevés de notes antérieurs",
      "Lettre de motivation (pourquoi le Canada, pourquoi cet établissement)",
    ],
    budgetDetail: "Frais de scolarité : 15 000–35 000 CAD/an selon l'établissement + frais de vie : 10 000–15 000 CAD/an",
    processSteps: [
      "Sélection de l'établissement et du programme",
      "Soumission de la candidature universitaire",
      "Réception de la lettre d'acceptation",
      "Demande de permis d'études en ligne",
      "Traitement (8–12 semaines)",
      "Arrivée au Canada et inscription",
    ],
  },
  // Luxembourg
  "lu-t1": {
    description: "Le Luxembourg recrute massivement des travailleurs qualifiés via le MAEE (Ministère des Affaires Étrangères). Le salaire minimum est de 3 165 EUR/mois net, parmi les plus élevés d'Europe.",
    prerequisites: [
      "Contrat de travail signé avec un employeur luxembourgeois (obligatoire)",
      "Diplôme reconnu dans le secteur d'activité concerné",
      "Casier judiciaire vierge (extrait de moins de 3 mois)",
      "Certificat médical de bonne santé",
      "Niveau de français B2 minimum (le Luxembourg est officiellement trilingue)",
    ],
    documents: [
      "Passeport en cours de validité (min. 6 mois après la date d'expiration du visa)",
      "Contrat de travail signé par l'employeur luxembourgeois",
      "Diplôme le plus élevé + traduction officielle si nécessaire",
      "Extrait de casier judiciaire (moins de 3 mois)",
      "Certificat médical",
      "Justificatif de logement au Luxembourg",
    ],
    budgetDetail: "Salaire minimum légal : 3 165 EUR/mois net. Frais de visa : 80 EUR. Frais de déménagement : 500 000–1 500 000 FCFA",
    processSteps: [
      "Identification et signature du contrat avec l'employeur",
      "Dépôt du dossier au MAEE Luxembourg",
      "Traitement par l'ADEM (Agence pour le Développement de l'Emploi)",
      "Obtention de l'autorisation de séjour et de travail",
      "Visa D délivré par l'Ambassade du Luxembourg",
      "Installation et enregistrement à la commune",
    ],
  },
  "lu-t2": {
    description: "Le Luxembourg offre un programme spécial pour les professions de santé (infirmiers, médecins, kinésithérapeutes) avec des salaires très compétitifs et une reconnaissance facilitée des diplômes africains.",
    prerequisites: [
      "Diplôme en sciences de la santé reconnu par l'Ordre des Médecins ou Infirmiers du Luxembourg",
      "Expérience professionnelle de minimum 2 ans",
      "Niveau de français B2 (obligatoire pour les soins aux patients)",
      "Casier judiciaire vierge",
      "Aptitude physique et mentale certifiée",
    ],
    documents: [
      "Passeport en cours de validité",
      "Diplôme de santé + relevés de notes",
      "Attestation d'inscription à l'Ordre professionnel du pays d'origine",
      "Preuves d'expérience professionnelle",
      "Résultats d'un test de langue française (DELF B2 minimum)",
    ],
    budgetDetail: "Salaires santé Luxembourg : 3 500–6 000 EUR/mois selon spécialité et expérience",
    processSteps: [
      "Reconnaissance du diplôme par l'autorité compétente luxembourgeoise",
      "Signature du contrat avec un hôpital ou clinique",
      "Dépôt du dossier au MAEE",
      "Obtention de l'autorisation d'exercer",
      "Visa D et installation",
    ],
  },
  // Pologne
  "pl-t1": {
    description: "La Pologne recrute massivement des travailleurs étrangers dans l'industrie, le BTP et les services. Les salaires varient de 25,36 à 25,50 PLN/heure avec hébergement souvent inclus.",
    prerequisites: [
      "Formation professionnelle ou expérience dans le secteur ciblé",
      "Aptitude physique pour les postes industriels",
      "Casier judiciaire vierge",
      "Contrat de travail avec employeur polonais (fourni par 3M Travel)",
      "Visa de travail D délivré par l'Ambassade de Pologne",
    ],
    documents: [
      "Passeport en cours de validité",
      "CV en polonais ou en anglais",
      "Diplôme ou certificat de formation",
      "Attestations d'expérience professionnelle",
      "Photos d'identité récentes",
    ],
    budgetDetail: "Salaire : 25,36–25,50 PLN/heure (≈ 6 USD/h). Hébergement souvent inclus par l'employeur. Frais de départ : 800 000–1 200 000 FCFA",
    processSteps: [
      "Sélection du profil et mise en relation avec l'employeur polonais",
      "Signature du contrat de travail",
      "Demande de visa de travail D à l'Ambassade de Pologne à Yaoundé",
      "Traitement (4–8 semaines)",
      "Départ et installation en Pologne",
    ],
  },
  // Europe Schengen
  "eu-t1": {
    description: "La Carte Bleue Européenne (EU Blue Card) est le visa de travail premium pour les professionnels hautement qualifiés souhaitant s'installer dans un pays de l'Union Européenne.",
    prerequisites: [
      "Diplôme universitaire (Bac+3 minimum) reconnu dans le pays cible",
      "Offre d'emploi d'un employeur européen avec salaire ≥ 1,5× le salaire moyen national",
      "Expérience professionnelle de minimum 3 ans dans le domaine",
      "Niveau de langue du pays cible (variable selon le pays)",
    ],
    documents: [
      "Passeport en cours de validité",
      "Offre d'emploi signée avec mention du salaire",
      "Diplôme universitaire + traduction certifiée",
      "CV détaillé",
      "Preuves d'expérience professionnelle",
    ],
    budgetDetail: "Frais de visa : 75–150 EUR selon le pays. Salaire minimum Blue Card : 56 400 EUR/an en Allemagne (2024)",
    processSteps: [
      "Identification de l'employeur et signature du contrat",
      "Dépôt de la demande de Carte Bleue Européenne",
      "Traitement par les autorités d'immigration (2–3 mois)",
      "Délivrance de la Carte Bleue (validité 4 ans renouvelable)",
    ],
  },
  "eu-t2": {
    description: "La Chancenkarte (Carte des Chances) est le nouveau visa allemand permettant aux professionnels qualifiés de venir chercher un emploi en Allemagne pendant 1 an, sans offre préalable.",
    prerequisites: [
      "Diplôme universitaire reconnu ou formation professionnelle équivalente",
      "Niveau d'allemand B1 minimum (ou anglais B2 pour les secteurs IT)",
      "Minimum 2 ans d'expérience professionnelle",
      "Preuve de ressources financières pour 1 an (min. 12 000 EUR)",
      "Casier judiciaire vierge",
    ],
    documents: [
      "Passeport en cours de validité",
      "Diplôme reconnu par l'anabin (base de données allemande)",
      "Résultats de test d'allemand (Goethe Institut B1 minimum)",
      "CV en allemand ou en anglais",
      "Relevés bancaires prouvant les fonds disponibles",
    ],
    budgetDetail: "Frais de visa : 75 EUR. Budget de subsistance recommandé : 12 000–15 000 EUR pour la période de recherche d'emploi",
    processSteps: [
      "Reconnaissance du diplôme par l'anabin ou l'IQ Network",
      "Obtention du niveau d'allemand requis",
      "Dépôt de la demande à l'Ambassade d'Allemagne",
      "Arrivée en Allemagne et recherche d'emploi active",
      "Conversion en visa de travail après signature du contrat",
    ],
  },
};

/** Données par défaut pour les procédures sans fiche détaillée */
function getDefaultDetails(proc: ProcedureInfo) {
  return {
    description: `Programme d'immigration vers ${proc.destination} — ${proc.title}. Nos conseillers vous accompagnent de A à Z dans votre démarche.`,
    prerequisites: [
      "Passeport en cours de validité (minimum 6 mois de validité restante)",
      "Casier judiciaire vierge (extrait de moins de 3 mois)",
      "Diplôme ou certification professionnelle dans votre domaine",
      "Preuves d'expérience professionnelle (contrats, attestations)",
      "Ressources financières suffisantes pour l'installation",
    ],
    documents: [
      "Passeport en cours de validité",
      "Curriculum Vitae (CV) mis à jour",
      "Diplôme le plus élevé + relevés de notes",
      "Extrait de casier judiciaire",
      "Photos d'identité récentes",
    ],
    budgetDetail: proc.budget,
    processSteps: [
      "Évaluation de votre profil par nos conseillers",
      "Constitution du dossier complet",
      "Soumission aux autorités compétentes",
      "Suivi et traitement de votre demande",
      "Obtention du visa ou titre de séjour",
    ],
  };
}

// ─── Composant Principal ──────────────────────────────────────────────────────
interface ProcedureDetailModalProps {
  procedure: ProcedureInfo | null;
  open: boolean;
  onClose: () => void;
  onContinue: (procedure: ProcedureInfo) => void;
}

const TYPE_CONFIG = {
  travail:   { label: "Travail",    color: "bg-blue-100 text-blue-700",   icon: Briefcase },
  etudes:    { label: "Études",     color: "bg-purple-100 text-purple-700", icon: GraduationCap },
  visiteur:  { label: "Visiteur",   color: "bg-green-100 text-green-700", icon: Eye },
  residence: { label: "Résidence",  color: "bg-amber-100 text-amber-700", icon: Home },
};

export default function ProcedureDetailModal({ procedure, open, onClose, onContinue }: ProcedureDetailModalProps) {
  if (!procedure) return null;

  const details = PROCEDURE_DETAILS[procedure.id] ?? getDefaultDetails(procedure);
  const typeConf = TYPE_CONFIG[procedure.type];
  const TypeIcon = typeConf.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{procedure.flag}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white`}>
                  <TypeIcon className="w-3 h-3" />
                  {typeConf.label}
                </span>
              </div>
              <h2 className="text-xl font-black leading-tight">{procedure.title}</h2>
              <p className="text-blue-200 text-sm mt-1">{procedure.destination}</p>
            </div>
          </div>

          {/* Métriques clés */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Budget global estimé
              </div>
              <div className="font-bold text-white text-sm">{procedure.budget}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                Durée estimée
              </div>
              <div className="font-bold text-white text-sm">{procedure.delai}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-800 text-sm">À propos de ce programme</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{details.description}</p>
          </div>

          {/* Prérequis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="font-bold text-gray-800 text-sm">Prérequis obligatoires</h3>
            </div>
            <ul className="space-y-2">
              {details.prerequisites.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Documents requis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-800 text-sm">Pièces justificatives à préparer</h3>
            </div>
            <ul className="space-y-1.5">
              {details.documents.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>

          {/* Étapes du processus */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-gray-800 text-sm">Étapes du processus</h3>
            </div>
            <div className="space-y-2">
              {details.processSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rappel frais 3M */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Frais d'ouverture de dossier 3M Travel</p>
                <p className="text-sm text-amber-700 mt-1">
                  <strong>65 000 FCFA</strong> — frais obligatoires et non remboursables pour l'ouverture et le traitement de votre dossier par nos conseillers. Ces frais couvrent l'évaluation complète, la constitution du dossier et le suivi jusqu'à l'obtention du visa.
                </p>
              </div>
            </div>
          </div>

          {/* Bouton CTA */}
          <div className="pt-2">
            <Button
              onClick={() => onContinue(procedure)}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 text-base rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Continuer vers le formulaire d'inscription
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Paiement sécurisé · MTN MoMo · Orange Money · Visa/Mastercard
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
