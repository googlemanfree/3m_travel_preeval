import React from "react";
import { QrCode, Facebook } from "lucide-react";

export default function FacebookQRCodeWidget() {
  const facebookUrl = "https://www.facebook.com/3mtravelcm";
  // Utilisation d'une API publique normalisée pour générer le QR code de la page officielle
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(facebookUrl)}&color=0f2460&bgcolor=ffffff`;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 text-white max-w-sm mx-auto my-6">
      <div className="bg-white p-2 rounded-xl shadow-md flex-shrink-0">
        <img
          src={qrCodeImageUrl}
          alt="QR Code Page Facebook 3M Travel & Services"
          className="w-24 h-24 object-contain"
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-1">
          <Facebook className="w-3.5 h-3.5 fill-current" />
          <span>Scanner le QR Code</span>
        </div>
        <p className="text-sm font-bold leading-snug">
          Rejoignez-nous sur Facebook !
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Flashez avec votre smartphone pour accèder à <span className="underline font-mono">3mtravelcm</span>.
        </p>
      </div>
    </div>
  );
}
