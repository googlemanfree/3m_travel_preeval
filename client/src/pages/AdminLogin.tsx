import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      // Le cookie HttpOnly est créé par le serveur. Ce stockage par onglet ne
      // sert qu'à conserver la compatibilité des appels admin existants.
      sessionStorage.setItem('adminSessionToken', data.sessionToken);
      sessionStorage.setItem('adminType', data.adminType);
      sessionStorage.setItem('adminName', data.fullName);
      sessionStorage.setItem('adminEmail', data.email);
      toast.success(`Bienvenue, ${data.fullName} !`);
      
      // Vérifier si le changement de mot de passe est obligatoire
      if (data.requiresPasswordChange) {
        navigate('/admin/change-password');
      } else {
        navigate('/admin');
      }
    },
    onError: (err) => {
      setLocalError(err.message || 'Email ou mot de passe incorrect.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin 3M Travel</h1>
          <p className="text-gray-500 mt-1">Connexion Sécurisée</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-5 h-5" />
              Espace administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="admin-email" className="text-gray-700 font-semibold mb-2 block">
                  Email administrateur
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
                    placeholder="admin@3mtravelagency.com"
                    className="pl-10"
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin-password" className="text-gray-700 font-semibold mb-2 block">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                    placeholder="••••••••••••"
                    className="pl-10 pr-10"
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {localError && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{localError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/" className="text-blue-600 hover:underline">← Retour à l'accueil</a>
        </p>
      </motion.div>
    </div>
  );
}
