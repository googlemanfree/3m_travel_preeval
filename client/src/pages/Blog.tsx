import { Card } from "@/components/ui/card";
import { Calendar, User, ArrowRight } from "lucide-react";

export function Blog() {
  const articles = [
    {
      id: 1,
      title: "Les 10 Erreurs à Éviter dans Votre Dossier de Visa Travail",
      excerpt: "Découvrez les erreurs les plus courantes qui peuvent retarder ou rejeter votre demande de visa travail.",
      author: "Marie Dupont",
      date: "15 Juillet 2024",
      category: "Conseils",
      image: "📋",
    },
    {
      id: 2,
      title: "Guide Complet : Visa Études en Australie 2024",
      excerpt: "Tout ce que vous devez savoir pour obtenir votre visa étudiant en Australie : conditions, documents, délais.",
      author: "Jean Martin",
      date: "10 Juillet 2024",
      category: "Guides",
      image: "🎓",
    },
    {
      id: 3,
      title: "Entretien Visa : Comment Réussir Votre Présentation",
      excerpt: "Conseils pratiques pour bien préparer votre entretien consulaire et maximiser vos chances de succès.",
      author: "Sophie Bernard",
      date: "5 Juillet 2024",
      category: "Conseils",
      image: "🎤",
    },
    {
      id: 4,
      title: "Pays Faciles pour Immigrer : Classement 2024",
      excerpt: "Classement des pays les plus accessibles pour l'immigration en 2024 selon les critères de facilité.",
      author: "Pierre Lefevre",
      date: "1 Juillet 2024",
      category: "Actualités",
      image: "🌍",
    },
    {
      id: 5,
      title: "Financer Votre Projet d'Études à l'Étranger",
      excerpt: "Découvrez les différentes sources de financement pour vos études internationales : bourses, prêts, etc.",
      author: "Isabelle Rousseau",
      date: "25 Juin 2024",
      category: "Guides",
      image: "💰",
    },
    {
      id: 6,
      title: "Changements Récents dans les Politiques de Visa 2024",
      excerpt: "Mise à jour des derniers changements dans les politiques de visa de plusieurs pays importants.",
      author: "Thomas Leclerc",
      date: "20 Juin 2024",
      category: "Actualités",
      image: "📰",
    },
  ];

  const categories = ["Tous", "Conseils", "Guides", "Actualités"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blog 3M Travel
          </h1>
          <p className="text-xl text-gray-600">
            Conseils, guides et actualités sur la mobilité internationale
          </p>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                idx === 0
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Article */}
        <Card className="mb-12 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="grid md:grid-cols-2 gap-6 p-8">
            <div className="text-6xl flex items-center justify-center">
              {articles[0].image}
            </div>
            <div className="flex flex-col justify-center">
              <span className="inline-block w-fit bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {articles[0].category}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {articles[0].title}
              </h2>
              <p className="text-gray-600 mb-6">{articles[0].excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {articles[0].author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {articles[0].date}
                </span>
              </div>
              <button className="w-fit bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                Lire l'article
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(1).map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="text-4xl mb-4">{article.image}</div>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium mb-3">
                  {article.category}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </span>
                </div>
                <button className="text-blue-600 font-medium text-sm hover:text-blue-700 flex items-center gap-1">
                  Lire plus
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-blue-600 text-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Restez Informé des Dernières Actualités
          </h2>
          <p className="mb-6 text-blue-100">
            Inscrivez-vous à notre newsletter pour recevoir nos conseils et actualités
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none"
            />
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              S'inscrire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
