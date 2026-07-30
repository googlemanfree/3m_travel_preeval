import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Award, Globe, Filter, Star, CheckCircle } from "lucide-react";

const COUNTRIES = ["Tous", "France", "Canada", "Allemagne", "Belgique", "USA", "Maroc"];
const VISA_TYPES = ["Tous", "Étudiant", "Travail", "Tourisme", "Regroupement familial"];

const VISA_COLORS: Record<string, string> = {
  "Étudiant": "bg-blue-100 text-blue-700",
  "Travail": "bg-green-100 text-green-700",
  "Tourisme": "bg-orange-100 text-orange-700",
  "Regroupement familial": "bg-purple-100 text-purple-700",
};

const FLAG_EMOJIS: Record<string, string> = {
  "France": "🇫🇷",
  "Canada": "🇨🇦",
  "Allemagne": "🇩🇪",
  "Belgique": "🇧🇪",
  "USA": "🇺🇸",
  "Maroc": "🇲🇦",
};

// Données de démonstration (seront remplacées par les vraies données de la DB)
const DEMO_VISAS = [
  { id: 1, firstName: "Marie", country: "France", visaType: "Étudiant", destination: "Paris", approvedDate: "Juin 2025", testimonial: "Excellent service, dossier traité en 3 semaines !" },
  { id: 2, firstName: "Jean", country: "Canada", visaType: "Travail", destination: "Montréal", approvedDate: "Mai 2025", testimonial: "Équipe professionnelle et réactive." },
  { id: 3, firstName: "Fatou", country: "Allemagne", visaType: "Étudiant", destination: "Berlin", approvedDate: "Avril 2025", testimonial: "Visa obtenu du premier coup !" },
  { id: 4, firstName: "Paul", country: "Belgique", visaType: "Étudiant", destination: "Bruxelles", approvedDate: "Mars 2025", testimonial: "Je recommande vivement 3M Travel." },
  { id: 5, firstName: "Aminata", country: "France", visaType: "Regroupement familial", destination: "Lyon", approvedDate: "Février 2025", testimonial: "Merci pour votre accompagnement tout au long du processus." },
  { id: 6, firstName: "David", country: "USA", visaType: "Tourisme", destination: "New York", approvedDate: "Janvier 2025", testimonial: "Rapide et efficace !" },
  { id: 7, firstName: "Sophie", country: "Canada", visaType: "Étudiant", destination: "Toronto", approvedDate: "Décembre 2024", testimonial: "Dossier complet et bien préparé." },
  { id: 8, firstName: "Ibrahim", country: "France", visaType: "Travail", destination: "Marseille", approvedDate: "Novembre 2024", testimonial: "Service impeccable." },
  { id: 9, firstName: "Cécile", country: "Allemagne", visaType: "Travail", destination: "Munich", approvedDate: "Octobre 2024", testimonial: "Très satisfaite du résultat." },
  { id: 10, firstName: "Moussa", country: "Belgique", visaType: "Tourisme", destination: "Liège", approvedDate: "Septembre 2024", testimonial: "Professionnel et disponible." },
  { id: 11, firstName: "Aïcha", country: "France", visaType: "Étudiant", destination: "Toulouse", approvedDate: "Août 2024", testimonial: "Visa obtenu en moins d'un mois !" },
  { id: 12, firstName: "Théo", country: "Canada", visaType: "Travail", destination: "Vancouver", approvedDate: "Juillet 2024", testimonial: "Excellent accompagnement." },
];

export default function VisaGallery() {
  const [filterCountry, setFilterCountry] = useState("Tous");
  const [filterType, setFilterType] = useState("Tous");

  const { data: dbVisas } = trpc.extras.getApprovedVisas.useQuery({ limit: 50 });

  // Utiliser les données DB si disponibles, sinon les données de démo
  const allVisas = (dbVisas && dbVisas.length > 0) ? dbVisas : DEMO_VISAS;

  const filteredVisas = allVisas.filter((v) => {
    const countryMatch = filterCountry === "Tous" || v.country === filterCountry;
    const typeMatch = filterType === "Tous" || v.visaType === filterType;
    return countryMatch && typeMatch;
  });

  const stats = {
    total: allVisas.length,
    countries: new Set(allVisas.map((v) => v.country)).size,
    types: new Set(allVisas.map((v) => v.visaType)).size,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a2744] to-[#2d4a8a] text-white py-16">
        <div className="container max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Nos Réussites</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Galerie des Visas Accordés
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
            Découvrez les succès de nos clients. Chaque visa accordé représente un rêve réalisé 
            grâce à l'accompagnement de notre équipe.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { label: "Visas accordés", value: `${stats.total}+` },
              { label: "Pays couverts", value: `${stats.countries}` },
              { label: "Types de visa", value: `${stats.types}` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{s.value}</div>
                <div className="text-xs text-blue-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container max-w-5xl py-12">
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtrer par :</span>
          </div>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Pays" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c !== "Tous" ? `${FLAG_EMOJIS[c] ?? "🌍"} ` : ""}{c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Type de visa" />
            </SelectTrigger>
            <SelectContent>
              {VISA_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="ml-auto self-center">
            {filteredVisas.length} résultat{filteredVisas.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Grille de visas */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisas.map((visa) => (
            <Card key={visa.id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {visa.firstName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{visa.firstName}</p>
                      <p className="text-xs text-gray-500">{visa.approvedDate}</p>
                    </div>
                  </div>
                  <span className="text-2xl">{FLAG_EMOJIS[visa.country] ?? "🌍"}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={`text-xs ${VISA_COLORS[visa.visaType] ?? "bg-gray-100 text-gray-700"}`}>
                    {visa.visaType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    {visa.destination}
                  </Badge>
                </div>

                {/* Testimonial */}
                {visa.testimonial && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm italic">"{visa.testimonial}"</p>
                  </div>
                )}

                {/* Success indicator */}
                <div className="flex items-center gap-1.5 mt-3 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Visa accordé ✓</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVisas.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun résultat</h3>
            <p className="text-gray-500">Essayez d'autres filtres pour voir plus de résultats.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setFilterCountry("Tous"); setFilterType("Tous"); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#1a2744] to-[#2d4a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Votre visa sera le prochain !</h2>
          <p className="text-blue-200 mb-6 max-w-lg mx-auto">
            Rejoignez nos centaines de clients satisfaits. Commencez votre évaluation gratuite aujourd'hui.
          </p>
          <Button className="bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold px-8 h-12">
            Évaluer mon éligibilité gratuitement
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
