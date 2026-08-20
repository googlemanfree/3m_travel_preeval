import React, { useState } from 'react';
import { ShieldCheck, HelpCircle, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

export function PassportAssistanceWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-2xl p-4 shadow-sm mb-6 transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
              Guide de saisie du passeport 🛂
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Conseils d’experts 3M</span>
            </h4>
            <p className="text-xs text-blue-700 mt-0.5">
              Cliquez pour consulter les critères consulaires et optimiser la lecture de votre document.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-blue-700 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-100/60 transition"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-950">
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Validité & Intégrité
            </div>
            <p className="text-slate-600">
              Le passeport doit être valide au moins 6 mois après la date de retour prévue. Les 4 coins du document doivent être visibles.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Zone MRZ (Lecture Optique)
            </div>
            <p className="text-slate-600">
              Assurez-vous que les lignes de code en bas de la page d’identification (avec les chevrons &lt;&lt;&lt;) ne soient ni coupées ni floues.
            </p>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-blue-100 shadow-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              Formats & Éclairage
            </div>
            <p className="text-slate-600">
              Privilégiez les scans PDF haute résolution ou les photos prises à la lumière du jour sans flash direct pour éviter les reflets sur la photo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
