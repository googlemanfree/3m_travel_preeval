import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Avis() {
  const testimonials = [
    {
      name: "Aminata Diallo",
      country: "Sénégal",
      visa: "Visa Travail - Canada",
      rating: 5,
      text: "3M Travel a rendu mon processus de visa tellement plus facile. L'évaluation gratuite m'a donné confiance et l'équipe a été très professionnelle tout au long.",
      image: "👩",
    },
    {
      name: "Jean-Pierre Mbongo",
      country: "Cameroun",
      visa: "Visa Études - Australie",
      rating: 5,
      text: "Excellent service ! Ils m'ont aidé à préparer tous mes documents et j'ai obtenu mon visa en 3 mois. Très recommandé !",
      image: "👨",
    },
    {
      name: "Fatima Hassan",
      country: "Mali",
      visa: "Visa Visiteur - France",
      rating: 5,
      text: "L'équipe de 3M Travel est très attentive et réactive. Ils répondent à toutes les questions et guident à chaque étape.",
      image: "👩",
    },
    {
      name: "Kofi Mensah",
      country: "Ghana",
      visa: "Visa Travail - Allemagne",
      rating: 5,
      text: "Processus transparent et professionnel. Je recommande vivement 3M Travel à tous ceux qui cherchent de l'aide pour leur visa.",
      image: "👨",
    },
    {
      name: "Zainab Ahmed",
      country: "Somalie",
      visa: "Visa Études - Royaume-Uni",
      rating: 5,
      text: "Merci à 3M Travel pour leur aide inestimable. Mon dossier a été accepté du premier coup !",
      image: "👩",
    },
    {
      name: "Pierre Dubois",
      country: "Côte d'Ivoire",
      visa: "Visa Travail - Suisse",
      rating: 5,
      text: "Service de qualité, équipe compétente et résultats rapides. Je suis très satisfait de mon expérience.",
      image: "👨",
    },
  ];

  const stats = [
    { label: "Dossiers Traités", value: "+1500" },
    { label: "Taux de Succès", value: "98%" },
    { label: "Clients Satisfaits", value: "4.9/5" },
    { label: "Délai Moyen", value: "48h" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Avis de Nos Clients
          </h1>
          <p className="text-xl text-gray-600">
            Découvrez ce que nos clients disent de leur expérience avec 3M Travel
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, idx) => (
            <Card key={idx} className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-3xl mb-2">{testimonial.image}</div>
                  <h3 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-gray-600">{testimonial.country}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {testimonial.visa}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {Array(testimonial.rating)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                "{testimonial.text}"
              </p>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à commencer votre parcours ?
          </h2>
          <p className="text-gray-600 mb-6">
            Rejoignez des milliers de clients satisfaits qui ont réalisé leurs rêves de mobilité internationale
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Commencer l'Évaluation Gratuite
          </button>
        </div>
      </div>
    </div>
  );
}
