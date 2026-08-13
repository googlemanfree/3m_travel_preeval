import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Coins, RefreshCw, ShieldCheck } from "lucide-react";

// Taux indicatifs par rapport au XAF (Franc CFA BEAC)
const RATES_TO_XAF: Record<string, number> = {
  EUR: 655.957, // 1 EUR = 655.957 XAF
  CAD: 445.50,  // 1 CAD ~ 445.50 XAF
  USD: 610.00,  // 1 USD ~ 610 XAF
  XAF: 1.00,
};

export default function CurrencyConverterWidget() {
  const { language } = useLanguage();
  const [amount, setAmount] = useState<string>("1500");
  const [fromCurrency, setFromCurrency] = useState<string>("EUR");
  const [toCurrency, setToCurrency] = useState<string>("XAF");

  const numAmount = parseFloat(amount) || 0;
  // Conversion vers XAF puis vers la devise cible
  const valueInXaf = numAmount * (RATES_TO_XAF[fromCurrency] || 1);
  const finalValue = valueInXaf / (RATES_TO_XAF[toCurrency] || 1);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-slate-900 via-[#0a2540] to-slate-900 text-white border-blue-900/40 shadow-xl rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Coins className="w-3.5 h-3.5" />
                {language === "en" ? "Live Exchange Rates" : "Taux de Change & Budget"}
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">
                {language === "en" ? "Consular Budget Estimator" : "Convertisseur de Devises & Frais Consulaires"}
              </CardTitle>
              <CardDescription className="text-slate-300 text-sm mt-1">
                {language === "en"
                  ? "Estimate visa fees, flight tickets, and settlement funds in your local currency."
                  : "Estimez rapidement vos frais de visa, billets d'avion et frais de dossier dans votre devise locale."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>{language === "en" ? "Updated: August 2026" : "Mis à jour : Août 2026"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300 uppercase">
                {language === "en" ? "Amount" : "Montant"}
              </Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white text-lg font-bold placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300 uppercase">
                {language === "en" ? "From Currency" : "De la devise"}
              </Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">🇪🇺 EUR (€ - Euro)</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD ($ - Dollar Canadien)</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD ($ - Dollar US)</SelectItem>
                  <SelectItem value="XAF">🇨🇲 XAF (FCFA - Franc CFA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300 uppercase">
                {language === "en" ? "To Currency" : "Vers la devise"}
              </Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XAF">🇨🇲 XAF (FCFA - Franc CFA)</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR (€ - Euro)</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD ($ - Dollar Canadien)</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD ($ - Dollar US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résultat conversion */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {language === "en" ? "Converted Amount (Indicative)" : "Montant converti (Indicatif)"}
              </p>
              <p className="text-3xl font-black text-white mt-1">
                {finalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} {toCurrency}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === "en" ? "Indicative interbank exchange rates" : "Taux indicatifs basés sur les cours officiels"}</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
