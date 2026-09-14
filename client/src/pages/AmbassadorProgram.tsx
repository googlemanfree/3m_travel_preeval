import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

  const copyReferralCode = async () => {
    if (!savedReferralCode) return;
    try {
      await navigator.clipboard.writeText(savedReferralCode);
      toast.success('Code copié dans le presse-papiers.');
    } catch {
      toast.error("Impossible de copier automatiquement. Copiez le code manuellement.");
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition disabled:opacity-60"
              >
                {registerMutation.isPending ? 'Inscription en cours…' : '✅ Devenir Ambassadeur'}
              </button>
            </form>

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
                  <p className="text-gray-600 text-sm">Commissions gagnées ({(statsQuery.data ? statsQuery.data.commissionRateBps / 100 : 15)}%, sur paiements confirmés)</p>
                  <p className="text-3xl font-black text-green-600">{(statsQuery.data?.totalCommissionXaf ?? 0).toLocaleString('fr-FR')} XAF</p>
                </div>
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
              <button onClick={copyReferralCode} className="w-full mt-4 bg-blue-100 text-blue-600 font-bold py-2 rounded-xl hover:bg-blue-200 transition">
                📋 Copier le code
              </button>
            </Card>
          </motion.div>
          )
        )}
      </div>
    </div>
  );
}
