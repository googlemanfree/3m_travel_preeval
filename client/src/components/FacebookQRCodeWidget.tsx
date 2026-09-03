import React from "react";
import { Facebook } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FacebookQRCodeWidget() {
  const facebookUrl = "https://www.facebook.com/3mtravelcm";
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(facebookUrl)}&color=0f2460&bgcolor=ffffff`;
  const { language } = useLanguage();
  const t = (fr: string, en: string) => language === "en" ? en : fr;

  return <div className="w-full max-w-[10rem] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 flex flex-col items-center gap-2 text-center text-white mx-auto my-2"><div className="bg-white p-2 rounded-xl shadow-md flex-shrink-0"><img src={qrCodeImageUrl} alt={t("Code QR de la page Facebook 3M Travel & Services", "QR code for the 3M Travel & Services Facebook page")} className="h-16 w-16 object-contain" /></div><div className="min-w-0"><div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-200 mb-1"><Facebook className="w-3 h-3 fill-current" /><span>{t("Scanner le code QR", "Scan the QR code")}</span></div><p className="text-xs font-bold leading-snug">{t("Rejoignez-nous sur Facebook", "Join us on Facebook")}</p><p className="text-[11px] leading-snug text-slate-200 mt-1">{t("Scannez avec votre smartphone pour accéder à", "Scan with your smartphone to visit")} <span className="break-all underline font-mono">3mtravelcm</span>.</p></div></div>;
}
