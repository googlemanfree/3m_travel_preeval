import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Copy,
  Download,
  Loader,
  X,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SchedulingLink } from "./SchedulingLink";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Candidate {
  fullName: string;
  email?: string;
  destination: string;
  visaType: string;
  scoringTotal: number;
  scoringBadge: "excellent" | "bon" | "moyen" | "faible";
}

interface EmailGeneratorProps {
  candidate: Candidate;
  aiSummary?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallAssessment: string;
  };
}

interface GeneratedEmail {
  subject: string;
  body: string;
  tone: "professionnel" | "encourageant" | "neutre";
}

export function EmailGenerator({ candidate, aiSummary }: EmailGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<GeneratedEmail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"professionnel" | "encourageant" | "neutre">(
    "professionnel"
  );
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [schedulingLink, setSchedulingLink] = useState("");
  const [includeScheduling, setIncludeScheduling] = useState(false);

  const generateEmail = async (tone: "professionnel" | "encourageant" | "neutre") => {
    setIsGenerating(true);
    setSelectedTone(tone);

    try {
      // Simuler un appel API pour générer l'email
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const toneDescriptions = {
        professionnel:
          "Maintenez un ton formel et professionnel, en mettant l'accent sur les critères objectifs.",
        encourageant:
          "Utilisez un ton bienveillant et encourageant, en soulignant les points positifs du candidat.",
        neutre:
          "Utilisez un ton neutre et informatif, en présentant les faits de manière équilibrée.",
      };

      const emailTemplates = {
        professionnel: {
          subject: `Suivi de votre candidature pour ${candidate.destination} - ${candidate.visaType}`,
          body: `Madame, Monsieur ${candidate.fullName},

Nous vous remercions de votre candidature pour un visa ${candidate.visaType} vers ${candidate.destination}.

Nous avons examiné votre dossier et souhaitons vous communiquer nos observations préliminaires :

POINTS FORTS DE VOTRE PROFIL :
${aiSummary?.strengths.map((s) => `• ${s}`).join("\n") || "• Profil solide et cohérent"}

POINTS À AMÉLIORER :
${aiSummary?.weaknesses.length ? aiSummary.weaknesses.map((w) => `• ${w}`).join("\n") : "• Aucun point critique identifié"}

RECOMMANDATIONS :
${aiSummary?.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") || "1. Préparez tous les documents requis\n2. Consultez les ressources spécifiques au pays"}

PROCHAINES ÉTAPES :
Veuillez prendre connaissance de nos recommandations et nous contacter si vous avez des questions. Notre équipe reste à votre disposition pour vous accompagner dans votre démarche.

Cordialement,
L'équipe 3M Travel & Services`,
        },
        encourageant: {
          subject: `Bonne nouvelle concernant votre candidature pour ${candidate.destination} ! 🎉`,
          body: `Cher(e) ${candidate.fullName},

Nous sommes heureux de vous informer que nous avons examiné votre candidature pour un visa ${candidate.visaType} vers ${candidate.destination}, et nous avons d'excellentes nouvelles !

VOS POINTS FORTS :
${aiSummary?.strengths.map((s) => `✓ ${s}`).join("\n") || "✓ Profil très prometteur"}

Votre profil présente de nombreux atouts qui jouent en votre faveur. Nous sommes confiants dans vos chances de succès.

QUELQUES SUGGESTIONS POUR RENFORCER VOTRE DOSSIER :
${aiSummary?.weaknesses.length ? aiSummary.weaknesses.map((w) => `→ ${w}`).join("\n") : "→ Votre dossier est déjà très complet"}

CONSEILS PRATIQUES :
${aiSummary?.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") || "1. Continuez à préparer votre projet\n2. Restez en contact avec notre équipe"}

Nous sommes vraiment enthousiaste à l'idée de vous accompagner dans cette belle aventure ! N'hésitez pas à nous contacter pour toute question.

Cordialement,
L'équipe 3M Travel & Services 🌍`,
        },
        neutre: {
          subject: `Analyse de votre candidature - ${candidate.destination} ${candidate.visaType}`,
          body: `Madame, Monsieur ${candidate.fullName},

Suite à l'examen de votre dossier de candidature pour un visa ${candidate.visaType} vers ${candidate.destination}, voici notre analyse :

ÉVALUATION :
${aiSummary?.overallAssessment || "Votre profil a été évalué selon nos critères standards."}

POINTS POSITIFS :
${aiSummary?.strengths.map((s) => `• ${s}`).join("\n") || "• Dossier conforme"}

POINTS À DÉVELOPPER :
${aiSummary?.weaknesses.length ? aiSummary.weaknesses.map((w) => `• ${w}`).join("\n") : "• Aucun problème majeur"}

ACTIONS RECOMMANDÉES :
${aiSummary?.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") || "1. Soumettre les documents\n2. Attendre la confirmation"}

Pour toute question, veuillez nous contacter.

Cordialement,
3M Travel & Services`,
        },
      };

      setEmail({
        subject: emailTemplates[tone].subject,
        body: emailTemplates[tone].body,
        tone,
      });
    } catch (error) {
      console.error("Erreur lors de la génération de l'email", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!email) return;

    const fullEmail = `Sujet: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(fullEmail);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadEmail = () => {
    if (!email) return;

    const content = `SUJET: ${email.subject}\n\n${email.body}`;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `email-${candidate.fullName}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      {/* Bouton d'action rapide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 flex-wrap"
      >
        <Button
          onClick={() => {
            setIsOpen(true);
            generateEmail("professionnel");
          }}
          disabled={isGenerating}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Générer un email
            </>
          )}
        </Button>

        {email && (
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Voir l'email
          </Button>
        )}
      </motion.div>

      {/* Modal de génération d'email */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Générateur d'Email Personnalisé</DialogTitle>
          </DialogHeader>

          {!email ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  Choisissez le ton de l'email :
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {(["professionnel", "encourageant", "neutre"] as const).map((tone) => (
                    <motion.button
                      key={tone}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => generateEmail(tone)}
                      disabled={isGenerating}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTone === tone
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <p className="font-semibold text-gray-900 capitalize">{tone}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {tone === "professionnel"
                          ? "Formel et structuré"
                          : tone === "encourageant"
                            ? "Bienveillant et positif"
                            : "Équilibré et factuel"}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 py-8"
                >
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <p className="text-gray-600 font-medium">Génération de l'email en cours...</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Informations du destinataire */}
              <Card className="bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Destinataire</Label>
                    <p className="font-semibold text-gray-900">{candidate.fullName}</p>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Ton</Label>
                    <p className="font-semibold text-gray-900 capitalize">{email.tone}</p>
                  </div>
                </div>
              </Card>

              {/* Sujet */}
              <div>
                <Label className="font-semibold">Sujet</Label>
                <div className="bg-gray-50 p-3 rounded-lg mt-2 border">
                  <p className="text-gray-900">{email.subject}</p>
                </div>
              </div>

              {/* Lien de rendez-vous */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="include-scheduling"
                    checked={includeScheduling}
                    onChange={(e) => setIncludeScheduling(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="include-scheduling" className="font-semibold cursor-pointer">
                    Inclure un lien de prise de rendez-vous
                  </Label>
                </div>
                {includeScheduling && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-blue-50 p-4 rounded-lg border border-blue-200"
                  >
                    <SchedulingLink
                      candidateName={candidate.fullName}
                      candidateEmail={candidate.email}
                      onLinkGenerated={(link) => setSchedulingLink(link)}
                    />
                  </motion.div>
                )}
              </div>

              {/* Corps de l'email */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">Corps du message</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Masquer
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Afficher
                      </>
                    )}
                  </Button>
                </div>
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 p-4 rounded-lg border whitespace-pre-wrap text-sm text-gray-700 max-h-96 overflow-y-auto"
                    >
                      {email.body}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmail(null);
                    generateEmail("professionnel");
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Régénérer
                </Button>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {isCopied ? "Copié !" : "Copier"}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadEmail}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
                <Button
                  onClick={() => {
                    /* Envoyer l'email via tRPC */
                  }}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
