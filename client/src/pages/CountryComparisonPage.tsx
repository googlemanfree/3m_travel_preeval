import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, Trash2, ExternalLink, Sparkles, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { procedures107Complete, CountryProcedureComplete } from '@/data/procedures107Complete';
import { toast } from 'sonner';

export default function CountryComparisonPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteCountries, setFavoriteCountries] = useState<CountryProcedureComplete[]>([]);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('3m_favorite_countries') || '[]');
      setFavoriteIds(favs);
      const matched = procedures107Complete.filter(c => favs.includes(c.id));
      setFavoriteCountries(matched);
    } catch (e) {
      setFavoriteIds([]);
      setFavoriteCountries([]);
    }
  }, []);

  const removeFavorite = (id: string) => {
    try {
      const updatedIds = favoriteIds.filter(fId => fId !== id);
      setFavoriteIds(updatedIds);
      setFavoriteCountries(procedures107Complete.filter(c => updatedIds.includes(c.id)));
      localStorage.setItem('3m_favorite_countries', JSON.stringify(updatedIds));
      toast.success("Destination retirée de vos favoris");
    } catch (e) {
      toast.error("Erreur lors de la suppression");
    }
  };

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
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <a href="/procedures" className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800 font-semibold text-sm transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour aux procédures
            </a>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Scale className="w-8 h-8 text-blue-600" /> Comparateur de Destinations Favorites
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Comparez côte à côte les critères clés de vos pays favoris pour choisir votre prochaine destination en toute sérénité.
            </p>
          </div>
          <a href="/procedures">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl shadow">
              + Ajouter d'autres pays
            </Button>
          </a>
        </div>

        {favoriteCountries.length === 0 ? (
          <Card className="p-12 text-center bg-white border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⭐
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Aucune destination en favori</h3>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              Explorez l'annuaire de nos 107 destinations et cliquez sur le bouton cœur de n'importe quel pays pour l'ajouter à votre comparateur.
            </p>
            <div className="pt-2">
              <a href="/procedures">
                <Button className="bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 text-white font-bold px-6 py-3 rounded-xl">
                  Explorer les 107 destinations
                </Button>
              </a>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto pb-6">
            <div className="min-w-[800px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoriteCountries.map((country) => (
                <motion.div
                  key={country.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 flex flex-col justify-between relative group"
                >
                  <button
                    onClick={() => removeFavorite(country.id)}
                    title="Retirer des favoris"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-6">
                    {/* En-tête carte */}
                    <div className="flex items-center gap-3 pr-8">
                      <span className="text-4xl p-2 bg-slate-50 rounded-2xl border border-slate-100">{country.flag}</span>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{country.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{country.region}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 font-bold uppercase text-[10px]">
                        Visa {country.visaType}
                      </Badge>
                      <Badge className={`text-[10px] font-bold ${getDifficultyColor(country.difficulty)}`}>
                        {country.difficulty}
                      </Badge>
                    </div>

                    {/* Critères comparatifs */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 text-sm">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Délai de traitement</span>
                        <span className="font-extrabold text-slate-800">{country.processingTime}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Coût estimé de la procédure</span>
                        <span className="font-extrabold text-slate-800">{country.cost}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Salaire minimum indicatif</span>
                        <span className="font-extrabold text-slate-800">{country.minSalary || 'Variable'}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Budget global agence</span>
                        <span className="font-extrabold text-slate-800">{country.totalCost || 'Sur devis'}</span>
                      </div>
                    </div>

                    {/* Points forts */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Atouts majeurs</span>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {country.highlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-6 mt-6 border-t border-slate-100">
                    <a href={`/procedures/${country.id}`} className="block">
                      <Button variant="outline" className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Voir la page complète
                      </Button>
                    </a>
                    <a href={`/evaluation-primaire?destination=${country.id}`} className="block">
                      <Button className="w-full bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 text-white font-bold py-2.5 rounded-xl text-xs shadow">
                        🚀 Lancer ma Procédure
                      </Button>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
