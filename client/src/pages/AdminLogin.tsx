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
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  const temporaryPasswordMutation = trpc.adminPasswordReset.requestTemporaryPassword.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (error) => setLocalError(error.message || "Impossible d’envoyer le mot de passe temporaire."),
  });

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      // Le cookie HttpOnly est créé par le serveur. Ce stockage par onglet ne
      // sert qu'à conserver la compatibilité des appels admin existants.
      sessionStorage.setItem('adminSessionToken', data.sessionToken);
      localStorage.setItem('adminSessionToken', data.sessionToken);
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
      if (err.message.includes('TOTP_REQUIRED')) {
        setNeedsTwoFactor(true);
        setLocalError('Saisissez votre code 2FA ou un code de récupération.');
      } else setLocalError(err.message || 'Email ou mot de passe incorrect.');
    },
  });

  const handleRequestTemporaryPassword = () => {
    setLocalError("");
    if (!email.trim()) {
      setLocalError("Saisissez votre adresse e-mail administrateur avant de demander un temporaire.");
      return;
    }
    temporaryPasswordMutation.mutate({ email: email.trim() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    loginMutation.mutate({ email: email.trim(), password, twoFactorCode: twoFactorCode || undefined });
  };

  return (
    <main className="premium-page-shell flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="premium-action mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Administration</p>
          <div className="premium-gold-rule mx-auto mt-2" aria-hidden="true" />
          <h1 className="premium-section-title mt-3 text-2xl sm:text-3xl">3M TRAVEL AGENCY</h1>
          <p className="premium-copy mt-2 text-sm">Connexion sécurisée à l’espace administrateur</p>
        </div>

        <Card className="premium-surface border-0 shadow-xl">
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-[#0a2b5c] to-[#165dff] text-white">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-5 w-5" />
              Espace administrateur
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="admin-email" className="mb-2 block font-semibold text-slate-800">
                  Email administrateur
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setLocalError(''); }}
                    placeholder="admin@3mtravelagency.com"
                    className="pl-10"
                    disabled={loginMutation.isPending}
                    autoComplete="username"
                    maxLength={320}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin-password" className="mb-2 block font-semibold text-slate-800">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                    placeholder="••••••••••••"
                    className="pl-10 pr-10"
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {needsTwoFactor && <div>
                <Label htmlFor="admin-two-factor" className="mb-2 block font-semibold text-slate-800">Code 2FA ou récupération</Label>
                <Input id="admin-two-factor" inputMode="numeric" autoComplete="one-time-code" value={twoFactorCode} onChange={(e) => { setTwoFactorCode(e.target.value); setLocalError(''); }} placeholder="Code à six chiffres" disabled={loginMutation.isPending} maxLength={32} />
              </div>}

              {localError && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{localError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="premium-action w-full text-white"
              >
                {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleRequestTemporaryPassword}
            disabled={temporaryPasswordMutation.isPending || loginMutation.isPending}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline disabled:opacity-60"
          >
            {temporaryPasswordMutation.isPending ? "Envoi du temporaire..." : "Recevoir un mot de passe temporaire par e-mail"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <a href="/" className="font-semibold text-blue-700 hover:underline">← Retour à l'accueil</a>
        </p>
      </motion.div>
    </main>
  );
}
