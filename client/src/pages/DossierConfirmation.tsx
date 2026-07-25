import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Download, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

interface DossierConfirmationProps {
  dossierNumber?: string;
  candidateName?: string;
  email?: string;
  destination?: string;
  formula?: string;
}

export default function DossierConfirmation() {
  const [, setLocation] = useLocation();
  const [dossierData, setDossierData] = useState<DossierConfirmationProps | null>(null);

  useEffect(() => {
    // Récupérer les données du localStorage
    const stored = localStorage.getItem('dossierConfirmation');
    if (stored) {
      setDossierData(JSON.parse(stored));
      // Nettoyer après 5 secondes
      setTimeout(() => localStorage.removeItem('dossierConfirmation'), 5000);
    } else {
      // Rediriger vers la page d'accueil si pas de données
      setTimeout(() => setLocation('/'), 2000);
    }
  }, [setLocation]);

  const copyToClipboard = () => {
    if (dossierData?.dossierNumber) {
      navigator.clipboard.writeText(dossierData.dossierNumber);
      toast.success('Numéro de dossier copié!');
    }
  };

  const downloadConfirmation = () => {
    if (!dossierData) return;
    const text = `
CONFIRMATION DE DOSSIER - 3M TRAVEL & SERVICES

Numéro de dossier: ${dossierData.dossierNumber}
Candidat: ${dossierData.candidateName}
Email: ${dossierData.email}
Destination: ${dossierData.destination}
Formule: ${dossierData.formula}

Conservez ce numéro précieusement pour suivre votre dossier.
    `;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `dossier-${dossierData.dossierNumber}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Confirmation téléchargée!');
  };

  if (!dossierData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar activePage="home" onEvalClick={() => {}} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar activePage="home" onEvalClick={() => {}} />

      <motion.div
        className="max-w-2xl mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header avec checkmark animé */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="inline-block"
            animate={{ scale: [0, 1.1, 1] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">
            Dossier créé avec succès !
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Votre demande a été enregistrée. Conservez votre numéro de dossier.
          </p>
        </motion.div>

        {/* Numéro de dossier en évidence */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white border-2 border-green-200 p-8 mb-8 text-center">
            <p className="text-sm text-gray-600 font-semibold mb-2">NUMÉRO DE DOSSIER</p>
            <p className="text-5xl font-black text-green-600 tracking-wider mb-4 font-mono">
              {dossierData.dossierNumber}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Conservez ce numéro pour suivre votre dossier
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copier
              </Button>
              <Button
                onClick={downloadConfirmation}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Détails du dossier */}
        <motion.div variants={itemVariants}>
          <Card className="bg-white p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé de votre dossier</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Candidat</span>
                <span className="font-semibold text-gray-900">{dossierData.candidateName}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-semibold text-gray-900">{dossierData.email}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Destination</span>
                <span className="font-semibold text-gray-900">{dossierData.destination?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Formule</span>
                <span className="font-semibold text-gray-900 capitalize">{dossierData.formula}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Prochaines étapes */}
        <motion.div variants={itemVariants}>
          <Card className="bg-blue-50 border border-blue-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Prochaines étapes</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Vérification email</h3>
                  <p className="text-sm text-gray-600">
                    Vérifiez votre email pour confirmer votre adresse
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact WhatsApp</h3>
                  <p className="text-sm text-gray-600">
                    Un conseiller vous contactera sous 24h
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Paiement</h3>
                  <p className="text-sm text-gray-600">
                    Procédez au paiement pour finaliser votre dossier
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex gap-4 justify-center flex-wrap">
          <Button
            onClick={() => setLocation('/mon-dossier')}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <FileText className="w-4 h-4" />
            Suivre mon dossier
          </Button>
          <a
            href={`https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour, je confirme l'ouverture de mon dossier ${dossierData.dossierNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Contacter par WhatsApp
            </Button>
          </a>
          <Button
            onClick={() => setLocation('/')}
            variant="ghost"
            className="gap-2"
          >
            Retour à l'accueil
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
