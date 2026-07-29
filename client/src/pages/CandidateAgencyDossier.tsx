import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Globe,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { startLogin } from "@/const";

type DossierStatus =
  | "nouveau"
  | "en_cours"
  | "documents_requis"
  | "soumis"
  | "approuve"
  | "refuse";

const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string }> = {
  nouveau:          { label: "Nouveau",           color: "text-blue-700",   bgColor: "bg-blue-50 border-blue-200",   icon: <FileText className="w-5 h-5 text-blue-600" />,  description: "Votre dossier a été enregistré par notre équipe." },
  en_cours:         { label: "En cours",           color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200", icon: <Clock className="w-5 h-5 text-yellow-600" />,  description: "Votre dossier est en cours de traitement par nos conseillers." },
  documents_requis: { label: "Documents requis",  color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200", icon: <AlertCircle className="w-5 h-5 text-orange-600" />, description: "Des documents supplémentaires sont nécessaires. Contactez-nous." },
  soumis:           { label: "Soumis",             color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: <CheckCircle className="w-5 h-5 text-purple-600" />, description: "Votre dossier a été soumis aux autorités compétentes." },
  approuve:         { label: "Approuvé ✓",         color: "text-green-700",  bgColor: "bg-green-50 border-green-200",  icon: <CheckCircle className="w-5 h-5 text-green-600" />, description: "Félicitations ! Votre dossier a été approuvé." },
  refuse:           { label: "Refusé",             color: "text-red-700",    bgColor: "bg-red-50 border-red-200",      icon: <XCircle className="w-5 h-5 text-red-600" />,   description: "Votre dossier a été refusé. Contactez-nous pour plus d'informations." },
};

const PROGRESS_STEPS: { status: DossierStatus; label: string }[] = [
  { status: "nouveau",          label: "Enregistrement" },
  { status: "en_cours",         label: "Traitement" },
  { status: "documents_requis", label: "Documents" },
  { status: "soumis",           label: "Soumission" },
  { status: "approuve",         label: "Approbation" },
];

function getStepIndex(status: DossierStatus): number {
  if (status === "refuse") return -1;
  return PROGRESS_STEPS.findIndex((s) => s.status === status);
}

interface AgencyDossier {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  visaType: string;
  status: DossierStatus;
  adminNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function CandidateAgencyDossier() {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [message, setMessage] = useState("");

  const { data: dossiers, isLoading, refetch } = trpc.agencyDossier.getMyDossiers.useQuery(
    { email: searchedEmail || undefined },
    {
      enabled: isAuthenticated && !!searchedEmail,
    }
  );

  const handleSearch = () => {
    if (!searchEmail.trim()) {
      toast({ title: "Email requis", description: "Veuillez entrer votre adresse email.", variant: "destructive" });
      return;
    }
    setSearchedEmail(searchEmail.trim());
  };

  const handleWhatsApp = (dossier: AgencyDossier) => {
    const text = encodeURIComponent(
      `Bonjour 3M Travel & Services,\n\nJe vous contacte concernant mon dossier :\n- Nom : ${dossier.fullName}\n- Email : ${dossier.email}\n- Destination : ${dossier.destination}\n- Type de visa : ${dossier.visaType}\n- Statut actuel : ${STATUS_CONFIG[dossier.status]?.label || dossier.status}\n\n${message ? `Message : ${message}` : "Pourriez-vous me donner des informations sur l'avancement de mon dossier ?"}`
    );
    window.open(`https://wa.me/237699999999?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès à votre dossier</h2>
            <p className="text-gray-600 mb-6">
              Connectez-vous pour consulter le statut de votre dossier enregistré en agence.
            </p>
            <Button
              onClick={() => startLogin()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

    const myDossiers = (dossiers as AgencyDossier[] | undefined) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Mon Dossier en Agence
          </h1>
          <p className="text-gray-500 mt-1">
            Consultez le statut de votre dossier enregistré physiquement dans notre agence.
          </p>
        </motion.div>

        {/* Search */}
        {!searchedEmail && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Rechercher votre dossier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="search-email">Adresse email utilisée lors de l'enregistrement</Label>
                    <Input
                      id="search-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
                      Rechercher
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Votre email pré-rempli : <strong>{user?.email}</strong>
                </p>
                <Button
                  variant="link"
                  className="text-blue-600 p-0 h-auto text-xs mt-1"
                  onClick={() => { setSearchEmail(user?.email || ""); setSearchedEmail(user?.email || ""); }}
                >
                  Utiliser mon email de connexion
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {searchedEmail && (
          <div>
            {/* Reset search */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Résultats pour : <strong>{searchedEmail}</strong>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchedEmail(""); setSearchEmail(""); }}
                className="text-xs"
              >
                Nouvelle recherche
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : myDossiers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Aucun dossier trouvé</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Aucun dossier n'est associé à cet email. Vérifiez l'email utilisé lors de votre visite en agence.
                  </p>
                  <Button
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => window.open("https://wa.me/237699999999?text=Bonjour, je souhaite vérifier mon dossier.", "_blank")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contacter l'agence
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {myDossiers.map((dossier, index) => {
                    const statusInfo = STATUS_CONFIG[dossier.status];
                    const stepIndex = getStepIndex(dossier.status);
                    const isRefused = dossier.status === "refuse";

                    return (
                      <motion.div
                        key={dossier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden shadow-md">
                          {/* Status Banner */}
                          <div className={`px-6 py-4 border-b ${statusInfo.bgColor}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {statusInfo.icon}
                                <div>
                                  <p className={`font-bold text-lg ${statusInfo.color}`}>
                                    {statusInfo.label}
                                  </p>
                                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetch()}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <CardContent className="p-6">
                            {/* Dossier Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div>
                                <p className="text-xs text-gray-400">Nom complet</p>
                                <p className="font-medium text-gray-800">{dossier.fullName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Destination</p>
                                <p className="font-medium text-gray-800 flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-blue-500" />
                                  {dossier.destination}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Type de visa</p>
                                <p className="font-medium text-gray-800">{dossier.visaType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Enregistré le</p>
                                <p className="font-medium text-gray-800 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {new Date(dossier.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {!isRefused && (
                              <div className="mb-6">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Progression du dossier</p>
                                <div className="relative">
                                  {/* Track */}
                                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                                  <div
                                    className="absolute top-4 left-0 h-1 bg-blue-500 rounded-full transition-all duration-700"
                                    style={{ width: `${stepIndex >= 0 ? ((stepIndex + 1) / PROGRESS_STEPS.length) * 100 : 0}%` }}
                                  />
                                  {/* Steps */}
                                  <div className="relative flex justify-between">
                                    {PROGRESS_STEPS.map((step, i) => {
                                      const isDone = i <= stepIndex;
                                      const isCurrent = i === stepIndex;
                                      return (
                                        <div key={step.status} className="flex flex-col items-center gap-1">
                                          <motion.div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                              isDone
                                                ? "bg-blue-500 border-blue-500 text-white"
                                                : "bg-white border-gray-300 text-gray-400"
                                            } ${isCurrent ? "ring-4 ring-blue-200 scale-110" : ""}`}
                                            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                          >
                                            {isDone ? (
                                              <CheckCircle className="w-4 h-4" />
                                            ) : (
                                              <span className="text-xs font-bold">{i + 1}</span>
                                            )}
                                          </motion.div>
                                          <span className={`text-xs text-center max-w-[60px] leading-tight ${isDone ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                                            {step.label}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Admin Notes */}
                            {dossier.adminNotes && (
                              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  Message de l'agence
                                </p>
                                <p className="text-sm text-amber-700">{dossier.adminNotes}</p>
                              </div>
                            )}

                            {/* Next Steps */}
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <p className="text-sm font-semibold text-blue-800 mb-2">Prochaines étapes</p>
                              {dossier.status === "nouveau" && (
                                <p className="text-sm text-blue-700">Notre équipe va examiner votre dossier sous 24-48h et vous contactera pour les prochaines étapes.</p>
                              )}
                              {dossier.status === "en_cours" && (
                                <p className="text-sm text-blue-700">Votre dossier est en cours de traitement. Restez disponible pour toute communication de notre part.</p>
                              )}
                              {dossier.status === "documents_requis" && (
                                <p className="text-sm text-blue-700">⚠️ Des documents supplémentaires sont requis. Veuillez nous contacter rapidement pour éviter tout retard.</p>
                              )}
                              {dossier.status === "soumis" && (
                                <p className="text-sm text-blue-700">Votre dossier a été soumis. Le délai de traitement varie selon la destination. Nous vous informerons dès réception d'une réponse.</p>
                              )}
                              {dossier.status === "approuve" && (
                                <p className="text-sm text-blue-700">🎉 Votre dossier est approuvé ! Contactez-nous pour récupérer vos documents.</p>
                              )}
                              {dossier.status === "refuse" && (
                                <p className="text-sm text-blue-700">Nous sommes désolés. Contactez-nous pour discuter des options disponibles et d'un éventuel recours.</p>
                              )}
                            </div>

                            {/* Contact Actions */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <Textarea
                                  placeholder="Votre message pour l'agence (optionnel)..."
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                  className="text-sm resize-none"
                                  rows={2}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => handleWhatsApp(dossier)}
                                  className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                                >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  WhatsApp
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => window.location.href = "/contact"}
                                  className="whitespace-nowrap"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Formulaire
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-gray-100 rounded-lg"
        >
          <p className="text-xs text-gray-500 text-center">
            Ce suivi concerne uniquement les dossiers enregistrés physiquement dans notre agence.
            Pour les dossiers en ligne, consultez votre{" "}
            <a href="/mon-dossier" className="text-blue-600 hover:underline">espace dossier en ligne</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
