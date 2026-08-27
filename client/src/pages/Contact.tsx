import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Zap, AlertCircle, CheckCircle, Facebook } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatModal } from '@/components/ChatModal';
import OfficeContactPanel from '@/components/OfficeContactPanel';
import { trpc } from '@/lib/trpc';
import { COMPANY_PROFILE } from '@/lib/companyContacts';
import { officeMapEmbedUrl, officeMapsUrl } from '@/lib/officeContacts';

export default function Contact() {
  const cameroon = COMPANY_PROFILE.offices.cameroon;
  const ottawa = COMPANY_PROFILE.offices.ottawa;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendContactEmailMutation = trpc.contact.sendContactEmail.useMutation();

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      details: [cameroon.addressLines.join(', '), ottawa.addressLines.join(', ')],
      color: 'text-red-500',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      details: [cameroon.whatsappDisplay, cameroon.phoneDisplay ?? ottawa.whatsappDisplay],
      color: 'text-green-500',
      link: true,
    },
    {
      icon: Mail,
      title: 'Email',
      details: [COMPANY_PROFILE.publicEmail],
      color: 'text-blue-500',
      link: true,
    },
    {
      icon: Clock,
      title: 'Horaires',
      details: [...cameroon.openingHours],
      color: 'text-purple-500',
    },
  ];

  const faqs = [
    {
      question: 'Quel est le délai de réponse ?',
      answer: 'Notre équipe répond à toutes les demandes dans les 24 heures ouvrables.',
    },
    {
      question: 'Puis-je appeler directement ?',
      answer: 'Oui, nos conseillers sont disponibles par téléphone du lundi au dimanche.',
    },
    {
      question: 'Proposez-vous des consultations en ligne ?',
      answer: 'Absolument ! Nous proposons des consultations vidéo et WhatsApp.',
    },
    {
      question: 'Comment suivre mon dossier ?',
      answer: 'Connectez-vous à votre espace client pour un suivi en temps réel.',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendContactEmailMutation.mutateAsync(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Nous contacter
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Notre équipe est à votre disposition pour répondre à vos questions et vous accompagner dans vos démarches de visas, eVisas, légalisations, traductions et assurances voyage.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10" />
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <OfficeContactPanel />
        </div>
      </section>

      {/* Google Maps Section */}
      <section id="carte-yaounde" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Nos localisations
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte du bureau principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-lg overflow-hidden shadow-lg"
            >
              <div className="bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Bureau principal</p>
                <h3 className="mt-1 text-lg font-bold text-gray-900 mb-2">Carte interactive — {cameroon.shortLabel}</h3>
                <p className="text-sm text-gray-600 mb-4">{cameroon.label}</p>
              </div>
              <iframe
                src={officeMapEmbedUrl({ id: "cameroon", ...cameroon })}
                title={`Carte interactive du ${cameroon.label}`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="bg-white px-4 pb-4">
                <a href={officeMapsUrl({ id: "cameroon", ...cameroon })} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Ouvrir l’itinéraire vers Yaoundé</a>
              </div>
            </motion.div>

            {/* Carte du bureau Ottawa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-lg overflow-hidden shadow-lg"
            >
              <div className="bg-white p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{ottawa.shortLabel}</h3>
                <p className="text-sm text-gray-600 mb-4">{ottawa.label}</p>
              </div>
              <iframe
                src={officeMapEmbedUrl({ id: "ottawa", ...ottawa })}
                title={`Carte interactive du ${ottawa.label}`}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                    <Icon className={`${info.color} mb-4`} size={32} />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {info.title}
                    </h3>
                    <div className="space-y-2">
                      {info.details.map((detail, idx) => (
                        <div key={idx}>
                          {info.link && info.title === 'Téléphone' ? (
                            <a
                              href={`tel:${detail.replace(/\s/g, '')}`}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              {detail}
                            </a>
                          ) : info.link && info.title === 'Email' ? (
                            <a
                              href={`mailto:${detail}`}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              {detail}
                            </a>
                          ) : (
                            <p className="text-gray-600">{detail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Envoyez-nous un message
            </h2>

            <Card className="p-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"
                >
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-800">{error}</p>
                </motion.div>
              )}

              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"
                >
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-green-800 font-semibold">Message envoyé avec succès!</p>
                    <p className="text-green-700 text-sm">Vous recevrez une réponse dans les 24 heures.</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+237 6XX XXX XXX"
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet *
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      required
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre demande..."
                    required
                    disabled={isLoading}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitted || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitted ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Message envoyé</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </motion.button>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Autres moyens de nous contacter
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Facebook Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 border-blue-100 bg-blue-50/30">
                <Facebook className="text-blue-600 mx-auto mb-4" size={40} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Page Facebook</h3>
                <p className="text-gray-600 mb-6 text-sm">Suivez notre actualité et nos offres</p>
                <a
                  href="https://www.facebook.com/3mtravelcm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#0b2f6b] !text-white px-6 py-2 rounded-lg hover:bg-[#08244f] transition-colors text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2f6b]"
                >
                  Visiter Facebook
                </a>
              </Card>
            </motion.div>

            {/* WhatsApp Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <MessageSquare className="text-blue-600 mx-auto mb-4" size={40} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 mb-6">Discutez directement avec notre équipe</p>
                <a
                  href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%20%26%20Services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#0f6b46] text-white px-6 py-2 rounded-lg hover:bg-[#0b5538] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b46]"
                >
                  Ouvrir WhatsApp
                </a>
              </Card>
            </motion.div>

            {/* Phone Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <Phone className="text-green-600 mx-auto mb-4" size={40} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Appel Direct</h3>
                <p className="text-gray-600 mb-6">Appelez nos conseillers</p>
                <a
                  href="tel:+237698104832"
                  className="inline-block bg-[#0b2f6b] !text-white px-6 py-2 rounded-lg hover:bg-[#08244f] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2f6b]"
                >
                  +237 698 104 832
                </a>
              </Card>
            </motion.div>

            {/* Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                <Zap className="text-purple-600 mx-auto mb-4" size={40} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Chat en Ligne</h3>
                <p className="text-gray-600 mb-6">Démarrer une conversation</p>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Démarrer le chat
                </button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Modal */}
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
