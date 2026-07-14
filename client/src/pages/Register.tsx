import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, UserPlus, Globe, Phone, Mail, User, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

const DESTINATIONS = [
  { value: "canada",     label: "🇨🇦 Canada — Résidence Permanente" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg — Travail qualifié" },
  { value: "pologne",    label: "🇵🇱 Pologne — Recrutement direct" },
  { value: "europe",     label: "🇪🇺 Europe Zone Schengen" },
  { value: "golfe",      label: "🇦🇪 Golfe & Moyen-Orient" },
  { value: "autre",      label: "Autre destination" },
];

export default function Register() {
  const [, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    destination: "canada" as string,
    nationality: "",
  });

  const registerMutation = trpc.candidate.register.useMutation({
    onSuccess: (data) => {
      login(data.token, {
        id: data.candidateId,
        fullName: form.fullName,
        email: form.email,
        destination: form.destination,
        dossierStatus: "nouveau",
      });
      toast.success("Compte créé avec succès ! Bienvenue dans votre espace candidat.");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    registerMutation.mutate({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      destination: form.destination as any,
      nationality: form.nationality || undefined,
    });
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      {/* Panneau gauche — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#7cb9e8] blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <img src={LOGO_URL} alt="3M Travel" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-2xl object-cover" />
          <h1 className="text-4xl font-black mb-4">Votre Espace Candidat</h1>
          <p className="text-blue-200 text-lg mb-8">Créez votre compte et suivez l'avancement de votre dossier d'immigration en temps réel.</p>
          <div className="space-y-4 text-left">
            {[
              { icon: CheckCircle, text: "Suivi en temps réel de votre dossier" },
              { icon: CheckCircle, text: "Upload sécurisé de vos documents" },
              { icon: CheckCircle, text: "Messagerie directe avec votre conseiller" },
              { icon: CheckCircle, text: "Notifications à chaque étape clé" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <item.icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-blue-100">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit — Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Créer mon compte</h2>
            <p className="text-gray-500 text-sm mt-1">Rejoignez l'espace candidat 3M Travel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom complet */}
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Nom complet *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Téléphone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="+237 6XX XXX XXX"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <Label className="text-sm font-semibold text-gray-700">Destination souhaitée</Label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Select value={form.destination} onValueChange={v => setForm(f => ({ ...f, destination: v }))}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATIONS.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Mot de passe * <span className="text-gray-400 font-normal">(8 caractères min.)</span></Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création en cours...</span>
              ) : (
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Créer mon compte <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-3">
              <Link href="/" className="hover:underline">← Retour à l'accueil</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
