import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  CheckCircle2,
  FileText,
  Users,
  Clock,
  AlertCircle,
  PenLine,
  Building2,
  Lock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AgreementProtocolProps {
  applicationId: number;
  dossierNumber: string;
  candidateName: string;
  destination: string;
  visaType?: string;
  formulaChosen?: string;
  onSigned: () => void;
  onBack: () => void;
}

export default function AgreementProtocol({
  applicationId,
  dossierNumber,
  candidateName,
  destination,
  visaType,
  formulaChosen,
  onSigned,
  onBack,
}: AgreementProtocolProps) {
  const [signatureName, setSignatureName] = useState(candidateName || "");
  const [hasRead, setHasRead] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [acceptsData, setAcceptsData] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<Date | null>(null);

  const signMutation = trpc.application.signAgreement.useMutation({
    onSuccess: () => {
      const now = new Date();
      setSignedAt(now);
      setSigned(true);
      toast.success("Protocole d'accord signé avec succès !");
      setTimeout(() => onSigned(), 2000);
    },
    onError: (err: { message: string }) => {
      toast.error("Erreur lors de la signature : " + err.message);
      setIsSigning(false);
    },
  });

  const handleSign = () => {
    if (!signatureName.trim()) {
      toast.error("Veuillez saisir votre nom complet pour signer.");
      return;
    }
    if (!hasRead || !acceptsTerms || !acceptsData) {
      toast.error("Veuillez cocher toutes les cases pour continuer.");
      return;
    }
    setIsSigning(true);
    signMutation.mutate({ applicationId, signatureName: signatureName.trim() });
  };

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const visaLabel: Record<string, string> = {
    etude: "Visa Étude",
    travail: "Visa Travail",
    tourisme: "Visa Tourisme",
    residence: "Résidence Permanente",
    famille: "Regroupement Familial",
    affaires: "Visa Affaires",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            Protocole d'Accord — Étape 2 sur 3
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Protocole d'Accompagnement
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto">
            Avant de finaliser votre dossier, veuillez lire attentivement ce
            document qui définit nos engagements réciproques.
          </p>
        </motion.div>

        {/* Document d'accord */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6"
        >
          {/* En-tête du document */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-200 text-sm font-medium">
                    3M TRAVEL AND SERVICES
                  </span>
                </div>
                <h2 className="text-xl font-bold">
                  PROTOCOLE D'ACCORD D'ACCOMPAGNEMENT
                </h2>
                <p className="text-blue-200 text-sm mt-1">
                  Dossier N° {dossierNumber} — {today}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-blue-500 text-white border-0 mb-2">
                  {visaLabel[visaType || ""] || visaType || "Visa Immigration"}
                </Badge>
                <p className="text-blue-200 text-sm">
                  Destination : {destination}
                </p>
              </div>
            </div>
          </div>

          {/* Corps du document */}
          <div className="p-6 space-y-6 text-slate-700 text-sm leading-relaxed">
            {/* Préambule */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                  I
                </span>
                Préambule
              </h3>
              <p>
                Le présent protocole est conclu entre{" "}
                <strong>3M Travel and Services</strong>, agence spécialisée en
                accompagnement à la mobilité internationale (ci-après
                «&nbsp;l'Agence&nbsp;»), et{" "}
                <strong>{candidateName || "le Candidat"}</strong> (ci-après
                «&nbsp;le Candidat&nbsp;»), dans le cadre d'une demande de visa
                de type <strong>{visaLabel[visaType || ""] || "immigration"}</strong> pour{" "}
                <strong>{destination}</strong>.
              </p>
              <p className="mt-2">
                Ce document formalise les termes de la collaboration entre les
                deux parties et définit clairement les obligations, les
                limites de responsabilité, et les conditions de l'accompagnement
                proposé.
              </p>
            </div>

            <Separator />

            {/* Engagements de l'agence */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                  II
                </span>
                Engagements de l'Agence
              </h3>
              <div className="space-y-2">
                {[
                  "Analyser le profil du Candidat et évaluer son éligibilité au visa demandé selon les critères officiels en vigueur.",
                  "Constituer et vérifier l'intégralité du dossier de demande de visa conformément aux exigences consulaires.",
                  "Accompagner le Candidat dans la préparation des documents requis, la rédaction des lettres de motivation et des justificatifs.",
                  "Assurer un suivi régulier de l'avancement du dossier et informer le Candidat de toute évolution significative.",
                  "Fournir des conseils personnalisés sur les démarches administratives, les délais et les procédures consulaires.",
                  "Maintenir la confidentialité absolue de toutes les informations et documents fournis par le Candidat.",
                  "Mettre à disposition une équipe disponible pour répondre aux questions du Candidat tout au long du processus.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Engagements du candidat */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                  III
                </span>
                Engagements du Candidat
              </h3>
              <div className="space-y-2">
                {[
                  "Fournir des informations exactes, complètes et sincères lors de la constitution du dossier.",
                  "Transmettre tous les documents demandés dans les délais convenus avec l'Agence.",
                  "Informer immédiatement l'Agence de tout changement de situation (emploi, état civil, adresse, etc.) susceptible d'affecter le dossier.",
                  "Respecter les rendez-vous et les délais fixés par l'Agence pour les démarches consulaires.",
                  "Ne pas entreprendre de démarches parallèles susceptibles de compromettre le dossier sans en informer l'Agence.",
                  "S'acquitter des honoraires d'accompagnement dans les conditions convenues.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Limites de responsabilité */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                  IV
                </span>
                Limites de Responsabilité
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    L'Agence est un prestataire de services d'accompagnement
                    administratif. Elle n'est pas une autorité consulaire et ne
                    peut garantir l'obtention du visa, la décision finale
                    appartenant exclusivement aux autorités compétentes du pays
                    de destination.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    L'Agence ne peut être tenue responsable des refus de visa
                    liés à des informations inexactes fournies par le Candidat,
                    à des changements de politique consulaire, ou à des
                    circonstances indépendantes de sa volonté.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Les délais de traitement indiqués sont donnés à titre
                    indicatif et peuvent varier selon les consulats et les
                    périodes de l'année.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Honoraires */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                  V
                </span>
                Honoraires et Conditions Financières
              </h3>
              <p className="text-slate-600">
                Les honoraires d'accompagnement correspondent à la formule
                choisie par le Candidat lors de sa demande ({formulaChosen || "formule standard"}).
                Le détail des prestations incluses dans cette formule est
                disponible sur notre site et a été présenté au Candidat lors de
                son évaluation. Les conditions de paiement et d'éventuel
                remboursement partiel en cas de refus de visa sont précisées
                dans les conditions générales de vente disponibles sur demande.
              </p>
            </div>

            <Separator />

            {/* Confidentialité */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                  VI
                </span>
                Protection des Données Personnelles
              </h3>
              <p>
                Les données personnelles collectées dans le cadre de ce dossier
                sont traitées conformément à la réglementation en vigueur sur la
                protection des données. Elles sont utilisées exclusivement dans
                le cadre de l'accompagnement visa et ne sont transmises qu'aux
                autorités consulaires compétentes et aux partenaires
                strictement nécessaires au traitement du dossier.
              </p>
            </div>

            <Separator />

            {/* Durée */}
            <div>
              <h3 className="font-semibold text-slate-900 text-base mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                  VII
                </span>
                Durée et Résiliation
              </h3>
              <p>
                Le présent protocole prend effet à compter de sa signature
                électronique par le Candidat et reste valable jusqu'à la
                décision finale des autorités consulaires concernant la demande
                de visa. Il peut être résilié par l'une ou l'autre des parties
                moyennant un préavis écrit de 7 jours, sous réserve des
                conditions financières applicables.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section signature */}
        <AnimatePresence mode="wait">
          {!signed ? (
            <motion.div
              key="signing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Signature Électronique
                  </h3>
                  <p className="text-sm text-slate-500">
                    Votre signature sera horodatée et enregistrée de façon
                    sécurisée.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Nom de signature */}
                <div>
                  <Label htmlFor="sigName" className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Votre nom complet (tel qu'il apparaît sur votre passeport) *
                  </Label>
                  <Input
                    id="sigName"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Ex : Jean-Pierre DUPONT"
                    className="text-base"
                  />
                </div>

                {/* Date automatique */}
                <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    Date de signature : <strong>{today}</strong> — horodatée
                    automatiquement
                  </span>
                </div>

                {/* Cases à cocher */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="hasRead"
                      checked={hasRead}
                      onCheckedChange={(v) => setHasRead(!!v)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="hasRead"
                      className="text-sm text-slate-700 cursor-pointer leading-relaxed"
                    >
                      J'atteste avoir lu et compris l'intégralité du présent
                      Protocole d'Accord d'Accompagnement dans toutes ses
                      clauses.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptsTerms"
                      checked={acceptsTerms}
                      onCheckedChange={(v) => setAcceptsTerms(!!v)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="acceptsTerms"
                      className="text-sm text-slate-700 cursor-pointer leading-relaxed"
                    >
                      J'accepte les termes et conditions de ce protocole, y
                      compris les engagements réciproques et les limites de
                      responsabilité de l'Agence.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptsData"
                      checked={acceptsData}
                      onCheckedChange={(v) => setAcceptsData(!!v)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="acceptsData"
                      className="text-sm text-slate-700 cursor-pointer leading-relaxed"
                    >
                      J'autorise 3M Travel and Services à traiter mes données
                      personnelles dans le cadre exclusif de ma demande de visa
                      conformément à la politique de confidentialité.
                    </Label>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                    disabled={isSigning}
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleSign}
                    disabled={
                      isSigning ||
                      !signatureName.trim() ||
                      !hasRead ||
                      !acceptsTerms ||
                      !acceptsData
                    }
                    className="flex-[2] bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    {isSigning ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signature en cours...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <PenLine className="w-4 h-4" />
                        Je signe et accepte ce protocole
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Protocole signé avec succès !
              </h3>
              <p className="text-green-700 mb-1">
                Signé par <strong>{signatureName}</strong>
              </p>
              <p className="text-green-600 text-sm">
                {signedAt?.toLocaleString("fr-FR")} — Référence : {dossierNumber}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600 text-sm">
                <Shield className="w-4 h-4" />
                <span>Signature horodatée et enregistrée de façon sécurisée</span>
              </div>
              <p className="text-green-600 text-sm mt-3">
                Redirection vers la confirmation de votre email...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
