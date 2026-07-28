import React from "react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Shield, Globe, FileText, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function Certifications() {
  const certifications = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Registre du Commerce (RCCM)",
      number: "RC/YAO/2019/A/2567",
      description: "Enregistrement officiel auprès des autorités camerounaises. Certifie notre légalité et notre capacité à exercer les activités d'agence de voyage.",
      date: "2015",
      status: "Actif",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Numéro d'Identification Unique (NIU)",
      number: "M112417203369H",
      description: "Identification fiscale et administrative. Garantit notre transparence fiscale et notre conformité aux normes gouvernementales.",
      date: "2015",
      status: "Actif",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Conformité RGPD",
      description: "Protection des données personnelles. Nous respectons les normes internationales de protection des données de nos clients.",
      date: "2020",
      status: "Actif",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Certification de Transparence",
      description: "Charte de transparence officielle. Engagement envers l'honnêteté, la clarté des tarifs et l'absence de frais cachés.",
      date: "2012",
      status: "Actif",
    },
  ];

  const partnerships = [
    {
      name: "Immigration, Réfugiés et Citoyenneté Canada",
      country: "🇨🇦",
      type: "Partenaire Officiel",
      description: "Partenariat pour les demandes de résidence permanente et permis de travail",
    },
    {
      name: "Ambassade de France au Cameroun",
      country: "🇫🇷",
      type: "Partenaire Consulaire",
      description: "Collaboration pour les visas Schengen et visas d'étude",
    },
    {
      name: "Consulat Général d'Allemagne",
      country: "🇩🇪",
      type: "Partenaire Officiel",
      description: "Partenariat pour les visas de travail et d'étude en Allemagne",
    },
    {
      name: "Ministère de l'Intérieur du Cameroun",
      country: "🇨🇲",
      type: "Partenaire Gouvernemental",
      description: "Collaboration avec les autorités pour les formalités administratives",
    },
  ];

  const services = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Assistance Visa",
      description: "Accompagnement complet pour toutes les demandes de visa",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Immigration Internationale",
      description: "Services d'immigration vers 30+ pays",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Support 24/7",
      description: "Assistance disponible 24 heures sur 24, 7 jours sur 7",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité Garantie",
      description: "Protection maximale de vos données personnelles",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Taux de Succès 98%",
      description: "Résultats garantis avec notre expertise",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Expertise Reconnue",
      description: "12 ans d'expérience dans le secteur",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Certifications & Accréditations
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              3M Travel & Services est une agence officielle certifiée, enregistrée et reconnue par les autorités compétentes. Découvrez nos certifications et nos partenariats.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            Nos Certifications Officielles
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                variants={fadeInUp}
                viewport={{ once: true }}
                custom={index}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-l-4 border-blue-600 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-blue-600 flex-shrink-0">
                    {cert.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {cert.title}
                    </h3>
                    {cert.number && (
                      <p className="text-sm text-blue-600 font-semibold mb-2">
                        {cert.number}
                      </p>
                    )}
                    <p className="text-gray-600 text-sm mb-4">
                      {cert.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Depuis {cert.date}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        {cert.status}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparence Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600"
          >
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Charte de Transparence
                </h3>
                <p className="text-gray-600 mb-4">
                  Notre rôle est d'accompagner la recherche d'employeur, la préparation technique du dossier et le suivi administratif. Nous ne délivrons pas nous-mêmes de visa ou de permis de travail — cette décision appartient exclusivement aux autorités compétentes de chaque pays d'accueil.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Tarifs clairs et transparents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Aucun frais caché</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Communication honnête et régulière</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Respect des délais annoncés</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partnerships Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            Nos Partenaires Officiels
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnerships.map((partner, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                variants={fadeInUp}
                viewport={{ once: true }}
                custom={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{partner.country}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-blue-600 font-semibold mb-2">
                      {partner.type}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {partner.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Certified Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-900 text-center mb-12"
          >
            Nos Services Certifiés
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                variants={fadeInUp}
                viewport={{ once: true }}
                custom={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-blue-600 mb-4">
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Besoin de Vérifier Nos Certifications ?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Contactez-nous pour obtenir des copies de nos certifications ou pour vérifier notre statut auprès des autorités.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-semibold">
                Nous Contacter
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 font-semibold">
                Évaluation Gratuite
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
