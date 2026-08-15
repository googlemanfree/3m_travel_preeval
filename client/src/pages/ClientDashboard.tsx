import { useState, useEffect } from "react";
import { getCandidateToken, useCandidateAuth } from "@/hooks/useCandidateAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarCropperModal } from "@/components/AvatarCropperModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp,
  FileCheck,
  FileWarning,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  Eye,
  Upload,
  Printer,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CreditCard,
  MessageSquare,
  Bell,
  Search,
  Archive,
  RotateCcw,
  Settings,
  LogOut,
  Heart,
  Plane,
  LifeBuoy,
  Loader2,
  X,
  UserRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface DossierStatus {
  id: string;
  numero: string;
  destination: string;
  projectType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  progress: number;
  totalDocuments: number;
  uploadedDocuments: number;
  missingDocuments: string[];
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "non_paye";
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
  paymentDate?: Date | null;
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: "pending" | "verified" | "rejected";
  notes?: string;
  rejectionReason?: string | null;
  fileUrl?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any; step: number; progress: number; action: string }> = {
  nouveau: { label: "Dossier créé", color: "bg-slate-100 text-slate-800", icon: Clock, step: 1, progress: 10, action: "Complétez votre évaluation et vos premières informations." },
  en_evaluation: { label: "Évaluation en cours", color: "bg-blue-100 text-blue-800", icon: Clock, step: 1, progress: 25, action: "Notre équipe analyse votre profil." },
  bilan_envoye: { label: "Bilan disponible", color: "bg-indigo-100 text-indigo-800", icon: FileCheck, step: 2, progress: 35, action: "Consultez votre bilan et la destination recommandée." },
  en_attente_paiement: { label: "Paiement à confirmer", color: "bg-amber-100 text-amber-800", icon: Clock, step: 2, progress: 40, action: "Vérifiez les instructions de paiement communiquées par l’agence." },
  paye: { label: "Paiement confirmé", color: "bg-cyan-100 text-cyan-800", icon: CheckCircle2, step: 2, progress: 45, action: "Préparez les pièces demandées pour la suite de la procédure." },
  en_attente_documents: { label: "Documents attendus", color: "bg-orange-100 text-orange-800", icon: AlertCircle, step: 3, progress: 55, action: "Ajoutez les documents manquants dans votre centre documentaire." },
  documents_recus: { label: "Documents reçus", color: "bg-teal-100 text-teal-800", icon: FileCheck, step: 3, progress: 65, action: "Vos documents sont en cours de contrôle par l’équipe." },
  soumis_agences: { label: "Dossier transmis", color: "bg-violet-100 text-violet-800", icon: FileUp, step: 4, progress: 78, action: "Votre dossier a été transmis aux partenaires autorisés." },
  en_cours_recrutement: { label: "Recrutement en cours", color: "bg-purple-100 text-purple-800", icon: Clock, step: 4, progress: 86, action: "Les retours des agences et employeurs sont suivis par l’équipe." },
  contrat_obtenu: { label: "Contrat obtenu", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2, step: 4, progress: 92, action: "Votre conseiller vous communiquera les prochaines formalités." },
  visa_approuve: { label: "Visa approuvé", color: "bg-green-100 text-green-800", icon: CheckCircle2, step: 5, progress: 100, action: "Félicitations. Consultez les instructions finales de votre conseiller." },
  refuse: { label: "Dossier à revoir", color: "bg-red-100 text-red-800", icon: AlertCircle, step: 5, progress: 100, action: "Consultez vos messages et contactez votre conseiller pour les prochaines options." },
};

const PROGRESS_STEPS = [
  { step: 1, label: "Évaluation", icon: FileCheck },
  { step: 2, label: "Bilan", icon: BarChart3 },
  { step: 3, label: "Documents", icon: FileUp },
  { step: 4, label: "Partenaires", icon: Plane },
  { step: 5, label: "Décision", icon: CheckCircle2 },
];

const SUPPORT_WHATSAPP_NUMBER = "237698104832";

