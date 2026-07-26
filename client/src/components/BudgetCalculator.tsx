import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';

interface CountryBudget {
  country: string;
  visaFee: number;
  schoolingFee: number;
  financialGuarantee: number;
  agencyFee: number;
  totalMin: number;
  totalMax: number;
  currency: string;
}

const COUNTRY_BUDGETS: Record<string, CountryBudget> = {
  canada: {
    country: '🇨🇦 Canada',
    visaFee: 100,
    schoolingFee: 15000,
    financialGuarantee: 20000,
    agencyFee: 65000,
    totalMin: 100 + 15000 + 20000 + 65000,
    totalMax: 100 + 25000 + 30000 + 65000,
    currency: 'CAD + XAF',
  },
  france: {
    country: '🇫🇷 France',
    visaFee: 99,
    schoolingFee: 3000,
    financialGuarantee: 15000,
    agencyFee: 65000,
    totalMin: 99 + 3000 + 15000 + 65000,
    totalMax: 99 + 10000 + 20000 + 65000,
    currency: 'EUR + XAF',
  },
  germany: {
    country: '🇩🇪 Allemagne',
    visaFee: 75,
    schoolingFee: 0,
    financialGuarantee: 11208,
    agencyFee: 65000,
    totalMin: 75 + 0 + 11208 + 65000,
    totalMax: 75 + 5000 + 15000 + 65000,
    currency: 'EUR + XAF',
  },
  luxembourg: {
    country: '🇱🇺 Luxembourg',
    visaFee: 80,
    schoolingFee: 0,
    financialGuarantee: 0,
    agencyFee: 65000,
    totalMin: 80 + 0 + 0 + 65000,
    totalMax: 80 + 10000 + 5000 + 65000,
    currency: 'EUR + XAF',
  },
  poland: {
    country: '🇵🇱 Pologne',
    visaFee: 80,
    schoolingFee: 0,
    financialGuarantee: 0,
    agencyFee: 65000,
    totalMin: 80 + 0 + 0 + 65000,
    totalMax: 80 + 8000 + 3000 + 65000,
    currency: 'PLN + XAF',
  },
  uk: {
    country: '🇬🇧 Royaume-Uni',
    visaFee: 719,
    schoolingFee: 15000,
    financialGuarantee: 30000,
    agencyFee: 65000,
    totalMin: 719 + 15000 + 30000 + 65000,
    totalMax: 719 + 35000 + 50000 + 65000,
    currency: 'GBP + XAF',
  },
  australia: {
    country: '🇦🇺 Australie',
    visaFee: 710,
    schoolingFee: 20000,
    financialGuarantee: 25000,
    agencyFee: 65000,
    totalMin: 710 + 20000 + 25000 + 65000,
    totalMax: 710 + 40000 + 50000 + 65000,
    currency: 'AUD + XAF',
  },
};

export const BudgetCalculator: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('canada');
  const [studentLevel, setStudentLevel] = useState<'bachelor' | 'master' | 'phd'>('bachelor');

  const budget = useMemo(() => {
    const countryBudget = COUNTRY_BUDGETS[selectedCountry];
    if (!countryBudget) return null;

    // Ajuster les frais selon le niveau d'études
    const schoolingMultiplier = {
      bachelor: 1,
      master: 1.3,
      phd: 1.5,
    };

    const adjustedSchooling = countryBudget.schoolingFee * schoolingMultiplier[studentLevel];
    const adjustedGuarantee = countryBudget.financialGuarantee * schoolingMultiplier[studentLevel];

    return {
      ...countryBudget,
      schoolingFee: adjustedSchooling,
      financialGuarantee: adjustedGuarantee,
      totalMin: countryBudget.visaFee + adjustedSchooling + adjustedGuarantee + countryBudget.agencyFee,
      totalMax: countryBudget.visaFee + adjustedSchooling * 1.5 + adjustedGuarantee * 1.5 + countryBudget.agencyFee,
    };
  }, [selectedCountry, studentLevel]);

  if (!budget) return null;

  const breakdown = [
    { label: 'Frais de visa', amount: budget.visaFee, color: 'bg-blue-100 text-blue-700' },
    { label: 'Frais de scolarité', amount: budget.schoolingFee, color: 'bg-purple-100 text-purple-700' },
    { label: 'Garantie financière', amount: budget.financialGuarantee, color: 'bg-green-100 text-green-700' },
    { label: 'Frais agence 3M', amount: budget.agencyFee, color: 'bg-orange-100 text-orange-700' },
  ];

  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-8 border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Calculateur de Budget</h2>
      </div>

      <p className="text-slate-600 mb-6">
        Estimez les frais totaux pour votre projet d'études ou de mobilité internationale.
      </p>

      {/* Sélection du pays */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(COUNTRY_BUDGETS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Niveau d'études</label>
          <select
            value={studentLevel}
            onChange={(e) => setStudentLevel(e.target.value as 'bachelor' | 'master' | 'phd')}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bachelor">Licence (Bachelor)</option>
            <option value="master">Master</option>
            <option value="phd">Doctorat (PhD)</option>
          </select>
        </div>
      </div>

      {/* Détail des frais */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Détail des frais</h3>
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
              >
                <span className="text-slate-700 font-medium">{item.label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.color}`}>
                  {item.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {budget.currency.split('+')[0]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Résumé total */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Budget Total Estimé</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Minimum</p>
              <p className="text-3xl font-bold">
                {budget.totalMin.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-blue-100 text-xs mt-1">{budget.currency}</p>
            </div>

            <div className="border-t border-blue-400 pt-4">
              <p className="text-blue-100 text-sm mb-1">Maximum</p>
              <p className="text-3xl font-bold">
                {budget.totalMax.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-blue-100 text-xs mt-1">{budget.currency}</p>
            </div>

            <div className="bg-blue-500 rounded-lg p-3 mt-4">
              <p className="text-blue-100 text-xs mb-1">Moyenne</p>
              <p className="text-2xl font-bold">
                {Math.round((budget.totalMin + budget.totalMax) / 2).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Conseils */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-lg p-4"
      >
        <p className="text-sm text-amber-900">
          <strong>💡 Conseil :</strong> Ces estimations sont basées sur les tarifs officiels 2026. Les frais réels peuvent varier selon votre situation. Contactez nos conseillers pour une évaluation personnalisée.
        </p>
      </motion.div>

      {/* CTA */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
          Évaluation Gratuite
        </button>
        <button className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-4 rounded-lg transition-colors">
          Contacter un Conseiller
        </button>
      </div>
    </div>
  );
};
