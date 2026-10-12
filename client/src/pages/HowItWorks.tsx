import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, DollarSign, Upload, Briefcase, Award } from "lucide-react";
import { Link } from "wouter";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

export default function HowItWorks() {
  const heroVisual = getServiceVisual("dossier");

  useEffect(() => {
    setPageSeo({
      title: "Comment ça marche : les étapes | 3M TRAVEL AGENCY",
      description:
        "Découvrez le parcours 3M TRAVEL AGENCY : évaluation, dossier, documents et suivi administratif pour votre projet de mobilité internationale.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  const steps = [
    {
      number: 1,
      title: "Créez votre compte sécurisé",
      description: "Inscrivez-vous sur notre plateforme pour créer votre espace personnel. C'est votre tableau de bord central pour gérer votre dossier.",
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      number: 2,
      title: "Choisissez votre destination",
      description: "Sélectionnez le pays de votre choix (Canada, France, Allemagne, etc.). Cela nous permet d'adapter l'évaluation à vos besoins.",
      icon: Briefcase,
      color: "bg-sky-100 text-sky-700",
    },
    {
      number: 3,
      title: "Évaluation approfondie",
      description: "Soumettez vos informations personnelles, professionnelles et académiques. Nos experts analyseront votre profil selon les critères du marché du travail.",
      icon: FileText,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      number: 4,
      title: "Recevez votre bilan en 48h",
      description: "Sous 48 heures, vous recevrez un rapport d'éligibilité détaillé par e-mail. Ce bilan vous indiquera vos chances de succès et les prochaines étapes.",
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      number: 5,
      title: "Paiement des frais d'ouverture",
      description: "Finalisez votre candidature en réglant les frais d'ouverture. Leur montant dépend de votre profil et vous est confirmé par écrit avant tout paiement. Il couvre les frais administratifs et lance officiellement votre processus.",
      icon: DollarSign,
      color: "bg-rose-100 text-rose-700",
    },
    {
      number: 6,
      title: "Dépôt de vos documents",
      description: "Déposez vos documents originaux à notre agence ou soumettez un scan professionnel en ligne. Nous acceptons les deux méthodes.",
      icon: Upload,
      color: "bg-blue-100 text-blue-700",
    },
    {
      number: 7,
      title: "Soumission aux agences partenaires",
      description: "Une fois vos documents vérifiés, nous les soumettons à notre réseau d'agences de recrutement pour trouver des opportunités d'emploi.",
      icon: Briefcase,
      color: "bg-teal-100 text-teal-700",
    },
    {
      number: 8,
      title: "Gestion administrative complète",
      description: "3M TRAVEL AGENCY gère toutes les démarches administratives pour l'obtention de votre permis de travail et visa. Vous pouvez vous concentrer sur votre avenir.",
      icon: Award,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden px-4 pb-14 pt-16 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/92 via-[#0a3264]/80 to-[#0e5b9f]/55" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">3M TRAVEL AGENCY</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Comment ça marche ?</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Découvrez notre processus simple et transparent pour obtenir votre visa de travail
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center font-bold text-xl mb-2`}>
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-1 h-20 bg-gradient-to-b from-blue-300 to-blue-100"></div>
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <Icon className={`w-8 h-8 ${step.color.split(" ")[1]} flex-shrink-0 mt-1`} />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-blue-900 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Prêt à commencer votre nouvelle carrière ?</h2>
          <p className="text-lg text-blue-100 mb-6">
            Évaluez votre éligibilité gratuitement et lancez votre dossier aujourd'hui
          </p>
          <Link href="/open-dossier">
            <Button className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-3 text-lg">
              Ouvrir mon dossier maintenant
            </Button>
          </Link>
        </div>

        <ProofGallerySection
          initialFilter="visas"
          lockFilter
          collapsedCount={3}
          hideWhenEmpty
          className="mt-12 bg-white px-0 py-12"
          titleFr="Preuves de dossiers accompagnés"
          titleEn="Proofs from supported cases"
          leadFr="Extraits anonymisés de visas et autorisations obtenus par des candidats suivis depuis Yaoundé."
          leadEn="Redacted excerpts of visas and authorisations obtained by candidates supported from Yaoundé."
        />

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquemment posées</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Combien de temps prend le processus ?</h3>
              <p className="text-gray-600">
                L'évaluation initiale prend 48 heures. Le reste du processus dépend de votre destination et des agences partenaires, généralement 2 à 6 mois.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Que se passe-t-il après le paiement ?</h3>
              <p className="text-gray-600">
                Après le paiement, vous devez déposer vos documents originaux à notre agence ou les soumettre en ligne. Nous les vérifierons puis les soumettrons aux agences.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Puis-je déposer mes documents en ligne ?</h3>
              <p className="text-gray-600">
                Oui ! Nous acceptons les scans professionnels en ligne pour ceux qui ne sont pas dans la ville. C'est une solution pratique et sécurisée.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Quel est le taux de succès ?</h3>
              <p className="text-gray-600">
                Notre taux de succès dépend de votre profil et de votre destination. Nos experts vous guideront pour maximiser vos chances.
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pourquoi nous faire confiance ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Transparence totale</h3>
              <p className="text-gray-600">
                Chaque étape est claire et documentée. Vous savez exactement où en est votre dossier.
              </p>
            </div>

            <div className="text-center">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Expertise reconnue</h3>
              <p className="text-gray-600">
                Notre équipe compte des spécialistes en immigration avec des années d'expérience.
              </p>
            </div>

            <div className="text-center">
              <Briefcase className="w-12 h-12 text-sky-700 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Réseau de partenaires</h3>
              <p className="text-gray-600">
                Nous travaillons avec des agences de recrutement dans les principaux pays de destination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
