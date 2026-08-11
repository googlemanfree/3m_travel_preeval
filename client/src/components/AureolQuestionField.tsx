import { useState } from "react";
import { ArrowRight, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "Quels documents faut-il préparer pour un visa d'études ?",
  "Quelle est la procédure pour le Canada ?",
  "Combien de temps prend une demande de visa ?",
];

export default function AureolQuestionField() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const chatMutation = trpc.aiCopilot.chat.useMutation({
    onSuccess: (data) => setAnswer(data.reply),
  });

  const submitQuestion = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || chatMutation.isPending) return;
    setQuestion(trimmed);
    setAnswer(null);
    chatMutation.mutate({ messages: [{ role: "user", content: trimmed }] });
  };

  return (
    <section aria-labelledby="aureol-question-title" className="relative overflow-hidden bg-gradient-to-br from-[#eff6ff] via-white to-[#eef2ff] py-12 md:py-16">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-xl shadow-blue-900/5 backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                <Sparkles className="h-4 w-4" />
                Assistant IA Aureol
              </div>
              <h2 id="aureol-question-title" className="text-2xl font-extrabold text-slate-900 md:text-3xl">
                Une question sur votre procédure ?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 md:text-base">
                Écrivez votre question simplement. Aureol vous oriente vers les étapes, documents et ressources adaptés à votre projet de mobilité.
              </p>
            </div>
            <div className="hidden rounded-2xl bg-blue-50 p-3 text-blue-700 md:block" aria-hidden="true">
              <MessageSquare className="h-7 w-7" />
            </div>
          </div>

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              submitQuestion();
            }}
          >
            <label htmlFor="aureol-question" className="sr-only">Votre question à Aureol</label>
            <input
              id="aureol-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ex. Quels documents dois-je préparer pour le Canada ?"
              disabled={chatMutation.isPending}
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <Button type="submit" disabled={!question.trim() || chatMutation.isPending} className="min-h-12 rounded-2xl bg-blue-700 px-5 hover:bg-blue-800">
              {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              <span>Demander à Aureol</span>
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Questions suggérées">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submitQuestion(suggestion)}
                disabled={chatMutation.isPending}
                className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-2 text-left text-xs font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" role="status">
              <div className="mb-1 flex items-center gap-2 font-bold text-emerald-800">
                <Sparkles className="h-4 w-4" /> Réponse d’Aureol
              </div>
              <p className="whitespace-pre-line">{answer}</p>
              <a href="/guide-procedures" className="mt-3 inline-flex items-center gap-1 font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950">
                Consulter le guide complet des procédures <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {chatMutation.isError && (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
              Aureol est momentanément indisponible. Vous pouvez consulter le guide des procédures ou nous contacter sur WhatsApp.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
