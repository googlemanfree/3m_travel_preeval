import { useState, useMemo } from 'react';
import { Search, ChevronDown, MessageCircle, Globe, Sparkles, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

interface Evisa {
  country: string;
  flag: string;
  region: string;
  type: string;
  duration: string;
  delay: string;
  docs: string;
  fee: string;
  note: string;
}

const fullEvisasDatabase: Evisa[] = [
  // AFRIQUE
  { country: "Égypte", flag: "🇪🇬", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "2-5 jours", docs: "Passeport (+6 mois), Photo d'identité, Réservation hôtel", fee: "25 USD", note: "Entrée simple ou multiple disponible." },
  { country: "Kenya", flag: "🇰🇪", region: "Afrique", type: "eTA Électronique", duration: "90 jours", delay: "24h-72h", docs: "Passeport, Billet d'avion A/R, Justificatif d'hébergement", fee: "34 USD", note: "Obligatoire pour tous les voyageurs avant l'embarquement." },
  { country: "Tanzanie & Zanzibar", flag: "🇹🇿", region: "Afrique", type: "e-Visa Touristique", duration: "30-90 jours", delay: "3-5 jours", docs: "Passeport, Photo, Billet d'avion retour", fee: "50 USD", note: "Valable pour le continent et l'île de Zanzibar." },
  { country: "Maroc", flag: "🇲🇦", region: "Afrique", type: "e-Visa (AEVM)", duration: "30 jours", delay: "24h-72h", docs: "Passeport, Copie Titre de séjour / Visa valide, Photo", fee: "770 MAD", note: "Accessible selon statut consulaire / titre résident." },
  { country: "Rwanda", flag: "🇷🇼", region: "Afrique", type: "e-Visa Entrée", duration: "30 jours", delay: "2-3 jours", docs: "Passeport, Photo fond blanc, Lettre d'invitation/Hôtel", fee: "50 USD", note: "Approbation préalable envoyée par mail." },
  { country: "Éthiopie", flag: "🇪🇹", region: "Afrique", type: "e-Visa Tourisme", duration: "30-90 jours", delay: "1-3 jours", docs: "Passeport, Photo récente", fee: "82 USD", note: "Arrivée exclusivement via l'Aéroport d'Addis-Abeba Bole." },
  { country: "Gabon", flag: "🇬🇦", region: "Afrique", type: "e-Visa Entrée", duration: "30-90 jours", delay: "24h-72h", docs: "Passeport, Autorisation d'entrée, Carnet de vaccination", fee: "85 EUR", note: "Délivrance de l'autorisation d'atterrissage." },
  { country: "Côte d'Ivoire", flag: "🇨🇮", region: "Afrique", type: "e-Visa Snedai", duration: "90 jours", delay: "48h", docs: "Passeport, Attestation d'hébergement, Carnet Jaune", fee: "73 EUR", note: "Pré-enrôlement en ligne et retrait à l'Aéroport d'Abidjan." },
  { country: "Togo", flag: "🇹🇬", region: "Afrique", type: "e-Visa Voyage", duration: "15-90 jours", delay: "24h-48h", docs: "Passeport, Billet A/R, Photo", fee: "35 000 XOF", note: "Portail e-Visa Togo officiel." },
  { country: "Ouganda", flag: "🇺🇬", region: "Afrique", type: "e-Visa Touristique", duration: "90 jours", delay: "2-4 jours", docs: "Passeport, Photo, Carnet de vaccination", fee: "50 USD", note: "Carnet de fièvre jaune obligatoire." },
  { country: "Bénin", flag: "🇧🇯", region: "Afrique", type: "e-Visa Électronique", duration: "30-90 jours", delay: "24h-48h", docs: "Passeport, Billet d'avion", fee: "50 EUR", note: "100% numérique sans déplacement." },
  { country: "Zambie & Zimbabwe", flag: "🇿🇲", region: "Afrique", type: "Kaza Univisa", duration: "30 jours", delay: "3 jours", docs: "Passeport, Photo, Billet d'avion", fee: "50 USD", note: "Permet de circuler librement entre la Zambie et le Zimbabwe." },
  { country: "Madagascar", flag: "🇲🇬", region: "Afrique", type: "e-Visa Séjour", duration: "30-60 jours", delay: "24h", docs: "Passeport, Billet A/R", fee: "35 EUR", note: "Enregistrement en ligne préalable." },
  { country: "Cap-Vert", flag: "🇨🇻", region: "Afrique", type: "Autorisation EASE", duration: "30 jours", delay: "24h", docs: "Passeport, Dates de séjour", fee: "31 EUR", note: "Pré-enregistrement obligatoire avant le vol." },
  { country: "Djibouti", flag: "🇩🇯", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "2-3 jours", docs: "Passeport (+6 mois), Photo, Réservation d'hôtel", fee: "31 USD", note: "Délivré pour raisons touristiques ou d'affaires." },
  { country: "Guinée", flag: "🇬🇳", region: "Afrique", type: "e-Visa Entrée", duration: "90 jours", delay: "24h-72h", docs: "Passeport, Photo, Extrait de casier judiciaire", fee: "80 USD", note: "Lettre d'accord délivrée en ligne." },
  { country: "Lesotho", flag: "🇱🇸", region: "Afrique", type: "e-Visa Touristique", duration: "44 jours", delay: "3 jours", docs: "Passeport, Relevé bancaire, Réservation hôtel", fee: "150 USD", note: "Dépôt complet sur le portail officiel." },
  { country: "Sierra Leone", flag: "🇸🇱", region: "Afrique", type: "e-Visa Séjour", duration: "30 jours", delay: "24h-48h", docs: "Passeport, Carnet de vaccination, Photo", fee: "80 USD", note: "Autorisation numérique d'entrée." },
  { country: "Soudan du Sud", flag: "🇸🇸", region: "Afrique", type: "e-Visa Entrée", duration: "30 jours", delay: "3-5 jours", docs: "Passeport, Lettre d'invitation, Photo", fee: "100 USD", note: "Approbation préalable requise." },
  { country: "Mozambique", flag: "🇲🇿", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "2-4 jours", docs: "Passeport, Confirmation d'hôtel, Billet A/R", fee: "50 USD", note: "Soumission directe sur le portail de la migration." },
  { country: "Malawi", flag: "🇲🇼", region: "Afrique", type: "e-Visa Touristique", duration: "30-90 jours", delay: "3 jours", docs: "Passeport, Photo, Réservation hébergement", fee: "50 USD", note: "Délivré sous forme de document PDF à imprimer." },
  { country: "Angola", flag: "🇦🇴", region: "Afrique", type: "e-Visa Pré-autorisation", duration: "30 jours", delay: "3-5 jours", docs: "Passeport, Relevé bancaire, Carnet Jaune", fee: "120 USD", note: "Pré-approbation avec paiement à l'arrivée." },

  // ASIE & MOYEN-ORIENT
  { country: "Émirats Arabes Unis (Dubaï)", flag: "🇦🇪", region: "Asie", type: "e-Visa Tourisme", duration: "30 / 60 jours", delay: "24h-48h", docs: "Scan Passeport haute définition, Photo d'identité couleur", fee: "130 USD", note: "Délivrance garantie via sponsor agréé." },
  { country: "Arabie Saoudite", flag: "🇸🇦", region: "Asie", type: "e-Visa Umrah / Tourisme", duration: "90 jours", delay: "24h-48h", docs: "Passeport, Photo d'identité, Assurance santé", fee: "140 USD", note: "Valable pour la réalisation de l'Oumrah et le tourisme." },
  { country: "Turquie", flag: "🇹🇷", region: "Asie", type: "e-Visa Consulaire", duration: "30 jours", delay: "24h", docs: "Passeport, Visa/Titre de séjour Schengen, US ou UK valide", fee: "60 USD", note: "Sous réserve d'un visa support éligible." },
  { country: "Inde", flag: "🇮🇳", region: "Asie", type: "e-Visa Tourisme / Business", duration: "30j à 1 an", delay: "3-5 jours", docs: "Passeport, Photo, Carte de visite (Business)", fee: "25 à 80 USD", note: "Formulaire détaillé de renseignements personnels." },
  { country: "Viêt Nam", flag: "🇻🇳", region: "Asie", type: "e-Visa Électronique", duration: "90 jours", delay: "3-5 jours", docs: "Passeport, Photo 4x6, Adresses d'hébergement", fee: "25 USD", note: "Entrées simples ou multiples sur le territoire." },
  { country: "Thaïlande", flag: "🇹🇭", region: "Asie", type: "e-Visa Touristique / DTV", duration: "60 jours / 5 ans", delay: "3-5 jours", docs: "Passeport, Relevé de compte bancaire, Billet A/R", fee: "40 USD", note: "Soumission dossier sur le portail Thai E-Visa." },
  { country: "Cambodge", flag: "🇰🇭", region: "Asie", type: "e-Visa Touristique", duration: "30 jours", delay: "3 jours", docs: "Passeport, Photo récente", fee: "36 USD", note: "Accepté dans la plupart des aéroports et postes terrestres." },
  { country: "Indonésie (Bali)", flag: "🇮🇩", region: "Asie", type: "e-VOA Touristique", duration: "30 jours", delay: "Instantané", docs: "Passeport (+6 mois), Billet de sortie du territoire", fee: "35 USD", note: "Prolongeable une fois de 30 jours supplémentaires." },
  { country: "Qatar", flag: "🇶🇦", region: "Asie", type: "e-Visa Hayya", duration: "30 jours", delay: "24h-48h", docs: "Passeport, Réservation d'hôtel ou hébergement hôte", fee: "100 QAR", note: "Délivré via l'application officielle Hayya." },
  { country: "Oman", flag: "🇴🇲", region: "Asie", type: "e-Visa Électronique", duration: "10-30 jours", delay: "24h", docs: "Passeport, Photo fond blanc", fee: "20 OMR", note: "Délivrance directe par la police royale d'Oman." },
  { country: "Sri Lanka", flag: "🇱🇰", region: "Asie", type: "ETA Électronique", duration: "30 jours", delay: "24h-48h", docs: "Passeport, Détails du vol", fee: "50 USD", note: "Autorisation de voyage électronique ETA." },
  { country: "Ouzbékistan", flag: "🇺🇿", region: "Asie", type: "e-Visa Électronique", duration: "30 jours", delay: "3 jours", docs: "Passeport, Photo d'identité au format digital", fee: "20 USD", note: "Valable pour une entrée sur le territoire." },
  { country: "Koweït", flag: "🇰🇼", region: "Asie", type: "e-Visa Touristique", duration: "90 jours", delay: "24h-48h", docs: "Passeport, Diplôme/Titre si requis", fee: "3 KWD", note: "Sous réserve d'éligibilité des professions/titres." },
  { country: "Jordanie", flag: "🇯🇴", region: "Asie", type: "Jordan Pass / e-Visa", duration: "30 jours", delay: "24h", docs: "Passeport, Itinéraire de voyage", fee: "70 JOD", note: "Exonère des frais de visa si séjour de 3 nuits minimum." },
  { country: "Laos", flag: "🇱🇦", region: "Asie", type: "e-Visa Touristique", duration: "30 jours", delay: "3 jours", docs: "Passeport, Photo récente", fee: "50 USD", note: "Accepté aux aéroports de Vientiane, Luang Prabang, Pakse." },
  { country: "Pakistan", flag: "🇵🇰", region: "Asie", type: "e-Visa Tourisme / Business", duration: "30-90 jours", delay: "7-10 jours", docs: "Passeport, Lettre d'invitation / Réservation hôtel", fee: "25 USD", note: "Traitement via le portail NADRA." },
  { country: "Mongolie", flag: "🇲🇳", region: "Asie", type: "e-Visa Touristique", duration: "30 jours", delay: "3 jours", docs: "Passeport, Photo, Réservation hôtel", fee: "21.50 USD", note: "Délivré pour le tourisme ou les événements." },
  { country: "Tadjikistan", flag: "🇹🇯", region: "Asie", type: "e-Visa Pamir", duration: "45 jours", delay: "3 jours", docs: "Passeport, Photo", fee: "30 USD", note: "Permis GBAO disponible en option pour la région du Pamir." },
  { country: "Japon", flag: "🇯🇵", region: "Asie", type: "e-Visa Court Séjour", duration: "90 jours", delay: "3-5 jours", docs: "Passeport, Relevés bancaires, Billet d'avion, Programme", fee: "Gratuit / Frais agence", note: "Pour séjours touristiques de courte durée." },
  { country: "Corée du Sud", flag: "🇰🇷", region: "Asie", type: "K-ETA Électronique", duration: "90 jours", delay: "24h", docs: "Passeport, Photo, Adresse en Corée", fee: "10 000 KRW", note: "Autorisation préalable de voyage." },
  { country: "Bahreïn", flag: "🇧🇭", region: "Asie", type: "e-Visa Touristique", duration: "14-30 jours", delay: "3-5 jours", docs: "Passeport, Billet A/R, Relevé de compte", fee: "29 BHD", note: "Délivré directement par les services de l'immigration." },
  { country: "Kirghizistan", flag: "🇰🇬", region: "Asie", type: "e-Visa Touristique", duration: "30-60 jours", delay: "5 jours", docs: "Passeport, Photo, Adresse sur place", fee: "50 USD", note: "Valable pour tourisme et affaires." },

  // EUROPE & AMÉRIQUES
  { country: "Russie", flag: "🇷🇺", region: "Europe", type: "e-Visa Unifié", duration: "16 jours", delay: "4 jours", docs: "Passeport (+6 mois), Photo d'identité numérique", fee: "52 USD", note: "Valable sur toute l'étendue de la Fédération de Russie." },
  { country: "Moldavie", flag: "🇲🇩", region: "Europe", type: "e-Visa Touristique", duration: "90 jours", delay: "3-5 jours", docs: "Passeport, Assurance voyage, Justificatif financier", fee: "80 EUR", note: "Dépôt de dossier en ligne sur le portail consulaire." },
  { country: "Cuba", flag: "🇨🇺", region: "Amériques", type: "e-Visa Numérique", duration: "90 jours", delay: "24h", docs: "Passeport, Billet d'avion, Assurance médicale", fee: "35 EUR", note: "Remplace l'ancienne carte touristique papier." },
  { country: "Suriname", flag: "🇸🇷", region: "Amériques", type: "e-Visa / E-Fee", duration: "90 jours", delay: "3 jours", docs: "Passeport, Billet A/R, Réservation d'hôtel", fee: "50 USD", note: "Portail officiel VFS Global Suriname." },
  { country: "Antigua-et-Barbuda", flag: "🇦🇬", region: "Amériques", type: "e-Visa Touristique", duration: "30 jours", delay: "5 jours", docs: "Passeport, Relevé bancaire, Extrait de casier judiciaire", fee: "100 USD", note: "Délivré pour le tourisme et les visites." },
  { country: "Bahamas", flag: "🇧🇸", region: "Amériques", type: "e-Visa Touristique", duration: "90 jours", delay: "7 jours", docs: "Passeport, Lettre d'emploi, Relevé bancaire", fee: "100 USD", note: "Demande en ligne via le portail gouvernemental." },
  { country: "Montserrat", flag: "🇲🇸", region: "Amériques", type: "e-Visa Touristique", duration: "12 mois (entrées multiples)", delay: "24h-48h", docs: "Passeport, Photo", fee: "50 USD", note: "Valable pour séjours touristiques réguliers." },
  { country: "Sainte-Hélène", flag: "🇸🇭", region: "Amériques", type: "e-Visa Électronique", duration: "183 jours max", delay: "7 jours", docs: "Passeport, Assurance médicale avec rapatriement", fee: "50 GBP", note: "Territoire britannique d'outre-mer." },

  // OCÉANIE
  { country: "Australie", flag: "🇦🇺", region: "Océanie", type: "eVisitor / ETA (600)", duration: "3 à 12 mois", delay: "24h-48h", docs: "Passeport, Justificatifs d'attachement financier et professionnel", fee: "20 à 190 AUD", note: "Selon la classe du visa et la nationalité." },
  { country: "Nouvelle-Zélande", flag: "🇳🇿", region: "Océanie", type: "NZeTA Électronique", duration: "2 ans", delay: "24h-72h", docs: "Passeport, Photo, Taxe IVL pour la conservation", fee: "58 NZD", note: "Autorisation de voyage électronique." }
];

interface ExpandedItem {
  [key: string]: boolean;
}

export default function Evisas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [expandedItems, setExpandedItems] = useState<ExpandedItem>({});
  const [aiPitches, setAiPitches] = useState<Record<string, string>>({});
  const [loadingPitchFor, setLoadingPitchFor] = useState<string | null>(null);

  const aiChatMutation = trpc.aiCopilot.chat.useMutation();

  const requestAiPitch = (evisa: Evisa) => {
    if (aiPitches[evisa.country] || loadingPitchFor === evisa.country) return;
    setLoadingPitchFor(evisa.country);
    aiChatMutation.mutate(
      {
        messages: [
          {
            role: "user",
            content: `Un visiteur camerounais hésite à demander seul son ${evisa.type} pour ${evisa.country} (frais officiels : ${evisa.fee}, délai : ${evisa.delay}, pièces : ${evisa.docs}). En 3 phrases maximum, explique-lui concrètement pourquoi passer par 3M Travel & Services plutôt que de le faire seul (vérification du dossier, gain de temps, éviter les erreurs qui font perdre les frais). Ton chaleureux et direct, pas de promesse de garantie.`,
          },
        ],
      },
      {
        onSuccess: (data) => {
          setAiPitches((prev) => ({ ...prev, [evisa.country]: data.reply }));
          setLoadingPitchFor(null);
        },
        onError: () => {
          setAiPitches((prev) => ({ ...prev, [evisa.country]: "Notre équipe vérifie chaque dossier avant soumission pour éviter les rejets qui font perdre les frais déjà payés — contactez-nous pour en discuter." }));
          setLoadingPitchFor(null);
        },
      }
    );
  };

  const regions = ['Tous', 'Afrique', 'Asie', 'Europe', 'Amériques', 'Océanie'];

  const filteredEvisas = useMemo(() => {
    return fullEvisasDatabase.filter(evisa => {
      const matchesSearch = 
        evisa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.docs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = selectedRegion === 'Tous' || evisa.region === selectedRegion;
      
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  const toggleExpanded = (country: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [country]: !prev[country]
    }));
  };

  const openWhatsApp = (country: string) => {
    const message = `Bonjour, je souhaiterais obtenir un e-Visa pour ${country}. Pouvez-vous m'aider ?`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/16728972999?text=${encodedMessage}`, '_blank');
  };

  const getRegionColor = (region: string) => {
    const colors: { [key: string]: string } = {
      'Afrique': 'bg-orange-100 text-orange-800',
      'Asie': 'bg-red-100 text-red-800',
      'Europe': 'bg-blue-100 text-blue-800',
      'Amériques': 'bg-green-100 text-green-800',
      'Océanie': 'bg-cyan-100 text-cyan-800'
    };
    return colors[region] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Annuaire Mondial des e-Visas</h1>
          </div>
          <p className="text-lg text-gray-600">Découvrez tous les pays proposant des e-Visas, ETA et autorisations électroniques</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par pays, type de visa ou documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-lg border-2 border-gray-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedRegion === region
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400'
              }`}
            >
              {region} ({region === 'Tous' ? fullEvisasDatabase.length : fullEvisasDatabase.filter(e => e.region === region).length})
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-center mb-8 text-gray-600">
          <p className="text-sm">
            {filteredEvisas.length} destination{filteredEvisas.length > 1 ? 's' : ''} trouvée{filteredEvisas.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Evisas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvisas.map((evisa, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{evisa.flag}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{evisa.country}</h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRegionColor(evisa.region)}`}>
                        {evisa.region}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-700 font-medium">{evisa.type}</div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Key Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durée:</span>
                    <span className="font-semibold text-gray-900">{evisa.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Délai:</span>
                    <span className="font-semibold text-gray-900">{evisa.delay}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais:</span>
                    <span className="font-semibold text-blue-600">{evisa.fee}</span>
                  </div>
                </div>

                {/* Expandable Section */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <button
                    onClick={() => toggleExpanded(evisa.country)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>📄 Pièces requises & Conseils</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedItems[evisa.country] ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedItems[evisa.country] && (
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Documents:</p>
                        <p>{evisa.docs}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Note:</p>
                        <p className="italic">{evisa.note}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Argumentaire IA personnalisé */}
                <div className="mb-3">
                  {!aiPitches[evisa.country] ? (
                    <button
                      onClick={() => requestAiPitch(evisa)}
                      disabled={loadingPitchFor === evisa.country}
                      className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg py-2 transition-colors"
                    >
                      {loadingPitchFor === evisa.country ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Pourquoi passer par nous ?
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
                      <p className="flex items-center gap-1 font-semibold text-xs text-indigo-500 mb-1">
                        <Sparkles className="w-3 h-3" /> Copilote 3M
                      </p>
                      {aiPitches[evisa.country]}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => openWhatsApp(evisa.country)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Solliciter mon e-Visa
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredEvisas.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun e-Visa trouvé pour votre recherche</p>
            <p className="text-gray-500 text-sm mt-2">Essayez d'ajuster vos filtres ou votre recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}
