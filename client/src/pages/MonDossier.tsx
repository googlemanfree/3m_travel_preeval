import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/Footer";
import { DossierProgressBar } from "@/components/DossierProgressBar";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Search,
  MessageSquare,
  Download,
  Shield,
  Plane,
  Star,
  ChevronRight,
  Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DossierStatus = "nouveau" | "paye" | "en_cours" | "documents_requis" | "soumis" | "approuve" | "refuse";

interface DossierData {
  id: number;
  dossierNumber: string;
  fullName: string;
  email: string;
  destination: string;
  visaType: string | null;
  formulaChosen: string;
  dossierStatus: DossierStatus;
  paymentStatus: string;
  paymentDate: Date | null;
  emailVerified: boolean;
  agreementSigned: boolean;
  agreementSignedAt: number | null;
  adminNote: string | null;
  passportUrl: string | null;
  cvUrl: string | null;
  diplomaUrl: string | null;
  documentsUrls: string | null;
  scoringTotal: number | null;
  scoringBadge: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Configuration des étapes de la timeline ──────────────────────────────────

const TIMELINE_STEPS = [
  {
    key: "soumission",
    label: "Dossier soumis",
    description: "Votre dossier a été reçu et enregistré",
    icon: FileText,
    statuses: ["nouveau", "paye", "en_cours", "documents_requis", "soumis", "approuve", "refuse"],
  },
  {
    key: "accord",
    label: "Accord signé",
    description: "Protocole d'accord signé électroniquement",
    icon: Shield,
    statuses: ["paye", "en_cours", "documents_requis", "soumis", "approuve"],
  },
  {
    key: "paiement",
    label: "Paiement confirmé",
    description: "Frais d'ouverture de dossier réglés",
    icon: CreditCard,
    statuses: ["paye", "en_cours", "documents_requis", "soumis", "approuve"],
  },
  {
    key: "traitement",
    label: "Dossier en traitement",
    description: "Nos conseillers étudient votre dossier",
    icon: Clock,
    statuses: ["en_cours", "documents_requis", "soumis", "approuve"],
  },
  {
    key: "soumis",
    label: "Dossier soumis",
    description: "Votre dossier a été soumis aux autorités",
    icon: CheckCircle2,
    statuses: ["soumis", "approuve"],
  },
  {
    key: "approuve",
    label: "Visa accordé",
    description: "Félicitations ! Votre visa a été approuvé",
    icon: Star,
    statuses: ["approuve"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusConfig(status: DossierStatus) {
  const configs: Record<DossierStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
    nouveau: { label: "Nouveau", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", icon: FileText },
    paye: { label: "Payé", color: "text-green-600", bgColor: "bg-green-50 border-green-200", icon: CreditCard },
    en_cours: { label: "En cours", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200", icon: Clock },
    documents_requis: { label: "Documents requis", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200", icon: AlertCircle },
    soumis: { label: "Soumis", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", icon: CheckCircle2 },
    approuve: { label: "Approuvé ✓", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: Star },
    refuse: { label: "Refusé", color: "text-red-600", bgColor: "bg-red-50 border-red-200", icon: AlertCircle },
  };
  return configs[status] || configs.nouveau;
}

function isStepCompleted(stepKey: string, dossier: DossierData): boolean {
  const statusOrder: DossierStatus[] = ["nouveau", "paye", "en_cours", "documents_requis", "soumis", "approuve"];
  const currentIndex = statusOrder.indexOf(dossier.dossierStatus);

  if (stepKey === "soumission") return true;
  if (stepKey === "accord") return dossier.agreementSigned;
  if (stepKey === "paiement") return dossier.paymentStatus === "SUCCESS";
  if (stepKey === "traitement") return currentIndex >= statusOrder.indexOf("en_cours");
  if (stepKey === "soumis") return currentIndex >= statusOrder.indexOf("soumis");
  if (stepKey === "approuve") return dossier.dossierStatus === "approuve";
  return false;
}

function isStepActive(stepKey: string, dossier: DossierData): boolean {
  if (stepKey === "accord" && !dossier.agreementSigned) return true;
  if (stepKey === "paiement" && dossier.agreementSigned && dossier.paymentStatus !== "SUCCESS") return true;
  if (stepKey === "traitement" && dossier.paymentStatus === "SUCCESS" && dossier.dossierStatus === "paye") return true;
  if (stepKey === "soumis" && dossier.dossierStatus === "en_cours") return true;
  if (stepKey === "approuve" && dossier.dossierStatus === "soumis") return true;
  return false;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MonDossier() {
  const [dossierNumber, setDossierNumber] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [credentials, setCredentials] = useState<{ dossierNumber: string; email: string } | null>(null);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Query de suivi (activée seulement après soumission)
  const { data: dossier, isLoading, error, refetch } = trpc.application.getDossierStatus.useQuery(
    credentials ?? { dossierNumber: "", email: "" },
    {
      enabled: !!credentials,
      retry: false,
    }
  );

  const sendMessageMutation = trpc.application.sendCandidateMessage.useMutation({
    onSuccess: () => {
      toast.success("Message envoyé à votre conseiller !");
      setMessage("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierNumber.trim() || !email.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    setCredentials({ dossierNumber: dossierNumber.trim(), email: email.trim() });
    setSubmitted(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !credentials) return;
    setSendingMessage(true);
    sendMessageMutation.mutate(
      { dossierNumber: credentials.dossierNumber, email: credentials.email, message: message.trim() },
      { onSettled: () => setSendingMessage(false) }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Lock className="w-4 h-4" />
              Espace sécurisé candidat
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi de mon dossier</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
              Consultez l'état d'avancement de votre dossier en temps réel. Accès sécurisé par numéro de dossier et email.
            </p>
          </div>

          {/* Formulaire de connexion */}
          {!submitted || error ? (
            <Card className="max-w-md mx-auto shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5 text-blue-600" />
                  Accéder à mon dossier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <Label htmlFor="dossierNumber" className="text-sm font-medium">
                      Numéro de dossier
                    </Label>
                    <Input
                      id="dossierNumber"
                      placeholder="ex: 3M-2026-1234"
                      value={dossierNumber}
                      onChange={(e) => setDossierNumber(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Reçu dans votre email de confirmation</p>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error.message}
                    </div>
                  )}
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Recherche en cours..." : "Accéder à mon dossier"}
                  </Button>
                </form>
                <div className="mt-4 pt-4 border-t text-center">
                  <p className="text-xs text-gray-400">
                    Vous n'avez pas encore de dossier ?{" "}
                    <a href="/open-dossier" className="text-blue-600 hover:underline font-medium">
                      Ouvrir un dossier
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Chargement de votre dossier...</p>
            </div>
          ) : dossier ? (
            <div className="space-y-6">
              {/* Barre de progression visuelle */}
              <DossierProgressBar
                status={dossier.dossierStatus as any}
                createdAt={dossier.createdAt}
                evaluationCompletedAt={undefined}
                documentsReceivedAt={undefined}
                submittedToAgenciesAt={undefined}
                dossierNumber={dossier.dossierNumber}
                email={dossier.email}
                onPaymentSuccess={() => {
                  // Recharger le dossier après le paiement
                  window.location.reload();
                }}
              />

              {/* Carte d'identité du dossier */}
              <Card className="shadow-md border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-blue-200 text-sm font-medium mb-1">Dossier</p>
                      <h2 className="text-2xl font-bold">{dossier.dossierNumber}</h2>
                      <p className="text-blue-100 mt-1">{dossier.fullName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-200 text-sm mb-1">Destination</p>
                      <p className="text-xl font-semibold flex items-center gap-1 justify-end">
                        <Plane className="w-5 h-5" />
                        {dossier.destination}
                      </p>
                      {dossier.visaType && (
                        <p className="text-blue-200 text-sm mt-1">Visa {dossier.visaType}</p>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Statut actuel</p>
                      {(() => {
                        const config = getStatusConfig(dossier.dossierStatus as DossierStatus);
                        const Icon = config.icon;
                        return (
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm ${config.bgColor} ${config.color}`}>
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Soumis le</p>
                      <p className="font-medium text-gray-800">
                        {new Date(dossier.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      </p>
                    </div>
                    {dossier.scoringTotal !== null && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Score d'éligibilité</p>
                        <p className="font-bold text-blue-700 text-lg">{dossier.scoringTotal}/100</p>
                        {dossier.scoringBadge && (
                          <Badge variant="outline" className="text-xs mt-1">{dossier.scoringBadge}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline d'avancement */}
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    Avancement de votre dossier
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {TIMELINE_STEPS.map((step, index) => {
                      const completed = isStepCompleted(step.key, dossier as DossierData);
                      const active = isStepActive(step.key, dossier as DossierData);
                      const Icon = step.icon;
                      const isLast = index === TIMELINE_STEPS.length - 1;

                      return (
                        <div key={step.key} className="flex gap-4 relative">
                          {/* Ligne verticale */}
                          {!isLast && (
                            <div
                              className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 transition-colors duration-500 ${
                                completed ? "bg-blue-500" : "bg-gray-200"
                              }`}
                              style={{ height: "calc(100% - 10px)" }}
                            />
                          )}

                          {/* Icône */}
                          <div
                            className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              completed
                                ? "bg-blue-600 text-white shadow-md"
                                : active
                                ? "bg-blue-100 text-blue-600 border-2 border-blue-400 animate-pulse"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Contenu */}
                          <div className={`pb-8 flex-1 ${isLast ? "pb-0" : ""}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold text-sm ${completed ? "text-gray-900" : active ? "text-blue-700" : "text-gray-400"}`}>
                                {step.label}
                              </p>
                              {completed && (
                                <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0 border-0">
                                  Complété
                                </Badge>
                              )}
                              {active && !completed && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0 border-0">
                                  En attente
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${completed ? "text-gray-600" : "text-gray-400"}`}>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Note admin (si présente) */}
              {dossier.adminNote && (
                <Card className="shadow-md border-0 border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Messages de votre conseiller
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dossier.adminNote.split("\n\n").map((block, i) => {
                        const isAdvisor = block.startsWith("[RÉPONSE CONSEILLER");
                        const isCandidate = block.startsWith("[MSG CANDIDAT");
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg text-sm ${
                              isAdvisor
                                ? "bg-blue-50 border border-blue-100"
                                : isCandidate
                                ? "bg-gray-50 border border-gray-100"
                                : "bg-gray-50"
                            }`}
                          >
                            <pre className="whitespace-pre-wrap font-sans text-gray-700">{block}</pre>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents soumis */}
              {(dossier.passportUrl || dossier.cvUrl || dossier.diplomaUrl) && (
                <Card className="shadow-md border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Documents soumis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {dossier.passportUrl && (
                        <a
                          href={dossier.passportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                          Passeport
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </a>
                      )}
                      {dossier.cvUrl && (
                        <a
                          href={dossier.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                          CV
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </a>
                      )}
                      {dossier.diplomaUrl && (
                        <a
                          href={dossier.diplomaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
                        >
                          <Download className="w-4 h-4" />
                          Diplôme
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Prochaines étapes */}
              <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    Prochaine étape
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dossier.dossierStatus === "nouveau" && !dossier.agreementSigned && (
                    <div className="flex items-start gap-3">
                      <Shield className="w-8 h-8 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Signez votre protocole d'accord</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Vous devez signer le protocole d'accord pour valider votre engagement et procéder au paiement.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.agreementSigned && dossier.paymentStatus !== "SUCCESS" && (
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-8 h-8 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Effectuez votre paiement</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Réglez les frais d'ouverture de dossier (65 000 FCFA) pour démarrer le traitement de votre dossier.
                        </p>
                        <a href={`/verify-application-email?dossier=${dossier.dossierNumber}`} className="inline-flex items-center gap-1 mt-2 text-blue-600 font-medium text-sm hover:underline">
                          Procéder au paiement <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "paye" && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-8 h-8 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Dossier en cours d'examen</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre paiement a été confirmé. Nos conseillers examinent votre dossier. Délai estimé : 3 à 5 jours ouvrables.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "en_attente_documents" && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">En attente de vos documents</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Veuillez déposer vos documents originaux à notre agence ou soumettre un scan professionnel en ligne.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "en_cours_recrutement" && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-8 h-8 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Traitement en cours</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre dossier est activement traité par nos agences partenaires. Nous vous contacterons dès qu'il y a du nouveau.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "soumis_agences" && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-8 h-8 text-purple-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Dossier soumis aux agences partenaires</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre dossier a été soumis à nos agences de recrutement. Nous travaillons pour vous trouver une opportunité.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "visa_approuve" && (
                    <div className="flex items-start gap-3">
                      <Star className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Visa accordé — Félicitations !</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre visa a été approuvé. Contactez votre conseiller pour récupérer vos documents et planifier votre départ.
                        </p>
                      </div>
                    </div>
                  )}
                  {dossier.dossierStatus === "refuse" && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Dossier refusé</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Votre dossier a été refusé. Contactez votre conseiller pour analyser les raisons et explorer les alternatives.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messagerie candidat */}
              <Card className="shadow-md border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Contacter mon conseiller
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <Textarea
                      placeholder="Posez une question ou envoyez un message à votre conseiller..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Réponse sous 24-48h ouvrables</p>
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!message.trim() || sendingMessage}
                      >
                        {sendingMessage ? "Envoi..." : "Envoyer"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Bouton changer de dossier */}
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setCredentials(null);
                    setSubmitted(false);
                    setDossierNumber("");
                    setEmail("");
                  }}
                >
                  Consulter un autre dossier
                </Button>
              </div>

            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
