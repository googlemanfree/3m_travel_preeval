import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Search, MessageCircle, Globe } from "lucide-react";

const WHATSAPP_NUMBER = "237698104832";

// ─── Données passeport camerounais (Source : Passport Index 2026) ─────────────

interface Country {
  name: string;
  code: string; // ISO 3166-1 alpha-2 pour flagcdn.com
  slug?: string;
}

const VISA_FREE: Country[] = [
  { name: "Barbade", code: "bb" },
  { name: "Bénin", code: "bj" },
  { name: "Rép. Centrafricaine", code: "cf" },
  { name: "Tchad", code: "td" },
  { name: "Congo-Brazzaville", code: "cg" },
  { name: "Îles Cook", code: "ck" },
  { name: "Dominique", code: "dm" },
  { name: "Guinée Équatoriale", code: "gq" },
  { name: "Gabon", code: "ga" },
  { name: "Gambie", code: "gm" },
  { name: "Grenade", code: "gd" },
  { name: "Haïti", code: "ht" },
  { name: "Kenya", code: "ke" },
  { name: "Kiribati", code: "ki" },
  { name: "Mali", code: "ml" },
  { name: "Micronésie", code: "fm" },
  { name: "Montserrat", code: "ms" },
  { name: "Nigeria", code: "ng" },
  { name: "Philippines", code: "ph" },
  { name: "Rwanda", code: "rw" },
  { name: "Singapour", code: "sg" },
  { name: "Vanuatu", code: "vu" },
];

