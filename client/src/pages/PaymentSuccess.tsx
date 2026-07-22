import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, Download, MessageCircle, Home, Loader2, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  const dossierNumber = params.get("dossier") ?? "";
  const isDemo = params.get("demo") === "true";

  const { data: application, isLoading } = trpc.application.getApplicationByDossierNumber.useQuery(
    { dossierNumber },
    { enabled: !!dossierNumber }
  );

  const whatsappMsg = encodeURIComponent(
    `Bonjour 3M Travel Agency, je viens d'ouvrir mon dossier d'immigration.\n\n` +
    `📋 Numéro de dossier : ${dossierNumber}\n` +
    `👤 Nom : ${application?.fullName ?? ""}\n` +
    `🌍 Destination : ${application?.destination ?? ""}\n\n` +
    `Merci de confirmer la réception de mon dossier.`
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-4 flex flex-col items-center justify-center min-h-[80vh]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
            <p className="text-slate-300">Chargement de votre dossier...</p>
          </div>
        ) : (
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Icône succès */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-[scale-in_0.5s_cubic-bezier(0.23,1,0.32,1)]">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-3">
                {isDemo ? "Dossier créé !" : "Paiement confirmé !"}
              </h1>
              <p className="text-slate-300 text-lg">
                {isDemo
                  ? "Votre dossier a été créé avec succès. Procédez au paiement via WhatsApp."
                  : "Votre paiement a été reçu et votre dossier est maintenant actif."}
              </p>
            </div>

            {/* Numéro de dossier */}
            <div className="bg-white/5 border border-emerald-500/30 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Votre numéro de dossier</p>
              <p className="text-3xl font-black text-emerald-400 tracking-wider">{dossierNumber}</p>
              <p className="text-slate-400 text-xs mt-2">Conservez ce numéro précieusement — il vous sera demandé à chaque étape</p>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-4">
              <h3 className="font-bold text-lg">Prochaines étapes</h3>
              {[
                { num: "1", text: "Vous recevrez un email de confirmation sous 24h" },
                { num: "2", text: "Un conseiller vous contactera sur WhatsApp pour la liste des documents" },
                { num: "3", text: "Préparez vos documents (passeport, CV, diplômes)" },
                { num: "4", text: "Suivez l'avancement de votre dossier dans votre espace candidat" },
              ].map(step => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                    {step.num}
                  </div>
                  <p className="text-slate-300 text-sm pt-0.5">{step.text}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/237620996045?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter sur WhatsApp
                </Button>
              </a>
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Mon espace candidat
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
