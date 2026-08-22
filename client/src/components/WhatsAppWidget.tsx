import { useState } from "react";
import { MessageCircle, X, Phone, Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_NUMBER = "16728972999";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

interface WhatsAppOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  message: string;
}

const whatsappOptions: WhatsAppOption[] = [
  {
    id: "visa",
    icon: <Info className="w-5 h-5" />,
    label: "Information Visa & Immigration",
    message: "Bonjour, j'aimerais des informations sur les procédures de visa.",
  },
  {
    id: "flight",
    icon: <Phone className="w-5 h-5" />,
    label: "Achat / Réservation de Billet",
    message: "Bonjour, je souhaite réserver un billet d'avion.",
  },
  {
    id: "rdv",
    icon: <Calendar className="w-5 h-5" />,
    label: "Prendre RDV à l'agence",
    message: "Bonjour, je voudrais prendre un rendez-vous à l'agence de Yaoundé.",
  },
];

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`${WHATSAPP_URL}?text=${encodedMessage}`, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Menu Options */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden mb-2 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-green-500 text-white p-3 font-semibold text-sm">
            Comment pouvons-nous vous aider ?
          </div>
          <div className="divide-y">
            {whatsappOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleWhatsAppClick(option.message)}
                className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center gap-3 text-sm"
              >
                <div className="text-green-500 flex-shrink-0">{option.icon}</div>
                <span className="text-gray-800 font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap animate-in fade-in duration-300">
          Besoin d'aide ?
        </div>
      )}
    </div>
  );
}
