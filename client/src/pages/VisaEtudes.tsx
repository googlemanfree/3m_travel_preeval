import { motion } from 'framer-motion';
import { GraduationCap, CheckCircle, FileText, Users, Award, ArrowRight, AlertCircle, Globe, Clock, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import Navbar from '@/components/Navbar';
import { Link } from 'wouter';

export default function VisaEtudes() {
  const destinations = [
    { flag: '🇨🇦', country: 'Canada', note: 'Permis d\'études, large choix de programmes collégiaux et universitaires' },
    { flag: '🇫🇷', country: 'France', note: 'Visa étudiant Schengen, campus francophones reconnus' },
    { flag: '🇧🇪', country: 'Belgique', note: 'Visa étudiant Schengen, frais de scolarité souvent abordables' },
    { flag: '🇩🇪', country: 'Allemagne', note: 'Visa étudiant Schengen, nombreux programmes en anglais' },
    { flag: '🇵🇱', country: 'Pologne', note: 'Visa étudiant Schengen, coût de la vie compétitif' },
  ];

  const steps = [
    {
      number: '1',
      title: 'Évaluation gratuite de votre profil',
      description: 'Nous étudions votre parcours académique, votre budget et vos objectifs pour identifier les destinations et filières les plus réalistes pour vous.',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Choix de l\'établissement et de la filière',
      description: 'Nous vous orientons vers des établissements reconnus correspondant à votre profil et à votre budget, en tenant compte des délais d\'admission.',
      icon: GraduationCap,
    },
    {
      number: '3',
      title: 'Constitution du dossier',
      description: 'Diplômes, relevés de notes, lettre de motivation, preuve de ressources financières, assurance : nous vérifions chaque pièce avant le dépôt.',
      icon: CheckCircle,
    },
    {
      number: '4',
      title: 'Dépôt de la demande de visa',
      description: 'Prise de rendez-vous consulaire, préparation à l\'entretien si nécessaire, suivi du dossier jusqu\'à la décision.',
      icon: Award,
    },
  ];

  const requirements = [
    'Diplômes et relevés de notes légalisés',
    'Lettre de motivation adaptée à l\'établissement visé',
    'Preuve de ressources financières suffisantes',
    'Attestation d\'assurance maladie/voyage',
    'Passeport valide (au moins 6 mois de validité)',
    'Lettre d\'admission ou de pré-inscription de l\'établissement',
  ];

  const faqs = [
    {
      question: 'Quel niveau d\'études faut-il pour partir étudier à l\'étranger ?',
      answer: 'Cela dépend de la destination et du programme visé : certains programmes sont accessibles après le Baccalauréat, d\'autres exigent une Licence ou un diplôme équivalent. Notre évaluation gratuite permet de clarifier les options réellement accessibles selon votre parcours.',
    },
    {
      question: 'Dois-je déjà avoir une admission avant de vous contacter ?',
      answer: 'Non. Nous pouvons vous accompagner dès la phase de recherche d\'établissement, ou reprendre le dossier si vous avez déjà une lettre d\'admission.',
    },
    {
      question: 'Combien de temps prend une demande de visa étudiant ?',
      answer: 'Le délai varie fortement selon le pays et la période de l\'année (les mois précédant la rentrée académique sont souvent plus chargés). Nous recommandons de démarrer les démarches plusieurs mois avant la date de rentrée visée.',
    },
    {
      question: 'Le visa étudiant permet-il de travailler pendant les études ?',
      answer: 'Dans plusieurs destinations (Canada, France, Belgique...), un permis de travail à temps partiel est possible sous conditions. Les règles précises dépendent du pays et sont confirmées avec vous au cas par cas.',
    },
    {
      question: 'Que se passe-t-il si ma demande de visa est refusée ?',
      answer: 'Un refus reste possible, la décision finale appartenant toujours aux autorités du pays de destination. Nous vérifions votre dossier en amont pour limiter ce risque et vous orientons sur les suites possibles en cas de refus.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="px-4 py-2 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold">
              🎓 Visa Études
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mt-6 mb-6">
              Étudiez à l'étranger, accompagné à chaque étape
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              De l'évaluation de votre profil à l'obtention de votre visa étudiant, 3M Travel & Services vous accompagne dans la constitution et le suivi de votre dossier.
            </p>
            <Link href="/evaluation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              >
                Démarrer mon évaluation gratuite
                <ArrowRight size={20} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Destinations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Destinations d'études les plus demandées</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Chaque destination a ses propres exigences et délais — notre équipe vous aide à choisir celle qui correspond le mieux à votre profil.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((d) => (
              <Card key={d.country} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{d.flag}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{d.country}</h3>
                <p className="text-sm text-gray-600">{d.note}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Comment ça marche</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white p-6 rounded-xl shadow-md h-full border border-gray-100">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">
                      {step.number}
                    </div>
                    <Icon className="text-blue-600 mb-4" size={28} />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-1 bg-blue-300 transform -translate-y-1/2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Documents généralement demandés</h2>
          <p className="text-center text-gray-600 mb-10">
            La liste exacte varie selon la destination et l'établissement — elle vous est confirmée précisément lors de votre évaluation.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {requirements.map((req) => (
              <div key={req} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-gray-700 text-sm">{req}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Pourquoi passer par 3M Travel & Services</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <Users className="text-blue-600 flex-shrink-0" size={32} />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Un conseiller dédié</h3>
                <p className="text-gray-600 text-sm">Un seul interlocuteur qui suit votre dossier du début à la fin, joignable par WhatsApp.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Globe className="text-blue-600 flex-shrink-0" size={32} />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Plusieurs destinations</h3>
                <p className="text-gray-600 text-sm">Canada, France, Belgique, Allemagne, Pologne et d'autres selon votre profil.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="text-blue-600 flex-shrink-0" size={32} />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Suivi transparent</h3>
                <p className="text-gray-600 text-sm">Vous savez à tout moment où en est votre dossier et ce qu'il reste à faire.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <AlertCircle className="text-blue-600 flex-shrink-0" size={32} />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Vérification avant dépôt</h3>
                <p className="text-gray-600 text-sm">Chaque dossier est relu avant soumission pour limiter les risques de rejet évitables.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white border border-gray-200 rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold text-gray-900">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Prêt à démarrer votre projet d'études ?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Une évaluation gratuite et sans engagement pour savoir où vous en êtes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/evaluation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Faire mon évaluation gratuite
                <ArrowRight size={20} />
              </motion.button>
            </Link>
            <a href="https://wa.me/237698104832?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20le%20visa%20\u00e9tudes." target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-green-500 text-green-600 font-bold rounded-full text-lg transition-all duration-300 hover:bg-green-50 inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Poser une question
              </motion.button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
