import React, { useState } from 'react';

const camerounEvisas = [
  // AFRIQUE
  { country: "Égypte", flag: "🇪🇬", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "2-5 jours", note: "Accessible en ligne pour passeport camerounais" },
  { country: "Kenya", flag: "🇰🇪", region: "Afrique", type: "eTA Électronique", duration: "90 jours", delay: "24h-72h", note: "Autorisation obligatoire avant départ" },
  { country: "Tanzanie & Zanzibar", flag: "🇹🇿", region: "Afrique", type: "e-Visa Touristique", duration: "30-90 jours", delay: "3-5 jours", note: "Délivrance électronique officielle" },
  { country: "Maroc", flag: "🇲🇦", region: "Afrique", type: "e-Visa (Autorisation Électronique)", duration: "30 jours", delay: "24h-72h", note: "Selon conditions de titre de séjour / visa valide" },
  { country: "Rwanda", flag: "🇷🇼", region: "Afrique", type: "e-Visa Entrée", duration: "30 jours", delay: "2-3 jours", note: "Approbation préalable en ligne" },
  { country: "Éthiopie", flag: "🇪🇹", region: "Afrique", type: "e-Visa Tourisme", duration: "30-90 jours", delay: "1-3 jours", note: "Valable pour arrivée via Addis-Abeba" },
  { country: "Gabon", flag: "🇬🇦", region: "Afrique", type: "e-Visa Entrée", duration: "30-90 jours", delay: "24h-72h", note: "Autorisation préalable obligatoire" },
  { country: "Côte d'Ivoire", flag: "🇨🇮", region: "Afrique", type: "e-Visa Snedai", duration: "90 jours", delay: "48h", note: "Pré-enrôlement et retrait à l'aéroport d'Abidjan" },
  { country: "Togo", flag: "🇹🇬", region: "Afrique", type: "e-Visa Voyage", duration: "15-90 jours", delay: "24h-48h", note: "Portail officiel e-Visa Togo" },
  { country: "Ouganda", flag: "🇺🇬", region: "Afrique", type: "e-Visa Touristique", duration: "90 jours", delay: "2-4 jours", note: "Demande obligatoire avant embarquement" },
  { country: "Zambie & Zimbabwe", flag: "🇿🇲", region: "Afrique", type: "Kaza Univisa / e-Visa", duration: "30 jours", delay: "3 jours", note: "Accès combiné aux deux pays" },
  { country: "Madagascar", flag: "🇲🇬", region: "Afrique", type: "e-Visa Séjour", duration: "30-60 jours", delay: "24h", note: "Demande en ligne ou à l'arrivée" },
  { country: "Cap-Vert", flag: "🇨🇻", region: "Afrique", type: "Autorisation EASE", duration: "30 jours", delay: "24h", note: "Pré-enregistrement obligatoire" },
  { country: "Bénin", flag: "🇧🇯", region: "Afrique", type: "e-Visa Électronique", duration: "30-90 jours", delay: "24h-48h", note: "100% en ligne pour Camerounais" },

  // ASIE & MOYEN-ORIENT
  { country: "Émirats Arabes Unis (Dubaï)", flag: "🇦🇪", region: "Asie", type: "e-Visa Tourisme / Résidence", duration: "30 / 60 jours", delay: "24h-48h", note: "Délivrance garantie via partenaire sponsor" },
  { country: "Arabie Saoudite", flag: "🇸🇦", region: "Asie", type: "e-Visa Umrah / Tourisme", duration: "90 jours", delay: "24h-48h", note: "Plateforme Nusuk / e-Visa" },
  { country: "Turquie", flag: "🇹🇷", region: "Asie", type: "e-Visa Consulaire", duration: "30 jours", delay: "24h", note: "Si possession d'un visa/titre Schengen, US ou UK valide" },
  { country: "Inde", flag: "🇮🇳", region: "Asie", type: "e-Visa Tourisme / Business", duration: "30j à 1 an", delay: "3-5 jours", note: "Ouvert aux ressortissants camerounais" },
  { country: "Viêt Nam", flag: "🇻🇳", region: "Asie", type: "e-Visa Électronique", duration: "90 jours", delay: "3-5 jours", note: "Entrées simples ou multiples" },
  { country: "Thaïlande", flag: "🇹🇭", region: "Asie", type: "e-Visa Électronique", duration: "60 jours", delay: "3-5 jours", note: "Soumission dossier en ligne" },
  { country: "Cambodge", flag: "🇰🇭", region: "Asie", type: "e-Visa Touristique", duration: "30 jours", delay: "3 jours", note: "Disponible pour passeport camerounais" },
  { country: "Indonésie (Bali)", flag: "🇮🇩", region: "Asie", type: "e-VOA Touristique", duration: "30 jours", delay: "Instantané", note: "Extension possible sur place" },
  { country: "Qatar", flag: "🇶🇦", region: "Asie", type: "e-Visa Hayya", duration: "30 jours", delay: "24h-48h", note: "Portail officiel Hayya" },
  { country: "Oman", flag: "🇴🇲", region: "Asie", type: "e-Visa Électronique", duration: "10-30 jours", delay: "24h", note: "Délivrance en ligne" },
  { country: "Sri Lanka", flag: "🇱🇰", region: "Asie", type: "ETA Électronique", duration: "30 jours", delay: "24h-48h", note: "Autorisation ETA en ligne" },
  { country: "Ouzbékistan", flag: "🇺🇿", region: "Asie", type: "e-Visa Électronique", duration: "30 jours", delay: "3 jours", note: "Accès en ligne pour Camerounais" },

  // EUROPE & AUTRES
  { country: "Russie", flag: "🇷🇺", region: "Europe", type: "e-Visa Unifié", duration: "16 jours", delay: "4 jours", note: "Valable pour séjour touristique / affaires" },
  { country: "Moldavie", flag: "🇲🇩", region: "Europe", type: "e-Visa Touristique", duration: "90 jours", delay: "3-5 jours", note: "Dépôt de dossier numérique" },
  { country: "Cuba", flag: "🇨🇺", region: "Amériques", type: "e-Visa / Carte Touristique Numérique", duration: "90 jours", delay: "24h", note: "Obligatoire avant l'embarquement" },
  { country: "Suriname", flag: "🇸🇷", region: "Amériques", type: "e-Visa / E-Fee", duration: "90 jours", delay: "3 jours", note: "Procédure 100% en ligne" }
];

