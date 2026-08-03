import React, { useState } from 'react';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AdminChangePasswordRequiredProps {
  sessionToken: string;
  adminEmail: string;
  onPasswordChanged?: () => void;
}

export default function AdminChangePasswordRequired({
  sessionToken,
  adminEmail,
  onPasswordChanged,
}: AdminChangePasswordRequiredProps) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont obligatoires');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Le nouveau mot de passe doit être différent du mot de passe actuel');
      return;
    }

    setLoading(true);

    try {
      // Appel à la procédure tRPC pour changer le mot de passe
      const response = await fetch('/api/trpc/adminAuth.changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Rediriger après 2 secondes
      setTimeout(() => {
        if (onPasswordChanged) {
          onPasswordChanged();
        } else {
          navigate('/admin-dashboard');
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Changement de mot de passe obligatoire
            </h1>
            <p className="text-slate-600">
              Pour des raisons de sécurité, vous devez changer votre mot de passe généré automatiquement lors de votre première connexion.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleChangePassword} className="space-y-5">
            {/* Email (lecture seule) */}
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={adminEmail}
                disabled
                className="mt-2 bg-slate-100 text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* Mot de passe actuel */}
            <div>
              <Label htmlFor="currentPassword" className="text-slate-700 font-medium">
                Mot de passe actuel
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Entrez votre mot de passe actuel"
                className="mt-2"
                disabled={loading}
              />
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <Label htmlFor="newPassword" className="text-slate-700 font-medium">
                Nouveau mot de passe
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="mt-2"
                disabled={loading}
              />
            </div>

            {/* Confirmer le mot de passe */}
            <div>
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                className="mt-2"
                disabled={loading}
              />
            </div>

            {/* Messages d'erreur */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Message de succès */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Mot de passe changé avec succès. Redirection en cours...
                </AlertDescription>
              </Alert>
            )}

            {/* Bouton de soumission */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              disabled={loading || success}
            >
              {loading ? 'Changement en cours...' : 'Changer mon mot de passe'}
            </Button>
          </form>

          {/* Note de sécurité */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>💡 Conseil de sécurité :</strong> Utilisez un mot de passe fort avec des majuscules, minuscules, chiffres et caractères spéciaux.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
