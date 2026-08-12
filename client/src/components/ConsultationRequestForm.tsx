import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, CheckCircle2, AlertCircle, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface Props {
  /** Pays pré-rempli (ex: "Luxembourg") — laisser vide pour un champ libre. */
  defaultCountry?: string;
}

export default function ConsultationRequestForm({ defaultCountry }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = trpc.consultationRequest.submit.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFormError("Merci de fournir votre CV au format PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Le fichier dépasse 5 Mo.");
      return;
    }
    setFormError("");
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (fullName.trim().length < 3) return setFormError("Le nom complet doit contenir au moins 3 caractères.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setFormError("Adresse email invalide.");

    let cvFileUrl: string | undefined;
    let cvFileName: string | undefined;

    if (cvFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", cvFile);
        formData.append("fileType", "cv");
        const res = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur d'envoi du CV" }));
          throw new Error(err.error || "Erreur lors de l'envoi du CV.");
        }
        const data = await res.json();
        cvFileUrl = data.fileUrl;
        cvFileName = data.fileName;
      } catch (err: any) {
        setIsUploading(false);
        setFormError(err.message || "Erreur lors de l'envoi du CV. Vous pouvez réessayer ou soumettre sans CV.");
        return;
      }
      setIsUploading(false);
    }

    submitMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      targetCountry: defaultCountry,
      message: message.trim() || undefined,
      cvFileUrl,
      cvFileName,
    });
  };

  if (submitMutation.data?.success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Demande envoyée !</h3>
        <p className="text-gray-600 text-sm">
          {cvFile
            ? "Votre CV est en cours d'analyse. Notre équipe examinera le résultat et vous recontactera par email très prochainement."
            : "Notre équipe examinera votre demande et vous recontactera par email très prochainement."}
        </p>
        {submitMutation.data?.emailSent ? (
          <div role="status" className="mt-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-left text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span><strong>Confirmation envoyée.</strong> Un e-mail de réception a été envoyé à {email}.</span>
          </div>
        ) : (
          <div role="status" className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>La demande est enregistrée, mais l’e-mail de confirmation n’a pas pu être envoyé. Notre équipe peut toujours traiter votre demande.</span>
          </div>
        )}
      </motion.div>
    );
  }

  const isPending = isUploading || submitMutation.isPending;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">Demander ma consultation gratuite</h3>
      <p className="text-sm text-gray-500 text-center mb-6">Joignez votre CV pour une analyse personnalisée de votre profil.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cr-fullName">Nom complet *</Label>
          <Input id="cr-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" className="mt-1" disabled={isPending} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cr-email">Email *</Label>
            <Input id="cr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="mt-1" disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="cr-phone">Téléphone</Label>
            <Input id="cr-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="mt-1" disabled={isPending} />
          </div>
        </div>
        <div>
          <Label htmlFor="cr-message">Message (optionnel)</Label>
          <Textarea id="cr-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Précisez votre projet, vos questions..." className="mt-1" rows={3} disabled={isPending} />
        </div>

        <div>
          <Label>CV (PDF, 5 Mo max)</Label>
          {!cvFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="mt-1 w-full border-2 border-dashed border-gray-300 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm">Cliquez pour importer votre CV</span>
            </button>
          ) : (
            <div className="mt-1 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{cvFile.name}</span>
              </div>
              <button type="button" onClick={() => setCvFile(null)} aria-label="Retirer le CV" disabled={isPending} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
        </div>

        <AnimatePresence>
          {(formError || submitMutation.error) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError || submitMutation.error?.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button type="submit" disabled={isPending} className="w-full py-6 text-base font-semibold bg-green-600 hover:bg-green-700">
          {isUploading ? (
            <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Envoi du CV...</span>
          ) : submitMutation.isPending ? (
            <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Envoi...</span>
          ) : (
            "💬 Demander ma consultation gratuite"
          )}
        </Button>
      </form>
    </div>
  );
}
