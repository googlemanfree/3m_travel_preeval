import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { XCircle, RefreshCw, MessageCircle, Home } from "lucide-react";

export default function PaymentFailed() {
  const params = new URLSearchParams(window.location.search);
  const dossierNumber = params.get("dossier") ?? "";

  const whatsappMsg = encodeURIComponent(
    `Bonjour 3M Travel Agency, j'ai rencontré un problème lors du paiement de mon dossier.\n\n` +
    `📋 Numéro de dossier : ${dossierNumber}\n\n` +
    `Pouvez-vous m'aider à finaliser le paiement ?`
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 text-white">

      <div className="pt-24 pb-16 px-4 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Icône échec */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-3">Paiement échoué</h1>
            <p className="text-slate-300 text-lg">
              Votre paiement n'a pas pu être traité. Votre dossier est conservé — vous pouvez réessayer.
            </p>
          </div>

          {dossierNumber && (
            <div className="bg-white/5 border border-red-500/20 rounded-2xl p-5">
              <p className="text-slate-400 text-sm mb-1">Numéro de dossier</p>
              <p className="text-2xl font-black text-red-300">{dossierNumber}</p>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3">
            <h3 className="font-bold">Causes possibles</h3>
            {[
              "Solde insuffisant sur votre compte Mobile Money",
              "Délai d'attente dépassé (session expirée)",
              "Erreur de saisie du code de confirmation",
              "Problème temporaire de connexion réseau",
            ].map((cause, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-400 mt-0.5">•</span>
                {cause}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/open-dossier">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer le paiement
              </Button>
            </Link>
            <a
              href={`https://wa.me/237620996045?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold">
                <MessageCircle className="w-4 h-4 mr-2" />
                Aide sur WhatsApp
              </Button>
            </a>
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 bg-transparent">
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
