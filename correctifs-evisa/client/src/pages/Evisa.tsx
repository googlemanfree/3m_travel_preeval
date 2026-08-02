import { motion } from 'framer-motion';
import { CheckCircle, Globe, FileText, Clock, Shield, Zap, ArrowRight, AlertCircle, CreditCard, Camera, Plane, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import Navbar from '@/components/Navbar';
import { Link } from 'wouter';

export default function Evisa() {
  const evisaTypes = [
    {
      emoji: '🇮🇳',
      country: 'Inde',
      validity: '30 jours, 1 an ou 5 ans (selon le type choisi)',
      entries: 'Simple ou multiple entrées (selon le type)',
      processing: '3 à 5 jours ouvrables (estimation)',
      price: '45 000 FCFA',
      description: 'e-Tourist Visa pour l\'Inde',
    },
    {
      emoji: '🇹🇷',
      country: 'Turquie',
      validity: '180 jours (séjour limité à 30 ou 90 jours selon nationalité)',
      entries: 'Simple ou multiple entrées selon nationalité',
      processing: 'Généralement quelques heures à 2 jours ouvrables',
      price: '35 000 FCFA',
      description: 'eVisa électronique Turquie',
    },
    {
      emoji: '🇪🇬',
      country: 'Égypte',
      validity: '30 jours (simple entrée) ou 90 jours (multiple entrées)',
      entries: 'Simple ou multiple entrées (selon le type choisi)',
      processing: '5 à 7 jours ouvrables (estimation)',
      price: '40 000 FCFA',
      description: 'eVisa touristique pour l\'Égypte',
    },
    {
      emoji: '🇧🇩',
      country: 'Bangladesh',
      validity: '30 jours',
      entries: 'Simple entrée',
      processing: 'Variable, à confirmer selon nationalité',
      price: '38 000 FCFA',
      description: 'Autorisation de voyage électronique Bangladesh',
    },
    {
      emoji: '🇱🇦',
      country: 'Laos',
      validity: '30 jours',
      entries: 'Simple entrée',
      processing: '3 jours ouvrables (estimation)',
      price: '42 000 FCFA',
      description: 'eVisa pour le Laos',
    },
    {
      emoji: '🇻🇳',
      country: 'Vietnam',
      validity: 'Jusqu\'à 90 jours',
      entries: 'Simple ou multiple entrées (selon le type choisi)',
      processing: '3 jours ouvrables (estimation)',
      price: '48 000 FCFA',
      description: 'eVisa Vietnam',
    },
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Remplir la demande en ligne',
      description: 'Vous choisissez votre destination et transmettez vos informations personnelles, passeport et dates de voyage via notre formulaire en 4 étapes',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Confirmation avec notre équipe',
      description: 'Votre demande nous est transmise via WhatsApp : nous vérifions votre dossier, vous confirmons le prix exact et le mode de paiement',
      icon: MessageCircle,
    },
    {
      number: '3',
      title: 'Soumission auprès des autorités',
      description: 'Une fois votre paiement confirmé, nous soumettons votre dossier complet aux autorités compétentes du pays de destination',
      icon: Zap,
    },
    {
      number: '4',
      title: 'Réception de votre eVisa',
      description: 'Vous recevez votre visa électronique par email dès son approbation, prêt à être imprimé ou présenté à l\'arrivée',
      icon: CheckCircle,
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: '100% en ligne',
      description: 'Pas besoin de vous déplacer à l\'ambassade ou au consulat',
    },
    {
      icon: Shield,
      title: 'Accompagnement humain',
      description: 'Votre dossier est vérifié par notre équipe avant soumission, pour limiter les risques de rejet',
    },
    {
      icon: Globe,
      title: 'Plusieurs destinations',
      description: 'Inde, Turquie, Égypte, Bangladesh, Laos, Vietnam — et d\'autres pays sur demande',
    },
    {
      icon: Zap,
      title: 'Suivi personnalisé',
      description: 'Un interlocuteur unique par WhatsApp, du dépôt de votre dossier jusqu\'à la réception de votre eVisa',
    },
  ];

  const requirements = [
    {
      icon: FileText,
      title: 'Passeport valide',
      detail: 'Au moins 6 mois de validité à la date d\'entrée dans le pays, avec au moins 2 pages vierges',
    },
    {
      icon: Camera,
      title: 'Photo d\'identité numérique',
      detail: 'Photo récente, couleur, fond blanc uni, format JPG/PNG — sans lunettes ni couvre-chef (sauf motif religieux)',
    },
    {
      icon: Plane,
      title: 'Informations de voyage',
      detail: 'Date de voyage prévue et durée de séjour souhaitée — les dates exactes ne sont pas figées définitivement à ce stade',
    },
    {
      icon: CreditCard,
      title: 'Moyen de paiement',
      detail: 'Le prix vous est confirmé par notre équipe avant tout paiement, selon votre nationalité et le type d\'eVisa choisi',
    },
  ];

  const faqs = [
    {
      question: 'Le prix affiché inclut-il tous les frais ?',
      answer: 'Les prix indiqués couvrent notre accompagnement (vérification du dossier, saisie, suivi). Les frais officiels exigés par certains pays peuvent varier selon votre nationalité et la période — notre équipe vous confirme le montant total exact avant tout paiement, sans surprise.',
    },
    {
      question: 'Combien de temps avant mon départ dois-je faire ma demande ?',
      answer: 'Nous recommandons de démarrer votre demande au moins 2 à 3 semaines avant votre date de voyage, pour absorber d\'éventuels délais de traitement ou compléments de dossier. Un traitement en urgence peut être possible selon le pays — demandez à notre équipe.',
    },
    {
      question: 'Que se passe-t-il si ma demande est refusée ?',
      answer: 'Un refus par les autorités du pays de destination reste possible, comme pour toute demande de visa. Notre équipe vérifie votre dossier en amont pour limiter ce risque, mais les frais consulaires déjà engagés ne sont généralement pas remboursables — nous vous en informons clairement avant la soumission.',
    },
    {
      question: 'Dois-je imprimer mon eVisa ?',
      answer: 'Cela dépend du pays. Certains exigent une copie imprimée à présenter à l\'arrivée, d\'autres vérifient électroniquement via votre passeport. Nous vous précisons cette information avec votre eVisa au moment de la réception.',
    },
    {
      question: 'Puis-je modifier mes dates de voyage après la demande ?',
      answer: 'Une fois l\'eVisa délivré, les dates de validité ne peuvent généralement plus être modifiées. Si vos dates ne sont pas encore fixées, indiquez-nous une fourchette approximative et confirmez-les avec notre équipe avant la soumission finale.',
    },
    {
      question: 'Mon pays de destination n\'est pas dans la liste, que faire ?',
      answer: 'Contactez-nous directement sur WhatsApp avec votre destination : de nombreux autres pays proposent un système eVisa et nous pouvons étudier votre demande au cas par cas.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 inline-block">
              <span className="px-4 py-2 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold">
                ✈️ Visa électronique
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              eVisa en Ligne
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Obtenez votre visa électronique rapidement, sans déplacement en ambassade, avec un accompagnement complet et sécurisé
            </p>

            <Link href="/evisa-demande">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              >
                Faire une demande d'eVisa
                <ArrowRight size={20} />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Le eVisa : une solution rapide et 100% en ligne
              </h2>
              <p className="text-gray-600 mb-4">
                Le visa électronique (eVisa) est une autorisation de voyage délivrée en ligne, sans besoin de se déplacer en ambassade ou consulat. Il permet d'entrer et de séjourner dans certains pays pour une durée déterminée.
              </p>
              <p className="text-gray-600 mb-6">
                Une fois approuvé, votre eVisa est généralement envoyé par email. Il suffit de l'imprimer ou de le présenter à l'arrivée selon les exigences du pays.
              </p>
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                <p className="text-gray-900 font-semibold">
                  ✓ Accompagnement complet
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Vérification du dossier, saisie des informations, suivi et assistance jusqu'à l'obtention de votre eVisa
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl"
            >
              <Globe size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-4">6 destinations disponibles</h3>
              <p className="mb-6">
                Et bien d'autres pays proposant le système eVisa sur simple demande
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Inde, Turquie, Égypte</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Vietnam, Laos, Bangladesh</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Autre destination ? Contactez-nous</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* eVisa Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Types d'eVisas disponibles
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12 max-w-2xl mx-auto">
            Durées et délais donnés à titre indicatif — ils varient selon votre nationalité et sont confirmés par notre équipe avant soumission de votre dossier.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evisaTypes.map((evisa, index) => (
              <motion.div
                key={evisa.country}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="text-4xl mb-4">{evisa.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {evisa.country}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{evisa.description}</p>

                  <div className="space-y-2 text-sm mb-4 flex-1">
                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Validité :</span> {evisa.validity}</p>
                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Entrées :</span> {evisa.entries}</p>
                    <p className="text-gray-600"><span className="font-semibold text-gray-800">Délai :</span> {evisa.processing}</p>
                  </div>

                  <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">À partir de</span>
                    <span className="text-lg font-bold text-blue-600">{evisa.price}</span>
                  </div>
                  <Link href="/evisa-demande">
                    <button className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
                      Demander
                    </button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Ce qu'il vous faut pour démarrer
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Préparez ces éléments avant de commencer votre demande — le formulaire ne prend que quelques minutes
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {requirements.map((req, index) => {
              const Icon = req.icon;
              return (
                <motion.div
                  key={req.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon className="text-blue-600" size={24} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{req.title}</h3>
                      <p className="text-gray-600 text-sm">{req.detail}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={22} />
            <p className="text-sm text-amber-800">
              Les documents supplémentaires (billet retour, réservation d'hôtel, preuve de fonds...) dépendent du pays et de votre nationalité. Notre équipe vous précise la liste exacte lors de la vérification de votre dossier.
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Comment ça marche : 4 étapes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="bg-white p-6 rounded-xl shadow-md h-full">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">
                      {step.number}
                    </div>
                    <Icon className="text-blue-600 mb-4" size={28} />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-1 bg-blue-300 transform -translate-y-1/2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Avantages du eVisa
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <Icon className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Questions fréquentes
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white border border-gray-200 rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold text-gray-900">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Besoin d'un eVisa ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Faites votre demande en ligne et recevez votre visa rapidement
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/evisa-demande">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
              >
                Faire une demande d'eVisa
                <ArrowRight size={20} />
              </motion.button>
            </Link>
            <a href="https://wa.me/237698104832?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20le%20service%20eVisa." target="_blank" rel="noopener noreferrer">
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
