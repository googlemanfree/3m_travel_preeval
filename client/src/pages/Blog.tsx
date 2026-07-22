import { useState } from "react";
import { Search, Calendar, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ARTICLES = [
  {
    id: 1,
    title: "TCF Canada 2026 : Guide Complet et Conseils",
    category: "Tests de Langue",
    author: "3M Travel",
    date: "22 juillet 2026",
    excerpt: "Tout ce que vous devez savoir sur le TCF Canada : structure, scoring, préparation et conseils d'experts.",
    content: `Le TCF Canada est le test de français officiel reconnu par Immigration, Réfugiés et Citoyenneté Canada (IRCC). Découvrez comment vous préparer efficacement...`,
  },
  {
    id: 2,
    title: "TEF vs TCF : Quelle est la différence ?",
    category: "Tests de Langue",
    author: "3M Travel",
    date: "20 juillet 2026",
    excerpt: "Comparaison détaillée entre le TEF et le TCF pour choisir le bon test selon votre destination.",
    content: `Le TEF et le TCF sont deux tests de français reconnus internationalement. Voici les différences clés...`,
  },
  {
    id: 3,
    title: "Express Entry 2026 : Nouvelles Règles et Stratégies",
    category: "Immigration Canada",
    author: "3M Travel",
    date: "18 juillet 2026",
    excerpt: "Les dernières mises à jour du système Express Entry et comment optimiser votre profil.",
    content: `Express Entry a connu plusieurs changements en 2026. Voici ce que vous devez savoir...`,
  },
  {
    id: 4,
    title: "Visa Schengen depuis le Cameroun : Processus Complet",
    category: "Visa Europe",
    author: "3M Travel",
    date: "15 juillet 2026",
    excerpt: "Guide étape par étape pour obtenir un visa Schengen depuis le Cameroun.",
    content: `Obtenir un visa Schengen depuis le Cameroun nécessite une préparation minutieuse...`,
  },
  {
    id: 5,
    title: "Chancenkarte Allemagne : Opportunité pour les Travailleurs",
    category: "Visa Europe",
    author: "3M Travel",
    date: "12 juillet 2026",
    excerpt: "La Chancenkarte allemande offre de nouvelles opportunités pour les travailleurs étrangers.",
    content: `La Chancenkarte est un nouveau visa de travail allemand lancé en 2024...`,
  },
  {
    id: 6,
    title: "IELTS vs TOEFL : Quel Test Choisir ?",
    category: "Tests de Langue",
    author: "3M Travel",
    date: "10 juillet 2026",
    excerpt: "Comparaison complète entre l'IELTS et le TOEFL pour votre candidature.",
    content: `L'IELTS et le TOEFL sont les deux tests d'anglais les plus reconnus...`,
  },
  {
    id: 7,
    title: "TCF Québec : Guide Complet pour les Immigrants",
    category: "Immigration Canada",
    author: "3M Travel",
    date: "8 juillet 2026",
    excerpt: "Tout sur le TCF Québec et comment l'utiliser pour votre immigration au Québec.",
    content: `Le TCF Québec est obligatoire pour l'immigration au Québec...`,
  },
  {
    id: 8,
    title: "Cours de Français à Yaoundé et Douala : Où S'Inscrire ?",
    category: "Conseils Pratiques",
    author: "3M Travel",
    date: "5 juillet 2026",
    excerpt: "Les meilleurs centres de formation en français à Yaoundé et Douala.",
    content: `Si vous avez besoin d'améliorer votre français avant un test...`,
  },
  {
    id: 9,
    title: "DELF et DALF : Certifications Officielles de Français",
    category: "Tests de Langue",
    author: "3M Travel",
    date: "2 juillet 2026",
    excerpt: "Guide complet sur les certifications DELF et DALF reconnues mondialement.",
    content: `Le DELF et le DALF sont des certifications officielles du français...`,
  },
  {
    id: 10,
    title: "AVI : Guide Complet de l'Attestation Bancaire",
    category: "Conseils Pratiques",
    author: "3M Travel",
    date: "30 juin 2026",
    excerpt: "Tout ce que vous devez savoir sur l'AVI pour votre visa étudiant.",
    content: `L'AVI est une attestation bancaire obligatoire pour les visas étudiants...`,
  },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  const categories = ["Tests de Langue", "Immigration Canada", "Visa Europe", "Conseils Pratiques"];

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedArticleData = selectedArticle ? ARTICLES.find((a) => a.id === selectedArticle) : null;

  if (selectedArticleData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
            >
              ← Retour au blog
            </button>

            <article>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
                  {selectedArticleData.category}
                </span>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">{selectedArticleData.title}</h1>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedArticleData.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedArticleData.date}
                  </span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p>{selectedArticleData.content}</p>
                <p className="mt-6 text-gray-600">
                  Cet article est un aperçu. Pour plus de détails, contactez notre équipe d'experts via WhatsApp.
                </p>
              </div>

              <div className="mt-12 p-6 bg-blue-50 rounded-lg text-center">
                <p className="text-gray-700 mb-4">Besoin de plus d'informations ?</p>
                <a
                  href="https://wa.me/237698104832"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  💬 Contacter un expert
                </a>
              </div>
            </article>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Conseils</h1>
          <p className="text-lg text-blue-100">Guides complets, conseils d'experts et actualités immigration</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Recherche et filtres */}
          <div className="mb-12 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                  selectedCategory === null
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article.id)}
                className="text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold mb-3">
                    {article.category}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.author}</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Aucun article trouvé.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
