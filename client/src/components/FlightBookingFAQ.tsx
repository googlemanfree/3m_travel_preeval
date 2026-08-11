import { useState } from "react";
import { HelpCircle, ChevronDown, MessageSquare, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FaqItem {
  question: string;
  answer: string;
  category: "Réservation" | "Paiement" | "Agence";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "Réservation",
    question: "Comment rechercher et comparer des vols en temps réel ?",
    answer: "Rendez-vous sur notre page Vols dédiée. Saisissez votre aéroport de départ, votre destination, vos dates et le nombre de passagers. Notre moteur interroge instantanément Google Flights via SearchAPI pour vous présenter les meilleures offres, avec des filtres par escales et alliances aériennes.",
  },
  {
    category: "Réservation",
    question: "Puis-je m'envoyer le récapitulatif d'un vol par e-mail ?",
    answer: "Oui ! Sur chaque carte de vol, un bouton « S'envoyer par e-mail » vous permet de recevoir instantanément un récapitulatif complet des horaires, des compagnies et des prix directement dans votre boîte de réception via notre adresse officielle hello@3mtravelagency.com.",
  },
  {
    category: "Paiement",
    question: "Comment s'effectue le règlement des billets d'avion ?",
    answer: "Une fois votre vol sélectionné, vous pouvez contacter directement nos conseillers via le bouton WhatsApp intégré ou vous rendre en agence physique. Nos administrateurs valident votre PNR et vous accompagnent pour un paiement sécurisé (en ligne ou en agence).",
  },
  {
    category: "Agence",
    question: "Où puis-je retrouver l'historique de mes recherches de vols ?",
    answer: "Si vous disposez d'un compte candidat sur la plateforme, l'ensemble de vos recherches de vols est automatiquement sauvegardé dans votre Espace Personnel (« My Space »), vous permettant de retrouver vos itinéraires en un clic.",
  },
  {
    category: "Agence",
    question: "Comment contacter l'équipe 3M Travel en cas de besoin urgent ?",
    answer: "Notre support client est joignable 7j/7 par WhatsApp depuis les boutons flottants de la plateforme, ou par e-mail à hello@3mtravelagency.com. Notre assistant virtuel Aureol est également disponible pour répondre instantanément à vos questions 24h/24.",
  },
];

export function FlightBookingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const categories = ["Tous", "Réservation", "Paiement", "Agence"];

  const filteredItems = activeCategory === "Tous"
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-semibold tracking-wide uppercase shadow-sm">
          <HelpCircle className="w-3.5 h-3.5" />
          Foire Aux Questions
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Tout ce que vous devez savoir sur nos services de voyage
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Consultez les réponses aux questions les plus fréquentes concernant la recherche de vols, l'envoi de récapitulatifs et l'accompagnement par nos experts.
        </p>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card
              key={item.question}
              className={`glass-card transition-all duration-300 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden ${
                isOpen ? "ring-2 ring-blue-500/30 bg-white/90 dark:bg-slate-900/90" : "hover:bg-white/60 dark:hover:bg-slate-900/60"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {item.question}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hidden sm:inline-block">
                    {item.category}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${
                      isOpen ? "transform rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <CardContent className="px-5 pb-5 pt-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mt-2 pt-4 animate-fadeIn">
                  <p>{item.answer}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bannière de contact rapide sous la FAQ */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 text-center sm:text-left relative z-10">
          <h3 className="text-lg font-bold">Vous avez une autre question spécifique ?</h3>
          <p className="text-blue-200 text-sm">Nos conseillers et notre assistant Aureol sont à votre écoute pour vous répondre.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10 flex-wrap justify-center">
          <Button
            onClick={() => window.open("https://wa.me/237600000000?text=Bonjour%203M%20Travel,%20j'ai%20une%20question%20concernant%20vos%20services.", "_blank")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp direct
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = "mailto:hello@3mtravelagency.com"}
            className="border-white/30 text-white hover:bg-white/10 gap-2 font-semibold bg-transparent"
          >
            <Mail className="w-4 h-4" />
            hello@3mtravelagency.com
          </Button>
        </div>
      </div>
    </section>
  );
}
