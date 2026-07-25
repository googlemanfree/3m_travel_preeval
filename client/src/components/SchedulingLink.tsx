import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Copy,
  Check,
  ExternalLink,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SchedulingLinkProps {
  candidateName: string;
  candidateEmail?: string;
  onLinkGenerated?: (link: string) => void;
}

interface SchedulingConfig {
  platform: "calendly" | "acuity" | "custom";
  duration: "15" | "30" | "45" | "60";
  type: "consultation" | "interview" | "follow-up";
  includeVideo: boolean;
  timezone: string;
}

const SCHEDULING_PLATFORMS = {
  calendly: {
    name: "Calendly",
    icon: "📅",
    description: "Planification simple et efficace",
    placeholder: "https://calendly.com/your-username",
  },
  acuity: {
    name: "Acuity Scheduling",
    icon: "🗓️",
    description: "Gestion complète des rendez-vous",
    placeholder: "https://acuity.scheduling.com/schedule.php?owner_id=...",
  },
  custom: {
    name: "Lien personnalisé",
    icon: "🔗",
    description: "Votre propre système de réservation",
    placeholder: "https://votre-domaine.com/booking",
  },
};

export function SchedulingLink({
  candidateName,
  candidateEmail,
  onLinkGenerated,
}: SchedulingLinkProps) {
  const [config, setConfig] = useState<SchedulingConfig>({
    platform: "calendly",
    duration: "30",
    type: "consultation",
    includeVideo: true,
    timezone: "UTC",
  });

  const [customLink, setCustomLink] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const generateLink = () => {
    let link = "";

    if (config.platform === "calendly") {
      link = `${customLink || "https://calendly.com/your-username"}?name=${encodeURIComponent(candidateName)}&email=${encodeURIComponent(candidateEmail || "")}&duration=${config.duration}&type=${config.type}`;
    } else if (config.platform === "acuity") {
      link = `${customLink || "https://acuity.scheduling.com/schedule.php?owner_id=..."}&name=${encodeURIComponent(candidateName)}&email=${encodeURIComponent(candidateEmail || "")}&duration=${config.duration}`;
    } else {
      link = `${customLink}?candidate=${encodeURIComponent(candidateName)}&email=${encodeURIComponent(candidateEmail || "")}&type=${config.type}`;
    }

    setGeneratedLink(link);
    onLinkGenerated?.(link);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getEmailText = () => {
    const platformName = SCHEDULING_PLATFORMS[config.platform].name;
    const typeLabel = {
      consultation: "une consultation",
      interview: "un entretien",
      "follow-up": "un suivi",
    }[config.type];

    return `Pour planifier ${typeLabel}, veuillez cliquer sur le lien ci-dessous :\n\n${generatedLink}\n\nCe lien vous permettra de choisir un créneau horaire qui vous convient.`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Configuration */}
      <Card className="p-6 border-blue-200 bg-blue-50">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Configuration du lien de rendez-vous
        </h3>

        <div className="space-y-4">
          {/* Plateforme */}
          <div>
            <Label className="text-sm font-semibold">Plateforme de réservation</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {(Object.entries(SCHEDULING_PLATFORMS) as Array<
                [keyof typeof SCHEDULING_PLATFORMS, (typeof SCHEDULING_PLATFORMS)[keyof typeof SCHEDULING_PLATFORMS]]
              >).map(([key, platform]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfig({ ...config, platform: key })}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    config.platform === key
                      ? "border-blue-600 bg-white shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-2xl mb-1">{platform.icon}</p>
                  <p className="text-xs font-semibold text-gray-900">{platform.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{platform.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Lien personnalisé */}
          <div>
            <Label htmlFor="custom-link" className="text-sm font-semibold">
              Lien de votre plateforme
            </Label>
            <Input
              id="custom-link"
              placeholder={SCHEDULING_PLATFORMS[config.platform].placeholder}
              value={customLink}
              onChange={(e) => setCustomLink(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-600 mt-1">
              Entrez l'URL de votre page de réservation
            </p>
          </div>

          {/* Durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-sm font-semibold">
                Durée du rendez-vous
              </Label>
              <Select value={config.duration} onValueChange={(value) => setConfig({ ...config, duration: value as "15" | "30" | "45" | "60" })}>
                <SelectTrigger id="duration" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 heure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type de rendez-vous */}
            <div>
              <Label htmlFor="type" className="text-sm font-semibold">
                Type de rendez-vous
              </Label>
              <Select value={config.type} onValueChange={(value) => setConfig({ ...config, type: value as "consultation" | "interview" | "follow-up" })}>
                <SelectTrigger id="type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="interview">Entretien</SelectItem>
                  <SelectItem value="follow-up">Suivi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vidéo */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <input
              type="checkbox"
              id="video"
              checked={config.includeVideo}
              onChange={(e) =>
                setConfig({ ...config, includeVideo: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="video" className="text-sm font-semibold cursor-pointer">
              Inclure un lien de vidéoconférence
            </Label>
          </div>

          {/* Bouton de génération */}
          <Button
            onClick={generateLink}
            disabled={!customLink}
            className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Calendar className="w-4 h-4" />
            Générer le lien
          </Button>
        </div>
      </Card>

      {/* Lien généré */}
      {generatedLink && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="p-6 border-green-200 bg-green-50">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Lien généré avec succès
            </h3>

            {/* Aperçu du lien */}
            <div className="bg-white p-4 rounded-lg border mb-4">
              <p className="text-xs text-gray-600 mb-2">Lien de réservation :</p>
              <div className="flex items-center gap-2 break-all">
                <code className="text-sm text-gray-900 flex-1 font-mono">
                  {generatedLink.substring(0, 50)}...
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="flex-shrink-0"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>{config.duration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span>{candidateName}</span>
              </div>
              {config.includeVideo && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span>Vidéoconférence incluse</span>
                </div>
              )}
            </div>

            {/* Aperçu du texte pour l'email */}
            <div className="bg-gray-50 p-3 rounded-lg border mb-4">
              <p className="text-xs text-gray-600 mb-2">Texte pour l'email :</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {getEmailText()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getEmailText());
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier le texte
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(generatedLink, "_blank")}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Tester le lien
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
