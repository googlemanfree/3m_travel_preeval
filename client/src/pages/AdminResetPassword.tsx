import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Eye, EyeOff, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminResetPassword() {
  const [, navigate] = useLocation();
  const [searchParams] = useLocation();
  const token = new URLSearchParams(searchParams).get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Valider le token
  const validateTokenQuery = trpc.adminPasswordReset.validateResetToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  // Réinitialiser le mot de passe
  const resetPasswordMutation = trpc.adminPasswordReset.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Mot de passe réinitialisé avec succès');
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
    },
    onError: (err) => {
      setLocalError(err.message || 'Erreur lors de la réinitialisation');
      toast.error('Erreur lors de la réinitialisation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validations
    if (!newPassword || !confirmPassword) {
      setLocalError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setLocalError('Token manquant');
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword,
      confirmPassword,
    });
  };

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setLocalError('Lien de réinitialisation invalide');
    }
  }, [token]);

  // Afficher un message d'erreur si le token est invalide
  if (validateTokenQuery.isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien expiré</h2>
              <p className="text-gray-600 mb-6">
                Le lien de réinitialisation a expiré ou est invalide. Veuillez demander un nouveau lien.
              </p>
              <Button
                onClick={() => navigate('/admin/forgot-password')}
                className="w-full"
              >
                Demander un nouveau lien
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Afficher un loader pendant la validation du token
  if (validateTokenQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien...</p>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Succès !</h2>
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Redirection vers la page de connexion...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const adminData = validateTokenQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-gray-500 mt-1">Créez un mot de passe sécurisé</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-5 h-5" />
              Réinitialisation de mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {adminData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>Compte :</strong> {adminData.email}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Administrateur :</strong> {adminData.fullName}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nouveau mot de passe */}
              <div>
                <Label htmlFor="new-password" className="text-gray-700 font-semibold mb-2 block">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 caractères"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setLocalError('');
                    }}
                    disabled={resetPasswordMutation.isPending}
                    className="pl-10 pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <Label htmlFor="confirm-password" className="text-gray-700 font-semibold mb-2 block">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setLocalError('');
                    }}
                    disabled={resetPasswordMutation.isPending}
                    className="pl-10 pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Messages d'erreur */}
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

              {/* Recommandations de sécurité */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">🔒 Recommandations :</p>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>✓ Minimum 8 caractères</li>
                  <li>✓ Mélangez majuscules, minuscules et chiffres</li>
                  <li>✓ Évitez les mots courants</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5"
              >
                {resetPasswordMutation.isPending ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
