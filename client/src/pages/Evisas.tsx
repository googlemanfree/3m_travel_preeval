import React, { useState } from 'react';

const evisaData = [
  { country: "Égypte", flag: "🇪🇬", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "2-5 jours" },
  { country: "Kenya", flag: "🇰🇪", region: "Afrique", type: "eTA Électronique", duration: "90 jours", delay: "24h-72h" },
  { country: "Tanzanie & Zanzibar", flag: "🇹🇿", region: "Afrique", type: "e-Visa Touristique", duration: "30-90 jours", delay: "3-5 jours" },
  { country: "Maroc", flag: "🇲🇦", region: "Afrique", type: "e-Visa Touristique", duration: "30 jours", delay: "24h-72h" },
  { country: "Rwanda", flag: "🇷🇼", region: "Afrique", type: "e-Visa Entrée", duration: "30 jours", delay: "2-3 jours" },
  { country: "Éthiopie", flag: "🇪🇹", region: "Afrique", type: "e-Visa Tourisme", duration: "30-90 jours", delay: "1-3 jours" },
  { country: "Gabon", flag: "🇬🇦", region: "Afrique", type: "e-Visa Entrée", duration: "30 jours", delay: "24h-72h" },
  { country: "Côte d'Ivoire", flag: "🇨🇮", region: "Afrique", type: "e-Visa Snedai", duration: "90 jours", delay: "48h" },
  { country: "Togo", flag: "🇹🇬", region: "Afrique", type: "e-Visa Voyage", duration: "15-90 jours", delay: "24h-48h" },
  { country: "Madagascar", flag: "🇲🇬", region: "Afrique", type: "e-Visa Séjour", duration: "30-60 jours", delay: "24h" },
  { country: "Cap-Vert", flag: "🇨🇻", region: "Afrique", type: "Autorisation EASE", duration: "30 jours", delay: "24h" },
  { country: "Émirats Arabes Unis (Dubaï)", flag: "🇦🇪", region: "Asie", type: "e-Visa Tourisme", duration: "30 / 60 jours", delay: "24h-48h" },
  { country: "Arabie Saoudite", flag: "🇸🇦", region: "Asie", type: "e-Visa Tourisme / Oumrah", duration: "90 jours", delay: "24h" },
  { country: "Turquie", flag: "🇹🇷", region: "Asie", type: "e-Visa Consulaire", duration: "30-90 jours", delay: "24h" },
  { country: "Inde", flag: "🇮🇳", region: "Asie", type: "e-Visa Tourisme / Business", duration: "30j à 1 an", delay: "3-5 jours" },
  { country: "Viêt Nam", flag: "🇻🇳", region: "Asie", type: "e-Visa Électronique", duration: "90 jours", delay: "3-5 jours" },
  { country: "Thaïlande", flag: "🇹🇭", region: "Asie", type: "e-Visa / DTV Nomad", duration: "60 jours / 5 ans", delay: "3-5 jours" },
  { country: "Cambodge", flag: "🇰🇭", region: "Asie", type: "e-Visa Touristique", duration: "30 jours", delay: "3 jours" },
  { country: "Indonésie (Bali)", flag: "🇮🇩", region: "Asie", type: "e-VOA Touristique", duration: "30 jours", delay: "Instantané" },
  { country: "Qatar", flag: "🇶🇦", region: "Asie", type: "e-Visa Hayya", duration: "30 jours", delay: "24h-48h" },
  { country: "Oman", flag: "🇴🇲", region: "Asie", type: "e-Visa Entrée", duration: "10-30 jours", delay: "24h" },
  { country: "Japon", flag: "🇯🇵", region: "Asie", type: "e-Visa Court Séjour", duration: "90 jours", delay: "3-5 jours" },
  { country: "Corée du Sud", flag: "🇰🇷", region: "Asie", type: "K-ETA Électronique", duration: "90 jours", delay: "24h" },
  { country: "Canada", flag: "🇨🇦", region: "Amériques", type: "AVE / eTA Canada", duration: "5 ans max", delay: "24h" },
  { country: "États-Unis", flag: "🇺🇸", region: "Amériques", type: "ESTA Électronique", duration: "2 ans", delay: "24h-72h" },
  { country: "Mexique", flag: "🇲🇽", region: "Amériques", type: "SAE Électronique", duration: "180 jours", delay: "Instantané" },
  { country: "Cuba", flag: "🇨🇺", region: "Amériques", type: "e-Visa Numérique", duration: "90 jours", delay: "24h" },
  { country: "Royaume-Uni", flag: "🇬🇧", region: "Europe", type: "UK ETA", duration: "2 ans", delay: "24h-72h" },
  { country: "Russie", flag: "🇷🇺", region: "Europe", type: "e-Visa Unifié", duration: "16 jours", delay: "4 jours" },
  { country: "Australie", flag: "🇦🇺", region: "Océanie", type: "eVisitor / ETA", duration: "12 mois", delay: "24h-48h" }
];

