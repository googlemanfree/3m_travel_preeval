import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCw, ShieldCheck, UserRound, FileEdit, ChevronDown } from 'lucide-react';

function formatDate(value: unknown) {
  if (!value) return 'Date inconnue';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR');
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function AdminPassportCorrectionHistory() {
  const [requestId, setRequestId] = useState('');
  const queryInput = useMemo(() => {
    const parsed = Number.parseInt(requestId, 10);
    return { limit: 100, ...(Number.isInteger(parsed) && parsed > 0 ? { requestId: parsed } : {}) };
  }, [requestId]);
  const { data, isLoading, refetch } = trpc.evisaAdmin.getPassportCorrectionHistory.useQuery(queryInput);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-950">Historique des corrections passeport</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Consultez les valeurs extraites par l’IA, les corrections faites par le candidat et les champs modifiés avant la soumission.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isLoading} className="w-fit">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="max-w-xs flex-1">
            <label htmlFor="passport-history-request-id" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Filtrer par identifiant de demande
            </label>
            <Input
              id="passport-history-request-id"
              inputMode="numeric"
              placeholder="Ex. 248"
              value={requestId}
              onChange={event => setRequestId(event.target.value.replace(/\D/g, ''))}
            />
          </div>
          {requestId && (
            <Button type="button" variant="ghost" onClick={() => setRequestId('')}>
              Effacer le filtre
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Chargement de l’historique…</div>
        ) : !data || data.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Aucune correction manuelle enregistrée.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {data.map(entry => {
              const previous = asObject(entry.previousData);
              const next = asObject(entry.nextData);
              const changedFields = Array.isArray(entry.changedFields) ? entry.changedFields.map(String) : [];
              return (
                <details key={String(entry.id)} className="group rounded-xl border border-slate-200 bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Demande #{entry.requestId}</Badge>
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">{changedFields.length} champ(s) modifié(s)</Badge>
                        <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-900">{entry.fullName || 'Candidat non identifié'}</p>
                      <p className="truncate text-xs text-slate-500">{entry.email || 'E-mail non renseigné'} · {entry.countryName || entry.countryCode || 'Destination non renseignée'}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid gap-4 border-t border-slate-100 bg-slate-50/60 p-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600"><UserRound className="h-3.5 w-3.5" /> Acteur</p>
                      <p className="text-sm text-slate-800">{entry.actorName || 'Candidat'}</p>
                      <p className="text-xs text-slate-500">{entry.actorEmail || 'E-mail non renseigné'} · source : {entry.source}</p>
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600"><FileEdit className="h-3.5 w-3.5" /> Champs modifiés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {changedFields.length ? changedFields.map(field => <Badge key={field} variant="secondary" className="text-[11px]">{field}</Badge>) : <span className="text-sm text-slate-500">Aucune différence détectée</span>}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Valeurs extraites</p>
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">{JSON.stringify(previous, null, 2)}</pre>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-800">Valeurs validées</p>
                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-emerald-900">{JSON.stringify(next, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
