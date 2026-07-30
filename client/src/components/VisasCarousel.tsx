import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface VisaAccorded {
  id: string;
  destination: string;
  flag: string;
  visaType: string;
  date: string;
  successRate: number;
}

const visasData: VisaAccorded[] = [
  {
    id: "1",
    destination: "Pologne",
    flag: "🇵🇱",
    visaType: "Visa Type D (Études)",
    date: "Juillet 2026",
    successRate: 95,
  },
  {
    id: "2",
    destination: "Canada",
    flag: "🇨🇦",
    visaType: "Permis d'Études",
    date: "Juin 2026",
    successRate: 90,
  },
  {
    id: "3",
    destination: "Schengen",
    flag: "🇪🇺",
    visaType: "Visa Schengen (Affaires)",
    date: "Mai 2026",
    successRate: 88,
  },
  {
    id: "4",
    destination: "Allemagne",
    flag: "🇩🇪",
    visaType: "Visa de Travail",
    date: "Avril 2026",
    successRate: 92,
  },
  {
    id: "5",
    destination: "Luxembourg",
    flag: "🇱🇺",
    visaType: "Visa de Résidence",
    date: "Mars 2026",
    successRate: 85,
  },
];

export function VisasCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % visasData.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + visasData.length) % visasData.length);
  };

  const visibleItems = [];
  for (let i = 0; i < itemsPerView; i++) {
    visibleItems.push(visasData[(currentIndex + i) % visasData.length]);
  }

  return (
    <section className="py-16 bg-gradient-to-b from-blue-900/10 to-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            ✨ Visas & Permis Accordés
          </h2>
          <p className="text-gray-600">
            Découvrez les succès de nos clients (données anonymisées)
          </p>
        </div>

        <div className="relative">
          {/* Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {visibleItems.map((visa) => (
              <Card
                key={visa.id}
                className="overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 bg-white/80 backdrop-blur-sm"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                  <div className="text-5xl mb-2">{visa.flag}</div>
                  <h3 className="text-2xl font-bold">{visa.destination}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Type de Visa</p>
                  <p className="font-semibold text-gray-900 mb-4">{visa.visaType}</p>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-600">
                        Taux de Succès
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {visa.successRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${visa.successRate}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">{visa.date}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={prevSlide}
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-300 hover:bg-blue-50"
            >
              <ChevronLeft className="w-5 h-5 text-blue-600" />
            </Button>
            <Button
              onClick={nextSlide}
              variant="outline"
              size="icon"
              className="rounded-full border-2 border-blue-300 hover:bg-blue-50"
            >
              <ChevronRight className="w-5 h-5 text-blue-600" />
            </Button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {visasData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "bg-blue-600 w-8" : "bg-blue-200 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