const VISA_ON_ARRIVAL: Country[] = [
  { name: "Comores", code: "km" },
  { name: "Djibouti", code: "dj" },
  { name: "Éthiopie", code: "et" },
  { name: "Guinée-Bissau", code: "gw" },
  { name: "Iran", code: "ir" },
  { name: "Jamaïque", code: "jm" },
  { name: "Laos", code: "la" },
  { name: "Macao", code: "mo" },
  { name: "Madagascar", code: "mg" },
  { name: "Maldives", code: "mv" },
  { name: "Mauritanie", code: "mr" },
  { name: "Mozambique", code: "mz" },
  { name: "Népal", code: "np" },
  { name: "Niue", code: "nu" },
  { name: "Palau", code: "pw" },
  { name: "Samoa", code: "ws" },
  { name: "Seychelles", code: "sc" },
  { name: "Sierra Leone", code: "sl" },
  { name: "Somalie", code: "so" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Togo", code: "tg" },
  { name: "Tuvalu", code: "tv" },
  { name: "Ouganda", code: "ug" },
  { name: "Zimbabwe", code: "zw" },
];

const E_VISA: Country[] = [
  { name: "Albanie", code: "al" },
  { name: "Arménie", code: "am" },
  { name: "Azerbaïdjan", code: "az" },
  { name: "Bahreïn", code: "bh" },
  { name: "Bélarus", code: "by" },
  { name: "Belize", code: "bz" },
  { name: "Bhoutan", code: "bt" },
  { name: "Bolivie", code: "bo" },
  { name: "Cambodge", code: "kh" },
  { name: "Cap-Vert", code: "cv" },
  { name: "Côte d'Ivoire", code: "ci" },
  { name: "Cuba", code: "cu" },
  { name: "Égypte", code: "eg" },
  { name: "Géorgie", code: "ge" },
  { name: "Ghana", code: "gh" },
  { name: "Inde", code: "in" },
  { name: "Indonésie", code: "id" },
  { name: "Kazakhstan", code: "kz" },
  { name: "Kirghizistan", code: "kg" },
  { name: "Koweït", code: "kw" },
  { name: "Lesotho", code: "ls" },
  { name: "Libéria", code: "lr" },
  { name: "Malaisie", code: "my" },
  { name: "Mexique", code: "mx" },
  { name: "Moldavie", code: "md" },
  { name: "Mongolie", code: "mn" },
  { name: "Myanmar", code: "mm" },
  { name: "Namibie", code: "na" },
  { name: "Nicaragua", code: "ni" },
  { name: "Oman", code: "om" },
  { name: "Pakistan", code: "pk" },
  { name: "Qatar", code: "qa" },
  { name: "Arabie Saoudite", code: "sa" },
  { name: "Sénégal", code: "sn" },
  { name: "Taïwan", code: "tw" },
  { name: "Tanzanie", code: "tz" },
  { name: "Thaïlande", code: "th" },
  { name: "Turquie", code: "tr" },
  { name: "Ukraine", code: "ua" },
  { name: "Émirats Arabes Unis", code: "ae" },
  { name: "Ouzbékistan", code: "uz" },
  { name: "Vietnam", code: "vn" },
  { name: "Zambie", code: "zm" },
  { name: "Zimbabwe", code: "zw" },
  { name: "Suriname", code: "sr" },
  { name: "Tadjikistan", code: "tj" },
  { name: "Tunisie", code: "tn" },
  { name: "Maroc", code: "ma" },
  { name: "Jordanie", code: "jo" },
  { name: "Irak", code: "iq" },
  { name: "Éthiopie", code: "et" },
];

// Pour "Visa Requis", on liste les principales destinations demandées
const VISA_REQUIRED_SAMPLE: Country[] = [
  { name: "Canada", code: "ca" },
  { name: "France", code: "fr" },
  { name: "États-Unis", code: "us" },
  { name: "Royaume-Uni", code: "gb" },
  { name: "Allemagne", code: "de" },
  { name: "Espagne", code: "es" },
  { name: "Italie", code: "it" },
  { name: "Belgique", code: "be" },
  { name: "Pays-Bas", code: "nl" },
  { name: "Suisse", code: "ch" },
  { name: "Portugal", code: "pt" },
  { name: "Pologne", code: "pl" },
  { name: "Australie", code: "au" },
  { name: "Japon", code: "jp" },
  { name: "Corée du Sud", code: "kr" },
  { name: "Chine", code: "cn" },
  { name: "Brésil", code: "br" },
  { name: "Argentine", code: "ar" },
  { name: "Afrique du Sud", code: "za" },
  { name: "Dubaï (EAU)", code: "ae" },
  { name: "Russie", code: "ru" },
  { name: "Suède", code: "se" },
  { name: "Norvège", code: "no" },
  { name: "Danemark", code: "dk" },
  { name: "Finlande", code: "fi" },
  { name: "Autriche", code: "at" },
  { name: "Grèce", code: "gr" },
  { name: "Irlande", code: "ie" },
  { name: "Luxembourg", code: "lu" },
  { name: "Nouvelle-Zélande", code: "nz" },
  { name: "Canada (Québec)", code: "ca" },
  { name: "Mexique", code: "mx" },
  { name: "Chili", code: "cl" },
  { name: "Colombie", code: "co" },
  { name: "Pérou", code: "pe" },
  { name: "Maroc", code: "ma" },
  { name: "Algérie", code: "dz" },
  { name: "Tunisie", code: "tn" },
  { name: "Égypte", code: "eg" },
  { name: "Éthiopie", code: "et" },
  { name: "Sénégal", code: "sn" },
  { name: "Côte d'Ivoire", code: "ci" },
  { name: "Ghana", code: "gh" },
  { name: "Inde", code: "in" },
  { name: "Thaïlande", code: "th" },
  { name: "Vietnam", code: "vn" },
  { name: "Singapour", code: "sg" },
  { name: "Malaisie", code: "my" },
  { name: "Indonésie", code: "id" },
  { name: "Philippines", code: "ph" },
  { name: "Émirats Arabes Unis", code: "ae" },
  { name: "Arabie Saoudite", code: "sa" },
  { name: "Qatar", code: "qa" },
  { name: "Koweït", code: "kw" },
  { name: "Bahreïn", code: "bh" },
  { name: "Oman", code: "om" },
  { name: "Turquie", code: "tr" },
  { name: "Israël", code: "il" },
  { name: "Liban", code: "lb" },
  { name: "Jordanie", code: "jo" },
  { name: "Ukraine", code: "ua" },
  { name: "Pologne", code: "pl" },
  { name: "République Tchèque", code: "cz" },
  { name: "Hongrie", code: "hu" },
  { name: "Roumanie", code: "ro" },
  { name: "Bulgarie", code: "bg" },
  { name: "Croatie", code: "hr" },
  { name: "Slovaquie", code: "sk" },
  { name: "Slovénie", code: "si" },
  { name: "Estonie", code: "ee" },
  { name: "Lettonie", code: "lv" },
  { name: "Lituanie", code: "lt" },
  { name: "Islande", code: "is" },
  { name: "Malte", code: "mt" },
  { name: "Chypre", code: "cy" },
  { name: "Canada (Colombie-Brit.)", code: "ca" },
  { name: "Canada (Ontario)", code: "ca" },
  { name: "Canada (Alberta)", code: "ca" },
  { name: "Canada (Manitoba)", code: "ca" },
  { name: "Canada (Saskatchewan)", code: "ca" },
  { name: "Canada (Nouvelle-Écosse)", code: "ca" },
  { name: "Canada (Nouveau-Brunswick)", code: "ca" },
  { name: "Canada (Île-du-Prince-Édouard)", code: "ca" },
  { name: "Canada (Terre-Neuve)", code: "ca" },
  { name: "Canada (Territoires)", code: "ca" },
  { name: "États-Unis (Green Card)", code: "us" },
  { name: "Mexique (Résidence)", code: "mx" },
  { name: "Brésil (Résidence)", code: "br" },
  { name: "Argentine (Résidence)", code: "ar" },
  { name: "Chili (Résidence)", code: "cl" },
  { name: "Pérou (Résidence)", code: "pe" },
  { name: "Colombie (Résidence)", code: "co" },
  { name: "Équateur", code: "ec" },
  { name: "Bolivie", code: "bo" },
  { name: "Paraguay", code: "py" },
  { name: "Uruguay", code: "uy" },
  { name: "Venezuela", code: "ve" },
  { name: "Guyana", code: "gy" },
  { name: "Suriname", code: "sr" },
  { name: "Trinité-et-Tobago", code: "tt" },
  { name: "Cuba", code: "cu" },
  { name: "République Dominicaine", code: "do" },
  { name: "Haïti", code: "ht" },
  { name: "Porto Rico (USA)", code: "us" },
  { name: "Jamaïque", code: "jm" },
  { name: "Bahamas", code: "bs" },
  { name: "Belize", code: "bz" },
  { name: "Guatemala", code: "gt" },
  { name: "Honduras", code: "hn" },
  { name: "El Salvador", code: "sv" },
  { name: "Costa Rica", code: "cr" },
  { name: "Panama", code: "pa" },
  { name: "Nicaragua", code: "ni" },
  { name: "Cambodge", code: "kh" },
  { name: "Myanmar", code: "mm" },
  { name: "Laos", code: "la" },
  { name: "Mongolie", code: "mn" },
  { name: "Kazakhstan", code: "kz" },
  { name: "Ouzbékistan", code: "uz" },
  { name: "Kirghizistan", code: "kg" },
  { name: "Tadjikistan", code: "tj" },
  { name: "Turkménistan", code: "tm" },
  { name: "Afghanistan", code: "af" },
  { name: "Pakistan", code: "pk" },
  { name: "Bangladesh", code: "bd" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Népal", code: "np" },
  { name: "Bhoutan", code: "bt" },
  { name: "Maldives", code: "mv" },
  { name: "Papouasie-Nouvelle-Guinée", code: "pg" },
  { name: "Fidji", code: "fj" },
  { name: "Tonga", code: "to" },
  { name: "Samoa", code: "ws" },
  { name: "Tuvalu", code: "tv" },
  { name: "Nauru", code: "nr" },
  { name: "Palau", code: "pw" },
  { name: "Îles Marshall", code: "mh" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Brunei", code: "bn" },
];

// ─── Composant drapeau + pays ─────────────────────────────────────────────────

function CountryFlag({ country }: { country: Country }) {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Bonjour 3M Travel, je souhaite obtenir des informations sur le visa pour ${country.name}. Pouvez-vous m'aider ?`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
    >
      <img
        src={`https://flagcdn.com/w40/${country.code}.png`}
        alt={`Drapeau ${country.name}`}
        width={28}
        height={20}
        className="rounded-sm shadow-sm object-cover"
        loading="lazy"
      />
      <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors">{country.name}</span>
    </a>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

type Tab = "visa-free" | "visa-on-arrival" | "e-visa" | "visa-required";

const TABS: { id: Tab; label: string; count: number; color: string; bg: string }[] = [
  { id: "visa-free", label: "Sans Visa", count: 22, color: "text-green-700", bg: "bg-green-600" },
  { id: "visa-on-arrival", label: "Visa à l'arrivée", count: 25, color: "text-blue-700", bg: "bg-blue-600" },
  { id: "e-visa", label: "E-Visa", count: 51, color: "text-orange-700", bg: "bg-orange-500" },
  { id: "visa-required", label: "Visa Requis", count: 133, color: "text-red-700", bg: "bg-red-600" },
];

const TAB_DATA: Record<Tab, Country[]> = {
  "visa-free": VISA_FREE,
  "visa-on-arrival": VISA_ON_ARRIVAL,
  "e-visa": E_VISA,
  "visa-required": VISA_REQUIRED_SAMPLE,
};

export default function PasseportIndex() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("visa-free");
  const [search, setSearch] = useState("");

  const countries = useMemo(() => {
    const list = TAB_DATA[activeTab];
    if (!search.trim()) return list;
    return list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeTab, search]);

  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-20 text-center"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1544983636-6e27b1022830?auto=format&fit=crop&w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative container mx-auto px-4">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
            📅 Index Passeport 2026 — Mise à jour Juillet 2026
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Passeport <span className="text-green-400">Camerounais</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Découvrez les 231 destinations accessibles et les conditions de visa pour le passeport camerounais.
          </p>
        </div>
      </section>

      {/* Compteurs */}
      <section className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                className={`py-6 px-4 text-center transition-all border-b-4 ${activeTab === tab.id ? `border-white ${tab.color} bg-white/10` : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <div className={`text-4xl font-black ${activeTab === tab.id ? "text-white" : ""}`}>
                  {tab.count}
                </div>
                <div className="text-sm font-semibold mt-1 uppercase tracking-wide">{tab.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">Voir la liste</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="bg-white text-gray-900">
        <div className="container mx-auto px-4 py-10">
          {/* Titre + recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {activeTabInfo.label}
                <span className="ml-2 text-lg font-normal text-gray-500">({activeTabInfo.count} pays)</span>
              </h2>
              {activeTab === "visa-free" && (
                <p className="text-sm text-gray-500 mt-1">Entrée libre sans visa requis pour les titulaires du passeport camerounais.</p>
              )}
              {activeTab === "visa-on-arrival" && (
                <p className="text-sm text-gray-500 mt-1">Visa obtenu directement à l'aéroport ou au port d'entrée.</p>
              )}
              {activeTab === "e-visa" && (
                <p className="text-sm text-gray-500 mt-1">Visa électronique à demander en ligne avant le voyage.</p>
              )}
              {activeTab === "visa-required" && (
                <p className="text-sm text-gray-500 mt-1">Visa obligatoire à obtenir à l'ambassade avant le départ. Cliquez sur un pays pour nous contacter.</p>
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <Input
                placeholder="Rechercher un pays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Grille des pays */}
          {countries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
              {countries.map((country, i) => (
                <CountryFlag key={`${country.code}-${i}`} country={country} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Globe size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucun pays trouvé pour "{search}"</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-white py-12 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-black mb-3">Envie de voyager sans contraintes ?</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Nos experts analysent votre profil pour trouver les meilleures destinations adaptées à votre passeport et budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour 3M Travel, je souhaite une analyse de mon profil passeport pour identifier les meilleures destinations. Pouvez-vous m'aider ?")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <MessageCircle size={18} />
              Demander une analyse
            </a>
            <Button
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 py-3 px-6 rounded-xl"
              onClick={() => navigate("/services")}
            >
              Voir nos services
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
