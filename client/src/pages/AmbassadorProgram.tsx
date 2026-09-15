import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clipboard, Loader2, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const REFERRAL_CODE_STORAGE_KEY = '3m-travel:ambassador-referral-code';

export default function AmbassadorProgram() {
  const [activeTab, setActiveTab] = useState<'benefits' | 'join' | 'dashboard'>('benefits');
  const [ambassadorData, setAmbassadorData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    referralCode: ''
  });
  const [savedReferralCode, setSavedReferralCode] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const referralLink = useMemo(() => {
    if (!savedReferralCode || typeof window === 'undefined') return '';
    return `${window.location.origin}/?ref=${encodeURIComponent(savedReferralCode)}`;
  }, [savedReferralCode]);

  useEffect(() => {
    try {
      setSavedReferralCode(window.localStorage.getItem(REFERRAL_CODE_STORAGE_KEY));
    } catch {
      // localStorage indisponible (navigation privée) : le tableau de bord proposera de saisir le code.
    }
  }, []);

  const registerMutation = trpc.ambassador.register.useMutation({
    onSuccess: (data) => {
      setAmbassadorData(prev => ({ ...prev, referralCode: data.referralCode }));
      setRegistrationNotice(data.alreadyRegistered ? 'Votre compte ambassadeur existe déjà. Votre lien personnel est prêt.' : 'Inscription réussie : votre lien personnel est prêt à être partagé.');
      try {
        window.localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, data.referralCode);
      } catch {
        // Si le stockage échoue, le code reste affiché à l'écran mais ne sera pas retrouvé au prochain passage.
      }
      setSavedReferralCode(data.referralCode);
      toast.success(data.alreadyRegistered ? 'Cette adresse e-mail est déjà inscrite. Voici votre code existant.' : 'Inscription réussie !', {
        description: `Votre code de parrainage : ${data.referralCode}`,
      });
      setActiveTab('dashboard');
    },
    onError: (error) => {
      setRegistrationNotice(null);
      toast.error(error.message || "L'inscription n'a pas pu être enregistrée. Réessayez.");
    },
  });

  const statsQuery = trpc.ambassador.getStatsByCode.useQuery(
    { referralCode: savedReferralCode ?? '' },
    { enabled: Boolean(savedReferralCode) },
  );

  const benefits = [
    {
      icon: '💰',
      title: 'Commissions Élevées',
      description: '15% de commission sur chaque dossier parrainé'
    },
    {
      icon: '🎁',
      title: 'Bonus de Performance',
      description: 'Bonus mensuel selon le nombre de dossiers'
    },
    {
      icon: '📱',
      title: 'Outils Marketing',
      description: 'Accès à des matériaux marketing professionnels'
    },
    {
      icon: '🌍',
      title: 'Réseau Global',
      description: 'Rejoignez une communauté d\'ambassadeurs'
    },
    {
      icon: '📊',
      title: 'Dashboard Dédié',
      description: 'Suivi en temps réel de vos parrainages'
    },
    {
      icon: '🏆',
      title: 'Récompenses VIP',
      description: 'Accès à des événements exclusifs'
    }
  ];

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      fullName: ambassadorData.fullName,
      email: ambassadorData.email,
      phone: ambassadorData.phone,
      country: ambassadorData.country,
    });
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
      toast.success('Lien de parrainage copié dans le presse-papiers.');
    } catch {
      toast.error("Impossible de copier automatiquement. Copiez le lien manuellement.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            🌟 Programme Ambassadeur 3M Travel
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Gagnez de l'argent en parrainant vos amis et votre réseau
          </p>
          <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-bold">
            💵 Jusqu'à 15% de commission par dossier
          </div>
        </motion.div>

        {/* Onglets */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { id: 'benefits', label: '✨ Avantages' },
            { id: 'join', label: '🚀 Rejoindre' },
            { id: 'dashboard', label: '📊 Dashboard' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {activeTab === 'benefits' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rejoignez le Programme</h2>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={ambassadorData.fullName}
                  onChange={(e) => setAmbassadorData(prev => ({
                    ...prev,
                    fullName: e.target.value
                  }))}
                  maxLength={255}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={ambassadorData.email}
                  onChange={(e) => setAmbassadorData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  maxLength={320}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={ambassadorData.phone}
                  onChange={(e) => setAmbassadorData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pays *
                </label>
                <input
                  type="text"
                  required
                  value={ambassadorData.country}
                  onChange={(e) => setAmbassadorData(prev => ({
                    ...prev,
                    country: e.target.value
                  }))}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                aria-busy={registerMutation.isPending}
                className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registerMutation.isPending ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Inscription en cours…</> : '✅ Devenir Ambassadeur'}
              </button>
            </form>
            {registrationNotice && (
              <div role="status" className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{registrationNotice}</span>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-sm text-gray-700">
                ℹ️ Après validation, vous recevrez un code de parrainage unique pour partager avec votre réseau.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' && (
          !savedReferralCode ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-8 text-center">
              <p className="text-gray-700">Vous n'avez pas encore de code de parrainage sur cet appareil.</p>
              <button
                onClick={() => setActiveTab('join')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition"
              >
                Rejoindre le programme
              </button>
            </motion.div>
          ) : statsQuery.isLoading ? (
            <div className="text-center text-gray-500 py-12">Chargement de vos statistiques…</div>
          ) : statsQuery.isError ? (
            <div className="text-center text-red-600 py-12">Vos statistiques n'ont pas pu être chargées. Réessayez dans un instant.</div>
          ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Statistiques</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Parrainages totaux</p>
                  <p className="text-3xl font-black text-blue-600">{statsQuery.data?.totalReferrals ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Dossiers payés parmi vos filleuls</p>
                  <p className="text-3xl font-black text-blue-600">{statsQuery.data?.paidReferrals ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Commissions gagnées ({statsQuery.data ? statsQuery.data.commissionRateBps / 100 : '—'}%, sur paiements confirmés)</p>
                  <p className="text-3xl font-black text-green-600">{statsQuery.data ? `${statsQuery.data.totalCommissionXaf.toLocaleString('fr-FR')} XAF` : '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Statut du profil</p>
                  <p className="text-lg font-black capitalize text-slate-900">{statsQuery.data?.status ?? '—'}</p>
                </div>
                <p className="text-xs leading-5 text-slate-500">Ces indicateurs sont calculés à partir des dossiers réellement associés à votre code et des paiements confirmés.</p>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Votre Code</h3>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-gray-600 text-sm mb-2">Partagez ce code</p>
                <p className="text-2xl font-black text-blue-600 font-mono">
                  {savedReferralCode}
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Lien complet à partager</p>
                <p className="break-all text-xs font-semibold text-slate-700">{referralLink}</p>
              </div>
              <button onClick={copyReferralLink} disabled={!referralLink} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-100 py-2 font-bold text-blue-600 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Copier le lien complet de parrainage">
                {copiedLink ? <Check className="h-4 w-4" aria-hidden="true" /> : <><Link2 className="h-4 w-4" aria-hidden="true" /><Clipboard className="h-4 w-4" aria-hidden="true" /></>}
                {copiedLink ? 'Lien copié' : 'Copier le lien complet'}
              </button>
            </Card>
          </motion.div>
          )
        )}
      </div>
    </div>
  );
}
