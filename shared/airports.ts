export interface Airport {
  code: string;       // Code IATA (ex: CDG)
  name: string;       // Nom de l'aéroport
  city: string;       // Ville
  country: string;    // Pays
  flag: string;       // Emoji drapeau
  popular?: boolean;  // Aéroport populaire (affiché en suggestions par défaut)
}

export const AIRPORTS: Airport[] = [
  // ── Afrique Centrale ──────────────────────────────────────────────────────
  { code: "YAO", name: "Aéroport International de Yaoundé-Nsimalen", city: "Yaoundé", country: "Cameroun", flag: "🇨🇲", popular: true },
  { code: "DLA", name: "Aéroport International de Douala", city: "Douala", country: "Cameroun", flag: "🇨🇲", popular: true },
  { code: "LBV", name: "Aéroport International Léon-Mba", city: "Libreville", country: "Gabon", flag: "🇬🇦", popular: true },
  { code: "BZV", name: "Aéroport International Maya-Maya", city: "Brazzaville", country: "Congo", flag: "🇨🇬" },
  { code: "FIH", name: "Aéroport International de N'Djili", city: "Kinshasa", country: "RD Congo", flag: "🇨🇩" },
  { code: "BGF", name: "Aéroport International de Bangui M'Poko", city: "Bangui", country: "Centrafrique", flag: "🇨🇫" },
  { code: "NDJ", name: "Aéroport International Hassan Djamous", city: "N'Djamena", country: "Tchad", flag: "🇹🇩" },
  { code: "SSG", name: "Aéroport International de Malabo", city: "Malabo", country: "Guinée Équatoriale", flag: "🇬🇶" },
  { code: "SAO", name: "Aéroport International de São Tomé", city: "São Tomé", country: "São Tomé-et-Príncipe", flag: "🇸🇹" },

  // ── Afrique de l'Ouest ────────────────────────────────────────────────────
  { code: "ABJ", name: "Aéroport International Félix-Houphouët-Boigny", city: "Abidjan", country: "Côte d'Ivoire", flag: "🇨🇮", popular: true },
  { code: "DKR", name: "Aéroport International Blaise Diagne", city: "Dakar", country: "Sénégal", flag: "🇸🇳", popular: true },
  { code: "ACC", name: "Aéroport International Kotoka", city: "Accra", country: "Ghana", flag: "🇬🇭", popular: true },
  { code: "LOS", name: "Aéroport International Murtala Muhammed", city: "Lagos", country: "Nigeria", flag: "🇳🇬", popular: true },
  { code: "ABV", name: "Aéroport International Nnamdi Azikiwe", city: "Abuja", country: "Nigeria", flag: "🇳🇬" },
  { code: "COO", name: "Aéroport International Cadjehoun", city: "Cotonou", country: "Bénin", flag: "🇧🇯" },
  { code: "OUA", name: "Aéroport International de Ouagadougou", city: "Ouagadougou", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "BKO", name: "Aéroport International Modibo Keïta", city: "Bamako", country: "Mali", flag: "🇲🇱" },
  { code: "CKY", name: "Aéroport International Ahmed Sékou Touré", city: "Conakry", country: "Guinée", flag: "🇬🇳" },
  { code: "FNA", name: "Aéroport International Lungi", city: "Freetown", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "ROB", name: "Aéroport International Roberts", city: "Monrovia", country: "Liberia", flag: "🇱🇷" },
  { code: "ABV", name: "Aéroport International Nnamdi Azikiwe", city: "Abuja", country: "Nigeria", flag: "🇳🇬" },
  { code: "TML", name: "Aéroport de Tamale", city: "Tamale", country: "Ghana", flag: "🇬🇭" },
  { code: "NIM", name: "Aéroport International Diori Hamani", city: "Niamey", country: "Niger", flag: "🇳🇪" },
  { code: "BJL", name: "Aéroport International Banjul", city: "Banjul", country: "Gambie", flag: "🇬🇲" },
  { code: "OXB", name: "Aéroport International Osvaldo Vieira", city: "Bissau", country: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "SID", name: "Aéroport International Amilcar Cabral", city: "Sal", country: "Cap-Vert", flag: "🇨🇻" },
  { code: "TMS", name: "Aéroport International de São Tomé", city: "São Tomé", country: "São Tomé-et-Príncipe", flag: "🇸🇹" },

  // ── Afrique de l'Est ──────────────────────────────────────────────────────
  { code: "ADD", name: "Aéroport International Bole", city: "Addis-Abeba", country: "Éthiopie", flag: "🇪🇹", popular: true },
  { code: "NBO", name: "Aéroport International Jomo Kenyatta", city: "Nairobi", country: "Kenya", flag: "🇰🇪", popular: true },
  { code: "DAR", name: "Aéroport International Julius Nyerere", city: "Dar es Salaam", country: "Tanzanie", flag: "🇹🇿" },
  { code: "EBB", name: "Aéroport International Entebbe", city: "Entebbe", country: "Ouganda", flag: "🇺🇬" },
  { code: "KGL", name: "Aéroport International de Kigali", city: "Kigali", country: "Rwanda", flag: "🇷🇼" },
  { code: "BJM", name: "Aéroport International de Bujumbura", city: "Bujumbura", country: "Burundi", flag: "🇧🇮" },
  { code: "MBA", name: "Aéroport International Moi", city: "Mombasa", country: "Kenya", flag: "🇰🇪" },
  { code: "JIB", name: "Aéroport International Ambouli", city: "Djibouti", country: "Djibouti", flag: "🇩🇯" },
  { code: "MGQ", name: "Aéroport International Aden Adde", city: "Mogadiscio", country: "Somalie", flag: "🇸🇴" },

  // ── Afrique du Nord ───────────────────────────────────────────────────────
  { code: "CAI", name: "Aéroport International du Caire", city: "Le Caire", country: "Égypte", flag: "🇪🇬", popular: true },
  { code: "CMN", name: "Aéroport Mohammed V", city: "Casablanca", country: "Maroc", flag: "🇲🇦", popular: true },
  { code: "ALG", name: "Aéroport International Houari Boumediene", city: "Alger", country: "Algérie", flag: "🇩🇿", popular: true },
  { code: "TUN", name: "Aéroport International Tunis-Carthage", city: "Tunis", country: "Tunisie", flag: "🇹🇳" },
  { code: "TIP", name: "Aéroport International Mitiga", city: "Tripoli", country: "Libye", flag: "🇱🇾" },
  { code: "RAK", name: "Aéroport International Marrakech-Menara", city: "Marrakech", country: "Maroc", flag: "🇲🇦" },
  { code: "AGA", name: "Aéroport Al Massira", city: "Agadir", country: "Maroc", flag: "🇲🇦" },

  // ── Afrique du Sud ────────────────────────────────────────────────────────
  { code: "JNB", name: "Aéroport International O.R. Tambo", city: "Johannesburg", country: "Afrique du Sud", flag: "🇿🇦", popular: true },
  { code: "CPT", name: "Aéroport International du Cap", city: "Le Cap", country: "Afrique du Sud", flag: "🇿🇦" },
  { code: "MPM", name: "Aéroport International de Maputo", city: "Maputo", country: "Mozambique", flag: "🇲🇿" },
  { code: "LUN", name: "Aéroport International Kenneth Kaunda", city: "Lusaka", country: "Zambie", flag: "🇿🇲" },
  { code: "HRE", name: "Aéroport International Robert Gabriel Mugabe", city: "Harare", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "GBE", name: "Aéroport International Sir Seretse Khama", city: "Gaborone", country: "Botswana", flag: "🇧🇼" },
  { code: "WDH", name: "Aéroport International Hosea Kutako", city: "Windhoek", country: "Namibie", flag: "🇳🇦" },
  { code: "TNR", name: "Aéroport International d'Ivato", city: "Antananarivo", country: "Madagascar", flag: "🇲🇬" },
  { code: "MRU", name: "Aéroport International Sir Seewoosagur Ramgoolam", city: "Port-Louis", country: "Maurice", flag: "🇲🇺" },
  { code: "RUN", name: "Aéroport Roland Garros", city: "Saint-Denis", country: "La Réunion", flag: "🇷🇪" },

  // ── Europe Occidentale ────────────────────────────────────────────────────
  { code: "CDG", name: "Aéroport Charles de Gaulle", city: "Paris", country: "France", flag: "🇫🇷", popular: true },
  { code: "ORY", name: "Aéroport Paris-Orly", city: "Paris", country: "France", flag: "🇫🇷" },
  { code: "LHR", name: "Aéroport London Heathrow", city: "Londres", country: "Royaume-Uni", flag: "🇬🇧", popular: true },
  { code: "LGW", name: "Aéroport London Gatwick", city: "Londres", country: "Royaume-Uni", flag: "🇬🇧" },
  { code: "STN", name: "Aéroport London Stansted", city: "Londres", country: "Royaume-Uni", flag: "🇬🇧" },
  { code: "AMS", name: "Aéroport Amsterdam Schiphol", city: "Amsterdam", country: "Pays-Bas", flag: "🇳🇱", popular: true },
  { code: "BRU", name: "Aéroport de Bruxelles", city: "Bruxelles", country: "Belgique", flag: "🇧🇪", popular: true },
  { code: "FRA", name: "Aéroport Frankfurt am Main", city: "Francfort", country: "Allemagne", flag: "🇩🇪", popular: true },
  { code: "MUC", name: "Aéroport International de Munich", city: "Munich", country: "Allemagne", flag: "🇩🇪" },
  { code: "BER", name: "Aéroport Berlin Brandenburg", city: "Berlin", country: "Allemagne", flag: "🇩🇪" },
  { code: "MAD", name: "Aéroport Adolfo Suárez Madrid-Barajas", city: "Madrid", country: "Espagne", flag: "🇪🇸", popular: true },
  { code: "BCN", name: "Aéroport de Barcelone-El Prat", city: "Barcelone", country: "Espagne", flag: "🇪🇸" },
  { code: "LIS", name: "Aéroport Humberto Delgado", city: "Lisbonne", country: "Portugal", flag: "🇵🇹", popular: true },
  { code: "FCO", name: "Aéroport Leonardo da Vinci", city: "Rome", country: "Italie", flag: "🇮🇹", popular: true },
  { code: "MXP", name: "Aéroport de Milan Malpensa", city: "Milan", country: "Italie", flag: "🇮🇹" },
  { code: "ZRH", name: "Aéroport de Zurich", city: "Zurich", country: "Suisse", flag: "🇨🇭", popular: true },
  { code: "GVA", name: "Aéroport de Genève", city: "Genève", country: "Suisse", flag: "🇨🇭" },
  { code: "LUX", name: "Aéroport de Luxembourg", city: "Luxembourg", country: "Luxembourg", flag: "🇱🇺", popular: true },
  { code: "VIE", name: "Aéroport International de Vienne", city: "Vienne", country: "Autriche", flag: "🇦🇹" },
  { code: "CPH", name: "Aéroport de Copenhague-Kastrup", city: "Copenhague", country: "Danemark", flag: "🇩🇰" },
  { code: "ARN", name: "Aéroport Stockholm Arlanda", city: "Stockholm", country: "Suède", flag: "🇸🇪" },
  { code: "OSL", name: "Aéroport d'Oslo Gardermoen", city: "Oslo", country: "Norvège", flag: "🇳🇴" },
  { code: "HEL", name: "Aéroport d'Helsinki-Vantaa", city: "Helsinki", country: "Finlande", flag: "🇫🇮" },
  { code: "DUB", name: "Aéroport de Dublin", city: "Dublin", country: "Irlande", flag: "🇮🇪" },
  { code: "ATH", name: "Aéroport International Elefthérios-Venizélos", city: "Athènes", country: "Grèce", flag: "🇬🇷" },
  { code: "WAW", name: "Aéroport Chopin de Varsovie", city: "Varsovie", country: "Pologne", flag: "🇵🇱", popular: true },
  { code: "PRG", name: "Aéroport Václav Havel", city: "Prague", country: "Rép. Tchèque", flag: "🇨🇿" },
  { code: "BUD", name: "Aéroport International de Budapest", city: "Budapest", country: "Hongrie", flag: "🇭🇺" },
  { code: "BUH", name: "Aéroport International Henri Coandă", city: "Bucarest", country: "Roumanie", flag: "🇷🇴" },
  { code: "SOF", name: "Aéroport International de Sofia", city: "Sofia", country: "Bulgarie", flag: "🇧🇬" },
  { code: "TLL", name: "Aéroport de Tallinn", city: "Tallinn", country: "Estonie", flag: "🇪🇪" },
  { code: "RIX", name: "Aéroport International de Riga", city: "Riga", country: "Lettonie", flag: "🇱🇻" },
  { code: "VNO", name: "Aéroport International de Vilnius", city: "Vilnius", country: "Lituanie", flag: "🇱🇹" },
  { code: "REK", name: "Aéroport International de Reykjavik", city: "Reykjavik", country: "Islande", flag: "🇮🇸" },

  // ── Moyen-Orient ──────────────────────────────────────────────────────────
  { code: "DXB", name: "Aéroport International de Dubaï", city: "Dubaï", country: "Émirats Arabes Unis", flag: "🇦🇪", popular: true },
  { code: "AUH", name: "Aéroport International d'Abu Dhabi", city: "Abu Dhabi", country: "Émirats Arabes Unis", flag: "🇦🇪" },
  { code: "DOH", name: "Aéroport International Hamad", city: "Doha", country: "Qatar", flag: "🇶🇦", popular: true },
  { code: "RUH", name: "Aéroport International King Khalid", city: "Riyad", country: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "JED", name: "Aéroport International King Abdulaziz", city: "Djeddah", country: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "KWI", name: "Aéroport International de Koweït", city: "Koweït", country: "Koweït", flag: "🇰🇼" },
  { code: "BAH", name: "Aéroport International de Bahreïn", city: "Manama", country: "Bahreïn", flag: "🇧🇭" },
  { code: "MCT", name: "Aéroport International de Mascate", city: "Mascate", country: "Oman", flag: "🇴🇲" },
  { code: "BEY", name: "Aéroport International Rafic Hariri", city: "Beyrouth", country: "Liban", flag: "🇱🇧" },
  { code: "AMM", name: "Aéroport International Queen Alia", city: "Amman", country: "Jordanie", flag: "🇯🇴" },
  { code: "IST", name: "Aéroport International d'Istanbul", city: "Istanbul", country: "Turquie", flag: "🇹🇷", popular: true },
  { code: "SAW", name: "Aéroport Sabiha Gökçen", city: "Istanbul", country: "Turquie", flag: "🇹🇷" },

  // ── Asie ──────────────────────────────────────────────────────────────────
  { code: "BKK", name: "Aéroport International Suvarnabhumi", city: "Bangkok", country: "Thaïlande", flag: "🇹🇭", popular: true },
  { code: "KUL", name: "Aéroport International de Kuala Lumpur", city: "Kuala Lumpur", country: "Malaisie", flag: "🇲🇾" },
  { code: "SIN", name: "Aéroport International Changi", city: "Singapour", country: "Singapour", flag: "🇸🇬" },
  { code: "PEK", name: "Aéroport International de Pékin", city: "Pékin", country: "Chine", flag: "🇨🇳" },
  { code: "PVG", name: "Aéroport International Pudong", city: "Shanghai", country: "Chine", flag: "🇨🇳" },
  { code: "HKG", name: "Aéroport International de Hong Kong", city: "Hong Kong", country: "Hong Kong", flag: "🇭🇰" },
  { code: "NRT", name: "Aéroport International Narita", city: "Tokyo", country: "Japon", flag: "🇯🇵" },
  { code: "DEL", name: "Aéroport International Indira Gandhi", city: "New Delhi", country: "Inde", flag: "🇮🇳" },
  { code: "BOM", name: "Aéroport International Chhatrapati Shivaji", city: "Mumbai", country: "Inde", flag: "🇮🇳" },

  // ── Amérique du Nord ──────────────────────────────────────────────────────
  { code: "JFK", name: "Aéroport International John F. Kennedy", city: "New York", country: "États-Unis", flag: "🇺🇸", popular: true },
  { code: "EWR", name: "Aéroport International Newark Liberty", city: "Newark", country: "États-Unis", flag: "🇺🇸" },
  { code: "LAX", name: "Aéroport International de Los Angeles", city: "Los Angeles", country: "États-Unis", flag: "🇺🇸" },
  { code: "ORD", name: "Aéroport International O'Hare", city: "Chicago", country: "États-Unis", flag: "🇺🇸" },
  { code: "MIA", name: "Aéroport International de Miami", city: "Miami", country: "États-Unis", flag: "🇺🇸" },
  { code: "YUL", name: "Aéroport International Pierre-Elliott-Trudeau", city: "Montréal", country: "Canada", flag: "🇨🇦", popular: true },
  { code: "YYZ", name: "Aéroport International Pearson", city: "Toronto", country: "Canada", flag: "🇨🇦" },
  { code: "YVR", name: "Aéroport International de Vancouver", city: "Vancouver", country: "Canada", flag: "🇨🇦" },

  // ── Amérique du Sud ───────────────────────────────────────────────────────
  { code: "GRU", name: "Aéroport International de São Paulo-Guarulhos", city: "São Paulo", country: "Brésil", flag: "🇧🇷" },
  { code: "EZE", name: "Aéroport International Ministro Pistarini", city: "Buenos Aires", country: "Argentine", flag: "🇦🇷" },
  { code: "BOG", name: "Aéroport International El Dorado", city: "Bogotá", country: "Colombie", flag: "🇨🇴" },

  // ── Océanie ───────────────────────────────────────────────────────────────
  { code: "SYD", name: "Aéroport International de Sydney", city: "Sydney", country: "Australie", flag: "🇦🇺", popular: true },
  { code: "MEL", name: "Aéroport de Melbourne", city: "Melbourne", country: "Australie", flag: "🇦🇺" },
  { code: "AKL", name: "Aéroport International d'Auckland", city: "Auckland", country: "Nouvelle-Zélande", flag: "🇳🇿" },

  // ── Arménie / Caucase ─────────────────────────────────────────────────────
  { code: "EVN", name: "Aéroport International Zvartnots", city: "Erevan", country: "Arménie", flag: "🇦🇲" },
  { code: "GYD", name: "Aéroport International Heydar Aliyev", city: "Bakou", country: "Azerbaïdjan", flag: "🇦🇿" },
  { code: "TBS", name: "Aéroport International de Tbilissi", city: "Tbilissi", country: "Géorgie", flag: "🇬🇪" },
];