export default function ClientDashboard() {
  const { candidate, isAuthenticated, logout } = useCandidateAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [dossier, setDossier] = useState<DossierStatus | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documentSuccessMessage, setDocumentSuccessMessage] = useState<string | null>(null);
  const [recentDocument, setRecentDocument] = useState<{ id: number; name: string; url: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null);
  const [historySort, setHistorySort] = useState<"recent" | "oldest">("recent");
  const [historyType, setHistoryType] = useState("all");
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", nationality: "", dateOfBirth: "" });
  const [correctionTarget, setCorrectionTarget] = useState<DocumentItem | null>(null);
  const [correctionComment, setCorrectionComment] = useState("");
  const [correctionFile, setCorrectionFile] = useState<File | null>(null);
  const [paymentReceiptUploading, setPaymentReceiptUploading] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "admin" | "agency">("all");
  const [notificationView, setNotificationView] = useState<"active" | "archived">("active");
  const [notificationQuery, setNotificationQuery] = useState("");
  const [notificationReplyId, setNotificationReplyId] = useState<number | null>(null);
  const [notificationReplyText, setNotificationReplyText] = useState("");
  const [notificationReplyAttachment, setNotificationReplyAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; mimeType: string; index: number; total: number; notificationId: number | null; acknowledged: boolean } | null>(null);

  // Récupérer les données du dossier
  const { data: dossierData, isLoading: dossierLoading } = trpc.candidate.getMyDossierData.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Récupérer les documents
  const { data: documentsData } = trpc.candidate.getMyDocuments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: caseTrackingData, isLoading: caseTrackingLoading } = trpc.caseTracking.getMyCases.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: candidateMessages } = trpc.candidate.getMessages.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: profileData, isLoading: profileLoading } = trpc.candidate.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const messagesWithAttachments = (candidateMessages ?? []) as Array<{
    id?: number;
    createdAt?: Date | string | null;
    senderRole?: string | null;
    attachmentSignedUrl?: string | null;
    attachmentName?: string | null;
    attachmentMimeType?: string | null;
    notificationId?: number | null;
    }>;
  const attachmentGallery = messagesWithAttachments
    .filter((message) => Boolean(message.attachmentSignedUrl))
    .map((message) => ({
      url: message.attachmentSignedUrl as string,
      name: message.attachmentName || "Pièce jointe",
      mimeType: message.attachmentMimeType || "application/octet-stream",
      notificationId: message.notificationId ?? null,
    }));
  const openAttachmentPreview = (index: number) => {
    const attachment = attachmentGallery[index];
    if (attachment) setAttachmentPreview({ ...attachment, index, total: attachmentGallery.length, acknowledged: false });
  };
  const moveAttachment = (direction: -1 | 1) => {
    setAttachmentPreview((current) => {
      if (!current) return current;
      const nextIndex = current.index + direction;
      const nextAttachment = attachmentGallery[nextIndex];
      return nextAttachment ? { ...nextAttachment, index: nextIndex, total: attachmentGallery.length, acknowledged: current.acknowledged } : current;
    });
  };
  useEffect(() => {
    if (!attachmentPreview || attachmentGallery.length < 2) return;
    const handleAttachmentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveAttachment(-1);
      if (event.key === "ArrowRight") moveAttachment(1);
    };
    window.addEventListener("keydown", handleAttachmentKeyDown);
    return () => window.removeEventListener("keydown", handleAttachmentKeyDown);
  }, [attachmentPreview, attachmentGallery.length]);
  const printAttachment = (attachment: { url: string; name: string; mimeType: string }) => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!printWindow) {
      toast.error("Autorisez les fenêtres contextuelles pour imprimer ce document.");
      return;
    }
    const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
    const safeUrl = escapeHtml(attachment.url);
    const safeName = escapeHtml(attachment.name);
    const preview = attachment.mimeType === "application/pdf"
      ? `<iframe src="${safeUrl}" title="${safeName}" onload="window.print()"></iframe>`
      : `<img src="${safeUrl}" alt="${safeName}" onload="window.print()">`;
    printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Imprimer — ${safeName}</title><style>html,body{margin:0;min-height:100%;font-family:Arial,sans-serif}body{display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}img,iframe{width:100%;height:calc(100vh - 48px);border:0;object-fit:contain}</style></head><body>${preview}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const trpcUtils = trpc.useUtils();
  const { data: favoriteFlights, isLoading: favoritesLoading } = trpc.flights.getFavoriteFlights.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const deleteFavoriteMutation = trpc.flights.deleteFavoriteFlight.useMutation({
    onSuccess: async () => {
      await trpcUtils.flights.getFavoriteFlights.invalidate();
      toast.success("Itinéraire supprimé");
    },
  });

  const saveDocumentMutation = trpc.candidate.saveDocument.useMutation();
  const deleteDocumentMutation = trpc.candidate.deleteDocument.useMutation({
    onSuccess: async () => {
      await trpcUtils.candidate.getMyDocuments.invalidate();
      setRecentDocument(null);
      toast.success("Le document a été supprimé de votre espace.");
    },
    onError: (error) => toast.error(error.message || "Le document n’a pas pu être supprimé."),
  });
  const updateAvatarMutation = trpc.candidate.updateAvatar.useMutation({
    onSuccess: async () => {
      await trpcUtils.candidate.getProfile.invalidate();
      toast.success("Votre photo de profil a été mise à jour.");
    },
    onError: (error) => toast.error(error.message || "La photo de profil n’a pas pu être mise à jour."),
  });
  const updateProfileMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: async () => {
      await trpcUtils.candidate.getProfile.invalidate();
      toast.success("Vos informations personnelles ont été mises à jour.");
    },
    onError: (error) => toast.error(error.message || "Le profil n’a pas pu être mis à jour."),
  });
  const submitRequirementMutation = trpc.caseTracking.submitMyRequirementDocument.useMutation({
    onSuccess: async () => {
      await trpcUtils.caseTracking.getMyCases.invalidate();
      toast.success("Document transmis. Notre équipe va maintenant le vérifier.");
    },
    onError: (error) => toast.error(error.message || "Le document n’a pas pu être transmis."),
  });
  const markNotificationReadMutation = trpc.caseTracking.markNotificationRead.useMutation({
    onSuccess: async () => {
      await trpcUtils.caseTracking.getMyCases.invalidate();
    },
    onError: (error) => toast.error(error.message || "La notification n’a pas pu être marquée comme lue."),
  });
  const sendNotificationReplyMutation = trpc.candidate.sendMessage.useMutation({
    onSuccess: async () => {
      setNotificationReplyId(null);
      setNotificationReplyText("");
      setNotificationReplyAttachment(null);
      await Promise.all([trpcUtils.candidate.getMessages.invalidate(), trpcUtils.caseTracking.getMyCases.invalidate()]);
      toast.success("Votre réponse et sa pièce jointe ont été envoyées à l’administration.");
    },
    onError: (error) => toast.error(error.message || "La réponse n’a pas pu être envoyée."),
  });

  const readAttachmentAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture du fichier impossible."));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
  const undoNotificationAcknowledgementMutation = trpc.caseTracking.markNotificationUnread.useMutation({
    onSuccess: async () => {
      setAttachmentPreview((current) => current ? { ...current, acknowledged: false } : current);
      await trpcUtils.caseTracking.getMyCases.invalidate();
      toast.info("Accusé de réception annulé", {
        description: "La notification est de nouveau marquée comme non lue.",
        position: "bottom-center",
      });
    },
    onError: (error) => toast.error(error.message || "L’annulation n’a pas pu être enregistrée."),
  });
  const acknowledgeNotificationMutation = trpc.caseTracking.markNotificationRead.useMutation({
    onSuccess: async (_result, variables) => {
      const notificationId = variables && typeof variables === "object" && "notificationId" in variables
        ? variables.notificationId
        : attachmentPreview?.notificationId;
      setAttachmentPreview((current) => current ? { ...current, acknowledged: true } : current);
      await trpcUtils.caseTracking.getMyCases.invalidate();
      toast.success("Accusé de réception enregistré", {
        description: "L’administration sait désormais que vous avez consulté ce document.",
        position: "bottom-center",
        duration: 3500,
        action: {
          label: "Annuler",
          onClick: () => {
            if (notificationId) undoNotificationAcknowledgementMutation.mutate({ notificationId });
          },
        },
      });
    },
    onError: (error) => toast.error(error.message || "L’accusé de réception n’a pas pu être enregistré."),
  });
  const setNotificationArchivedMutation = trpc.caseTracking.setNotificationArchived.useMutation({
    onSuccess: async ({ archived }) => {
      await trpcUtils.caseTracking.getMyCases.invalidate();
      toast.success(archived ? "Notification archivée." : "Notification restaurée.");
    },
    onError: (error) => toast.error(error.message || "La notification n’a pas pu être mise à jour."),
  });
  const initiatePaymentMutation = trpc.application.initiateMyCinetPayPayment.useMutation({
    onSuccess: (result) => {
      if (result.paymentUrl) window.location.assign(result.paymentUrl);
      else toast.info("Le paiement en ligne n’a pas fourni de lien. Contactez votre conseiller.");
    },
    onError: (error) => toast.error(error.message || "Le paiement n’a pas pu être initialisé."),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    if (dossierData && dossierData.data) {
      const app = dossierData.data.application;
      const dossierStatus = String(dossierData.data.dossierStatus || app.dossierStatus || "nouveau");
      const statusConfig = STATUS_LABELS[dossierStatus] ?? STATUS_LABELS.nouveau;
      setDossier({
        id: app.id.toString(),
        numero: app.dossierNumber || `DOSS-${app.id}`,
        destination: app.destination || "Non spécifiée",
        projectType: app.formulaChosen || "Accompagnement international",
        status: dossierStatus,
        createdAt: new Date(app.createdAt),
        updatedAt: new Date(app.updatedAt),
        progress: statusConfig.progress,
        totalDocuments: dossierData.data.documents.length,
        uploadedDocuments: dossierData.data.documents.length,
        missingDocuments: [],
        paymentStatus: dossierData.data.paymentStatus ?? app.paymentStatus ?? "PENDING",
        paymentAmount: app.paymentAmount ?? 65000,
        paymentCurrency: app.paymentCurrency ?? "XAF",
        paymentDate: app.paymentDate ? new Date(app.paymentDate) : null,
      });
    }
  }, [dossierData]);

  useEffect(() => {
    if (documentsData && documentsData.documents) {
      setDocuments(
        documentsData.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.fileName,
          type: doc.fileType,
          size: 0,
          uploadedAt: new Date(doc.uploadedAt),
          status: doc.status || "pending",
          notes: "",
          rejectionReason: doc.rejectionReason || null,
          fileUrl: doc.fileUrl,
        }))
      );
    }
  }, [documentsData]);

  useEffect(() => {
    if (!profileData) return;
    setProfileForm({
      fullName: profileData.fullName || "",
      phone: profileData.phone || "",
      nationality: profileData.nationality || "",
      dateOfBirth: profileData.dateOfBirth || "",
    });
  }, [profileData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleCorrectionSubmission = async () => {
    if (!correctionTarget || !correctionFile) {
      toast.error("Sélectionnez la version corrigée du document.");
      return;
    }
    const explanation = correctionComment.trim();
    if (explanation.length < 3) {
      toast.error("Ajoutez un court commentaire explicatif avant l’envoi.");
      return;
    }
    const token = getCandidateToken();
    if (!token) {
      toast.error("Votre session candidat a expiré. Veuillez vous reconnecter.");
      setLocation("/login");
      return;
    }
    setUploading(true);
    try {
      const allowedTypes = new Set(["cv", "passeport", "diplome", "releve_notes", "photo", "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "autre"]);
      const formData = new FormData();
      formData.append("file", correctionFile);
      formData.append("fileType", allowedTypes.has(correctionTarget.type) ? correctionTarget.type : "autre");
      const response = await fetch("/api/candidate/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors du téléversement");
      const savedDocument = await saveDocumentMutation.mutateAsync({
        fileType: allowedTypes.has(correctionTarget.type) ? correctionTarget.type as "cv" | "passeport" | "diplome" | "releve_notes" | "photo" | "justificatif_domicile" | "extrait_naissance" | "casier_judiciaire" | "autre" : "autre",
        fileName: payload.fileName || correctionFile.name,
        fileUrl: payload.fileUrl,
        fileKey: payload.fileKey,
        fileSizeBytes: payload.fileSizeBytes ?? correctionFile.size,
        mimeType: payload.mimeType || correctionFile.type,
        correctionComment: `Correction de « ${correctionTarget.name} » : ${explanation}`,
      });
      if (savedDocument.documentId && payload.fileUrl) setRecentDocument({ id: savedDocument.documentId, name: payload.fileName || correctionFile.name, url: payload.fileUrl });
      await trpcUtils.candidate.getMyDocuments.invalidate();
      setDocumentSuccessMessage(`Votre version corrigée et votre commentaire ont été transmis au conseiller pour « ${correctionTarget.name} ».`);
      setCorrectionTarget(null);
      setCorrectionComment("");
      setCorrectionFile(null);
      toast.success("Correction envoyée au conseiller.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "La correction n’a pas pu être envoyée.");
    } finally {
      setUploading(false);
    }
  };

  const handleRequirementUpload = async (
    requirement: { id?: number; documentType?: string },
    file: File | undefined,
  ) => {
    if (!file) return;
    if (!requirement.id || !requirement.documentType) {
      toast.error("La pièce demandée est incomplète. Actualisez votre dossier puis réessayez.");
      return;
    }
    const token = getCandidateToken();
    if (!token) {
      toast.error("Votre session candidat a expiré. Veuillez vous reconnecter.");
      setLocation("/login");
      return;
    }
    const acceptedTypes = new Set([
      "passport", "cv", "diploma", "transcript", "bank_statement", "employment_letter",
      "birth_certificate", "marriage_certificate", "proof_of_residence", "passeport", "diplome",
      "releve_bancaire", "lettre_motivation", "contrat_travail", "lettre_admission", "acte_naissance",
      "acte_mariage", "justificatif_hebergement", "photo_identite", "casier_judiciaire",
    ]);
    const fileType = acceptedTypes.has(requirement.documentType) ? requirement.documentType : "other";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    try {
      const response = await fetch("/api/candidate/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors du téléversement");
      await submitRequirementMutation.mutateAsync({
        requirementId: requirement.id,
        fileName: payload.fileName || file.name,
        fileKey: payload.fileKey,
        mimeType: payload.mimeType || file.type,
        fileSizeBytes: payload.fileSizeBytes ?? file.size,
      });
      await Promise.all([
        trpcUtils.candidate.getMyDocuments.invalidate(),
        trpcUtils.candidate.getMyDossierData.invalidate(),
      ]);
      setDocumentSuccessMessage(`« ${payload.fileName || file.name} » a été reçu et transmis à votre conseiller pour vérification.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du téléversement");
    }
  };

    const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("Veuillez sélectionner au moins un fichier");
      return;
    }

    const token = getCandidateToken();
    if (!token) {
      toast.error("Votre session candidat a expiré. Veuillez vous reconnecter.");
      setLocation("/login");
      return;
    }

    setUploading(true);
    try {
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", "autre");
        const response = await fetch("/api/candidate/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Erreur lors du téléversement");
        const savedDocument = await saveDocumentMutation.mutateAsync({
          fileType: "autre",
          fileName: payload.fileName || file.name,
          fileUrl: payload.fileUrl,
          fileKey: payload.fileKey,
          fileSizeBytes: payload.fileSizeBytes ?? file.size,
          mimeType: payload.mimeType || file.type,
        });
        if (savedDocument.documentId && payload.fileUrl) {
          setRecentDocument({ id: savedDocument.documentId, name: payload.fileName || file.name, url: payload.fileUrl });
        }
      }
      await Promise.all([
        trpcUtils.candidate.getMyDocuments.invalidate(),
        trpcUtils.candidate.getMyDossierData.invalidate(),
      ]);
      toast.success("Documents téléversés avec succès!");
      setDocumentSuccessMessage(`${uploadedFiles.length} document${uploadedFiles.length > 1 ? "s ont" : " a"} été téléversé${uploadedFiles.length > 1 ? "s" : ""} avec succès.`);
      setUploadedFiles([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentReceiptUpload = async (file: File | undefined) => {
    if (!file) return;
    const token = getCandidateToken();
    if (!token) {
      toast.error("Votre session candidat a expiré. Veuillez vous reconnecter.");
      setLocation("/login");
      return;
    }
    setPaymentReceiptUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "justificatif_paiement");
      const response = await fetch("/api/candidate/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Le justificatif n’a pas pu être téléversé.");
      await saveDocumentMutation.mutateAsync({
        fileType: "justificatif_paiement",
        fileName: payload.fileName || file.name,
        fileUrl: payload.fileUrl,
        fileKey: payload.fileKey,
        fileSizeBytes: payload.fileSizeBytes ?? file.size,
        mimeType: payload.mimeType || file.type,
      });
      await Promise.all([
        trpcUtils.candidate.getMyDocuments.invalidate(),
        trpcUtils.candidate.getMyDossierData.invalidate(),
      ]);
      setDocumentSuccessMessage("Votre justificatif de paiement a été reçu. Il sera vérifié par l’administration avant l’ouverture complète du dossier.");
      toast.success("Justificatif de paiement transmis.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le justificatif n’a pas pu être transmis.");
    } finally {
      setPaymentReceiptUploading(false);
    }
  };

  if (dossierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Aucun Dossier Trouvé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Vous n'avez pas encore créé de dossier. Commencez par remplir l'évaluation d'éligibilité.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Retour à l'Accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = STATUS_LABELS[dossier.status] ?? STATUS_LABELS.nouveau;
  const StatusIcon = currentStatus.icon;
  const activeCase = caseTrackingData?.cases[0];
  const pendingRequirements = activeCase?.requirements.filter((requirement) =>
    requirement.status === "pending" || requirement.status === "rejected"
  ) ?? [];
  const statusHistory = (activeCase?.history ?? dossierData?.data?.statusHistory ?? [])
    .filter((entry) => entry?.createdAt)
    .slice()
    .sort((left, right) => new Date(left.createdAt!).getTime() - new Date(right.createdAt!).getTime());
  const historyTypes = Array.from(new Set(statusHistory.map((entry) => entry.newStatus).filter(Boolean))) as string[];
  const filteredStatusHistory = statusHistory
    .filter((entry) => historyType === "all" || entry.newStatus === historyType)
    .slice()
    .sort((left, right) => {
      const delta = new Date(left.createdAt!).getTime() - new Date(right.createdAt!).getTime();
      return historySort === "oldest" ? delta : -delta;
    });
  const requiresRevisionSupport = dossier.status === "refuse" || pendingRequirements.some((requirement) => requirement.status === "rejected");
  const handleQuickSupport = () => {
    const message = `Bonjour Prime Travel Service, j’ai besoin d’assistance pour la révision de mon dossier ${dossier.numero}.`;
    window.open(`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  const handleDeleteDocument = (document: { id: string; name: string }) => {
    if (!window.confirm(`Supprimer « ${document.name} » ? Cette action est disponible avant validation par l’équipe.`)) return;
    deleteDocumentMutation.mutate({ fileId: Number(document.id) });
  };
  const handleAvatarFileSelect = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image JPG, PNG ou WebP pour votre portrait.");
      return;
    }
    setAvatarCropSource(URL.createObjectURL(file));
  };
  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    const email = profileData?.email || candidate?.email;
    if (!email) {
      toast.error("Votre adresse e-mail est indisponible. Actualisez la page puis réessayez.");
      return;
    }
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", "photo_identite");
    formData.append("email", email);
    formData.append("captureMethod", "gallery");
    try {
      const response = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors du téléversement de la photo");
      await updateAvatarMutation.mutateAsync({ avatarUrl: payload.fileUrl, portraitVerificationToken: payload.portraitVerificationToken });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du téléversement de la photo");
    } finally {
      setAvatarUploading(false);
    }
  };
  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await updateProfileMutation.mutateAsync({
      fullName: profileForm.fullName.trim(),
      phone: profileForm.phone.trim() || undefined,
      nationality: profileForm.nationality.trim() || undefined,
      dateOfBirth: profileForm.dateOfBirth || undefined,
    });
  };
  const requiredRequirements = activeCase?.requirements.filter((requirement) => requirement.isRequired !== false) ?? [];
  const documentProgress = requiredRequirements.length > 0
    ? Math.round((requiredRequirements.filter((requirement) => requirement.status === "received" || requirement.status === "approved").length / requiredRequirements.length) * 100)
    : documents.length > 0 ? 100 : 0;
  const profileFieldsCompleted = [profileData?.fullName || candidate?.fullName, profileData?.phone, profileData?.nationality, profileData?.dateOfBirth].filter(Boolean).length;
  const profileProgress = Math.round((profileFieldsCompleted / 4) * 100);
  const globalProgress = Math.round((dossier.progress + documentProgress + profileProgress) / 3);
  const nextProgressSection = [
    { key: "procedure", value: dossier.progress, label: "la procédure" },
    { key: "documents", value: documentProgress, label: "les documents" },
    { key: "profile", value: profileProgress, label: "le profil" },
  ].sort((left, right) => left.value - right.value)[0];
  const navigateToIncompleteSection = (section: "procedure" | "documents" | "profile") => {
    if (section === "documents") setActiveTab("documents");
    if (section === "profile") setActiveTab("settings");
    window.setTimeout(() => document.getElementById(section === "documents" ? "documents-center" : section === "profile" ? "profile-settings" : "dossier-status")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const paymentStatus = dossier.paymentStatus ?? "PENDING";
  const paymentIsComplete = paymentStatus === "SUCCESS";
  const paymentStatusLabel = paymentIsComplete
    ? "Paiement confirmé"
    : paymentStatus === "FAILED" || paymentStatus === "CANCELLED"
      ? "Paiement à vérifier"
      : "Paiement en attente";
  const paymentStatusClass = paymentIsComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : paymentStatus === "FAILED" || paymentStatus === "CANCELLED"
      ? "border-red-200 bg-red-50 text-red-950"
      : "border-amber-200 bg-amber-50 text-amber-950";
  const hasOnlineApplication = Boolean(dossierData?.data?.application?.id);
  const notificationItems = (caseTrackingData?.notifications ?? []).map((notification: any) => {
    const isAgency = String(notification.type).startsWith("agency_") || notification.type === "agency_response";
    return {
      ...notification,
      category: isAgency ? "agency" as const : "admin" as const,
      categoryLabel: isAgency ? "Agence de placement" : "Administration",
    };
  });
  const filteredNotifications = notificationItems.filter((notification) => {
    const query = notificationQuery.trim().toLocaleLowerCase("fr-FR");
    const matchesView = notificationView === "archived" ? notification.isArchived : !notification.isArchived;
    const matchesCategory = notificationFilter === "all" || notification.category === notificationFilter;
    const matchesSearch = !query || `${notification.title} ${notification.body} ${notification.categoryLabel}`.toLocaleLowerCase("fr-FR").includes(query);
    return matchesView && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mon Espace Client</h1>
              <p className="text-gray-600 mt-2">Dossier: <span className="font-semibold">{dossier.numero}</span></p>
            </div>
            <Button variant="outline" onClick={() => { logout(); setLocation("/login"); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white shadow-lg">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
            <div className="flex items-center gap-4 md:block md:text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-300/70 bg-white/10 text-2xl font-bold" aria-hidden="true">{globalProgress}%</div>
              <div>
                <p className="mt-0 text-sm font-semibold md:mt-3">Avancement global</p>
                <p className="text-xs text-blue-100">Synthèse de votre dossier</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Vue d’ensemble de votre progression</h2>
                  <p className="text-sm text-blue-100">Le pourcentage combine votre procédure, vos documents requis et vos informations de profil.</p>
                </div>
              </div>
              <button type="button" onClick={() => navigateToIncompleteSection(nextProgressSection.key as "procedure" | "documents" | "profile")} className="w-full space-y-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200" aria-label={`Accéder à ${nextProgressSection.label}, la priorité actuelle de votre dossier`}>
                <div className="flex items-center justify-between text-sm text-cyan-50"><span>Étape prioritaire : {nextProgressSection.label}</span><span className="font-semibold underline underline-offset-4">Compléter</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Progression globale du dossier" aria-valuemin={0} aria-valuemax={100} aria-valuenow={globalProgress}><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all duration-300" style={{ width: `${globalProgress}%` }} /></div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <span className="rounded-lg bg-white/10 p-3"><span className="block text-blue-100">Procédure</span><strong>{dossier.progress}%</strong></span>
                  <span className="rounded-lg bg-white/10 p-3"><span className="block text-blue-100">Documents</span><strong>{documentProgress}%</strong></span>
                  <span className="rounded-lg bg-white/10 p-3"><span className="block text-blue-100">Profil</span><strong>{profileProgress}%</strong></span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Statut Principal */}
        <Card id="dossier-status" className="border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="w-6 h-6" aria-hidden="true" />
                    {currentStatus.label}
                  </CardTitle>
                  <CardDescription>
                    Destination : {dossier.destination} · Type : {dossier.projectType}
                  </CardDescription>
              </div>
              <Badge className={currentStatus.color}>
                {currentStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Module de suivi synchronisé avec le statut fixé par l’administration */}
            <div className="space-y-3" aria-label="Suivi d’avancement du dossier">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">Suivi de votre dossier</span>
                <span className="text-sm font-semibold text-blue-700">{dossier.progress}%</span>
              </div>
              <div
                className="w-full overflow-hidden rounded-full bg-gray-200 h-3"
                role="progressbar"
                aria-label="Progression du dossier"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={dossier.progress}
              >
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                  style={{ width: `${dossier.progress}%` }}
                />
              </div>
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                <span className="font-semibold">Prochaine action : </span>{currentStatus.action}
              </p>
            </div>

            {/* Étapes */}
            <div className="grid grid-cols-5 gap-2">
              {PROGRESS_STEPS.map((step, idx) => (
                <div
                  key={step.step}
                  className={`p-3 rounded-lg text-center transition-all ${
                    step.step <= currentStatus.step
                      ? "bg-blue-100 border-2 border-blue-600 text-blue-900"
                      : "bg-gray-100 border-2 border-gray-300 text-gray-600"
                  }`}
                  aria-current={step.step === currentStatus.step ? "step" : undefined}
                >
                  <step.icon className="mx-auto mb-1 h-6 w-6" aria-hidden="true" />
                  <p className="text-xs font-semibold">{step.label}</p>
                </div>
              ))}
            </div>

            {/* Documents Manquants */}
            {dossier.missingDocuments.length > 0 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="font-semibold text-orange-900 mb-2">Documents Manquants:</p>
                <ul className="space-y-1">
                  {dossier.missingDocuments.map((doc, idx) => (
                    <li key={idx} className="text-sm text-orange-800">
                      • {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="payment-dossier" className={`border ${paymentStatusClass}`}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                  Frais d’ouverture de dossier
                </CardTitle>
                <CardDescription className="mt-1 text-current/75">
                  Traitement, traduction et soumission de votre profil aux agences partenaires.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-current/30 bg-white/70 text-current">{paymentStatusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-bold">{(dossier.paymentAmount ?? 65000).toLocaleString("fr-FR")} {dossier.paymentCurrency ?? "XAF"}</p>
                <p className="mt-1 text-sm text-current/75">Dossier {dossier.numero}</p>
              </div>
              {paymentIsComplete ? (
                <div className="flex items-center gap-2 font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Les étapes suivantes sont ouvertes</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    disabled={!hasOnlineApplication || initiatePaymentMutation.isPending}
                    onClick={() => initiatePaymentMutation.mutate({ paymentMethod: "mtn" })}
                  >
                    {initiatePaymentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />}
                    Payer en ligne
                  </Button>
                  <label htmlFor="payment-receipt-upload" className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-current/30 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white focus-within:ring-2 focus-within:ring-blue-500">
                    {paymentReceiptUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="mr-2 h-4 w-4" aria-hidden="true" />}
                    Déposer un reçu
                    <input id="payment-receipt-upload" type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={paymentReceiptUploading} onChange={(event) => { void handlePaymentReceiptUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                  </label>
                </div>
              )}
            </div>
            {!hasOnlineApplication && !paymentIsComplete && <p className="text-sm text-current/80">Votre dossier historique est rattaché à votre compte. Envoyez le reçu effectué en agence ; l’administration mettra à jour le statut après vérification.</p>}
            {dossier.paymentDate && <p className="text-xs text-current/70">Dernière mise à jour : {dossier.paymentDate.toLocaleString("fr-FR")}</p>}
          </CardContent>
        </Card>

        {documentSuccessMessage && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-emerald-600 p-1 text-white"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span>
              <div>
                <p className="font-semibold">Dépôt confirmé</p>
                <p className="mt-1 text-sm text-emerald-900">{documentSuccessMessage}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 text-emerald-800 hover:bg-emerald-100" aria-label="Masquer la confirmation" onClick={() => setDocumentSuccessMessage(null)}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {recentDocument && (
          <Card className="border border-emerald-200 bg-white">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <div><p className="font-semibold text-slate-900">Document récent : {recentDocument.name}</p><p className="text-sm text-slate-600">Vérifiez le fichier ou supprimez-le tant qu’il n’est pas validé.</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild><a href={recentDocument.url} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" aria-hidden="true" />Prévisualiser</a></Button>
                <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" disabled={deleteDocumentMutation.isPending} onClick={() => deleteDocumentMutation.mutate({ fileId: recentDocument.id })}>
                  {deleteDocumentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />} Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-orange-950">
                  <FileWarning className="h-5 w-5 text-orange-600" aria-hidden="true" />
                  Pièces à compléter
                </CardTitle>
                <CardDescription className="mt-1">Déposez directement la pièce demandée. Elle sera transmise au conseiller pour vérification.</CardDescription>
              </div>
              <Badge variant="outline" className="border-orange-300 bg-white text-orange-800">
                {caseTrackingLoading ? "Chargement…" : `${pendingRequirements.length} à traiter`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {caseTrackingLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-600" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des demandes documentaires…
              </div>
            ) : pendingRequirements.length > 0 ? (
              <div className="space-y-3">
                {pendingRequirements.map((requirement) => {
                  const inputId = `requirement-upload-${requirement.id}`;
                  const isRejected = requirement.status === "rejected";
                  return (
                    <div key={requirement.id} className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{requirement.documentType}</p>
                        <p className="mt-1 text-sm text-slate-600">{requirement.adminComment || (isRejected ? "Une nouvelle version est demandée par le conseiller." : "Document requis pour poursuivre votre dossier.")}</p>
                        {requirement.dueAt && <p className="mt-1 text-xs text-slate-500">À transmettre avant le {new Date(requirement.dueAt).toLocaleDateString("fr-FR")}</p>}
                      </div>
                      <div className="shrink-0">
                        <input
                          id={inputId}
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                          disabled={submitRequirementMutation.isPending}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0];
                            void handleRequirementUpload(requirement, file);
                            event.currentTarget.value = "";
                          }}
                        />
                        <label htmlFor={inputId}>
                          <Button asChild size="sm" disabled={submitRequirementMutation.isPending} className="cursor-pointer bg-orange-600 hover:bg-orange-700">
                            <span>
                              {submitRequirementMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="mr-2 h-4 w-4" aria-hidden="true" />}
                              Déposer la pièce
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Aucune pièce complémentaire n’est demandée pour le moment. Les nouvelles demandes apparaîtront ici dès leur création par votre conseiller.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-700" aria-hidden="true" />
                Historique du dossier
              </CardTitle>
              <CardDescription>Chaque étape est enregistrée avec sa date de mise à jour.</CardDescription>
            </CardHeader>
            <CardContent>
              {statusHistory.length > 0 ? (
                <>
                  <div className="mb-5 grid gap-3 sm:grid-cols-2" aria-label="Filtres de l’historique">
                    <div className="space-y-1.5">
                      <Label htmlFor="history-type">Type d’étape</Label>
                      <select id="history-type" value={historyType} onChange={(event) => setHistoryType(event.target.value)} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                        <option value="all">Toutes les étapes</option>
                        {historyTypes.map((status) => <option key={status} value={status}>{(STATUS_LABELS[status] ?? STATUS_LABELS.nouveau).label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="history-sort">Ordre des dates</Label>
                      <select id="history-sort" value={historySort} onChange={(event) => setHistorySort(event.target.value as "recent" | "oldest")} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                        <option value="recent">Plus récent d’abord</option>
                        <option value="oldest">Plus ancien d’abord</option>
                      </select>
                    </div>
                  </div>
                  {filteredStatusHistory.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Aucune étape ne correspond à ce filtre.</p>
                  ) : (
                  <ol className="relative ml-2 space-y-5 border-l border-slate-200 pl-5" aria-label="Chronologie des changements de statut">
                  {filteredStatusHistory.map((entry, index) => {
                    const historyStatus = STATUS_LABELS[entry.newStatus || "nouveau"] ?? STATUS_LABELS.nouveau;
                    return (
                      <li key={`${entry.id ?? "history"}-${index}`} className="relative">
                        <span className="absolute -left-[1.78rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow" aria-hidden="true" />
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{historyStatus.label}</p>
                          <time className="text-xs text-slate-500" dateTime={new Date(entry.createdAt!).toISOString()}>
                            {new Date(entry.createdAt!).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                          </time>
                        </div>
                        {entry.reason && <p className="mt-1 text-sm text-slate-600">{entry.reason}</p>}
                      </li>
                    );
                  })}
                  </ol>
                  )}
                </>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">La première mise à jour apparaîtra ici dès qu’elle sera enregistrée par l’équipe.</p>
              )}
            </CardContent>
          </Card>

          {requiresRevisionSupport && (
            <Card className="border border-amber-200 bg-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-950">
                  <LifeBuoy className="h-5 w-5 text-amber-700" aria-hidden="true" />
                  Besoin d’aide ?
                </CardTitle>
                <CardDescription className="text-amber-900">Une pièce ou une décision nécessite votre attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-amber-950">Contactez rapidement l’équipe Prime Travel Service afin de comprendre la révision demandée.</p>
                <Button onClick={handleQuickSupport} className="w-full bg-amber-700 hover:bg-amber-800">
                  <LifeBuoy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Contacter l’assistance
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications" className="relative gap-1">
              <Bell className="h-4 w-4" aria-hidden="true" /> Notifications
              {(caseTrackingData?.unreadNotifications ?? 0) > 0 && <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">{caseTrackingData?.unreadNotifications}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          {/* Aperçu */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations du Dossier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de Dossier</p>
                    <p className="font-semibold text-lg">{dossier.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold text-lg">{dossier.destination}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type de Projet</p>
                    <p className="font-semibold text-lg">{dossier.projectType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge className={STATUS_LABELS[dossier.status]?.color}>
                      {STATUS_LABELS[dossier.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documents Téléversés</p>
                    <p className="font-semibold text-lg">
                      {dossier.uploadedDocuments} / {dossier.totalDocuments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Créé le</p>
                    <p className="font-semibold text-lg">{dossier.createdAt.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" id="documents-center" className="space-y-4">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Téléverser des Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label htmlFor="file-input" className="cursor-pointer block">
                    <FileUp className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Cliquez pour téléverser</p>
                    <p className="text-sm text-gray-600">ou glissez-déposez vos fichiers</p>
                    <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG, DOC (max 10 Mo par fichier)</p>
                  </label>
                </div>

                {/* Fichiers Sélectionnés */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Fichiers à Téléverser:</p>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">{file.name}</p>
                            <p className="text-xs text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {uploading ? "Téléversement..." : "Confirmer le Téléversement"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {correctionTarget && (
              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-950"><FileWarning className="h-5 w-5 text-orange-700" aria-hidden="true" />Corriger « {correctionTarget.name} »</CardTitle>
                  <CardDescription>Ajoutez une courte explication à destination du conseiller, puis sélectionnez la nouvelle version du document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert"><span className="font-semibold">Motif du refus : </span>{correctionTarget.rejectionReason || "Une nouvelle version est demandée."}</div>
                  <div className="space-y-2"><Label htmlFor="correction-comment">Votre commentaire explicatif</Label><Textarea id="correction-comment" value={correctionComment} onChange={(event) => setCorrectionComment(event.target.value)} maxLength={1000} minLength={3} placeholder="Ex. J’ai fourni une version plus lisible, mise à jour le…" className="min-h-24" /><p className="text-xs text-slate-500">Ce commentaire est transmis avec votre fichier au conseiller.</p></div>
                  <div className="space-y-2"><Label htmlFor="correction-file">Nouvelle version du document</Label><Input id="correction-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event) => setCorrectionFile(event.currentTarget.files?.[0] || null)} /><p className="text-xs text-slate-500">{correctionFile ? `Fichier sélectionné : ${correctionFile.name}` : "Aucun fichier sélectionné."}</p></div>
                  <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" onClick={() => void handleCorrectionSubmission()} disabled={uploading || !correctionFile || correctionComment.trim().length < 3} className="bg-orange-700 hover:bg-orange-800">{uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Envoyer la correction</Button><Button type="button" variant="outline" onClick={() => { setCorrectionTarget(null); setCorrectionComment(""); setCorrectionFile(null); }}>Annuler</Button></div>
                </CardContent>
              </Card>
            )}

            {/* Documents Téléversés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Documents Téléversés
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Aucun document téléversé pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-semibold">{doc.name}</p>
                            <p className="text-xs text-gray-600">
                              Téléversé le {doc.uploadedAt.toLocaleDateString('fr-FR')}
                            </p>
                            {doc.status === "rejected" && (
                              <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-900" role="alert">
                                <p className="font-semibold">Document refusé — correction requise</p>
                                <p className="mt-1">Motif : {doc.rejectionReason || "Le conseiller demande une nouvelle version du document."}</p>
                              </div>
                            )}
                          </div>
                          <Badge
                            className={
                              doc.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {doc.status === "verified" ? "Vérifié" : doc.status === "rejected" ? "Rejeté" : "En attente"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {doc.fileUrl ? (
                            <>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Voir ${doc.name}`}>
                                  <Eye className="w-4 h-4" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={doc.fileUrl} download={doc.name} aria-label={`Télécharger ${doc.name}`}>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" disabled aria-label="Aperçu indisponible">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" disabled aria-label="Téléchargement indisponible">
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {doc.status !== "verified" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Supprimer ${doc.name}`}
                              disabled={deleteDocumentMutation.isPending}
                              onClick={() => handleDeleteDocument(doc)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {doc.status === "rejected" && (
                            <Button variant="outline" size="sm" onClick={() => { setCorrectionTarget(doc); setCorrectionComment(""); setCorrectionFile(null); }} className="border-orange-200 text-orange-800 hover:bg-orange-50">
                              <Upload className="mr-1 h-4 w-4" aria-hidden="true" /> Corriger
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinéraires favoris */}
          <TabsContent value="favorites" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Mes itinéraires favoris
                  </CardTitle>
                  <CardDescription>Retrouvez les vols sauvegardés depuis la recherche et reprenez contact avec l’agence.</CardDescription>
                </div>
                {favoriteFlights?.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl gap-2 text-xs font-bold"
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFont("helvetica", "bold");
                      doc.setFontSize(18);
                      doc.setTextColor(30, 58, 138);
                      doc.text("3M Travel & Services - Mes Itinéraires Favoris", 14, 20);
                      
                      doc.setFontSize(10);
                      doc.setTextColor(100, 100, 100);
                      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} | Total : ${favoriteFlights.length} vol(s) sauvegardé(s)`, 14, 28);
                      
                      let y = 38;
                      favoriteFlights.forEach((item: any, idx: number) => {
                        const flight = item.flight || {};
                        if (y > 270) {
                          doc.addPage();
                          y = 20;
                        }
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(12);
                        doc.setTextColor(30, 41, 59);
                        doc.text(`${idx + 1}. ${flight.originCity || flight.origin || "Départ"} → ${flight.destinationCity || flight.destination || "Arrivée"}`, 14, y);
                        
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(10);
                        doc.setTextColor(71, 85, 105);
                        doc.text(`Compagnie : ${flight.airline?.name || "Compagnie aérienne"} | Vol : ${flight.flightNumber || "N/A"}`, 14, y + 6);
                        doc.text(`Date : ${flight.departureDate || "N/A"} (${flight.departureTime || ""} - ${flight.arrivalTime || ""}) | Durée : ${flight.duration || "N/A"}`, 14, y + 12);
                        doc.text(`Prix : ${flight.totalPrice || "Sur devis"} | Ref PNR : ${flight.pnrRef || "N/A"}`, 14, y + 18);
                        
                        y += 26;
                      });
                      
                      doc.save("mes_itineraires_favoris_3mtravel.pdf");
                      toast.success("Rapport PDF des favoris téléchargé avec succès !");
                    }}
                  >
                    <Download className="w-4 h-4" /> Exporter en PDF
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
                    <div className="w-5 h-5 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                    Chargement de vos favoris...
                  </div>
                ) : !favoriteFlights?.length ? (
                  <div className="text-center py-10 text-gray-500">
                    <Plane className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                    <p className="font-semibold">Aucun itinéraire enregistré</p>
                    <p className="text-sm mt-1">Utilisez « Sauvegarder » sur une carte de vol pour le retrouver ici.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteFlights.map((item: any) => {
                      const flight = item.flight || {};
                      return (
                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 hover:bg-rose-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-white p-2 shadow-sm"><Plane className="w-5 h-5 text-[#2563EB]" /></div>
                            <div>
                              <p className="font-bold text-gray-900">{flight.originCity || flight.origin || "Départ"} → {flight.destinationCity || flight.destination || "Arrivée"}</p>
                              <p className="text-sm text-gray-600">{flight.airline?.name || "Compagnie aérienne"} · {flight.flightNumber || "Vol"}</p>
                              <p className="text-xs text-gray-500 mt-1">Enregistré le {new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:justify-end">
                            <Button variant="outline" size="sm" onClick={() => setLocation(`/flights?origin=${encodeURIComponent(flight.origin || "")}&destination=${encodeURIComponent(flight.destination || "")}&date=${encodeURIComponent(flight.departureDate || "")}`)}>
                              Rechercher à nouveau
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Supprimer cet itinéraire favori"
                              disabled={deleteFavoriteMutation.isPending}
                              onClick={() => deleteFavoriteMutation.mutate({ id: item.id })}
                              className="text-rose-600 hover:bg-rose-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messagerie
                </CardTitle>
                <CardDescription>Retrouvez les échanges directs avec l’équipe Prime Travel Service.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center py-8">Les messages détaillés apparaîtront ici. Consultez l’onglet Notifications pour les remarques et décisions déjà publiées.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-blue-700" aria-hidden="true" /> Centre de notifications</CardTitle>
                  <CardDescription>Remarques de l’administration et réponses des agences de placement, synchronisées avec votre dossier.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les notifications">
                  {(["all", "admin", "agency"] as const).map((filter) => (
                    <Button key={filter} type="button" size="sm" variant={notificationFilter === filter ? "default" : "outline"} onClick={() => setNotificationFilter(filter)}>
                      {filter === "all" ? "Toutes" : filter === "admin" ? "Administration" : "Agences"}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <Input value={notificationQuery} onChange={(event) => setNotificationQuery(event.target.value)} placeholder="Rechercher un message, une remarque ou une agence" aria-label="Rechercher dans les notifications" className="pl-9" />
                  </div>
                  <div className="flex gap-2" role="group" aria-label="Afficher les notifications actives ou archivées">
                    <Button type="button" size="sm" variant={notificationView === "active" ? "default" : "outline"} onClick={() => setNotificationView("active")}>Actives</Button>
                    <Button type="button" size="sm" variant={notificationView === "archived" ? "default" : "outline"} onClick={() => setNotificationView("archived")}><Archive className="mr-1 h-4 w-4" aria-hidden="true" /> Archivées</Button>
                  </div>
                </div>
                {caseTrackingLoading ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des notifications…</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">Aucune notification dans cette catégorie.</div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <article key={notification.id} className={`rounded-xl border p-4 ${notification.isRead ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{notification.categoryLabel}</Badge>{!notification.isRead && <Badge className="bg-blue-700 text-white">Nouveau</Badge>}</div>
                          <h3 className="mt-2 font-semibold text-slate-900">{notification.title}</h3>
                          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{notification.body}</p>
                          <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          {!notification.isRead && <Button type="button" size="sm" variant="outline" disabled={markNotificationReadMutation.isPending} onClick={() => markNotificationReadMutation.mutate({ notificationId: notification.id })}>Marquer comme lue</Button>}
                          {notification.category === "admin" && <Button type="button" size="sm" variant="outline" onClick={() => { setNotificationReplyId(notification.id); setNotificationReplyText(""); }}><MessageSquare className="mr-1 h-4 w-4" aria-hidden="true" /> Répondre</Button>}
                          <Button type="button" size="sm" variant="ghost" disabled={setNotificationArchivedMutation.isPending} onClick={() => setNotificationArchivedMutation.mutate({ notificationId: notification.id, archived: !notification.isArchived })}>
                            {notification.isArchived ? <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" /> : <Archive className="mr-1 h-4 w-4" aria-hidden="true" />}
                            {notification.isArchived ? "Restaurer" : "Archiver"}
                          </Button>
                        </div>
                      </div>
                      {notificationReplyId === notification.id && notification.category === "admin" && <form className="mt-4 space-y-3 border-t border-slate-200 pt-4" onSubmit={async (event) => {
                        event.preventDefault();
                        const content = notificationReplyText.trim();
                        if (!content && !notificationReplyAttachment) { toast.error("Écrivez une réponse ou ajoutez une pièce jointe."); return; }
                        try {
                          const attachment = notificationReplyAttachment ? {
                            dataUrl: await readAttachmentAsDataUrl(notificationReplyAttachment),
                            fileName: notificationReplyAttachment.name,
                            mimeType: notificationReplyAttachment.type as "application/pdf" | "image/jpeg" | "image/png",
                            sizeBytes: notificationReplyAttachment.size,
                          } : undefined;
                          sendNotificationReplyMutation.mutate({ content, attachment });
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "La pièce jointe n’a pas pu être préparée.");
                        }
                      }}>
                        <div className="space-y-1">
                          <Label htmlFor={`notification-reply-${notification.id}`}>Votre réponse</Label>
                          <div className="flex flex-wrap gap-1.5 py-1">
                            <span className="text-xs text-slate-500 self-center mr-1">Modèles :</span>
                            <button type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors" onClick={() => setNotificationReplyText("Bonjour, je viens de téléverser le document demandé. Merci de bien vouloir le vérifier.")}>📄 Document joint</button>
                            <button type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors" onClick={() => setNotificationReplyText("Bonjour, j'ai effectué le règlement des frais de dossier de 65 000 XAF. Mon reçu a été transmis.")}>💳 Paiement effectué</button>
                            <button type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors" onClick={() => setNotificationReplyText("Bonjour, pourrais-je connaître l’état d’avancement actuel de mon dossier s’il vous plaît ?")}>🔍 État du dossier</button>
                            <button type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors" onClick={() => setNotificationReplyText("Bonjour, j'ai besoin d’une assistance avec mon conseiller pour finaliser mon dossier.")}>👤 Besoin d'aide</button>
                          </div>
                        </div>
                        <Textarea id={`notification-reply-${notification.id}`} value={notificationReplyText} onChange={(event) => setNotificationReplyText(event.target.value)} placeholder="Répondez à l’administration au sujet de cette notification…" maxLength={2000} rows={3} autoFocus />
                        <div className="space-y-2">
                          <Label htmlFor={`notification-attachment-${notification.id}`}>Pièce jointe (PDF, JPG ou PNG, 5 Mo maximum)</Label>
                          <Input id={`notification-attachment-${notification.id}`} type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (!file) { setNotificationReplyAttachment(null); return; }
                            if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) { toast.error("Formats acceptés : PDF, JPG ou PNG."); event.currentTarget.value = ""; return; }
                            if (file.size > 5 * 1024 * 1024) { toast.error("La pièce jointe ne doit pas dépasser 5 Mo."); event.currentTarget.value = ""; return; }
                            setNotificationReplyAttachment(file);
                          }} />
                          {notificationReplyAttachment && <div className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                            <span className="truncate">{notificationReplyAttachment.name} · {(notificationReplyAttachment.size / 1024 / 1024).toFixed(2)} Mo</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setNotificationReplyAttachment(null)} aria-label="Retirer la pièce jointe"><X className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button type="button" size="sm" variant="ghost" onClick={() => { setNotificationReplyId(null); setNotificationReplyText(""); setNotificationReplyAttachment(null); }}>Annuler</Button>
                          <Button type="submit" size="sm" disabled={sendNotificationReplyMutation.isPending}>{sendNotificationReplyMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageSquare className="mr-1 h-4 w-4" aria-hidden="true" />} Envoyer la réponse</Button>
                        </div>
                      </form>}
                    </article>
                  ))
                )}
                {messagesWithAttachments.some((message) => Boolean(message.attachmentSignedUrl)) && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Pièces jointes des échanges</h3>
                  <p className="mt-1 text-sm text-slate-600">Ouvrez un PDF ou une image sans quitter votre espace client.</p>
                  <div className="mt-3 space-y-2">
                    {messagesWithAttachments.filter((message) => Boolean(message.attachmentSignedUrl)).map((message) => {
                      const attachmentUrl = message.attachmentSignedUrl as string;
                      const attachmentName = message.attachmentName || "Pièce jointe";
                      const attachmentMimeType = message.attachmentMimeType || "application/octet-stream";
                      const attachmentIndex = attachmentGallery.findIndex((attachment) => attachment.url === attachmentUrl);
                      return <div key={`message-attachment-${message.id}`} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{attachmentName}</p>
                          <p className="text-xs text-slate-500">{message.senderRole === "candidate" ? "Envoyé par vous" : "Envoyé par l’administration"} · {new Date(message.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => openAttachmentPreview(attachmentIndex)}><Eye className="mr-1 h-4 w-4" aria-hidden="true" /> Aperçu</Button>
                          <Button asChild type="button" size="sm" variant="ghost"><a href={attachmentUrl} target="_blank" rel="noreferrer" download={attachmentName}><Download className="mr-1 h-4 w-4" aria-hidden="true" /> Télécharger</a></Button>
                        </div>
                      </div>;
                    })}
                  </div>
                </div>}
              </CardContent>
            </Card>
            <Dialog open={Boolean(attachmentPreview)} onOpenChange={(open) => { if (!open) setAttachmentPreview(null); }}>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle className="truncate pr-8">{attachmentPreview?.name || "Aperçu de la pièce jointe"}</DialogTitle>
                  {attachmentPreview && attachmentPreview.total > 1 && <p className="text-xs font-medium text-slate-500" aria-live="polite">Pièce {attachmentPreview.index + 1} sur {attachmentPreview.total} · Utilisez les flèches gauche et droite pour naviguer</p>}
                  <DialogDescription>Visualisation sécurisée de la pièce jointe associée à votre échange.</DialogDescription>
                </DialogHeader>
                <div className="flex min-h-[320px] max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-slate-100 p-2">
                  {attachmentPreview?.mimeType === "application/pdf" ? <iframe title={`Aperçu PDF ${attachmentPreview.name}`} src={attachmentPreview.url} className="h-[65vh] w-full rounded border border-slate-200 bg-white" /> : attachmentPreview ? <img src={attachmentPreview.url} alt={`Aperçu de ${attachmentPreview.name}`} className="max-h-[65vh] max-w-full object-contain" /> : null}
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {attachmentPreview && attachmentPreview.total > 1 && <div className="flex w-full gap-2 sm:w-auto" aria-label="Navigation entre les pièces jointes">
                    <Button type="button" variant="outline" onClick={() => moveAttachment(-1)} disabled={attachmentPreview.index === 0} aria-label="Pièce jointe précédente"><ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" /> Précédent</Button>
                    <Button type="button" variant="outline" onClick={() => moveAttachment(1)} disabled={attachmentPreview.index === attachmentPreview.total - 1} aria-label="Pièce jointe suivante">Suivant <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
                  </div>}
                  <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                  {attachmentPreview?.notificationId && <Button type="button" variant={attachmentPreview.acknowledged ? "secondary" : "default"} disabled={attachmentPreview.acknowledged || acknowledgeNotificationMutation.isPending} onClick={() => acknowledgeNotificationMutation.mutate({ notificationId: attachmentPreview.notificationId as number })} aria-live="polite"><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" /> {attachmentPreview.acknowledged ? "Réception confirmée" : "Accuser réception"}</Button>}
                  {attachmentPreview && <Button type="button" variant="outline" onClick={() => printAttachment(attachmentPreview)}><Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Imprimer</Button>}
                  {attachmentPreview && <Button asChild variant="outline"><a href={attachmentPreview.url} target="_blank" rel="noreferrer" download={attachmentPreview.name}><Download className="mr-2 h-4 w-4" aria-hidden="true" /> Télécharger</a></Button>}
                  <Button type="button" onClick={() => setAttachmentPreview(null)}>Fermer</Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" id="profile-settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Mon profil
                </CardTitle>
                <CardDescription>Gardez vos informations de contact à jour afin que l’équipe puisse assurer le suivi de votre dossier.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
                    {profileData?.avatarUrl ? <img src={profileData.avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" /> : <UserRound className="h-9 w-9 text-blue-600" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">Photo de profil</p>
                    <p className="mt-1 text-sm text-slate-600">Ajoutez ou remplacez votre portrait. Une photo humaine, nette et récente est requise pour sécuriser votre dossier.</p>
                    <input id="profile-avatar" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={avatarUploading || updateAvatarMutation.isPending} onChange={(event) => { handleAvatarFileSelect(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
                    <label htmlFor="profile-avatar" className={`mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-800 ${avatarUploading || updateAvatarMutation.isPending ? "pointer-events-none opacity-60" : ""}`}>
                      {avatarUploading || updateAvatarMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {profileData?.avatarUrl ? "Remplacer la photo" : "Ajouter une photo"}
                    </label>
                  </div>
                </div>
                <form className="space-y-4" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="profile-name">Nom complet</Label>
                      <Input id="profile-name" value={profileForm.fullName} minLength={2} required onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Téléphone</Label>
                      <Input id="profile-phone" inputMode="tel" value={profileForm.phone} placeholder="Ex. +237 6…" onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-nationality">Nationalité</Label>
                      <Input id="profile-nationality" value={profileForm.nationality} placeholder="Ex. Camerounaise" onChange={(event) => setProfileForm((current) => ({ ...current, nationality: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-birth-date">Date de naissance</Label>
                      <Input id="profile-birth-date" type="date" value={profileForm.dateOfBirth} onChange={(event) => setProfileForm((current) => ({ ...current, dateOfBirth: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Adresse e-mail</Label>
                      <Input id="profile-email" value={profileData?.email || candidate?.email || ""} disabled aria-describedby="profile-email-help" />
                      <p id="profile-email-help" className="text-xs text-slate-500">L’adresse e-mail est protégée et ne peut pas être modifiée ici.</p>
                    </div>
                  </div>
                  <Button type="submit" disabled={profileLoading || updateProfileMutation.isPending} className="w-full sm:w-auto">
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Enregistrer le profil
                  </Button>
                </form>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setLocation("/forgot-password")}>Modifier le mot de passe</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {avatarCropSource && (
          <AvatarCropperModal
            isOpen={Boolean(avatarCropSource)}
            imageSrc={avatarCropSource}
            onClose={() => {
              URL.revokeObjectURL(avatarCropSource);
              setAvatarCropSource(null);
            }}
            onCropComplete={(croppedFile) => { void handleAvatarChange(croppedFile); }}
          />
        )}
      </div>
    </div>
  );
}
