import React from "react";
import { motion } from "framer-motion";
import { Facebook, ExternalLink, ThumbsUp, MessageCircle, Share2, Award, Calendar } from "lucide-react";
import { Button } from "./ui/button";

const MOCK_FB_POSTS = [
  {
    id: "1",
    date: "Il y a 2 jours",
    content: "Félicitations à notre candidat M. Kamga pour l'obtention de son visa pour le Canada (Entrée Express) ! Votre avenir commence ici avec 3M Travel & Services.",
    likes: "142",
    comments: "28",
    shares: "15",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "2",
    date: "Il y a 5 jours",
    content: "Opportunités d'emploi et procédures simplifiées pour le Luxembourg et l'Allemagne. Venez évaluer votre profil gratuitement dans notre agence de Yaoundé (Biyem-Assi) ou directement sur notre site !",
    likes: "98",
    comments: "19",
    shares: "22",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "3",
    date: "Il y a 1 semaine",
    content: "Rappel important : notre équipe reste mobilisée pour traiter vos demandes de réservation de billets d'avion et d'hôtels avec PNR original garanti en 48h.",
    likes: "215",
    comments: "45",
    shares: "34",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600",
  },
];

export default function FacebookFeedSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-3">
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span>Communauté & Actualités</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Suivez nos actualités sur <span className="text-blue-600">Facebook</span>
            </h2>
            <p className="mt-2 text-base text-gray-600 max-w-2xl">
              Rejoignez notre communauté de plus de 2 600 abonnés sur notre page officielle <strong className="text-gray-900">3M Travel & Services</strong> pour ne rien rater des nouvelles opportunités de visa et d'immigration.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2"
            >
              <a href="https://www.facebook.com/3mtravelcm" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-5 h-5 fill-current" />
                Visiter notre page Facebook
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
          </div>
        </div>

        {/* Grille des publications récentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_FB_POSTS.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={post.image}
                  alt="Publication 3M Travel"
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                  <Facebook className="w-3 h-3 fill-current" />
                  <span>3M Travel & Services</span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{post.date}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    {post.content}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <ThumbsUp className="w-3.5 h-3.5" /> {post.likes} J'aime
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments} commentaires
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> {post.shares} partages
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bannière de contact rapide Facebook */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Une question urgente ? Contactez-nous sur Facebook Messenger
            </h3>
            <p className="text-blue-200 text-sm">
              Nos conseillers vous répondent en moins de 30 minutes sur notre page officielle.
            </p>
          </div>
          <Button
            asChild
            className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl shadow transition whitespace-nowrap"
          >
            <a href="https://m.me/3mtravelcm" target="_blank" rel="noopener noreferrer">
              Envoyer un message
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
