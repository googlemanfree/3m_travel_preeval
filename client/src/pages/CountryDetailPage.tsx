import React from 'react';
import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Download, ArrowLeft, CheckCircle2, FileText, Briefcase, Globe, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { procedures107Complete } from '@/data/procedures107Complete';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function CountryDetailPage() {
  const [, params] = useRoute<{ countryId: string }>('/procedures/:countryId');
  const countryId = params?.countryId;

  const country = procedures107Complete.find(c => c.id === countryId);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (countryId) {
      try {
        const favs = JSON.parse(localStorage.getItem('3m_favorite_countries') || '[]');
        setIsFavorite(favs.includes(countryId));
      } catch (e) {}
    }
  }, [countryId]);

  const toggleFavorite = () => {
    if (!countryId) return;
    try {
      const favs = JSON.parse(localStorage.getItem('3m_favorite_countries') || '[]');
      let updated = [];
      if (isFavorite) {
        updated = favs.filter((id: string) => id !== countryId);
        setIsFavorite(false);
        toast.success("Destination retirée de vos favoris");
      } else {
        updated = [...favs, countryId];
        setIsFavorite(true);
        toast.success("Destination enregistrée dans vos favoris !");
      }
      localStorage.setItem('3m_favorite_countries', JSON.stringify(updated));
    } catch (e) {
      toast.error("Erreur lors de la mise à jour des favoris");
    }
  };

  if (!country) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Destination non trouvée</h2>
        <p className="text-slate-600 mb-6">Le pays demandé n'existe pas dans notre répertoire des 107 destinations.</p>
        <a href="/procedures">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux procédures
          </Button>
        </a>
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'facile': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'moyen': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'difficile': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation retour */}
        <div>
          <a href="/procedures" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-semibold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à l'annuaire des procédures
          </a>
        </div>

        {/* En-tête du Pays */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 min-w-0 w-full">
              <span className="text-6xl sm:text-7xl p-3 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner">{country.flag}</span>
              <div className="min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <Badge className="bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase tracking-wider text-xs max-w-full whitespace-normal">
                    {country.region}
                  </Badge>
                  <Badge className={`text-xs ${getDifficultyColor(country.difficulty)} font-bold max-w-full whitespace-normal`}>
                    Niveau : {country.difficulty}
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{country.name}</h1>
                <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Programme officiel d'immigration & visa {country.visaType}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
              <Button
                onClick={toggleFavorite}
                variant="outline"
                className={`w-full sm:w-auto font-bold px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  isFavorite 
                    ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current text-white' : ''}`} />
                {isFavorite ? 'Dans vos favoris' : 'Favori'}
              </Button>

              <a href={`/evaluation-primaire?destination=${country.id}`} className="w-full sm:w-auto flex-1 md:flex-initial">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-6 py-3 rounded-xl shadow-lg transition-all hover:scale-105">
                  🚀 Lancer ma Procédure
                </Button>
              </a>
              {country.pdfUrl && (
                <a href={country.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex-1 md:flex-initial">
                  <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold px-6 py-3 rounded-xl">
                    <Download className="w-4 h-4 mr-2" /> Guide PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Indicateurs clés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-slate-200 shadow-sm bg-white rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Délai de traitement</p>
            <p className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> {country.processingTime}
            </p>
          </Card>
          <Card className="p-5 border-slate-200 shadow-sm bg-white rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Coût estimé</p>
            <p className="text-lg font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> {country.cost}
            </p>
          </Card>
          <Card className="p-5 border-slate-200 shadow-sm bg-white rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Salaire minimum indicatif</p>
            <p className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" /> {country.minSalary || 'Variable'}
            </p>
          </Card>
          <Card className="p-5 border-slate-200 shadow-sm bg-white rounded-2xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget global agence</p>
            <p className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" /> {country.totalCost || 'Sur devis'}
            </p>
          </Card>
        </div>

        {/* Contenu principal : Description, Culture & Travail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Description détaillée */}
            <Card className="p-8 border-slate-200 shadow-sm bg-white rounded-3xl space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-700" /> Présentation de la Destination & Culture
              </h2>
              <p className="text-slate-700 leading-relaxed text-base">{country.description}</p>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-slate-700 leading-relaxed text-sm">
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" /> Pourquoi choisir {country.name} ?
                </h4>
                <p>{country.detailedDescription}</p>
              </div>

              <h3 className="text-lg font-bold text-slate-900 pt-4">Points forts & Opportunités</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {country.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-800">{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Procédure étape par étape */}
            <Card className="p-8 border-slate-200 shadow-sm bg-white rounded-3xl space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-indigo-700" /> Étapes de la Procédure pour {country.name}
              </h2>
              <div className="space-y-4">
                {country.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Étape {idx + 1}</h4>
                      <p className="text-slate-600 text-sm mt-0.5">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Colonne latérale : Documents requis & Appel à l'action */}
          <div className="space-y-6">
            <Card className="p-6 border-slate-200 shadow-sm bg-white rounded-3xl space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" /> Documents Requis
              </h3>
              <div className="space-y-5">
                {country.requiredDocuments.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg">
                      {cat.category}
                    </h4>
                    <ul className="space-y-2 pl-2">
                      {cat.documents.map((doc, dIdx) => (
                        <li key={dIdx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <a href={`/evaluation-primaire?destination=${country.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-3.5 rounded-xl shadow-md">
                    🚀 Commencer mon Dossier
                  </Button>
                </a>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg space-y-4">
              <h4 className="font-bold text-lg">Besoin d'aide sur {country.name} ?</h4>
              <p className="text-blue-200 text-sm">Nos conseillers experts en mobilité internationale vous accompagnent de A à Z dans vos démarches.</p>
              <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow">
                  💬 Discuter sur WhatsApp
                </Button>
              </a>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
