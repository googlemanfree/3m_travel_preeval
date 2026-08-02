import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const resetMutation = trpc.simpleAuth.forgotPassword.useMutation({
    onSuccess: (data) => {
        setSent(true);
      toast.success("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception et vos spams.");
    },
    onError: (err) => {
        toast.error(err.message || "Erreur lors de l'envoi du lien");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { 
      toast.error("Veuillez entrer votre adresse email."); 
      return; 
    }
    resetMutation.mutate({ email });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img src={LOGO_URL} alt="3M Travel" className="w-14 h-14 rounded-xl mx-auto mb-4 object-contain" />
            {sent ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Email envoyé !</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
                  Vérifiez également vos spams.
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-12 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {resetMutation.isPending ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <Button
                  onClick={() => { setSent(false); setEmail(""); }}
                  variant="outline"
                  className="w-full"
                >
                  Essayer avec un autre email
                </Button>
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
    </div>
  );
}
