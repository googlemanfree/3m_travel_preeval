import { useState } from "react";
import { BellRing, ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

/**
 * Candidats dont le dossier attend des pièces, du plus silencieux au plus récent : le comptoir relance d'un clic sur WhatsApp
 * (message prérempli qui nomme la prochaine pièce). Les rappels automatiques par e-mail suivent leurs propres règles.
 */
export function AdminCandidatesToRemind({ sessionToken }: { sessionToken: string }) {
  const [open, setOpen] = useState(false);
  const query = trpc.documentFollowUp.listCandidatesToRemind.useQuery({ sessionToken, limit: 100 }, { enabled: Boolean(sessionToken), staleTime: 60_000, retry: 1 });
  const items = query.data?.items ?? [];
  const count = query.data?.count ?? 0;

  return (
    <Card className="border-amber-200 bg-amber-50/40" data-testid="candidates-to-remind">
      <CardHeader className="pb-3">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><BellRing className="h-4 w-4 text-amber-700" aria-hidden="true" />Candidats à relancer</CardTitle>
            <CardDescription>
              {query.isLoading ? "Chargement…" : query.error ? "Liste indisponible pour le moment." : count === 0 ? "Aucun candidat n’a de pièce en attente d’envoi." : `${count} candidat${count > 1 ? "s ont" : " a"} des pièces à envoyer ou à remplacer.`}
            </CardDescription>
          </div>
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">Rien à relancer.</p>
          ) : (
            <ul className="divide-y divide-amber-100 rounded-xl border border-amber-100 bg-white" data-testid="to-remind-list">
              {items.map((item) => (
                <li key={item.candidateId} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid="to-remind-row">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">{item.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{item.email}</p>
                    <p className="mt-0.5 text-xs text-slate-700">
                      {item.total - item.missing - item.replace} sur {item.total} pièces reçues{item.firstLabel ? ` · prochaine : ${item.firstLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className={`rounded-full px-2 py-0.5 ${item.daysInactive >= 7 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900"}`}>{item.daysInactive} j sans activité</span>
                    {item.replace > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">{item.replace} à remplacer</span>}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{item.remindersSinceActivity} rappel{item.remindersSinceActivity > 1 ? "s" : ""} e-mail</span>
                    {item.optedOut && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">Désinscrit des rappels</span>}
                  </div>
                  {item.hasWhatsApp ? (
                    <a href={`https://wa.me/${item.whatsappNumber}?text=${encodeURIComponent(item.whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700" data-testid="remind-whatsapp">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />Relancer sur WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Pas de numéro WhatsApp</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