export default function Evisas() {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');

  const filtered = camerounEvisas.filter(item => {
    const matchesSearch = item.country.toLowerCase().includes(search.toLowerCase()) || 
                          item.type.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === 'Tous' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleApply = (countryName: string) => {
    const message = encodeURIComponent(`Bonjour 3M Travel & Services SARL, je détiens un passeport camerounais 🇨🇲 et je souhaite solliciter votre accompagnement pour l'obtention de mon e-Visa pour : ${countryName}.`);
    window.open(`https://wa.me/237698104832?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0B192C] text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <span className="bg-[#0066CC]/20 text-[#0066CC] border border-[#0066CC]/30 px-4 py-1.5 rounded-full text-sm font-semibold inline-block mb-4">
          🇨🇲 e-Visas Eligibles — Passeport Camerounais
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          e-Visas & ETA pour <span className="text-[#D4AF37]">Ressortissants Camerounais</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
          Liste exacte et vérifiée des pays délivrant une autorisation de voyage ou un visa électronique aux citoyens camerounais. Accompagnement consulaire certifié par <strong className="text-white">3M Travel & Services SARL</strong>.
        </p>
      </div>

      {/* RECHERCHE ET FILTRES */}
      <div className="max-w-5xl mx-auto mb-10 space-y-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Rechercher une destination (ex: Dubaï, Égypte, Turquie, Viêt Nam, Inde...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1E3E62]/40 border border-gray-700 rounded-2xl py-4 px-6 text-white placeholder-gray-400 focus:outline-none focus:border-[#0066CC] shadow-lg backdrop-blur-md"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {['Tous', 'Afrique', 'Asie', 'Europe', 'Amériques'].map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                selectedRegion === region
                  ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/30'
                  : 'bg-[#1E3E62]/30 text-gray-300 hover:bg-[#1E3E62]/60 border border-gray-700/50'
              }`}
            >
              {region} {region === 'Tous' ? `(${camerounEvisas.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE D'AFFICHAGE DES EVISAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <div key={idx} className="bg-[#1E3E62]/20 border border-gray-800 hover:border-[#0066CC]/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{item.flag}</span>
                <span className="text-xs bg-[#0066CC]/20 text-[#0066CC] border border-[#0066CC]/30 px-3 py-1 rounded-full font-semibold">
                  🇨🇲 Éligible
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{item.country}</h3>
              <p className="text-sm text-[#D4AF37] font-medium mb-3">{item.type}</p>

              <div className="space-y-2 text-sm text-gray-300 mb-4 bg-[#0B192C]/50 p-3 rounded-xl border border-gray-800/80">
                <div className="flex justify-between">
                  <span className="text-gray-400">Durée autorisée :</span>
                  <span className="font-semibold">{item.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Délai moyen :</span>
                  <span className="font-semibold text-green-400">{item.delay}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 italic mb-6">
                ℹ️ {item.note}
              </p>
            </div>

            <button
              onClick={() => handleApply(item.country)}
              className="w-full bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2"
            >
              <span>Demander avec 3M Travel</span>
              <span>→</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
