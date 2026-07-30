import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, MapPin, AlertCircle } from "lucide-react";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";

// Checklist documents par pays et type de visa
const DOCUMENTS_BY_COUNTRY_VISA: Record<string, Record<string, string[]>> = {
  "Canada": {
    "Étudiant": [
      "Passeport valide",
      "Lettre d'acceptation de l'établissement",
      "Preuve de ressources financières",
      "Relevé de notes",
      "Certificat de langue (IELTS/TOEFL)",
      "Lettre de motivation"
    ],
    "Travail": [
      "Passeport valide",
      "Offre d'emploi",
      "Diplômes et certificats",
      "Preuve d'expérience professionnelle",
      "Lettre de motivation",
      "Preuve de ressources financières"
    ],
    "Résidence": [
      "Passeport valide",
      "Preuve d'expérience professionnelle",
      "Diplômes",
      "Lettre de motivation",
      "Preuve de ressources financières",
      "Certificat de police"
    ]
  },
  "USA": {
    "Étudiant": [
      "Passeport valide",
      "Formulaire I-20",
      "Preuve de ressources financières",
      "Relevé de notes",
      "Certificat de langue (TOEFL)",
      "Lettre de motivation"
    ],
    "Travail": [
      "Passeport valide",
      "Offre d'emploi",
      "Diplômes",
      "Preuve d'expérience",
      "Lettre de motivation",
      "Preuve de ressources financières"
    ],
    "Tourisme": [
      "Passeport valide",
      "Preuve de ressources financières",
      "Itinéraire de voyage",
      "Réservations hôtel",
      "Lettre d'invitation (si applicable)"
    ]
  },
  "France": {
    "Étudiant": [
      "Passeport valide",
      "Lettre d'acceptation",
      "Preuve de ressources financières",
      "Relevé de notes",
      "Certificat de langue (TCF/DELF)",
      "Lettre de motivation"
    ],
    "Travail": [
      "Passeport valide",
      "Offre d'emploi",
      "Diplômes",
      "Preuve d'expérience",
      "Lettre de motivation",
      "Preuve de ressources financières"
    ],
    "Tourisme": [
      "Passeport valide",
      "Preuve de ressources financières",
      "Réservations hôtel",
      "Itinéraire de voyage",
      "Assurance voyage"
    ]
  },
  "Royaume-Uni": {
    "Étudiant": [
      "Passeport valide",
      "Lettre d'acceptation (CAS)",
      "Preuve de ressources financières",
      "Relevé de notes",
      "Certificat de langue (IELTS)",
      "Lettre de motivation"
    ],
    "Travail": [
      "Passeport valide",
      "Visa sponsorship",
      "Diplômes",
      "Preuve d'expérience",
      "Lettre de motivation",
      "Preuve de ressources financières"
    ]
  },
  "Australie": {
    "Étudiant": [
      "Passeport valide",
      "Lettre d'acceptation (CoE)",
      "Preuve de ressources financières",
      "Relevé de notes",
      "Certificat de langue (IELTS)",
      "Lettre de motivation"
    ],
    "Travail": [
      "Passeport valide",
      "Offre d'emploi",
      "Diplômes",
      "Preuve d'expérience",
      "Lettre de motivation",
      "Preuve de ressources financières"
    ]
  }
};

interface EvaluationResultProps {
  country?: string;
  visaType?: string;
  score?: number;
  verdict?: string;
}

export default function EvaluationResult() {
  const { isAuthenticated } = useCandidateAuth();
  const [location, setLocation] = useLocation();
  const [country, setCountry] = useState("Canada");
  const [visaType, setVisaType] = useState("Étudiant");
  const [checkedDocuments, setCheckedDocuments] = useState<Record<string, boolean>>({});
  const [showOnlineOption, setShowOnlineOption] = useState(false);
  const [showAgencyOption, setShowAgencyOption] = useState(false);

  // Récupérer les documents requis
  const requiredDocuments = DOCUMENTS_BY_COUNTRY_VISA[country]?.[visaType] || [];

  // Calculer le pourcentage de documents complétés
  const completedCount = Object.values(checkedDocuments).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / requiredDocuments.length) * 100);

  const handleDocumentCheck = (doc: string) => {
    setCheckedDocuments(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const handleDepositOnline = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    setLocation("/submit-documents");
  };

  const handleScheduleAgency = () => {
    setLocation("/schedule-agency");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Résultat de Votre Évaluation</h1>
          <p className="text-lg text-gray-600">Voici la liste des documents requis pour votre dossier</p>
        </div>

        {/* Selection Pays et Type Visa */}
        <Card>
          <CardHeader>
            <CardTitle>Sélectionnez votre destination et type de visa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pays</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(DOCUMENTS_BY_COUNTRY_VISA).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type de Visa</label>
                <select
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.keys(DOCUMENTS_BY_COUNTRY_VISA[country] || {}).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist des Documents Requis</CardTitle>
                <CardDescription>
                  {country} - Visa {visaType}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg">
                {completionPercentage}%
              </Badge>
            </div>
            {/* Barre de progression */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredDocuments.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => handleDocumentCheck(doc)}
                >
                  <input
                    type="checkbox"
                    checked={checkedDocuments[doc] || false}
                    onChange={() => handleDocumentCheck(doc)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className={`flex-1 ${checkedDocuments[doc] ? "line-through text-gray-500" : "text-gray-700"}`}>
                    {doc}
                  </span>
                  {checkedDocuments[doc] && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions - Deux Options */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Comment souhaitez-vous procéder?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Vous pouvez déposer vos documents entièrement en ligne ou prendre rendez-vous dans l'une de nos agences physiques.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: En Ligne */}
              <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">📱 Déposer en Ligne</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Téléchargez vos documents directement depuis chez vous. Rapide, sécurisé et sans déplacement.
                  </p>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>✓ Aucun déplacement requis</li>
                    <li>✓ Accès 24h/24</li>
                    <li>✓ Suivi en temps réel</li>
                    <li>✓ Support par email</li>
                  </ul>
                  <Button
                    onClick={handleDepositOnline}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Déposer mes documents en ligne →
                  </Button>
                </CardContent>
              </Card>

              {/* Option 2: En Agence */}
              <Card className="border-2 border-orange-200 hover:border-orange-400 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">🏢 Rendez-vous en Agence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Rencontrez nos experts en personne dans l'une de nos agences.
                  </p>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li>✓ Conseil personnalisé</li>
                    <li>✓ Vérification immédiate</li>
                    <li>✓ Support direct</li>
                    <li>✓ Agences à Douala & Yaoundé</li>
                  </ul>
                  <Button
                    onClick={handleScheduleAgency}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Prendre rendez-vous →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Info Agences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Nos Agences
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Douala</h3>
              <p className="text-sm text-gray-700 mb-2">
                Adresse: [À confirmer]
              </p>
              <p className="text-sm text-gray-700">
                Horaires: Lun-Ven 09:00-17:00
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Yaoundé</h3>
              <p className="text-sm text-gray-700 mb-2">
                Adresse: [À confirmer]
              </p>
              <p className="text-sm text-gray-700">
                Horaires: Lun-Ven 09:00-17:00
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Supplémentaire */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Besoin d'aide?</p>
                <p className="text-sm text-yellow-800">
                  Contactez-nous via WhatsApp pour toute question sur les documents requis ou pour prendre rendez-vous immédiatement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
