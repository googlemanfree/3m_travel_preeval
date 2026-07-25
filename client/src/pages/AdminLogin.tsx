import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Lock, Mail, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'email' | 'otp';

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [adminType, setAdminType] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');
  const [showOtpHint, setShowOtpHint] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Mutations
  const requestOTPMutation = trpc.adminAuth.requestOTP.useMutation({
    onSuccess: (data) => {
      setAdminType(data.adminType);
      setLocalError('');
      setAttemptCount(0);
      setStep('otp');
      toast.success('Code OTP envoyé à votre email');
    },
    onError: (error) => {
      const errorMsg = error.message || 'Une erreur est survenue';
      setLocalError(errorMsg);
      setAttemptCount(prev => prev + 1);
    },
  });

  const verifyOTPMutation = trpc.adminAuth.verifyOTP.useMutation({
    onSuccess: (data) => {
      // Sauvegarder le token de session
      localStorage.setItem('adminSessionToken', data.sessionToken);
      localStorage.setItem('adminType', data.adminType);
      localStorage.setItem('adminName', data.fullName);
      setLocalError('');
      setAttemptCount(0);
      toast.success('Connexion réussie!');

      // Rediriger vers le dashboard admin unifié
      navigate('/admin');
    },
    onError: (error) => {
      const errorMsg = error.message || 'Une erreur est survenue';
      setLocalError(errorMsg);
      setAttemptCount(prev => prev + 1);
    },
  });

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email) {
      setLocalError('Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Veuillez entrer une adresse email valide');
      return;
    }

    requestOTPMutation.mutate({ email });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!otpCode) {
      setLocalError('Veuillez entrer le code OTP');
      return;
    }

    if (otpCode.length !== 6) {
      setLocalError('Le code OTP doit contenir exactement 6 chiffres');
      return;
    }

    verifyOTPMutation.mutate({ email, otpCode });
  };

  const getErrorDetails = (error: string): { title: string; suggestion: string; icon: React.ReactNode } => {
    if (error.includes('email') || error.includes('autorisé')) {
      return {
        title: '❌ Email Non Autorisé',
        suggestion: 'Utilisez l\'une des adresses autorisées listées ci-dessous',
        icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      };
    }
    if (error.includes('OTP') || error.includes('code')) {
      return {
        title: '❌ Code OTP Incorrect',
        suggestion: 'Vérifiez le code envoyé à votre email ou demandez un nouveau code',
        icon: <XCircle className="w-6 h-6 text-red-600" />,
      };
    }
    return {
      title: '⚠️ Erreur de Connexion',
      suggestion: 'Une erreur est survenue. Veuillez réessayer',
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
    };
  };

  const errorDetails = localError ? getErrorDetails(localError) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin 3M Travel</h1>
          <p className="text-gray-600 mt-2">Connexion Sécurisée</p>
        </div>

        {/* Carte de connexion */}
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              {step === 'email' ? (
                <>
                  <Mail className="w-5 h-5" />
                  Étape 1: Email
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Étape 2: Code OTP
                </>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-8">
            {step === 'email' ? (
              // Formulaire email
              <form onSubmit={handleRequestOTP} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-semibold mb-2 block">
                    Email Administrateur
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="aureoldonfack@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLocalError('');
                    }}
                    className={`transition-all ${
                      localError && step === 'email'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    disabled={requestOTPMutation.isPending}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Entrez votre email administrateur pour recevoir un code OTP
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={requestOTPMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg"
                >
                  {requestOTPMutation.isPending ? 'Envoi en cours...' : 'Envoyer Code OTP'}
                </Button>

                {/* Message d'information */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300 rounded-xl p-4 shadow-md"
                >
                  <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Accès Administrateur
                  </p>
                  <p className="text-xs text-indigo-700">
                    Entrez votre email administrateur pour recevoir un code de connexion sécurisé.
                  </p>
                </motion.div>
              </form>
            ) : (
              // Formulaire OTP
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3 shadow-md"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <p className="text-sm font-bold text-green-900">✓ Code OTP Envoyé</p>
                    <p className="text-sm text-green-800 mt-1">Vérifiez votre email: <strong className="text-green-900">{email}</strong></p>
                    <p className="text-xs text-green-700 mt-2">⏱️ Le code expire dans 10 minutes</p>
                  </div>
                </motion.div>

                <div>
                  <Label htmlFor="otp" className="text-gray-700 font-semibold mb-2 block">
                    Code OTP (6 chiffres)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setLocalError('');
                    }}
                    maxLength={6}
                    className={`text-center text-2xl font-bold transition-all ${
                      localError && step === 'otp'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    disabled={verifyOTPMutation.isPending}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Entrez les 6 chiffres du code reçu par email
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('email');
                      setOtpCode('');
                      setLocalError('');
                      setAttemptCount(0);
                    }}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyOTPMutation.isPending || otpCode.length !== 6}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg"
                  >
                    {verifyOTPMutation.isPending ? 'Vérification...' : 'Vérifier & Connexion'}
                  </Button>
                </div>
              </form>
            )}

            {/* Messages d'erreur stylisés */}
            <AnimatePresence>
              {localError && errorDetails && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3 shadow-lg"
                >
                  {errorDetails.icon}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">{errorDetails.title}</p>
                    <p className="text-sm text-red-800 mt-1">{localError}</p>
                    <p className="text-xs text-red-700 mt-2 italic">💡 {errorDetails.suggestion}</p>
                    
                    {/* Compteur de tentatives */}
                    {attemptCount > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full transition-all ${
                                i < attemptCount ? 'bg-red-600' : 'bg-red-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-red-700">
                          {attemptCount === 1 && '1 tentative échouée'}
                          {attemptCount === 2 && '2 tentatives échouées'}
                          {attemptCount >= 3 && '⚠️ Plusieurs tentatives échouées'}
                        </span>
                      </div>
                    )}

                    {/* Bouton d'aide pour OTP */}
                    {step === 'otp' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowOtpHint(!showOtpHint)}
                          className="text-xs text-red-700 hover:text-red-900 font-semibold underline transition-colors"
                        >
                          {showOtpHint ? '✓ Masquer l\'astuce' : '? Besoin d\'aide ?'}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setLocalError('')}
                    className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Astuce OTP */}
            <AnimatePresence>
              {showOtpHint && step === 'otp' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4"
                >
                  <p className="text-xs text-blue-900 font-bold mb-3">💡 Conseils Utiles:</p>
                  <ul className="text-xs text-blue-800 space-y-2 list-disc list-inside">
                    <li>Vérifiez votre dossier <strong>spam</strong> ou <strong>indésirables</strong></li>
                    <li>Le code expire après <strong>10 minutes</strong></li>
                    <li>Cliquez sur <strong>"Retour"</strong> pour demander un nouveau code</li>
                    <li>Assurez-vous d'entrer exactement <strong>6 chiffres</strong></li>
                    <li>Vérifiez que vous utilisez le bon email autorisé</li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Lien retour */}
        <div className="text-center mt-6">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
