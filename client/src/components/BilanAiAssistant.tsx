import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

type Props = { sessionToken: string; text: string; fullName?: string | null; disabled?: boolean; onApply: (text: string) => void };

/**
 * Assistant de relecture (Perplexity), seconde option d'édition automatique : propose une version corrigée, plus claire, plus courte ou en anglais.
 * Le nom du candidat n'est pas transmis ; rien n'est remplacé sans clic, et le remplacement est annulable.
 */
export function BilanAiAssistant({ sessionToken, text, fullName, disabled = false, onApply }: Props) {
  const status = trpc.bilanAi.status.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchOnWindowFocus: false });
  const [mode, setMode] = useState("clarify");
  const [result, setResult] = useState<{ proposal: string; warnings: string[] } | null>(null);
  const [undoText, setUndoText] = useState<string | null>(null);
  const improve = trpc.bilanAi.improve.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (error) => toast.error(error.message),
  });
  if (!status.data) return null;
  if (!status.data.available) {
    return <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600" data-testid="bilan-ai-off">Assistant de relecture non activé : la clé Perplexity doit être ajoutée à la configuration du serveur.</p>;
  }
  const tooShort = text.trim().length < 30;
  return (
    <div className="mt-2 space-y-2 rounded-md border border-violet-200 bg-violet-50/60 p-2" data-testid="bilan-ai">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-700" aria-hidden="true" />
        <select className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs" value={mode} onChange={(event) => setMode(event.target.value)} aria-label="Type de relecture" data-testid="bilan-ai-mode" disabled={disabled}>
          {status.data.modes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <Button type="button" size="sm" variant="outline" disabled={disabled || tooShort || improve.isPending} onClick={() => improve.mutate({ sessionToken, mode: mode as never, text, fullName: fullName ?? null })} data-testid="bilan-ai-run">{improve.isPending ? "Relecture en cours…" : "Proposer une amélioration"}</Button>
        {undoText !== null && <Button type="button" size="sm" variant="ghost" onClick={() => { onApply(undoText); setUndoText(null); }} data-testid="bilan-ai-undo">Annuler le remplacement</Button>}
      </div>
      <p className="text-[11px] text-slate-600">Le nom et les coordonnées du candidat ne sont pas transmis. Vous relisez la proposition avant de l'appliquer.</p>
      {result && (
        <div className="space-y-2 rounded-md border border-violet-200 bg-white p-2" data-testid="bilan-ai-result">
          <textarea className="h-40 w-full resize-y rounded-md border border-slate-200 p-2 text-sm" readOnly value={result.proposal} aria-label="Proposition de l'assistant" data-testid="bilan-ai-proposal" />
          {result.warnings.length > 0 && <ul className="list-disc pl-5 text-xs text-amber-900" data-testid="bilan-ai-warnings">{result.warnings.map((line) => <li key={line}>{line}</li>)}</ul>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => { if (window.confirm("Remplacer votre texte par cette proposition ?")) { setUndoText(text); onApply(result.proposal); setResult(null); } }} data-testid="bilan-ai-apply">Remplacer mon texte</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)} data-testid="bilan-ai-ignore">Ignorer</Button>
          </div>
        </div>
      )}
    </div>
  );
}
