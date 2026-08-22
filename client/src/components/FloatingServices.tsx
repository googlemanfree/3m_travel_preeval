import { useState } from "react";
import { useLocation } from "wouter";

interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
  path: string;
  description: string;
}

const services: Service[] = [
  {
    id: "visa",
    name: "Visa & Immigration",
    icon: "🛂",
    color: "bg-blue-600",
    path: "/",
    description: "Évaluation gratuite",
  },
  {
    id: "flights",
    name: "Billets d'avion",
    icon: "✈️",
    color: "bg-cyan-500",
    path: "/flights",
    description: "Meilleurs tarifs",
  },
  {
    id: "hotels",
    name: "Hôtels, véhicules & Tourisme",
    icon: "🏨",
    color: "bg-amber-500",
    path: "/tourisme",
    description: "Hôtels, véhicules et packs",
  },
  {
    id: "insurance",
    name: "Assurance voyage",
    icon: "🛡️",
    color: "bg-green-600",
    path: "#",
    description: "Protection complète",
  },
  {
    id: "translation",
    name: "Traduction Certifiée",
    icon: "📄",
    color: "bg-purple-600",
    path: "#",
    description: "Documents officiels",
  },
  {
    id: "procedures",
    name: "Procédures & Guides",
    icon: "📋",
    color: "bg-indigo-600",
    path: "/procedures",
    description: "Toutes les infos",
  },
];

export default function FloatingServices() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  const handleServiceClick = (path: string) => {
    if (path !== "#") {
      navigate(path);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110 ${
          isOpen
            ? "bg-gradient-to-br from-blue-600 to-blue-800 rotate-45"
            : "bg-gradient-to-br from-blue-600 to-blue-800"
        }`}
        title="Services"
      >
        <span className={`transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
          ⚙️
        </span>
      </button>

      {/* Floating menu items */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80">
          {/* Grid of services */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {services.map((service, index) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.path)}
                className={`p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-white border-l-4 ${service.color} animate-fade-in`}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: "fadeInUp 0.3s ease-out forwards",
                  opacity: 0,
                }}
              >
                <div className="text-3xl mb-2">{service.icon}</div>
                <div className="text-left">
                  <h3 className="font-bold text-sm text-slate-900">{service.name}</h3>
                  <p className="text-xs text-slate-600">{service.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Quick contact */}
          <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-blue-600">
            <p className="text-xs text-slate-600 mb-3">Besoin d'aide ?</p>
            <a
              href="https://wa.me/16728972999"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
