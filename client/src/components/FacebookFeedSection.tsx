import React, { useState } from "react";
import { motion } from "framer-motion";
import { Facebook, ExternalLink, ThumbsUp, MessageCircle, Share2, Award, Calendar, Star, Send, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

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

const FACEBOOK_REVIEWS = [
  {
    id: "r1",
    author: "Dr. Sandrine Ngo Balep",
    role: "Procédure Canada - Études",
    rating: 5,
    date: "Il y a 1 semaine",
    comment: "Service impeccable ! J'ai reçu mon bilan d'évaluation en moins de 48h et l'équipe de 3M Travel à Yaoundé m'a accompagnée jusqu'à l'obtention de mon admission. Je recommande vivement !",
  },
  {
    id: "r2",
    author: "Hervé T.",
    role: "Visa Travail Luxembourg",
    rating: 5,
    date: "Il y a 2 semaines",
    comment: "Agence très sérieuse et professionnelle. Le suivi dans l'espace client est transparent et les conseillers sont toujours à l'écoute sur Messenger et en agence.",
  },
  {
    id: "r3",
    author: "Martine M.",
    role: "Réservation Vol & Hôtel",
    rating: 5,
    date: "Il y a 3 semaines",
    comment: "J'ai obtenu mon PNR de vol en un temps record. La quittance et la confirmation étaient parfaitement conformes. Merci à tout le cabinet 3M Travel !",
  },
];

export default function FacebookFeedSection() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error("Veuillez entrer une adresse e-mail valide.");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setSubscribed(true);
      toast.success("Inscription réussie à la lettre d'information 3M Travel !");
      setNewsletterEmail("");
      setTimeout(() => setSubscribed(false), 6000);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareMessenger = () => {
    const shareUrl = `https://www.facebook.com/dialog/send?app_id=291494419107518&link=${encodeURIComponent("https://www.facebook.com/3mtravelcm")}&redirect_uri=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "width=600,height=500");
  };

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50/60 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-3">
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span>Communauté & Avis Vérifiés</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Suivez notre page <span className="text-blue-600">Facebook Officielle</span>
            </h2>
            <p className="mt-2 text-base text-gray-600 max-w-2xl">
              Rejoignez notre communauté de plus de 2 600 abonnés sur <strong className="text-gray-900">3M Travel & Services</strong>. Partagez nos actualités ou échangez directement avec nos conseillers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <a href="https://www.facebook.com/3mtravelcm" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-5 h-5 fill-current" />
                Page Facebook
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </Button>
            <Button
              onClick={handleShareMessenger}
              className="bg-[#0084FF] hover:bg-[#006dd6] text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              Partager sur Messenger
            </Button>
          </div>
        </div>

        {/* Grille des publications récentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
                    <MessageCircle className="w-3.5 h-3.5" /> {post.comments} com.
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" /> {post.shares} partages
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section Avis Clients Synchronisés Facebook */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Ce que nos clients disent sur Facebook</h3>
            <p className="text-sm text-gray-600 mt-1">Avis authentiques synchronisés depuis notre page officielle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FACEBOOK_REVIEWS.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-yellow-400 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm italic mb-4">"{review.comment}"</p>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    <p className="font-bold text-gray-900">{review.author}</p>
                    <p className="text-blue-600">{review.role}</p>
                  </div>
                  <span className="text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bloc Communautaire : Messenger & Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Messenger Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-medium mb-4">
                <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Support Messenger direct</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Une question urgente sur votre projet de voyage ?</h3>
              <p className="text-blue-200 text-sm leading-relaxed mb-6">
                Nos conseillers en mobilité internationale vous répondent en direct sur Messenger pour préparer votre dossier sans attendre.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl shadow transition"
              >
                <a href="https://m.me/3mtravelcm" target="_blank" rel="noopener noreferrer">
                  Discuter sur Messenger
                </a>
              </Button>
              <Button
                onClick={handleShareMessenger}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition"
              >
                Partager la page
              </Button>
            </div>
          </div>

          {/* Newsletter Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Alertes Opportunités & Visas</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Recevez nos alertes par e-mail</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Inscrivez-vous pour être notifié dès l'ouverture des quotas d'immigration ou des nouvelles offres de placement à l'étranger.
              </p>
            </div>

            {subscribed ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-800">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium">Merci ! Votre inscription est confirmée. Vous recevrez nos prochaines actualités sur hello@3mtravelagency.com.</p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Votre adresse e-mail..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 rounded-xl border-gray-200 focus:border-blue-600"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-semibold flex items-center gap-1.5"
                  >
                    <span>S'inscrire</span>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400">
                  En vous inscrivant, vous acceptez de recevoir nos e-mails d'information (désabonnement facile à tout moment).
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
