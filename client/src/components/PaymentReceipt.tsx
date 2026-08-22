import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Check, Calendar, DollarSign, FileText, Share2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface PaymentReceiptProps {
  dossierNumber: string;
  candidateName: string;
  email: string;
  destination: string;
  amount: number;
  currency: string;
  transactionId: string;
  paymentDate: Date;
  paymentMethod?: string;
}

const LOGO_URL = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg";

export default function PaymentReceipt({
  dossierNumber,
  candidateName,
  email,
  destination,
  amount,
  currency,
  transactionId,
  paymentDate,
  paymentMethod = "CinetPay",
}: PaymentReceiptProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  const receiptRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Générer le code QR
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Créer les données du QR code
        const qrData = `3M-PAYMENT|${dossierNumber}|${transactionId}|${amount}|${currency}|${paymentDate.toISOString()}`;
        
        // Générer le code QR en tant que data URL
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: {
            dark: "#1e3a8a",
            light: "#ffffff",
          },
        });
        
        setQrCode(qrDataUrl);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    generateQR();
  }, [dossierNumber, transactionId, amount, currency, paymentDate]);

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    setIsDownloading(true);
    try {
      // Capturer le reçu en tant qu'image
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Créer un PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // Largeur A4 en mm
      const pageHeight = 297; // Hauteur A4 en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Télécharger le PDF
      pdf.save(`Reçu_Paiement_${dossierNumber}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareReceipt = async () => {
    setIsSharing(true);
    try {
      const text = `Paiement confirmé pour mon dossier 3M Travel ${dossierNumber}. Montant: ${amount} ${currency}. Transaction ID: ${transactionId}`;

      if (navigator.share) {
        await navigator.share({
          title: "Reçu de Paiement 3M Travel",
          text: text,
        });
      } else {
        // Fallback: copier dans le presse-papiers
        await navigator.clipboard.writeText(text);
        alert("Reçu copié dans le presse-papiers");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification de Succès */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900">Paiement Confirmé ✅</h3>
            <p className="text-green-700 text-sm mt-1">
              Votre paiement de <strong>{amount.toLocaleString()} {currency}</strong> a été traité avec succès.
              Votre dossier est maintenant <strong>OUVERT ET PAYÉ</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Reçu Détaillé */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        ref={receiptRef}
        className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg"
      >
        {/* En-tête avec Logo */}
        <div className="text-center mb-8 pb-8 border-b-2 border-gray-100">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <img
              src={LOGO_URL}
              alt="3M Travel Logo"
              className="h-16 object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FileText className="w-4 h-4" />
            REÇU DE PAIEMENT OFFICIEL
          </div>
          <h2 className="text-3xl font-bold text-gray-900">3M Travel & Services</h2>
          <p className="text-gray-500 text-sm mt-1">Pré-Évaluation Visa & Immigration</p>
        </div>

        {/* Numéro de Reçu */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-gray-600 text-sm font-semibold">NUMÉRO DE DOSSIER</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{dossierNumber}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-semibold">TRANSACTION ID</p>
            <p className="text-lg font-mono text-gray-700 mt-1 break-all">{transactionId}</p>
          </div>
        </div>

        {/* Informations du Candidat */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4">INFORMATIONS DU CANDIDAT</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom Complet</span>
              <span className="font-semibold text-gray-900">{candidateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-semibold text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination</span>
              <span className="font-semibold text-gray-900 uppercase">{destination}</span>
            </div>
          </div>
        </div>

        {/* Détails du Paiement */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4">DÉTAILS DU PAIEMENT</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">Montant</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {amount.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">Date de Paiement</span>
              </div>
              <span className="font-semibold text-gray-900">
                {paymentDate.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Méthode de Paiement</span>
              <span className="font-semibold text-gray-900">{paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Statut et Code QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Statut */}
          <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold text-green-900">PAIEMENT CONFIRMÉ</p>
                <p className="text-green-700 text-sm">
                  Votre dossier est maintenant actif et prêt pour le traitement.
                </p>
              </div>
            </div>
          </div>

          {/* Code QR d'Authenticité */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <p className="font-bold text-blue-900 text-sm">VÉRIFICATION D'AUTHENTICITÉ</p>
            </div>
            {qrCode && (
              <div className="bg-white p-2 rounded-lg border-2 border-blue-200 mb-3">
                <img src={qrCode} alt="QR Code" className="w-28 h-28" />
              </div>
            )}
            <p className="text-blue-700 text-xs text-center">
              Scannez ce code QR pour vérifier l'authenticité
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t-2 border-gray-100 text-center">
          <p className="text-gray-500 text-xs">
            Ce reçu est une preuve officielle de votre paiement. Conservez-le précieusement.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            © 2026 3M Travel & Services. Tous droits réservés.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Reçu généré le {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>
      </motion.div>

      {/* Boutons d'Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-3 flex-col sm:flex-row"
      >
        <Button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          {isDownloading ? "Téléchargement..." : "Télécharger le Reçu (PDF)"}
        </Button>

        <Button
          onClick={shareReceipt}
          disabled={isSharing}
          variant="outline"
          className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          {isSharing ? "Partage..." : "Partager"}
        </Button>
      </motion.div>

      {/* Prochaines Étapes */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">📋 Prochaines Étapes</h3>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
              1
            </span>
            <span className="text-gray-700">
              <strong>Accédez à votre espace candidat</strong> pour soumettre vos documents
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
              2
            </span>
            <span className="text-gray-700">
              <strong>Téléchargez vos documents</strong> (passeport, CV, diplômes, etc.)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
              3
            </span>
            <span className="text-gray-700">
              <strong>Suivez votre dossier</strong> en temps réel depuis votre dashboard
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
              4
            </span>
            <span className="text-gray-700">
              <strong>Recevez des mises à jour</strong> par email à chaque étape
            </span>
          </li>
        </ol>
      </Card>

      {/* Support */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
        <p className="text-amber-900 text-sm">
          Besoin d'aide ? Contactez-nous sur{" "}
          <a
            href="https://wa.me/16728972999"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-amber-700 hover:underline"
          >
            WhatsApp
          </a>{" "}
          ou par email à{" "}
          <a href="mailto:hello@3mtravelagency.com" className="font-bold text-amber-700 hover:underline">
            hello@3mtravelagency.com
          </a>
        </p>
      </div>
    </div>
  );
}
