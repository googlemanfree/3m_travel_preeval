import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Euro, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export function AdminCurrencyRates() {
  const [eurRate, setEurRate] = useState('656');
  const [usdRate, setUsdRate] = useState('600');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const ratesQuery = trpc.exchangeRates.getRates.useQuery();

  useEffect(() => {
    if (ratesQuery.data) {
      setEurRate(String(ratesQuery.data.eurToXaf));
      setUsdRate(String(ratesQuery.data.usdToXaf));
    }
  }, [ratesQuery.data]);
  const updateRatesMutation = trpc.exchangeRates.updateRates.useMutation({
    onSuccess: () => {
      setSuccessMsg('Taux de change mis à jour avec succès.');
      ratesQuery.refetch();
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const eur = parseFloat(eurRate);
    const usd = parseFloat(usdRate);
    if (isNaN(eur) || isNaN(usd)) return;
    updateRatesMutation.mutate({ eurToXaf: eur, usdToXaf: usd });
  };

  return (
    <Card className="shadow-sm border border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="w-5 h-5 text-primary" />
          Gestion des Taux de Change (XAF / EUR / USD)
        </CardTitle>
        <CardDescription>
          Configurez les taux de conversion indicatifs utilisés pour estimer automatiquement les frais de procédure dans la monnaie locale des candidats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Euro className="w-4 h-4 text-blue-600" />
              1 Euro (EUR) en Franc CFA (XAF)
            </label>
            <Input
              type="number"
              step="1"
              value={eurRate}
              onChange={(e) => setEurRate(e.target.value)}
              placeholder="Ex: 656"
              required
            />
            <p className="text-xs text-muted-foreground">Taux fixe BEAC de référence : 655.957 XAF pour 1 EUR.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              1 Dollar US (USD) en Franc CFA (XAF)
            </label>
            <Input
              type="number"
              step="1"
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value)}
              placeholder="Ex: 600"
              required
            />
            <p className="text-xs text-muted-foreground">Taux indicatif du marché pour les devises USD.</p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={updateRatesMutation.isPending} className="gap-2">
              {updateRatesMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
              Enregistrer les nouveaux taux
            </Button>
          </div>
        </form>

        <div className="p-4 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Règle de calcul dynamique :
          </p>
          <p>Les montants affichés sur les formulaires de demande et factures proforma s'ajustent instantanément en divisant le tarif de base en XAF par ces taux de change.</p>
        </div>
      </CardContent>
    </Card>
  );
}
