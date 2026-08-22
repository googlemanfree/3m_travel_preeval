import { useState, useMemo } from 'react';
import { Search, Globe, Clock, DollarSign, ArrowRight, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { evisasDatabaseComplete, EvisaDestination } from '@/data/evisasDatabaseComplete';
import { motion } from 'framer-motion';

export default function EvisasAdvanced() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Tous');
  const [selectedDelay, setSelectedDelay] = useState('Tous');

  const regions = ['Tous', 'Afrique', 'Asie', 'Europe', 'Amériques', 'Océanie'];
  const delays = ['Tous', '24h', '24h-48h', '2-5 jours', '3-7 jours'];

  const filteredEvisas = useMemo(() => {
    return evisasDatabaseComplete.filter(evisa => {
      const matchesSearch = 
        evisa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.docs.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evisa.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = selectedRegion === 'Tous' || evisa.region === selectedRegion;
      
      const matchesDelay = selectedDelay === 'Tous' || evisa.delay.toLowerCase().includes(selectedDelay.toLowerCase());
      
      return matchesSearch && matchesRegion && matchesDelay;
    });
  }, [searchQuery, selectedRegion, selectedDelay]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* En-tête de la page */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-600" /> Annuaire Officiel e-Visa 100% Numérique
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Procédures <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700">e-Visa</span> & Autorisations
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Découvrez uniquement les destinations éligibles à l'e-Visa électronique sans passage en ambassade. Cliquez sur une destination pour explorer sa culture, ses photos et lancer votre procédure en toute sérénité.
          </p>
        </div>

        {/* Barre de recherche et filtres de régions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher un pays, un type de visa (ex: Égypte, Tourisme, ETA...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-base rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase mr-2 flex items-center gap-1">
                <Globe className="w-4 h-4 text-blue-600" /> Régions :
              </span>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRegion === region
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase mr-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-600" /> Délai :
              </span>
              {delays.map(delay => (
                <button
                  key={delay}
                  onClick={() => setSelectedDelay(delay)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDelay === delay
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {delay}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grille des destinations e-Visa */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvisas.map((destination) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image d'en-tête */}
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  {destination.image ? (
                    <img
                      src={destination.image}
                      alt={`Drapeau de ${destination.country}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-950 to-slate-800 text-7xl" role="img" aria-label={`Drapeau de ${destination.country}`}>{destination.flag}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="text-3xl p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md inline-block">
                      {destination.flag}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600/90 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-full border border-white/20">
                      {destination.region}
                    </Badge>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-black text-white tracking-tight">{destination.country}</h3>
                    <p className="text-xs text-blue-200 font-semibold">{destination.type}</p>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-semibold uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Délai
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{destination.delay}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-500 font-semibold uppercase flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Frais officiels
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{destination.fee}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {destination.culture}
                  </p>
                </div>
              </div>

              {/* Bouton d'action */}
              <div className="p-6 pt-0">
                <a href={`/evisa/${destination.id}`}>
                  <Button className="w-full bg-slate-900 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md">
                    Détails de l'e-Visa & Culture <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEvisas.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              🔍
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Aucun e-Visa trouvé</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Aucune destination ne correspond à votre recherche « {searchQuery} ». Essayez un autre terme ou une autre région.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
