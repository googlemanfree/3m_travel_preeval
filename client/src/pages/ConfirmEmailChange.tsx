import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function ConfirmEmailChange() {
  const [, navigate] = useLocation();
  const query = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const token = query.get("token")?.trim() ?? "";
  const channel = query.get("channel") === "current" ? "current" : query.get("channel") === "new" ? "new" : null;
  const [completed, setCompleted] = useState<boolean | null>(null);
  const confirmMutation = trpc.candidate.confirmEmailChange.useMutation({
    onSuccess: (result) => setCompleted(result.completed),
  });
  const invalidLink = !token || !channel;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="email-change-confirmation-title">
        <div className="mb-5 inline-flex rounded-xl bg-blue-50 p-3 text-blue-800"><ShieldCheck className="h-7 w-7" /></div>
        <h1 id="email-change-confirmation-title" className="text-2xl font-black text-slate-950">Confirmer le changement d’adresse</h1>
        {invalidLink ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert"><AlertCircle className="mr-2 inline h-4 w-4" />Ce lien est incomplet ou invalide. Faites une nouvelle demande depuis votre profil.</div>
        ) : completed === true ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" role="status"><CheckCircle2 className="mr-2 inline h-4 w-4" />Votre nouvelle adresse e-mail est confirmée. Connectez-vous de nouveau avec cette adresse pour accéder à votre espace.</div>
        ) : completed === false ? (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950" role="status"><MailCheck className="mr-2 inline h-4 w-4" />Cette adresse est confirmée. Le changement sera finalisé après confirmation de l’autre adresse.</div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-600">Confirmez uniquement si vous êtes à l’origine de la demande. Votre adresse de connexion ne sera modifiée qu’après validation des deux boîtes e-mail.</p>
        )}

        {confirmMutation.error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" role="alert">{confirmMutation.error.message}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {completed === null && !invalidLink ? <Button type="button" onClick={() => confirmMutation.mutate({ token, channel })} disabled={confirmMutation.isPending} className="bg-blue-700 hover:bg-blue-800">{confirmMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />}{confirmMutation.isPending ? "Confirmation…" : "Confirmer cette adresse"}</Button> : null}
          <Button type="button" variant="outline" onClick={() => navigate(completed === true ? "/login" : "/mon-espace?section=profile")}>{completed === true ? "Se connecter" : "Retour à mon profil"}</Button>
        </div>
      </section>
    </main>
  );
}