export default function Evisas() {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');

  const filtered = evisaData.filter(item => {
    const matchesSearch = item.country.toLowerCase().includes(search.toLowerCase()) || item.type.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === 'Tous' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleApply = (countryName: string) => {
    const message = encodeURIComponent(`Bonjour 3M Travel & Services SARL, je souhaite solliciter un accompagnement pour l'obtention de mon e-Visa pour : ${countryName}.`);
    window.open(`https://wa.me/237698104832?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0B192C] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center mb-12">
        <span className="bg-[#0066CC]/20 text-[#0066CC] border border-[#0066CC]/30 px-4 py-1.5 rounded-full text-sm font-semibold inline-block mb-4">
          🛂 Guichet Mondial de Visas Électroniques
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Annuaire Mondial des <span className="text-[#D4AF37]">e-Visas & ETA</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
          Obtenez votre autorisation de voyage électronique pour plus de 30 destinations. Vérification consulaire et suivi rigoureux par <strong className="text-white">3M Travel & Services SARL</strong>.
        </p>
      </div>

      <div className="max-w-5xl mx-auto mb-10 space-y-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Tapez le nom d'un pays (ex: Turquie, Égypte, Dubaï, Canada...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1E3E62]/40 border border-gray-700 rounded-2xl py-4 px-6 text-white placeholder-gray-400 focus:outline-none focus:border-[#0066CC] shadow-lg backdrop-blur-md"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {['Tous', 'Afrique', 'Asie', 'Amériques', 'Europe', 'Océanie'].map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                selectedRegion === region
                  ? 'bg-[#0066CC] text-white shadow-lg shadow-[#0066CC]/30'
                  : 'bg-[#1E3E62]/30 text-gray-300 hover:bg-[#1E3E62]/60 border border-gray-700/50'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <div key={idx} className="bg-[#1E3E62]/20 border border-gray-800 hover:border-[#0066CC]/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between backdrop-blur-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{item.flag}</span>
                <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700">
                  {item.region}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{item.country}</h3>
              <p className="text-sm text-[#D4AF37] font-medium mb-4">{item.type}</p>

              <div className="space-y-2 text-sm text-gray-300 mb-6 bg-[#0B192C]/50 p-3 rounded-xl border border-gray-800/80">
                <div className="flex justify-between">
                  <span className="text-gray-400">Durée autorisée :</span>
                  <span className="font-semibold">{item.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Délai estimé :</span>
                  <span className="font-semibold text-green-400">{item.delay}</span>
                </div>
              </div>
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

      <div className="max-w-4xl mx-auto mt-16 bg-[#1E3E62]/30 border border-gray-700/60 rounded-3xl p-8 text-center backdrop-blur-md">
        <h3 className="text-xl font-bold text-[#D4AF37] mb-2">🛡️ Garantie Audit & Conformité Consulaire</h3>
        <p className="text-gray-300 text-sm">
          Nos experts procèdent au contrôle préalable de la lisibilité de vos passeports, de la conformité des photos et des pièces justificatives avant toute soumission officielle.
        </p>
      </div>
    </div>
  );
}
