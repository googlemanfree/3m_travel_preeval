import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      details: ['Yaoundé, Cameroun', 'Douala, Cameroun'],
      color: 'text-red-500',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      details: ['+237 698 104 832', '+237 620 996 045'],
      color: 'text-green-500',
      link: true,
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['contact@3mtravelagency.com', 'support@3mtravelagency.com'],
      color: 'text-blue-500',
      link: true,
    },
    {
      icon: Clock,
      title: 'Horaires',
      details: ['Lun-Ven: 8h00 - 20h00', 'Sam-Dim: 9h00 - 18h00'],
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

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

      {/* Google Maps Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Nos localisations
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Yaoundé Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-lg overflow-hidden shadow-lg"
            >
              <div className="bg-white p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Yaoundé</h3>
                <p className="text-sm text-gray-600 mb-4">Siège principal</p>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.7441234567890!2d11.5021!3d3.8667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwNTIwMDEuMiJOIDExwrMwMDA1OS4yIkU!5e0!3m2!1sfr!2scm!4v1234567890"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>

            {/* Douala Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-lg overflow-hidden shadow-lg"
            >
              <div className="bg-white p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Douala</h3>
                <p className="text-sm text-gray-600 mb-4">Bureau secondaire</p>
              </div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.7441234567890!2d9.7679!3d4.0511!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z0JDQu9C80LXQvdC40LXQvdC90LjRgdC60LDRgtC10YI!5e0!3m2!1sfr!2scm!4v1234567890"
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Votre nom"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      required
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
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre demande..."
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitted}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitted ? (
                    <>
                      <span>✓ Message envoyé</span>
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

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'WhatsApp',
                description: 'Discutez directement avec notre équipe',
                action: 'Ouvrir WhatsApp',
                link: 'https://wa.me/237698104832?text=Bonjour%203M%20Travel%20%26%20Services',
              },
              {
                icon: Phone,
                title: 'Appel direct',
                description: 'Parlez à un conseiller en temps réel',
                action: 'Appeler maintenant',
                link: 'tel:+237698104832',
              },
              {
                icon: Zap,
                title: 'Chat en ligne',
                description: 'Réponse instantanée de notre support',
                action: 'Démarrer le chat',
                link: '#',
              },
            ].map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                    <Icon className="text-blue-600 mx-auto mb-4" size={40} />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {option.description}
                    </p>
                    <a
                      href={option.link}
                      target={option.title === 'WhatsApp' ? '_blank' : undefined}
                      rel={option.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                      className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {option.action}
                    </a>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Questions fréquemment posées
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-md transition-all duration-300">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 ml-6">
                    <span className="text-blue-600 font-semibold">R: </span>
                    {faq.answer}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Response Time Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            ✓ Réponse rapide garantie
          </h3>
          <p className="text-blue-100 text-lg">
            Notre équipe s'engage à répondre à toutes vos demandes dans les 24 heures ouvrables.
          </p>
        </div>
      </section>
    </div>
  );
}
