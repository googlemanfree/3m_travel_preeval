import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Trash2, ExternalLink, Sparkles, Scale, UserCheck, Sliders, Briefcase, GraduationCap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { procedures107Complete, CountryProcedureComplete } from '@/data/procedures107Complete';
import { toast } from 'sonner';

export default function CountryComparisonPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteCountries, setFavoriteCountries] = useState<CountryProcedureComplete[]>([]);

  // Profil candidat interactif
  const [userProfile, setUserProfile] = useState({
    education: 'bac_plus_3', // bac, bac_plus_2, bac_plus_3, master_phd
    experience: '3_5_ans',   // 0_1_ans, 1_3_ans, 3_5_ans, plus_5_ans
    budget: 'moyen',          // faible, moyen, eleve
    targetVisa: 'tous'        // tous, travail, etudes, visiteur
  });

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('3m_favorite_countries') || '[]');
      setFavoriteIds(favs);
      const matched = procedures107Complete.filter(c => favs.includes(c.id));
      setFavoriteCountries(matched);

      const savedProfile = localStorage.getItem('3m_candidate_profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (e) {
      setFavoriteIds([]);
      setFavoriteCountries([]);
    }
  }, []);

  const handleProfileChange = (key: string, value: string) => {
    const updated = { ...userProfile, [key]: value };
    setUserProfile(updated);
    try {
      localStorage.setItem('3m_candidate_profile', JSON.stringify(updated));
    } catch (e) {}
  };

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

  // Calcul dynamique de compatibilité en fonction du profil candidat et du pays
  const getDynamicCompatibility = (country: CountryProcedureComplete) => {
    let score = 70;

    // Type de visa
    if (userProfile.targetVisa === 'tous' || userProfile.targetVisa === country.visaType) {
      score += 10;
    } else {
      score -= 15;
    }

    // Niveau d'études
    if (userProfile.education === 'master_phd') score += 12;
    else if (userProfile.education === 'bac_plus_3') score += 8;
    else if (userProfile.education === 'bac_plus_2') score += 4;
    else score -= 5;

    // Expérience
    if (userProfile.experience === 'plus_5_ans') score += 10;
    else if (userProfile.experience === '3_5_ans') score += 8;
    else if (userProfile.experience === '1_3_ans') score += 4;
    else score -= 5;

    // Difficulté pays
    if (country.difficulty === 'facile') score += 8;
    else if (country.difficulty === 'moyen') score += 3;
    else score -= 5;

    // Variation stable par pays
    const hash = country.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    score += (hash % 7) - 3;

    return Math.min(99, Math.max(50, score));
  };

  const getCompatibilityDetails = (country: CountryProcedureComplete) => {
    const score = getDynamicCompatibility(country);
    const reasons: { text: string; positive: boolean }[] = [];
    const recommendations: string[] = [];

    if (userProfile.targetVisa === 'tous' || userProfile.targetVisa === country.visaType) {
      reasons.push({ text: `Type de visa (${country.visaType}) parfaitement aligné`, positive: true });
    } else {
      reasons.push({ text: `Visa demandé (${country.visaType}) différent de votre préférence`, positive: false });
      recommendations.push(`Vérifiez si une transition vers le visa ${country.visaType} correspond à vos objectifs.`);
    }

    if (userProfile.education === 'master_phd' || userProfile.education === 'bac_plus_3') {
      reasons.push({ text: `Niveau d'études supérieur validé pour ce programme`, positive: true });
    } else {
      reasons.push({ text: `Niveau d'études standard acceptant des compléments de formation`, positive: true });
      recommendations.push(`Envisagez une équivalence de diplôme ou une formation certifiante complémentaire.`);
    }

    if (userProfile.experience === 'plus_5_ans' || userProfile.experience === '3_5_ans') {
      reasons.push({ text: `Expérience professionnelle solide valorisée`, positive: true });
    } else {
      reasons.push({ text: `Expérience débutante nécessitant un accompagnement renforcé`, positive: false });
      recommendations.push(`Documentez vos stages, projets associatifs ou réalisations pour compenser.`);
    }

    if (country.difficulty === 'facile') {
      reasons.push({ text: `Démarches administratives fluidifiées et rapides`, positive: true });
    } else if (country.difficulty === 'moyen') {
      reasons.push({ text: `Procédure standard avec exigences réglementaires modérées`, positive: true });
    } else {
      reasons.push({ text: `Procédure sélective exigeant un dossier d'excellence`, positive: false });
      recommendations.push(`Préparez un CV aux normes internationales et des lettres de motivation percutantes.`);
    }

    if (userProfile.budget === 'faible' && country.cost.includes('Élevé')) {
      recommendations.push(`Prévoyez un cofinancement ou une bourse d'études pour couvrir le budget.`);
    }

    return { score, reasons, recommendations };
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
              Ajustez votre profil ci-dessous pour voir les scores de compatibilité se mettre à jour en temps réel.
            </p>
          </div>
          <a href="/procedures">
            <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-xl shadow">
              + Ajouter d'autres pays
            </Button>
          </a>
        </div>

        {/* Panneau de profil interactif */}
        <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-3xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Ajuster mon profil pour affirmer les scores de compatibilité</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" /> Niveau d'Études
              </label>
              <select
                value={userProfile.education}
                onChange={(e) => handleProfileChange('education', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="bac">Baccalauréat</option>
                <option value="bac_plus_2">Bac +2 / BTS / DUT</option>
                <option value="bac_plus_3">Bac +3 / Licence</option>
                <option value="master_phd">Master / Doctorat</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Expérience Professionnelle
              </label>
              <select
                value={userProfile.experience}
                onChange={(e) => handleProfileChange('experience', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="0_1_ans">Moins d'un an</option>
                <option value="1_3_ans">1 à 3 ans</option>
                <option value="3_5_ans">3 à 5 ans</option>
                <option value="plus_5_ans">Plus de 5 ans</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Budget Envisagé
              </label>
              <select
                value={userProfile.budget}
                onChange={(e) => handleProfileChange('budget', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="faible">Économique (&lt; 2000€)</option>
                <option value="moyen">Standard (2000€ - 5000€)</option>
                <option value="eleve">Confort (&gt; 5000€)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" /> Type de Visa Souhaité
              </label>
              <select
                value={userProfile.targetVisa}
                onChange={(e) => handleProfileChange('targetVisa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="tous">Tous les types</option>
                <option value="travail">Travail uniquement</option>
                <option value="etudes">Études uniquement</option>
                <option value="visiteur">Visiteur / Tourisme</option>
              </select>
            </div>
          </div>
        </Card>

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
              {favoriteCountries.map((country) => {
                const compatibility = getDynamicCompatibility(country);
                return (
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

                    <div className="space-y-5">
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

                      {/* Indicateur de compatibilité profil avec infobulle détaillée */}
                      {(() => {
                        const { score, reasons } = getCompatibilityDetails(country);
                        return (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3.5 rounded-2xl relative group cursor-help">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Compatibilité Profil (i)
                              </span>
                              <span className="text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
                                {score}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${score}%` }}
                              />
                            </div>

                            {/* Infobulle au survol avec recommandations */}
                            {(() => {
                              const { reasons, recommendations } = getCompatibilityDetails(country);
                              return (
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-80 p-4 bg-slate-900 text-white text-xs rounded-2xl shadow-2xl z-50 pointer-events-none space-y-3 border border-slate-700">
                                  <p className="font-bold text-amber-400 border-b border-slate-700 pb-1.5 flex items-center justify-between">
                                    <span>Analyse & Conseils : {country.name}</span>
                                  </p>
                                  <ul className="space-y-1.5">
                                    {reasons.map((r, idx) => (
                                      <li key={idx} className="flex items-start gap-1.5">
                                        <span className={r.positive ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                          {r.positive ? '✓' : '•'}
                                        </span>
                                        <span className="text-slate-200">{r.text}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {recommendations.length > 0 && (
                                    <div className="pt-2 border-t border-slate-700 space-y-1">
                                      <p className="font-bold text-blue-300">💡 Actions recommandées :</p>
                                      <ul className="space-y-1 text-slate-300">
                                        {recommendations.map((rec, i) => (
                                          <li key={i} className="flex items-start gap-1">
                                            <span className="text-blue-400">→</span>
                                            <span>{rec}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* Critères comparatifs */}
                      <div className="space-y-3 pt-1 border-t border-slate-100 text-sm">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Délai de traitement</span>
                          <span className="font-extrabold text-slate-800">{country.processingTime}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Coût estimé</span>
                          <span className="font-extrabold text-slate-800">{country.cost}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Salaire minimum</span>
                          <span className="font-extrabold text-slate-800">{country.minSalary || 'Variable'}</span>
                        </div>
                      </div>

                      {/* Points forts */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Atouts majeurs</span>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {country.highlights.slice(0, 2).map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-5 mt-5 border-t border-slate-100">
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
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
