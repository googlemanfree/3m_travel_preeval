import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calculator, Globe, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

const COUNTRIES = ["France", "Canada", "Allemagne", "Belgique", "USA", "Maroc"];
const VISA_TYPES = ["Étudiant", "Travail", "Tourisme", "Regroupement familial"];

const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

export default function BudgetCalculator() {
  const [country, setCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [includeTranslation, setIncludeTranslation] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { data: budget, isLoading } = trpc.extras.calculateBudget.useQuery(
    { country, visaType, includeTranslation },
    { enabled: showResult && !!country && !!visaType }
  );

  const handleCalculate = () => {
    if (country && visaType) setShowResult(true);
  };

  const handleReset = () => {
    setShowResult(false);
    setCountry("");
    setVisaType("");
    setIncludeTranslation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a2744] to-[#2d4a8a] text-white py-16">
        <div className="container max-w-4xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Calculator className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Outil Gratuit</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Calculateur de Budget Visa
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Estimez le coût total de votre dossier de visa en quelques secondes. 
              Frais consulaires, services 3M, traductions et plus encore.
            </p>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Formulaire */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1a2744]">
                <Globe className="w-5 h-5 text-blue-600" />
                Votre projet de visa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Pays de destination</Label>
                <Select value={country} onValueChange={(v) => { setCountry(v); setShowResult(false); }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Type de visa</Label>
                <Select value={visaType} onValueChange={(v) => { setVisaType(v); setShowResult(false); }}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez le type de visa" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Inclure la traduction</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Documents officiels traduits et certifiés</p>
                </div>
                <Switch
                  checked={includeTranslation}
                  onCheckedChange={(v) => { setIncludeTranslation(v); setShowResult(false); }}
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={!country || !visaType}
                className="w-full h-12 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold text-base"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculer mon budget
              </Button>

              {showResult && (
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Nouvelle simulation
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Résultat */}
          <div>
            {!showResult && (
              <Card className="shadow-lg border-0 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Votre estimation apparaîtra ici
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Sélectionnez un pays et un type de visa pour obtenir une estimation détaillée.
                  </p>
                </CardContent>
              </Card>
            )}

            {showResult && isLoading && (
              <Card className="shadow-lg border-0 h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Calcul en cours...</p>
                </CardContent>
              </Card>
            )}

            {showResult && !isLoading && !budget && (
              <Card className="shadow-lg border-0 border-l-4 border-l-orange-400">
                <CardContent className="py-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Tarif non disponible</h3>
                      <p className="text-gray-600 text-sm">
                        Nous n'avons pas encore de tarif configuré pour cette combinaison. 
                        Contactez-nous pour un devis personnalisé.
                      </p>
                      <Button className="mt-4 bg-[#1a2744] hover:bg-[#2d4a8a]" size="sm">
                        Demander un devis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {showResult && !isLoading && budget && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-[#1a2744] to-[#2d4a8a] text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm mb-1">Estimation pour</p>
                      <CardTitle className="text-white text-xl">
                        Visa {budget.visaType} — {budget.country}
                      </CardTitle>
                    </div>
                    <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                      {budget.successRate}% de succès
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Délai */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Délai de traitement estimé</p>
                      <p className="font-semibold text-gray-800">{budget.processingDays} jours ouvrés</p>
                    </div>
                  </div>

                  {/* Détail des frais */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Détail des frais
                    </h4>
                    
                    {[
                      { label: "Frais consulaires", amount: budget.breakdown.visaFee, icon: "🏛️" },
                      { label: "Services 3M Travel", amount: budget.breakdown.serviceFee, icon: "🤝" },
                      ...(budget.breakdown.guaranteeFee > 0 ? [{ label: "Garantie financière", amount: budget.breakdown.guaranteeFee, icon: "🔒" }] : []),
                      ...(budget.breakdown.translationFee > 0 ? [{ label: "Traduction certifiée", amount: budget.breakdown.translationFee, icon: "📝" }] : []),
                      ...(budget.breakdown.otherFees > 0 ? [{ label: "Autres frais", amount: budget.breakdown.otherFees, icon: "📋" }] : []),
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <span>{item.icon}</span>
                          {item.label}
                        </span>
                        <span className="font-medium text-gray-800 text-sm">
                          {formatFCFA(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-r from-[#1a2744] to-[#2d4a8a] text-white rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                        <span className="font-semibold">Total estimé</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-400">
                        {formatFCFA(budget.total)}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>
                      Cette estimation est indicative. Le montant final peut varier selon votre profil et les exigences consulaires. 
                      Contactez-nous pour un devis précis.
                    </p>
                  </div>

                  <Button className="w-full bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold">
                    Démarrer mon dossier
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "💡",
              title: "Estimation gratuite",
              desc: "Notre calculateur est 100% gratuit et sans engagement. Simulez autant de scénarios que vous souhaitez."
            },
            {
              icon: "🎯",
              title: "Tarifs transparents",
              desc: "Nous affichons tous les frais sans surprise. Frais consulaires, services et traductions inclus."
            },
            {
              icon: "📞",
              title: "Devis personnalisé",
              desc: "Votre situation est unique. Contactez-nous pour un devis adapté à votre profil et vos besoins."
            }
          ].map((item) => (
            <Card key={item.title} className="border-0 shadow-sm text-center p-6">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
