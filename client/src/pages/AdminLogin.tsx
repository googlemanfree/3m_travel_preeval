import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'email' | 'otp';

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [adminType, setAdminType] = useState<string>('');

  // Mutations
  const requestOTPMutation = trpc.adminAuth.requestOTP.useMutation({
    onSuccess: (data) => {
      setAdminType(data.adminType);
      setStep('otp');
      toast.success('Code OTP envoyé à votre email');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyOTPMutation = trpc.adminAuth.verifyOTP.useMutation({
    onSuccess: (data) => {
      // Sauvegarder le token de session
      localStorage.setItem('adminSessionToken', data.sessionToken);
      localStorage.setItem('adminType', data.adminType);
      localStorage.setItem('adminName', data.fullName);
      toast.success('Connexion réussie!');

      // Rediriger vers le dashboard approprié
      if (data.adminType === 'evaluation') {
        navigate('/admin/evaluation');
      } else if (data.adminType === 'accompagnement') {
        navigate('/admin/accompagnement');
      } else if (data.adminType === 'procedures') {
        navigate('/admin/procedures');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    requestOTPMutation.mutate({ email });
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Veuillez entrer un code OTP valide (6 chiffres)');
      return;
    }
    verifyOTPMutation.mutate({ email, otpCode });
  };

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
                    placeholder="admin@3mtravelagency.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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

                {/* Comptes admin disponibles */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Comptes Admin Disponibles:</p>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>📊 <strong>Admin Évaluation:</strong> evaluation@3mtravelagency.com</div>
                    <div>🚀 <strong>Admin Accompagnement:</strong> accompagnement@3mtravelagency.com</div>
                    <div>🌍 <strong>Admin Procédures:</strong> procedures@3mtravelagency.com</div>
                  </div>
                </div>
              </form>
            ) : (
              // Formulaire OTP
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Code OTP envoyé</p>
                    <p className="text-sm text-green-700">Vérifiez votre email: <strong>{email}</strong></p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="otp" className="text-gray-700 font-semibold mb-2 block">
                    Code OTP (6 chiffres)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl font-bold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={verifyOTPMutation.isPending}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Le code expire dans 10 minutes
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep('email');
                      setOtpCode('');
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

            {/* Messages d'erreur */}
            {(requestOTPMutation.error || verifyOTPMutation.error) && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Erreur</p>
                  <p className="text-sm text-red-700">
                    {requestOTPMutation.error?.message || verifyOTPMutation.error?.message}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lien retour */}
        <div className="text-center mt-6">
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
