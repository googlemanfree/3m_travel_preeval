import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Download, ArrowLeft, CheckCircle2, FileText, Briefcase, Globe, Award, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { evisasDatabaseComplete, EvisaDestination } from '@/data/evisasDatabaseComplete';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function EvisaDetailPage() {
  const [, params] = useRoute<{ evisaId: string }>('/evisa/:evisaId');
  const evisaId = params?.evisaId;

  const destination = evisasDatabaseComplete.find(e => e.id === evisaId);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (evisaId) {
      try {
        const favs = JSON.parse(localStorage.getItem('3m_favorite_evisas') || '[]');
        setIsFavorite(favs.includes(evisaId));
      } catch (e) {}
    }
  }, [evisaId]);

  const toggleFavorite = () => {
    if (!evisaId) return;
    try {
      const favs = JSON.parse(localStorage.getItem('3m_favorite_evisas') || '[]');
      let updated = [];
      if (isFavorite) {
        updated = favs.filter((id: string) => id !== evisaId);
        setIsFavorite(false);
        toast.success("Destination retirée de vos favoris e-Visa");
      } else {
        updated = [...favs, evisaId];
        setIsFavorite(true);
        toast.success("Destination e-Visa enregistrée dans vos favoris !");
      }
      localStorage.setItem('3m_favorite_evisas', JSON.stringify(updated));
    } catch (e) {
      toast.error("Erreur lors de la mise à jour des favoris");
    }
  };

  if (!destination) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Destination e-Visa non trouvée</h2>
        <p className="text-slate-600 mb-6">Le pays demandé n'est pas répertorié dans notre portail e-Visa officiel.</p>
        <a href="/evisas">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux e-Visas
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <a href="/evisas">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'annuaire e-Visa
            </Button>
          </a>
          <Button
            onClick={toggleFavorite}
            variant="outline"
            className={`rounded-xl gap-2 ${isFavorite ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
            {isFavorite ? 'Enregistré en favori' : 'Ajouter aux favoris'}
          </Button>
        </div>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 text-white"
        >
          <div className="absolute inset-0 z-0">
            <img
              src={destination.image}
              alt={destination.country}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover opacity-35 filter brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
          </div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-5xl sm:text-6xl p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                {destination.flag}
              </span>
                <div className="space-y-1">
                  <Badge className="bg-blue-600 text-white font-bold px-3 py-1 text-xs uppercase tracking-wider rounded-full">
                    {destination.region} • {destination.type}
                  </Badge>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    {destination.country}
                  </h1>
                  <p className="text-sm font-semibold text-blue-200 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-4 h-4 text-amber-400" /> Capitale / Pôle : <span className="text-white font-bold">{destination.capital}</span>
                  </p>
                </div>
            </div>

            <p className="text-slate-200 text-base sm:text-lg max-w-3xl leading-relaxed font-light">
              {destination.culture}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-300 font-semibold uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Délai d'obtention
                </p>
                <p className="text-lg font-black text-white mt-1">{destination.delay}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-300 font-semibold uppercase flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Frais officiels
                </p>
                <p className="text-lg font-black text-white mt-1">{destination.fee}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-300 font-semibold uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Durée de séjour
                </p>
                <p className="text-lg font-black text-white mt-1">{destination.duration}</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-slate-300 font-semibold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Format
                </p>
                <p className="text-lg font-black text-white mt-1">100% Numérique</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grille de contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne gauche (2/3) : Atouts, Procédure et Documents */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Atouts & Emblèmes */}
            <Card className="p-8 bg-white border-slate-200 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
                  ✨
                </div>
                <h2 className="text-2xl font-black text-slate-900">Pourquoi choisir {destination.country} ?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {destination.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-blue-600 font-bold mt-0.5">✓</span>
                    <span className="text-sm font-semibold text-slate-800">{h}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Emblèmes nationaux & Culture :</p>
                <div className="flex flex-wrap gap-2">
                  {destination.emblems.map((emb, i) => (
                    <Badge key={i} className="bg-blue-50 text-blue-800 border border-blue-200 font-semibold px-3 py-1 rounded-xl">
                      {emb}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Étapes de la procédure e-Visa */}
            <Card className="p-8 bg-white border-slate-200 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                  📋
                </div>
                <h2 className="text-2xl font-black text-slate-900">Procédure e-Visa étape par étape</h2>
              </div>
              <div className="space-y-4">
                {destination.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Étape {idx + 1}</h4>
                      <p className="text-sm text-slate-600 mt-0.5">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Traitement professionnel */}
            <Card className="p-8 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 text-white rounded-2xl flex items-center justify-center font-bold">
                  💼
                </div>
                <h3 className="text-xl font-bold text-white">Opportunités professionnelles & Contexte</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {destination.workInfo}
              </p>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs text-slate-200">
                <span className="font-bold text-amber-300">Note consulaire :</span> {destination.note}
              </div>
            </Card>

          </div>

          {/* Colonne droite (1/3) : Documents requis et CTA Lancer la procédure */}
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 bg-white border-slate-200 rounded-3xl shadow-lg space-y-6 sticky top-8">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Dossier requis</span>
                <h3 className="text-xl font-black text-slate-900">Documents nécessaires</h3>
              </div>

              <div className="space-y-3">
                {destination.docs.split(', ').map((doc, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{doc}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Garantie 3M Travel & Services :</p>
                  <p>Validation par nos experts avant soumission officielle sur le portail consulaire.</p>
                </div>

                <a href={`/evaluation-primaire?destination=${destination.id}&type=evisa`}>
                  <Button className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base">
                    🚀 Lancer la procédure e-Visa
                  </Button>
                </a>

                <a href={`/evisa/request?countryCode=${destination.id}&countryName=${encodeURIComponent(destination.country)}`}>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-bold py-3 px-6 rounded-2xl">
                    Soumettre mes documents en ligne
                  </Button>
                </a>
              </div>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
