import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, MessageCircle, Globe, ShieldCheck, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const verifiedEvisasDatabase: Evisa[] = [
  // ================= AFRIQUE =================
  { 
    country: "Égypte", 
    flag: "🇪🇬", 
    region: "Afrique", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "2-5 jours ouvrés", 
    docs: "Passeport (valide +6 mois), Photo d'identité couleur, Réservation d'hôtel confirmée, Billet d'avion A/R", 
    fee: "25 USD", 
    note: "Disponible en entrée simple ou multiple. Traitement officiel en ligne via le portail gouvernemental égyptien." 
  },
  { 
    country: "Kenya", 
    flag: "🇰🇪", 
    region: "Afrique", 
    type: "eTA Électronique", 
    duration: "90 jours", 
    delay: "24h - 72h", 
    docs: "Passeport en cours de validité, Billet d'avion A/R, Justificatif d'hébergement ou invitation", 
    fee: "34 USD", 
    note: "Autorisation de Voyage Électronique (eTA) obligatoire pour tous les voyageurs avant l'embarquement." 
  },
  { 
    country: "Tanzanie (incl. Zanzibar)", 
    flag: "🇹🇿", 
    region: "Afrique", 
    type: "e-Visa Touristique", 
    duration: "90 jours", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Photo d'identité récente, Billet d'avion de retour", 
    fee: "50 USD", 
    note: "Valable pour l'ensemble du territoire tanzanien ainsi que pour l'île autonome de Zanzibar." 
  },
  { 
    country: "Maroc", 
    flag: "🇲🇦", 
    region: "Afrique", 
    type: "e-Visa (AEVM)", 
    duration: "30 jours", 
    delay: "24h - 72h", 
    docs: "Passeport, Copie d'un visa ou titre de séjour valide (Schengen, US, UK, Canada, Japon, Australie)", 
    fee: "770 MAD", 
    note: "Réservé aux ressortissants éligibles disposant d'un titre de voyage ou visa des pays développés partenaires." 
  },
  { 
    country: "Rwanda", 
    flag: "🇷🇼", 
    region: "Afrique", 
    type: "e-Visa Entrée", 
    duration: "30 jours", 
    delay: "2-3 jours ouvrés", 
    docs: "Passeport, Photo sur fond blanc, Lettre d'invitation ou réservation d'hôtel", 
    fee: "50 USD", 
    note: "Permet l'entrée par tous les postes frontaliers officiels du Rwanda." 
  },
  { 
    country: "Éthiopie", 
    flag: "🇪🇹", 
    region: "Afrique", 
    type: "e-Visa Tourisme", 
    duration: "30 à 90 jours", 
    delay: "24h - 48h", 
    docs: "Passeport (+6 mois), Photo récente format passeport", 
    fee: "82 USD", 
    note: "Valable exclusivement pour les arrivées internationales via l'Aéroport International Bole d'Addis-Abeba." 
  },
  { 
    country: "Gabon", 
    flag: "🇬🇦", 
    region: "Afrique", 
    type: "e-Visa Électronique", 
    duration: "30 à 90 jours", 
    delay: "48h - 72h", 
    docs: "Passeport, Autorisation d'entrée préalable, Carnet international de vaccination (fièvre jaune)", 
    fee: "85 EUR", 
    note: "Délivrance d'une autorisation d'atterrissage numérique à présenter à l'embarquement." 
  },
  { 
    country: "Côte d'Ivoire", 
    flag: "🇨🇮", 
    region: "Afrique", 
    type: "e-Visa Snedai", 
    duration: "90 jours", 
    delay: "48h", 
    docs: "Passeport, Attestation d'hébergement ou réservation d'hôtel, Carnet de vaccination", 
    fee: "73 EUR", 
    note: "Enrôlement en ligne et prise d'empreintes simplifiée à l'arrivée à l'Aéroport Félix Houphouët-Boigny d'Abidjan." 
  },
  { 
    country: "Togo", 
    flag: "🇹🇬", 
    region: "Afrique", 
    type: "e-Visa Voyage", 
    duration: "15 à 90 jours", 
    delay: "24h - 48h", 
    docs: "Passeport, Billet d'avion A/R, Photo d'identité", 
    fee: "35 000 XOF", 
    note: "Plateforme officielle gérée par la police nationale togolaise." 
  },
  { 
    country: "Ouganda", 
    flag: "🇺🇬", 
    region: "Afrique", 
    type: "e-Visa Touristique", 
    duration: "90 jours", 
    delay: "2-4 jours ouvrés", 
    docs: "Passeport, Photo, Certificat de vaccination contre la fièvre jaune", 
    fee: "50 USD", 
    note: "Possibilité d'opter pour l'East Africa Tourist Visa incluant également le Kenya et le Rwanda." 
  },
  { 
    country: "Bénin", 
    flag: "🇧🇯", 
    region: "Afrique", 
    type: "e-Visa Électronique", 
    duration: "30 à 90 jours", 
    delay: "24h - 48h", 
    docs: "Passeport, Billet d'avion aller-retour", 
    fee: "50 EUR (entrée simple) / 75 EUR (entrées multiples)", 
    note: "Procédure 100% numérique sans dépôt physique de passeport." 
  },
  { 
    country: "Zambie & Zimbabwe", 
    flag: "🇿🇲", 
    region: "Afrique", 
    type: "Kaza Univisa", 
    duration: "30 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo, Itinéraire de voyage", 
    fee: "50 USD", 
    note: "Visa combiné permettant de traverser librement les frontières entre la Zambie et le Zimbabwe." 
  },
  { 
    country: "Madagascar", 
    flag: "🇲🇬", 
    region: "Afrique", 
    type: "e-Visa Séjour", 
    duration: "30 à 60 jours", 
    delay: "24h - 48h", 
    docs: "Passeport, Billet d'avion de retour", 
    fee: "35 EUR (30j) / 40 EUR (60j)", 
    note: "Paiement des frais et obtention de l'attestation électronique en ligne." 
  },
  { 
    country: "Cap-Vert", 
    flag: "🇨🇻", 
    region: "Afrique", 
    type: "Autorisation EASE", 
    duration: "30 jours", 
    delay: "24h", 
    docs: "Passeport, Numéro de vol et dates de séjour", 
    fee: "31 EUR", 
    note: "Enregistrement obligatoire (EASE) pour tout passager débarquant au Cap-Vert." 
  },
  { 
    country: "Angola", 
    flag: "🇦🇴", 
    region: "Afrique", 
    type: "e-Visa Pré-approbation", 
    duration: "30 jours", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Justificatif de ressources financières, Carnet de vaccination", 
    fee: "120 USD", 
    note: "Délivrance de la pré-autorisation en ligne, formalités finales de visa à l'arrivée." 
  },
  { 
    country: "Mozambique", 
    flag: "🇲🇿", 
    region: "Afrique", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "2-4 jours ouvrés", 
    docs: "Passeport, Confirmation de réservation hôtelière, Billet A/R", 
    fee: "50 USD", 
    note: "Simplification récente des procédures d'immigration mozambicaines." 
  },
  { 
    country: "Malawi", 
    flag: "🇲🇼", 
    region: "Afrique", 
    type: "e-Visa Touristique", 
    duration: "30 à 90 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo récente, Justificatif d'hébergement", 
    fee: "50 USD", 
    note: "Document officiel PDF à imprimer et présenter à l'arrivée." 
  },

  // ================= ASIE & MOYEN-ORIENT =================
  { 
    country: "Émirats Arabes Unis (Dubaï)", 
    flag: "🇦🇪", 
    region: "Asie", 
    type: "e-Visa Tourisme", 
    duration: "30 / 60 jours", 
    delay: "24h - 48h", 
    docs: "Scan du passeport couleur, Photo d'identité sur fond clair", 
    fee: "130 USD", 
    note: "Prise en charge via nos agences partenaires et compagnies aériennes accréditées." 
  },
  { 
    country: "Arabie Saoudite", 
    flag: "🇸🇦", 
    region: "Asie", 
    type: "e-Visa Tourisme / Oumrah", 
    duration: "90 jours", 
    delay: "24h - 48h", 
    docs: "Passeport valide, Photo d'identité, Assurance médicale obligatoire", 
    fee: "140 USD", 
    note: "Ouvert aux touristes internationaux et pèlerins pour l'Oumrah." 
  },
  { 
    country: "Turquie", 
    flag: "🇹🇷", 
    region: "Asie", 
    type: "e-Visa Électronique", 
    duration: "30 à 90 jours", 
    delay: "Instantané à 24h", 
    docs: "Passeport, Carte bancaire pour le règlement", 
    fee: "Variable selon nationalité (env. 50 USD)", 
    note: "Portail officiel e-Visa République de Turquie (Electronic Visa Application System)." 
  },
  { 
    country: "Inde", 
    flag: "🇮🇳", 
    region: "Asie", 
    type: "e-Visa (Tourist / Business)", 
    duration: "30 jours à 5 ans", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport (scan page d'garde), Photo format carré, Lettre de mission (Business)", 
    fee: "25 à 100 USD selon saison", 
    note: "Formulaire en ligne exhaustif requis (antécédents, famille, etc.)." 
  },
  { 
    country: "Viêt Nam", 
    flag: "🇻🇳", 
    region: "Asie", 
    type: "e-Visa Électronique", 
    duration: "90 jours (entrées multiples)", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Photo d'identité numérique, Portrait face", 
    fee: "25 USD", 
    note: "Valable pour tous les ports maritimes, terrestres et aériens internationaux du Viêt Nam." 
  },
  { 
    country: "Thaïlande", 
    flag: "🇹🇭", 
    region: "Asie", 
    type: "e-Visa Officiel", 
    duration: "60 jours (prolongeable)", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Justificatif financier (relevé de compte), Billet A/R", 
    fee: "40 USD", 
    note: "Demande centralisée sur le portail officiel Thai E-Visa." 
  },
  { 
    country: "Cambodge", 
    flag: "🇰🇭", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo numérique récente", 
    fee: "36 USD", 
    note: "Idéal pour le tourisme et les courts séjours culturels." 
  },
  { 
    country: "Indonésie (Bali)", 
    flag: "🇮🇩", 
    region: "Asie", 
    type: "e-VOA (Visa on Arrival)", 
    duration: "30 jours (renouvelable 1 fois)", 
    delay: "Instantané", 
    docs: "Passeport valide +6 mois, Billet de sortie du territoire indonésien", 
    fee: "35 USD (500 000 IDR)", 
    note: "Évite les files d'attente à l'arrivée aux aéroports de Denpasar ou Jakarta." 
  },
  { 
    country: "Qatar", 
    flag: "🇶🇦", 
    region: "Asie", 
    type: "e-Visa Hayya", 
    duration: "30 jours", 
    delay: "24h - 48h", 
    docs: "Passeport, Réservation d'hôtel validée sur Discover Qatar", 
    fee: "Gratuit / Variable", 
    note: "Plateforme unifiée Hayya pour le tourisme et l'événementiel." 
  },
  { 
    country: "Oman", 
    flag: "🇴🇲", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "10 à 30 jours", 
    delay: "24h - 48h", 
    docs: "Passeport, Photo d'identité", 
    fee: "20 OMR (30 jours)", 
    note: "Délivrance directe par la Royal Oman Police." 
  },
  { 
    country: "Sri Lanka", 
    flag: "🇱🇰", 
    region: "Asie", 
    type: "ETA Électronique", 
    duration: "30 jours (extensible)", 
    delay: "24h", 
    docs: "Passeport, Détails du vol aller-retour", 
    fee: "50 USD", 
    note: "Autorisation de Voyage Électronique (ETA)." 
  },
  { 
    country: "Ouzbékistan", 
    flag: "🇺🇿", 
    region: "Asie", 
    type: "e-Visa Électronique", 
    duration: "30 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo d'identité", 
    fee: "20 USD", 
    note: "Entrée simple pour séjours touristiques." 
  },
  { 
    country: "Jordanie", 
    flag: "🇯🇴", 
    region: "Asie", 
    type: "Jordan Pass / e-Visa", 
    duration: "30 jours", 
    delay: "24h", 
    docs: "Passeport, Itinéraire", 
    fee: "70 JOD", 
    note: "Inclut l'accès gratuit à plus de 40 sites touristiques (Petra, etc.) et l'exonération du visa." 
  },
  { 
    country: "Laos", 
    flag: "🇱🇦", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo", 
    fee: "50 USD", 
    note: "Valable via les principaux points d'entrée aériens et terrestres." 
  },
  { 
    country: "Mongolie", 
    flag: "🇲🇳", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Photo, Réservation d'hôtel", 
    fee: "21.50 USD", 
    note: "Plateforme officielle de e-Visa mongole." 
  },
  { 
    country: "Bahreïn", 
    flag: "🇧🇭", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "14 jours", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Billet d'avion, Relevés bancaires", 
    fee: "29 BHD", 
    note: "Vérification des conditions d'éligibilité selon la nationalité." 
  },
  { 
    country: "Kirghizistan", 
    flag: "🇰🇬", 
    region: "Asie", 
    type: "e-Visa Touristique", 
    duration: "30 à 60 jours", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Photo", 
    fee: "50 USD", 
    note: "Simplification des formalités pour la découverte de la région." 
  },

  // ================= EUROPE & AMÉRIQUES =================
  { 
    country: "Russie", 
    flag: "🇷🇺", 
    region: "Europe", 
    type: "e-Visa Unifié", 
    duration: "16 jours", 
    delay: "4 jours ouvrés", 
    docs: "Passeport (+6 mois), Photo d'identité numérique, Assurance voyage valide en Russie", 
    fee: "52 USD", 
    note: "Valable pour un séjour touristique, d'affaires ou humanitaire dans toute la Fédération de Russie." 
  },
  { 
    country: "Moldavie", 
    flag: "🇲🇩", 
    region: "Europe", 
    type: "e-Visa Touristique", 
    duration: "90 jours", 
    delay: "3-5 jours ouvrés", 
    docs: "Passeport, Assurance médicale, Justificatif de moyens de subsistance", 
    fee: "80 EUR", 
    note: "Portail consulaire officiel moldave." 
  },
  { 
    country: "Cuba", 
    flag: "🇨🇺", 
    region: "Amériques", 
    type: "e-Visa Numérique (Tarjeta del Turista)", 
    duration: "90 jours (renouvelable 1 fois)", 
    delay: "24h", 
    docs: "Passeport valide, Billet d'avion aller-retour, Assurance voyage obligatoire", 
    fee: "35 EUR", 
    note: "Remplace l'ancienne carte touristique cartonnée traditionnelle." 
  },
  { 
    country: "Suriname", 
    flag: "🇸🇷", 
    region: "Amériques", 
    type: "e-Visa / E-Fee", 
    duration: "90 jours", 
    delay: "3 jours ouvrés", 
    docs: "Passeport, Billet A/R, Réservation hôtelière", 
    fee: "50 USD (+ frais de gestion)", 
    note: "Géré via la plateforme officielle VFS Global / Suriname e-Visa." 
  },
  { 
    country: "Antigua-et-Barbuda", 
    flag: "🇦🇬", 
    region: "Amériques", 
    type: "e-Visa Touristique", 
    duration: "30 jours", 
    delay: "5 jours ouvrés", 
    docs: "Passeport, Relevé bancaire, Lettre d'invitation ou d'hôtel", 
    fee: "100 USD", 
    note: "Autorisation électronique officielle pour les Caraïbes." 
  },
  { 
    country: "Bahamas", 
    flag: "🇧🇸", 
    region: "Amériques", 
    type: "e-Visa Touristique", 
    duration: "90 jours", 
    delay: "5-7 jours ouvrés", 
    docs: "Passeport, Photo, Lettre d'employeur ou justificatif financier", 
    fee: "100 USD", 
    note: "Traitement par le département de l'immigration bahamien." 
  },

  // ================= OCÉANIE =================
  { 
    country: "Australie", 
    flag: "🇦🇺", 
    region: "Océanie", 
    type: "ETA / eVisitor (Subclass 600)", 
    duration: "3, 6 ou 12 mois", 
    delay: "24h - 48h", 
    docs: "Passeport, Justificatifs d'attachement financier et professionnel", 
    fee: "20 à 190 AUD", 
    note: "Demande en ligne via l'application officielle Australian ETA." 
  },
  { 
    country: "Nouvelle-Zélande", 
    flag: "🇳🇿", 
    region: "Océanie", 
    type: "NZeTA (Electronic Travel Authority)", 
    duration: "2 ans (entrées multiples)", 
    delay: "24h - 72h", 
    docs: "Passeport en cours de validité, Photo d'identité", 
    fee: "58 NZD (incluant taxe IVL)", 
    note: "Obligatoire pour l'embarquement vers la Nouvelle-Zélande." 
  }
];

interface ExpandedItem {
  [key: string]: boolean;
}

export default function Evisas() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [expandedItems, setExpandedItems] = useState<ExpandedItem>({});

  const regions = ['Tous', 'Afrique', 'Asie', 'Europe', 'Amériques', 'Océanie'];

  const filteredEvisas = useMemo(() => {
    return verifiedEvisasDatabase.filter(evisa => {
      const matchesSearch = 
        evisa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.docs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.note.toLowerCase().includes(searchQuery.toLowerCase());
      
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

  const openWhatsApp = (countryName: string) => {
    const text = encodeURIComponent(`Bonjour l'équipe 3M Travel, je souhaite solliciter un e-Visa pour ${countryName}. Pouvez-vous m'accompagner dans la procédure ?`);
    window.open(`https://wa.me/237698104832?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Globe className="w-4 h-4" />
            Portail Officiel e-Visa & Autorisations Électroniques
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Catalogue Mondial des <span className="text-blue-600">e-Visas Vérifiés</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            Consultez la liste exhaustive et rigoureusement vérifiée des pays délivrant des visas électroniques (e-Visa), ETA et autorisations de voyage numériques. Évitez les intermédiaires non officiels et confiez votre dossier à l'expertise de 3M Travel & Services.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par pays, type de visa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 w-full border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>

            {/* Region Filter Pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
              {regions.map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedRegion === region
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm font-medium text-gray-500">
            Affichage de <span className="font-bold text-gray-900">{filteredEvisas.length}</span> destinations e-Visa certifiées
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Filtre anti-faux positifs : pas de visa consulaire classique ou espace Schengen</span>
          </div>
        </div>

        {/* Grid of Evisas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvisas.map((evisa) => (
            <div
              key={evisa.country}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl" role="img" aria-label={`Drapeau ${evisa.country}`}>
                    {evisa.flag}
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {evisa.region}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{evisa.country}</h3>
                <p className="text-sm font-medium text-blue-600">{evisa.type}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 pt-4 flex-1 flex flex-col justify-between">
                
                {/* Key Metrics */}
                <div className="space-y-2.5 mb-6">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" /> Durée séjour:
                    </span>
                    <span className="font-semibold text-gray-900">{evisa.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-gray-400" /> Délai d'obtention:
                    </span>
                    <span className="font-semibold text-gray-900">{evisa.delay}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Frais officiels:</span>
                    <span className="font-bold text-blue-600">{evisa.fee}</span>
                  </div>
                </div>

                {/* Expandable Section */}
                <div className="border-t border-gray-100 pt-3 mb-6">
                  <button
                    onClick={() => toggleExpanded(evisa.country)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>📄 Pièces requises & Conseils officiels</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedItems[evisa.country] ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {expandedItems[evisa.country] && (
                    <div className="mt-3 space-y-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900 mb-0.5">Documents requis :</p>
                        <p>{evisa.docs}</p>
                      </div>
                      <div className="mt-2">
                        <p className="font-semibold text-gray-900 mb-0.5">Note pratique :</p>
                        <p className="italic">{evisa.note}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => openWhatsApp(evisa.country)}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
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
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-800 text-lg font-semibold">Aucun e-Visa trouvé pour votre recherche</p>
            <p className="text-gray-500 text-sm mt-1">Essayez d'ajuster les filtres régionaux ou le terme de recherche.</p>
          </div>
        )}

      </div>
    </div>
  );
}
