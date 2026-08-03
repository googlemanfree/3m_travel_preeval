import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, DollarSign, Upload, Briefcase, Award } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Creez votre compte securise",
      description: "Inscrivez-vous sur notre plateforme pour creer votre espace personnel. C'est votre tableau de bord central pour gerer votre dossier.",
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
    {
      number: 2,
      title: "Choisissez votre destination",
      description: "Selectionnez le pays de votre choix (Canada, France, Allemagne, etc.). Cela nous permet d'adapter l'evaluation a vos besoins.",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-600",
    },
    {
      number: 3,
      title: "Evaluation approfondie",
      description: "Soumettez vos informations personnelles, professionnelles et academiques. Nos experts analyseront votre profil selon les criteres du marche du travail.",
      icon: FileText,
      color: "bg-green-100 text-green-600",
    },
    {
      number: 4,
      title: "Recevez votre bilan en 48h",
      description: "Sous 48 heures, vous recevrez un rapport d'eligibilite detaille par email. Ce bilan vous indiquera vos chances de succes et les prochaines etapes.",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      number: 5,
      title: "Paiement obligatoire (65 000 XAF)",
      description: "Finalisez votre candidature en effectuant le paiement de 65 000 XAF. Ce montant couvre les frais administratifs et lance officiellement votre processus.",
      icon: DollarSign,
      color: "bg-red-100 text-red-600",
    },
    {
      number: 6,
      title: "Depot de vos documents",
      description: "Deposez vos documents originaux a notre agence ou soumettez un scan professionnel en ligne. Nous acceptons les deux methodes.",
      icon: Upload,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      number: 7,
      title: "Soumission aux agences partenaires",
      description: "Une fois vos documents verifies, nous les soumettons a notre reseau d'agences de recrutement pour trouver des opportunites d'emploi.",
      icon: Briefcase,
      color: "bg-pink-100 text-pink-600",
    },
    {
      number: 8,
      title: "Gestion administrative complete",
      description: "3M Travel & Services gere toutes les demarches administratives pour l'obtention de votre permis de travail et visa. Vous pouvez vous concentrer sur votre avenir.",
      icon: Award,
      color: "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Comment ca marche ?</h1>
          <p className="text-xl text-blue-100">
            Decouvrez notre processus simple et transparent pour obtenir votre visa de travail
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex gap-6">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center font-bold text-xl mb-2`}>
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-1 h-20 bg-gradient-to-b from-blue-300 to-blue-100"></div>
                  )}
                </div>

                {/* Content */}
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

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Pret a commencer votre nouvelle carriere ?</h2>
          <p className="text-lg text-blue-100 mb-6">
            Evaluez votre eligibilite gratuitement et lancez votre dossier aujourd'hui
          </p>
          <Link href="/open-dossier">
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 text-lg">
              Ouvrir mon dossier maintenant
            </Button>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions frequemment posees</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Combien de temps prend le processus ?</h3>
              <p className="text-gray-600">
                L'evaluation initiale prend 48 heures. Le reste du processus depend de votre destination et des agences partenaires, generalement 2 a 6 mois.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Que se passe-t-il apres le paiement ?</h3>
              <p className="text-gray-600">
                Apres le paiement, vous devez deposer vos documents originaux a notre agence ou les soumettre en ligne. Nous les verifierons puis les soumettrons aux agences.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Puis-je deposer mes documents en ligne ?</h3>
              <p className="text-gray-600">
                Oui ! Nous acceptons les scans professionnels en ligne pour ceux qui ne sont pas dans la ville. C'est une solution pratique et securisee.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Quel est le taux de succes ?</h3>
              <p className="text-gray-600">
                Notre taux de succes depend de votre profil et de votre destination. Nos experts vous guideront pour maximiser vos chances.
              </p>
            </Card>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pourquoi nous faire confiance ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Transparence totale</h3>
              <p className="text-gray-600">
                Chaque etape est claire et documentee. Vous savez exactement ou en est votre dossier.
              </p>
            </div>

            <div className="text-center">
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Expertise reconnue</h3>
              <p className="text-gray-600">
                Notre equipe compte des specialistes en immigration avec des annees d'experience.
              </p>
            </div>

            <div className="text-center">
              <Briefcase className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Reseau de partenaires</h3>
              <p className="text-gray-600">
                Nous travaillons avec des agences de recrutement dans les principaux pays de destination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
