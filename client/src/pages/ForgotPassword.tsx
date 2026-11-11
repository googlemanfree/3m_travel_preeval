import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import EmailDeliveryHelp from "@/components/EmailDeliveryHelp";
import { useResendCooldown } from "@/hooks/useResendCooldown";

const LOGO_URL = "/logo-3m.webp";

export default function ForgotPassword() {
  const [location] = useLocation();
  const [email, setEmail] = useState(() => {
    // wouter ne renvoie que le chemin : l'adresse préremplie se lit dans la barre d'adresse.
    const search = typeof window !== "undefined" ? window.location.search : location.split("?")[1] ?? "";
    const query = new URLSearchParams(search);
    return query.get("email") ?? "";
  });
  const [sent, setSent] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cooldown = useResendCooldown(email.trim() ? `reset:${email.trim().toLowerCase()}` : "");

  const resetMutation = trpc.candidate.requestPasswordReset.useMutation({
    onSuccess: () => {
      setSent(true);
      setSentAt(Date.now());
      setErrorMessage(null);
      cooldown.markSent();
      toast.success("Demande envoyée. Le lien arrive en général en quelques minutes.");
    },
    onError: (err) => {
      const message = /trop de demandes/i.test(err.message)
        ? err.message
        : "Le lien n’a pas pu être envoyé pour le moment. Réessayez dans un instant ou écrivez-nous sur WhatsApp.";
      setErrorMessage(message);
      toast.error(message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre adresse email.");
      return;
    }
    setErrorMessage(null);
    resetMutation.mutate({ email: email.trim() });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img src={LOGO_URL} alt="3M TRAVEL AGENCY" className="mx-auto mb-4 h-14 w-14 rounded-full bg-white object-contain" />
            {sent ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Demande envoyée</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
                  Pour votre sécurité, nous ne confirmons pas ici si l’adresse est inscrite.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Réinitialiser votre mot de passe</h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Entrez votre adresse email et nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
                </p>
              </>
            )}
          </div>

          <div className="px-8 py-6">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4" aria-busy={resetMutation.isPending}>
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Adresse email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="pl-10 h-11"
                      required
                      maxLength={320}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-12 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                >
                  {resetMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2" role="status" aria-live="polite">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      Envoi en cours…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" aria-hidden="true" />
                      Envoyer le lien de réinitialisation
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <EmailDeliveryHelp
                  email={email}
                  kind="reset"
                  onResend={() => { setErrorMessage(null); resetMutation.mutate({ email: email.trim() }); }}
                  isSending={resetMutation.isPending}
                  secondsLeft={cooldown.secondsLeft}
                  sentAt={sentAt}
                  errorMessage={errorMessage}
                  onChangeEmail={() => { setSent(false); setErrorMessage(null); }}
                />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link href="/login" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          🔒 Le lien de réinitialisation expire après 1 heure.
        </p>
      </motion.div>
    </main>
  );
}
