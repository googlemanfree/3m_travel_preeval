import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plane, Search, CheckCircle2, Clock, XCircle, AlertCircle,
  MessageCircle, ArrowRight, Ticket, Users, Mail, Phone,
  Calendar, MapPin, RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

function formatXAF(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  pending: {
    label: "En attente de confirmation",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
  },
  confirmed: {
    label: "Confirmée",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  },
  paid: {
    label: "Paiement reçu",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
  },
  ticketed: {
    label: "Billet émis",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    icon: <Ticket className="w-5 h-5 text-purple-500" />,
  },
  cancelled: {
    label: "Annulée",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
};

export default function FlightBookingStatus() {
  const [refInput, setRefInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [searchParams, setSearchParams] = useState<{ bookingRef: string; contactEmail: string } | null>(null);
  const [error, setError] = useState("");

  const { data: booking, isLoading, isError } = trpc.flightBookings.getBookingByRef.useQuery(
    searchParams!,
    { enabled: !!searchParams, retry: false }
  );

  // flightData est un objet JSON parsé par le serveur
  const fd = booking?.flightData as {
    airline?: string;
    flightNumber?: string;
    from?: string;
    fromCity?: string;
    to?: string;
    toCity?: string;
    departure?: string;
    arrival?: string;
    duration?: string;
    stops?: number;
    class?: string;
    returnFlight?: {
      airline?: string;
      flightNumber?: string;
      departure?: string;
      arrival?: string;
    };
  } | undefined;

  // Le champ DB s'appelle bookingStatus (pas status)
  const bookingStatus = (booking as any)?.bookingStatus as string | undefined;

  function handleSearch() {
    const ref = refInput.trim().toUpperCase();
    const email = emailInput.trim().toLowerCase();
    if (!ref || ref.length < 4) {
      setError("Veuillez entrer une référence valide (ex: 3MF-2026-XXXXX).");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Veuillez entrer l'adresse email utilisée lors de la réservation.");
      return;
    }
    setError("");
    setSearchParams({ bookingRef: ref, contactEmail: email });
  }

  const statusCfg = bookingStatus ? (STATUS_CONFIG[bookingStatus] ?? STATUS_CONFIG.pending) : null;

  function buildWhatsApp() {
    if (!booking || !fd) return "#";
    const msg = `Bonjour 3M Travel, je souhaite des informations sur ma réservation :\n\n📋 Référence : *${booking.bookingRef}*\n✈️ Vol : ${fd.fromCity ?? fd.from ?? ""} → ${fd.toCity ?? fd.to ?? ""}\n📅 Départ : ${fd.departure ? formatDate(fd.departure) : ""}\n💰 Total : ${formatXAF(booking.totalPrice)}\n\nMerci.`;
    return `https://wa.me/237698104832?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-amber-400/30">
              <Ticket className="w-3.5 h-3.5" /> Suivi de réservation
            </div>
            <h1 className="text-3xl font-black text-white mb-3">Suivre ma réservation de vol</h1>
            <p className="text-blue-200 text-sm">
              Entrez votre référence et votre email pour consulter l'état de votre dossier
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8"
        >
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            Rechercher votre réservation
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Référence de réservation</label>
              <input
                type="text"
                value={refInput}
                onChange={e => setRefInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Ex: 3MF-2026-ABCDE"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email de réservation</label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="votre@email.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-xl gap-2 py-2.5"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Rechercher
            </Button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3">
            La référence vous a été communiquée après votre réservation (format : 3MF-2026-XXXXX)
          </p>
        </motion.div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Recherche en cours...</p>
            </motion.div>
          )}

          {(isError || (searchParams && !isLoading && !booking)) && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center"
            >
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-red-800 mb-1">Réservation introuvable</h3>
              <p className="text-red-600 text-sm">
                Aucune réservation trouvée pour la référence <strong>{searchParams?.bookingRef}</strong>.<br />
                Vérifiez la référence reçue par email ou contactez notre équipe.
              </p>
              <a
                href="https://wa.me/237698104832?text=Bonjour%2C%20je%20cherche%20ma%20r%C3%A9servation%20de%20vol."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Contacter le support
              </a>
            </motion.div>
          )}

          {booking && fd && statusCfg && (
            <motion.div
              key="found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Status banner */}
              <div className={`rounded-2xl border p-5 flex items-center gap-4 ${statusCfg.bg}`}>
                {statusCfg.icon}
                <div className="flex-1">
                  <p className={`font-bold text-base ${statusCfg.color}`}>{statusCfg.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Référence : <span className="font-mono font-bold text-gray-800">{booking.bookingRef}</span>
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs font-bold ${statusCfg.color}`}>
                  {bookingStatus?.toUpperCase()}
                </Badge>
              </div>

              {/* Vol */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-600" />
                  Détails du vol
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Itinéraire</span>
                    <span className="font-medium ml-auto flex items-center gap-1">
                      {fd.fromCity ?? fd.from} <ArrowRight className="w-3 h-3" /> {fd.toCity ?? fd.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Départ</span>
                    <span className="font-medium ml-auto">{fd.departure ? formatDate(fd.departure) : "—"}</span>
                  </div>
                  {fd.returnFlight?.departure && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">Retour</span>
                      <span className="font-medium ml-auto">{formatDate(fd.returnFlight.departure)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Compagnie</span>
                    <span className="font-medium ml-auto">{fd.airline} · {fd.flightNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Passagers</span>
                    <span className="font-medium ml-auto">
                      {booking.adultsCount} adulte{booking.adultsCount > 1 ? "s" : ""}
                      {booking.childrenCount > 0 ? ` · ${booking.childrenCount} enfant${booking.childrenCount > 1 ? "s" : ""}` : ""}
                      {booking.infantsCount > 0 ? ` · ${booking.infantsCount} bébé${booking.infantsCount > 1 ? "s" : ""}` : ""}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total payé</span>
                    <span className="font-bold text-xl text-amber-600">{formatXAF(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Coordonnées
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-700">{booking.contactEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-700">{booking.contactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Prochaines étapes selon statut */}
              {bookingStatus === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-amber-900 mb-3">Prochaines étapes</h3>
                  <div className="space-y-2 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                      <p>Un conseiller 3M Travel vous contacte sous 24h pour confirmer la disponibilité</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                      <p>Paiement sécurisé via Mobile Money, virement ou en agence</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                      <p>Réception de vos billets électroniques par email</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={buildWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter un conseiller
                </a>
                <Link href="/vols">
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    <Plane className="w-4 h-4" />
                    Nouvelle recherche
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
