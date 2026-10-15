import { Hand, Phone, ExternalLink, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTodayItems, type TodayCandidate } from "@/components/AdminTodayDashboard";

type Props = {
  candidates: TodayCandidate[];
  onOpen: (candidateId: string) => void;
  onExit: () => void;
};

/**
 * Mode guichet tactile : file du jour en grandes tuiles (écran tactile / stand agence).
 * Réutilise la même file que le pilotage — aucun nouveau calcul métier.
 */
export default function AdminGuichetPanel({ candidates, onOpen, onExit }: Props) {
  const items = buildTodayItems(candidates).slice(0, 16);

  return (
    <Card
      className="border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-slate-50 shadow-md"
      data-testid="admin-guichet-panel"
      data-admin-guichet-panel
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-950">
            <Hand className="h-6 w-6 text-indigo-700" aria-hidden="true" />
            Mode guichet
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Tuiles tactiles pour traiter la file du jour au comptoir. Touchez une carte pour ouvrir le dossier 360°.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-12 gap-2 px-5 text-base"
          onClick={onExit}
          data-testid="admin-guichet-exit"
        >
          Quitter le guichet
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p
            className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-base font-semibold text-emerald-900"
            data-testid="admin-guichet-empty"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Aucune priorité critique — file du jour vide.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="admin-guichet-grid">
            {items.map((item, index) => {
              const phone = (item.candidate as { phone?: string | null; whatsapp?: string | null }).whatsapp
                || (item.candidate as { phone?: string | null }).phone
                || "";
              const digits = phone.replace(/\D/g, "");
              const wa = digits.length >= 8
                ? `https://wa.me/${digits.startsWith("237") || digits.length > 9 ? digits : `237${digits}`}`
                : null;
              return (
                <div
                  key={`${item.candidate.id}-${item.label}-${index}`}
                  className="flex min-h-[9.5rem] flex-col justify-between rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm"
                  data-testid="admin-guichet-tile"
                >
                  <div>
                    <Badge className="mb-2 bg-indigo-100 text-indigo-900">{item.label}</Badge>
                    <p className="text-lg font-bold leading-tight text-slate-950">{item.candidate.fullName}</p>
                    <p className="mt-1 font-mono text-sm text-slate-600">{item.candidate.folderCode}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="lg"
                      className="min-h-12 flex-1 gap-2 bg-indigo-700 text-base hover:bg-indigo-800"
                      onClick={() => onOpen(item.candidate.id)}
                      data-testid={`admin-guichet-open-${item.candidate.id}`}
                    >
                      <ExternalLink className="h-5 w-5" aria-hidden="true" />
                      Ouvrir
                    </Button>
                    {wa ? (
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="min-h-12 gap-2 px-4 text-base"
                        asChild
                      >
                        <a href={wa} target="_blank" rel="noreferrer" data-testid={`admin-guichet-wa-${item.candidate.id}`}>
                          <Phone className="h-5 w-5" aria-hidden="true" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
