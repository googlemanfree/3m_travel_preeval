import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  const requestResetMutation = trpc.adminPasswordReset.requestReset.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Email de réinitialisation envoyé');
      // Rediriger après 5 secondes
      setTimeout(() => {
        navigate('/admin/login');
      }, 5000);
    },
    onError: (err) => {
      setLocalError(err.message || 'Une erreur est survenue');
      toast.error('Erreur lors de la demande');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Veuillez entrer votre email');
      return;
    }

    requestResetMutation.mutate({ email: email.trim() });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardContent className="pt-12 pb-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé</h2>
              <p className="text-gray-600 mb-6">
                Si un compte administrateur est associé à <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-900">
                  <strong>💡 Conseil :</strong> Vérifiez votre dossier spam si vous ne recevez pas l'email dans les prochaines minutes.
                </p>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Redirection vers la page de connexion dans quelques secondes...
              </p>

              <Button
                onClick={() => navigate('/admin/login')}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
          <p className="text-gray-500 mt-1">Réinitialisez votre accès administrateur</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="w-5 h-5" />
              Récupération de compte
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="reset-email" className="text-gray-700 font-semibold mb-2 block">
                  Email administrateur
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError('');
                  }}
                  disabled={requestResetMutation.isPending}
                  className="text-base"
                />
              </div>

              {localError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{localError}</div>
                </motion.div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Processus sécurisé :</strong> Vous recevrez un email avec un lien de réinitialisation valide 1 heure.
                </p>
              </div>

              <Button
                type="submit"
                disabled={requestResetMutation.isPending || !email.trim()}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5"
              >
                {requestResetMutation.isPending ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/admin/login')}
                className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm w-full py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Vous n'avez pas de compte ? Contactez l'administrateur système.
        </p>
      </motion.div>
    </div>
  );
}
