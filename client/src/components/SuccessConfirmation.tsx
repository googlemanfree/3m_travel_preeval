import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Download, Share2, Clock, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { SuccessAnimation } from './SuccessAnimation';

interface SuccessConfirmationProps {
  fullName: string;
  countryName: string;
  countryCode: string;
  email: string;
  totalCost: number;
  currency: string;
  requestId?: string;
  onReturnHome: () => void;
}

export function SuccessConfirmation({
  fullName,
  countryName,
  countryCode,
  email,
  totalCost,
  currency,
  requestId,
  onReturnHome,
}: SuccessConfirmationProps) {
  const submissionDate = new Date();
  const formattedDate = submissionDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = submissionDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadReceipt = () => {
    // Générer un reçu PDF
    const receiptContent = `
REÇU DE DEMANDE D'E-VISA
========================

Numéro de demande: ${requestId || 'N/A'}
Date de soumission: ${formattedDate} à ${formattedTime}

INFORMATIONS PERSONNELLES
========================
Nom complet: ${fullName}
Email: ${email}

INFORMATIONS E-VISA
========================
Pays de destination: ${countryName} (${countryCode})
Frais d'accompagnement: ${totalCost.toLocaleString('fr-FR')} ${currency}

Merci d'avoir choisi nos services !
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
    element.setAttribute('download', `evisa_receipt_${requestId || 'unknown'}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShareByEmail = () => {
    const subject = `Confirmation de votre demande d'e-visa - ${countryName}`;
    const body = `Bonjour,\n\nVotre demande d'e-visa pour ${countryName} a été soumise avec succès.\n\nNuméro de demande: ${requestId || 'N/A'}\nDate: ${formattedDate}\n\nMerci !`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const nextSteps = [
    {
      step: 1,
      title: 'Vérification des documents',
      description: 'Nos experts vérifieront votre demande et vos documents',
      duration: '24-48 heures',
    },
    {
      step: 2,
      title: 'Traitement de la demande',
      description: 'Votre demande sera traitée par les autorités compétentes',
      duration: '3-7 jours',
    },
    {
      step: 3,
      title: 'Délivrance du visa',
      description: 'Vous recevrez votre e-visa par email',
      duration: '1-2 jours',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-white relative overflow-hidden">
      {/* Animation de succès */}
      <SuccessAnimation />

      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        {/* Message principal */}
        <div className="text-center mb-12 pt-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Demande Soumise avec Succès !
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Félicitations, {fullName.split(' ')[0]} !
          </p>
          <p className="text-gray-500">
            Votre demande d'e-visa pour <strong>{countryName}</strong> a été reçue et traitée.
          </p>
        </div>

        {/* Détails de la demande */}
        <Card className="p-8 mb-8 border-2 border-green-200 bg-white shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Numéro de demande */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Numéro de demande</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{requestId || 'En attente'}</p>
              </div>
            </div>

            {/* Date de soumission */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Date de soumission</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formattedDate} à {formattedTime}
                </p>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Destination</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {countryName} ({countryCode})
                </p>
              </div>
            </div>

            {/* Montant */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-yellow-100">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Montant total</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {totalCost.toLocaleString('fr-FR')} {currency}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Prochaines étapes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Prochaines Étapes</h2>
          <div className="space-y-4">
            {nextSteps.map((item, index) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    {item.step}
                  </div>
                  {index < nextSteps.length - 1 && (
                    <div className="w-1 h-12 bg-blue-200 mt-2" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message informatif */}
        <Card className="p-6 bg-blue-50 border border-blue-200 mb-8">
          <p className="text-sm text-blue-900">
            <strong>Important :</strong> Un email de confirmation a été envoyé à <strong>{email}</strong>.
            Veuillez vérifier votre dossier spam si vous ne le recevez pas. Conservez votre numéro de demande
            pour suivre l'état de votre demande.
          </p>
        </Card>

        {/* Boutons d'action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            className="flex items-center justify-center gap-2 h-12"
          >
            <Download className="w-4 h-4" />
            Télécharger le reçu
          </Button>
          <Button
            onClick={handleShareByEmail}
            variant="outline"
            className="flex items-center justify-center gap-2 h-12"
          >
            <Share2 className="w-4 h-4" />
            Partager par email
          </Button>
          <Button
            onClick={onReturnHome}
            className="flex items-center justify-center gap-2 h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            Retour à l'accueil
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Lien de suivi */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Vous pouvez suivre votre demande à tout moment</p>
          <Button
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 underline"
            onClick={() => {
              // Rediriger vers la page de suivi
              window.location.href = `/tracking?requestId=${requestId}`;
            }}
          >
            Suivre ma demande
          </Button>
        </div>
      </div>
    </div>
  );
}
