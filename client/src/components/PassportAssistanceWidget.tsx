import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export function PassportAssistanceWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-primary/20 bg-primary/5 shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <CardTitle className="text-sm font-semibold">Assistant IA de Saisie Passeport</CardTitle>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs h-7 gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {isOpen ? 'Masquer les conseils' : 'Conseils de saisie'}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0 text-xs text-muted-foreground space-y-2 border-t border-border/50 pt-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Validité :</strong> Assurez-vous que votre passeport est valide au moins 6 mois après votre date prévue de retour.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Zones MRZ :</strong> La lecture automatique par IA extrait la bande infalsifiable en bas de page. Vérifiez l'exactitude du numéro de passeport.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Noms et prénoms :</strong> Saisissez exactement les mêmes prénoms et orthographes que sur la ligne d'identité principale.</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
