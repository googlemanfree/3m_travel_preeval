import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, TrendingUp } from "lucide-react";

interface SimulatorResult {
  score: number;
  level: string;
  color: string;
  message: string;
  recommendations: string[];
}

export function SimulatorExpress() {
  const [, navigate] = useLocation();
  const [domain, setDomain] = useState("");
  const [education, setEducation] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<SimulatorResult | null>(null);

  const domains = [
    { value: "tech", label: "Informatique & Tech" },
    { value: "health", label: "Santé & Médecine" },
    { value: "engineering", label: "Ingénierie" },
    { value: "business", label: "Commerce & Gestion" },
    { value: "education", label: "Éducation" },
    { value: "other", label: "Autre" },
  ];

  const educationLevels = [
    { value: "bac", label: "Baccalauréat" },
    { value: "licence", label: "Licence" },
    { value: "master", label: "Master" },
    { value: "doctorat", label: "Doctorat" },
  ];

  const destinations = [
    { value: "poland", label: "🇵🇱 Pologne", score: 95 },
    { value: "canada", label: "🇨🇦 Canada", score: 90 },
    { value: "germany", label: "🇩🇪 Allemagne", score: 85 },
    { value: "schengen", label: "🇪🇺 Schengen", score: 80 },
    { value: "luxembourg", label: "🇱🇺 Luxembourg", score: 75 },
  ];

  const calculateScore = () => {
    if (!domain || !education || !destination) return;

    let score = 50;

    // Education bonus
    const eduBonus: Record<string, number> = {
      bac: 10,
      licence: 20,
      master: 30,
      doctorat: 40,
    };
    score += eduBonus[education] || 0;

    // Domain bonus
    const domainBonus: Record<string, number> = {
      tech: 15,
      health: 15,
      engineering: 20,
      business: 10,
      education: 5,
      other: 0,
    };
    score += domainBonus[domain] || 0;

    // Destination multiplier
    const destData = destinations.find((d) => d.value === destination);
    if (destData) {
      score = Math.min(100, (score / 100) * destData.score + 30);
    }

    let level = "Faible";
    let color = "text-red-600";
    let message = "Renforcez votre profil avant de postuler.";
    let recommendations = [
      "Améliorer votre niveau de langue",
      "Obtenir une certification professionnelle",
      "Acquérir plus d'expérience",
    ];

    if (score >= 80) {
      level = "Excellent";
      color = "text-green-600";
      message = "Votre profil est très compétitif ! Commencez votre évaluation.";
      recommendations = [
        "Préparer vos documents",
        "Consulter nos experts",
        "Démarrer l'évaluation complète",
      ];
    } else if (score >= 60) {
      level = "Bon";
      color = "text-blue-600";
      message = "Votre profil a du potentiel. Approfondissez votre évaluation.";
      recommendations = [
        "Améliorer certains critères",
        "Consulter nos experts",
        "Démarrer l'évaluation",
      ];
    }

    setResult({
      score: Math.round(score),
      level,
      color,
      message,
      recommendations,
    });
  };

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-900">
                Calculer mes Chances en 30 Secondes
              </h2>
            </div>
            <p className="text-gray-600">
              Découvrez votre indice d'opportunité pour votre destination rêvée
            </p>
          </div>

          <Card className="p-8 border-2 border-blue-200">
            <div className="space-y-6">
              {/* Domain Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre Domaine d'Expertise
                </label>
                <Select value={domain} onValueChange={setDomain}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez votre domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Education Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niveau d'Études
                </label>
                <Select value={education} onValueChange={setEducation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez votre niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination Souhaitée
                </label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez votre destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Calculate Button */}
              <Button
                onClick={calculateScore}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Calculer mon Indice d'Opportunité
              </Button>
            </div>

            {/* Results */}
            {result && (
              <div className="mt-8 pt-8 border-t-2 border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                    <span className={`text-4xl font-bold ${result.color}`}>
                      {result.score}%
                    </span>
                  </div>
                  <h3 className={`text-2xl font-bold ${result.color} mb-2`}>
                    {result.level}
                  </h3>
                  <p className="text-gray-700 font-medium">{result.message}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Prochaines Étapes :
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => navigate("/evaluation")}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                >
                  Commencer l'Évaluation Complète
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