/**
 * Recherche d'aéroports par texte libre (code IATA, ville, pays, nom)
 * Retourne max `limit` résultats triés par pertinence
 */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Sans query → retourner les aéroports populaires
    return AIRPORTS.filter(a => a.popular).slice(0, limit);
  }

  const scored = AIRPORTS.map(airport => {
    const code = airport.code.toLowerCase();
    const city = airport.city.toLowerCase();
    const country = airport.country.toLowerCase();
    const name = airport.name.toLowerCase();

    let score = 0;

    // Code IATA exact → priorité maximale
    if (code === q) score += 100;
    else if (code.startsWith(q)) score += 80;

    // Ville commence par la query
    if (city === q) score += 70;
    else if (city.startsWith(q)) score += 60;
    else if (city.includes(q)) score += 40;

    // Pays
    if (country.startsWith(q)) score += 30;
    else if (country.includes(q)) score += 20;

    // Nom de l'aéroport
    if (name.includes(q)) score += 10;

    // Bonus aéroports populaires
    if (airport.popular) score += 5;

    return { airport, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ airport }) => airport);
}

/** Retourne un aéroport par son code IATA */
export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code === code.toUpperCase());
}

/** Label court pour l'affichage dans le champ (ex: "CDG — Paris") */
export function airportLabel(airport: Airport): string {
  return `${airport.code} — ${airport.city}`;
}
