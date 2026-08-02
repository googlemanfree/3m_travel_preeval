import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface DocumentVerificationModalProps {
  isOpen: boolean;
  document: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentVerificationModal({
  isOpen,
  document,
  onClose,
  onSuccess,
}: DocumentVerificationModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const approveMutation = trpc.admin.approveDocument.useMutation();
  const rejectMutation = trpc.admin.rejectDocument.useMutation();

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await approveMutation.mutateAsync({
        sessionToken: localStorage.getItem("adminSessionToken") || "",
        documentId: document.id,
        comment,
      });
      onSuccess();
      onClose();
      setComment("");
      setAction(null);
    } catch (err) {
      console.error("Erreur lors de l'approbation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert("Veuillez fournir une raison pour le rejet");
      return;
    }
    setIsLoading(false);
    try {
      await rejectMutation.mutateAsync({
        sessionToken: localStorage.getItem("adminSessionToken") || "",
        documentId: document.id,
        comment,
      });
      onSuccess();
      onClose();
      setComment("");
      setAction(null);
    } catch (err) {
      console.error("Erreur lors du rejet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto"
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Vérification du Document
              </h2>
              <p className="text-gray-600 mt-2">{document.documentType}</p>
            </div>

            {/* Contenu */}
            <div className="p-6">
              {!action ? (
                // Écran de choix
                <div className="space-y-6">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-gray-700">
                      <strong>Document:</strong> {document.documentType}
                    </p>
                    <p className="text-gray-700 mt-2">
                      <strong>Uploadé:</strong>{" "}
                      {new Date(document.uploadedAt).toLocaleDateString("fr-FR")}
                    </p>
                    {document.readabilityScore && (
                      <div className="mt-3">
                        <p className="text-gray-700">
                          <strong>Lisibilité:</strong> {document.readabilityScore}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${document.readabilityScore}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setAction("approve")}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-6"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approuver
                    </Button>
                    <Button
                      onClick={() => setAction("reject")}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 py-6"
                    >
                      <XCircle className="w-5 h-5" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ) : (
                // Écran de commentaire
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    {action === "approve" ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {action === "approve"
                        ? "Approuver le document"
                        : "Rejeter le document"}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {action === "approve"
                        ? "Commentaire (optionnel)"
                        : "Raison du rejet (obligatoire)"}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        action === "approve"
                          ? "Entrez un commentaire..."
                          : "Expliquez pourquoi ce document est rejeté..."
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>

                  {action === "reject" && !comment.trim() && (
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">
                        Une raison est requise pour rejeter un document
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        setAction(null);
                        setComment("");
                      }}
                      variant="outline"
                      className="py-2"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={
                        action === "approve" ? handleApprove : handleReject
                      }
                      disabled={
                        isLoading ||
                        (action === "reject" && !comment.trim())
                      }
                      className={
                        action === "approve"
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }
                    >
                      {isLoading
                        ? "Traitement..."
                        : action === "approve"
                          ? "Confirmer l'approbation"
                          : "Confirmer le rejet"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
