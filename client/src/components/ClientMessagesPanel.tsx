import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, UserRound, Headphones, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";

export default function ClientMessagesPanel() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const messagesQuery = trpc.candidate.getMessages.useQuery(undefined, {
    enabled: isAuthenticated && Boolean(candidate),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    retry: 1,
  });
  const unreadQuery = trpc.candidate.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated && Boolean(candidate),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
  const sendMutation = trpc.candidate.sendMessage.useMutation({
    onSuccess: async () => {
      setContent("");
      await Promise.all([
        utils.candidate.getMessages.invalidate(),
        utils.candidate.unreadCount.invalidate(),
        utils.candidate.getMyDossierData.invalidate(),
      ]);
      toast.success("Votre message a bien été envoyé à l’équipe 3M TRAVEL AGENCY.");
    },
    onError: (error) => toast.error(error.message || "Impossible d’envoyer le message."),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messagesQuery.data]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate({ content: trimmed });
  };

  const messages = messagesQuery.data ?? [];

  return (
    <Card className="premium-surface border-blue-100/80 p-5 sm:p-6" aria-labelledby="client-messages-title">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Espace client</p>
            <h2 id="client-messages-title" className="premium-section-title text-lg sm:text-xl">Messagerie 3M TRAVEL AGENCY</h2>
            <p className="premium-copy mt-1 text-sm">Échangez avec l’équipe qui suit votre dossier.</p>
          </div>
        </div>
        {typeof unreadQuery.data?.count === "number" && unreadQuery.data.count > 0 && (
          <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            {unreadQuery.data.count} nouveau{unreadQuery.data.count > 1 ? "x" : ""} message{unreadQuery.data.count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {messagesQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Chargement de vos échanges…
          </div>
        ) : messagesQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Les messages ne sont pas disponibles pour le moment. Actualisez la page ou réessayez dans quelques instants.
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm leading-6 text-slate-700">
            Aucun message pour le moment. Écrivez à votre conseiller pour commencer la conversation.
          </div>
        ) : (
          messages.map((message) => {
            const isCandidate = message.senderRole === "candidate";
            return (
              <div key={message.id} className={`flex gap-3 ${isCandidate ? "justify-end" : "justify-start"}`}>
                {!isCandidate && (
                  <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Headphones className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${isCandidate ? "rounded-br-md bg-blue-800 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`mt-2 flex items-center gap-1 text-[11px] ${isCandidate ? "text-blue-100" : "text-slate-600"}`}>
                    {isCandidate ? <UserRound className="h-3 w-3" aria-hidden="true" /> : <Headphones className="h-3 w-3" aria-hidden="true" />}
                    {isCandidate ? "Vous" : "Équipe 3M TRAVEL AGENCY"} · {new Date(message.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 border-t border-slate-100 pt-4">
        <label htmlFor="client-message" className="mb-2 block text-sm font-bold text-slate-900">Nouveau message</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Textarea
            id="client-message"
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, 2000))}
            placeholder="Écrivez votre question ou transmettez une information à l’équipe…"
            rows={3}
            maxLength={2000}
            className="min-h-24 resize-y rounded-xl border-slate-200"
            disabled={sendMutation.isPending}
          />
          <Button type="submit" disabled={!content.trim() || sendMutation.isPending} className="premium-action h-11 shrink-0 rounded-xl px-5 text-white sm:w-auto">
            {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
            Envoyer
          </Button>
        </div>
        <p className="mt-2 text-sm text-slate-600">Réponse habituelle de l’équipe : sous 24 heures ouvrées.</p>
      </form>
    </Card>
  );
}
