import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clipboard, Loader2, Link2, Share2, BarChart3, ShieldCheck, UsersRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { INTERNATIONAL_BRAND } from '@/data/internationalBrand';
import { PremiumCoverImage } from '@/components/PremiumCoverImage';
import { getServiceVisual } from '@/data/premiumVisuals';

const REFERRAL_CODE_STORAGE_KEY = '3m-travel:ambassador-referral-code';

export default function AmbassadorProgram() {
  const heroVisual = getServiceVisual('mobilite');
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
      icon: Share2,
      title: 'Lien de parrainage traçable',
      description: 'Un code personnel pour présenter 3M TRAVEL AGENCY à votre réseau, avec suivi des dossiers associés.',
    },
    {
      icon: ShieldCheck,
      title: 'Commissions sur paiements confirmés',
      description: 'Les commissions ne sont comptabilisées qu’après validation des dossiers et des paiements effectivement confirmés.',
    },
    {
      icon: BarChart3,
      title: 'Tableau de bord personnel',
      description: 'Consultez parrainages, dossiers payés et statut de votre profil depuis cet espace.',
    },
    {
      icon: UsersRound,
      title: 'Corridor Yaoundé · Ottawa',
      description: 'Vous orientez des candidats vers une méthode documentée — sans promettre visa, emploi ou admission.',
    },
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
    <main className="premium-page-shell min-h-screen">
      <section className="relative overflow-hidden px-4 pb-14 pt-20 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90 brightness-105 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/94 via-[#0a3264]/82 to-[#0e5b9f]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061a36]/70 via-transparent to-[#061a36]/30" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl">
            {INTERNATIONAL_BRAND.publicName}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">{INTERNATIONAL_BRAND.corridor}</p>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Programme Ambassadeur
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Présentez nos services à votre réseau avec un code de parrainage traçable. Les commissions dépendent des dossiers et paiements effectivement confirmés — jamais d’un résultat de visa ou d’emploi.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-wrap justify-center gap-3" role="tablist" aria-label="Sections du programme ambassadeur">
          {[
            { id: 'benefits' as const, label: 'Avantages' },
            { id: 'join' as const, label: 'Rejoindre' },
            { id: 'dashboard' as const, label: 'Tableau de bord' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[#0a2b5c] text-white shadow-md'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'benefits' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2"
          >
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="premium-surface rounded-2xl p-6 sm:p-8">
                  <div className="premium-gold-rule" aria-hidden="true" />
                  <Icon className="mt-4 h-7 w-7 text-blue-800" aria-hidden="true" />
                  <h2 className="mt-3 text-xl font-bold text-slate-950">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{benefit.description}</p>
                </article>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'join' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-surface mx-auto max-w-2xl rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-2xl font-bold text-slate-950">Rejoignez le programme</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Inscription réservée aux personnes souhaitant présenter 3M TRAVEL AGENCY de façon responsable. Aucun résultat administratif n’est promis aux filleuls.
            </p>

            <form onSubmit={handleJoin} className="premium-form-surface mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={ambassadorData.fullName}
                  onChange={(e) => setAmbassadorData((prev) => ({ ...prev, fullName: e.target.value }))}
                  maxLength={255}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Email *</label>
                <input
                  type="email"
                  required
                  value={ambassadorData.email}
                  onChange={(e) => setAmbassadorData((prev) => ({ ...prev, email: e.target.value }))}
                  maxLength={320}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={ambassadorData.phone}
                  onChange={(e) => setAmbassadorData((prev) => ({ ...prev, phone: e.target.value }))}
                  maxLength={50}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Pays *</label>
                <input
                  type="text"
                  required
                  value={ambassadorData.country}
                  onChange={(e) => setAmbassadorData((prev) => ({ ...prev, country: e.target.value }))}
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                aria-busy={registerMutation.isPending}
                className="premium-action flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Inscription en cours…
                  </>
                ) : (
                  'Devenir ambassadeur'
                )}
              </button>
            </form>

            {registrationNotice && (
              <div role="status" className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{registrationNotice}</span>
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm leading-6 text-slate-700">
                Après validation, vous recevrez un code de parrainage unique à partager avec votre réseau. Le taux applicable apparaît dans votre tableau de bord une fois les paiements confirmés.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'dashboard' && (
          !savedReferralCode ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="premium-surface mx-auto max-w-xl rounded-2xl p-8 text-center">
              <p className="text-slate-700">Vous n&apos;avez pas encore de code de parrainage sur cet appareil.</p>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className="premium-action mt-4 rounded-xl px-6 py-3 font-bold text-white transition"
              >
                Rejoindre le programme
              </button>
            </motion.div>
          ) : statsQuery.isLoading ? (
            <div className="py-12 text-center text-slate-500">Chargement de vos statistiques…</div>
          ) : statsQuery.isError ? (
            <div className="py-12 text-center text-red-600">Vos statistiques n&apos;ont pas pu être chargées. Réessayez dans un instant.</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
            >
              <Card className="premium-surface p-8">
                <h3 className="text-lg font-bold text-slate-950">Statistiques</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Parrainages totaux</p>
                    <p className="text-3xl font-black text-blue-700">{statsQuery.data?.totalReferrals ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Dossiers payés parmi vos filleuls</p>
                    <p className="text-3xl font-black text-blue-700">{statsQuery.data?.paidReferrals ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">
                      Commissions gagnées ({statsQuery.data ? statsQuery.data.commissionRateBps / 100 : '—'}%, sur paiements confirmés)
                    </p>
                    <p className="text-3xl font-black text-emerald-700">
                      {statsQuery.data ? `${statsQuery.data.totalCommissionXaf.toLocaleString('fr-FR')} XAF` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Statut du profil</p>
                    <p className="text-lg font-black capitalize text-slate-900">{statsQuery.data?.status ?? '—'}</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Ces indicateurs sont calculés à partir des dossiers réellement associés à votre code et des paiements confirmés.
                  </p>
                </div>
              </Card>

              <Card className="premium-surface p-8">
                <h3 className="text-lg font-bold text-slate-950">Votre code</h3>
                <div className="mt-4 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="mb-2 text-sm text-slate-600">Partagez ce code</p>
                  <p className="font-mono text-2xl font-black text-blue-700">{savedReferralCode}</p>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Lien complet à partager</p>
                  <p className="break-all text-xs font-semibold text-slate-700">{referralLink}</p>
                </div>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  disabled={!referralLink}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-100 py-2 font-bold text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Copier le lien complet de parrainage"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                      <Clipboard className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                  {copiedLink ? 'Lien copié' : 'Copier le lien complet'}
                </button>
              </Card>
            </motion.div>
          )
        )}

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-5 text-slate-500">{INTERNATIONAL_BRAND.disclaimer.fr}</p>
      </div>
    </main>
  );
}
