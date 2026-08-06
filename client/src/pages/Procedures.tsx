import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import {
  MessageCircle, Search, X, ChevronDown, ChevronUp,
  FileText, Globe, Star, Clock, DollarSign, CheckCircle,
  ArrowRight, Briefcase, GraduationCap, Eye, Home,
} from "lucide-react";

export default function Procedures() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [expandedDestination, setExpandedDestination] = useState<string | null>(null);

  // Données simplifiées des procédures
  const regions = [
    {
      id: "europe",
      name: "🇪🇺 Europe Schengen",
      destinations: [
        {
          id: "luxembourg",
          pays: "Luxembourg",
          flag: "🇱🇺",
          procedures: [
            {
              id: "lu-t1",
              title: "Carte Bleue UE — Salarié Hautement Qualifié",
              budget: "À partir de 2 800 000 FCFA",
              delai: "3–5 mois",
            },
          ],
        },
      ],
    },
  ];

  const handleContactWhatsApp = (destination: string) => {
    const msg = encodeURIComponent(
      `Bonjour 3M Travel & Services,\n\nJe suis intéressé(e) par les procédures pour ${destination}. Pouvez-vous m'accompagner ?`
    );
    window.open(`https://wa.me/237698104832?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
            🌍 Procédures officielles · Destinations mondiales
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Nous vous accompagnons<br />
            <span className="text-sky-300">partout dans le monde</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Découvrez toutes les procédures de visa, travail, études et résidence disponibles.
          </p>

          {/* Search Bar */}
          <div className="relative w-full max-w-2xl mx-auto mb-6">
            <div className="flex items-center bg-white rounded-2xl shadow-xl">
              <Search className="w-5 h-5 text-gray-400 ml-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un pays, un visa..."
                className="flex-1 px-4 py-4 text-gray-800 bg-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regions List */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {regions.map((region) => (
          <div key={region.id} className="mb-8">
            <button
              onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
              className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all flex items-center justify-between"
            >
              <h2 className="text-xl font-bold text-gray-900">{region.name}</h2>
              {selectedRegion === region.id ? (
                <ChevronUp className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {selectedRegion === region.id && (
              <div className="mt-4 space-y-4">
                {region.destinations.map((dest) => (
                  <div key={dest.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <button
                      onClick={() =>
                        setExpandedDestination(
                          expandedDestination === dest.id ? null : dest.id
                        )
                      }
                      className="w-full text-left flex items-center justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {dest.flag} {dest.pays}
                        </h3>
                      </div>
                      {expandedDestination === dest.id ? (
                        <ChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedDestination === dest.id && (
                      <div className="mt-4 space-y-3">
                        {dest.procedures.map((proc) => (
                          <div key={proc.id} className="bg-gray-50 rounded p-3 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">{proc.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {proc.budget}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {proc.delai}
                              </span>
                            </div>
                            <Button
                              onClick={() => handleContactWhatsApp(dest.pays)}
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Contacter via WhatsApp
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
}
