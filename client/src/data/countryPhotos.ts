/**
 * Photos des guides d'études par pays (/blog/etudes/:slug). Toutes proviennent de Wikimedia Commons et sont
 * hébergées dans /public/photos-pays (ou /public/photos-canada pour le Canada). Les crédits exigés par chaque
 * licence sont affichés sous les photos par CountryPhotoGallery : ne jamais retirer l'auteur ni la licence.
 * La première photo sert d'image d'en-tête, la seconde de photo de galerie.
 */
export type CountryPhoto = {
  src: string;
  alt: string;
  place: string;
  author: string;
  license: string;
  licenseUrl: string;
  fileUrl: string;
  width: number;
  height: number;
};

export const countryPhotos: Record<string, CountryPhoto[]> = {
  canada: [
    { src: "/photos-canada/canada-vancouver.jpg", alt: "Vue du centre-ville de Vancouver, du port et des montagnes, avec le drapeau du Canada au premier plan", place: "Vancouver", author: "Quintin Soloviev", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Skyline_of_Vancouver,_BC.jpg", width: 1280, height: 853 },
    { src: "/photos-canada/canada-quebec-chateau-frontenac.jpg", alt: "Le Château Frontenac et la ville de Québec illuminés de nuit", place: "Québec", author: "Wilfredor", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Chateau_Frontenac_illuminated_at_night_in_Quebec_City.jpg", width: 1280, height: 819 },
  ],
  france: [
    { src: "/photos-pays/etudes-france-1.jpg", alt: "La tour Eiffel et le pont Alexandre-III illuminés à la tombée de la nuit, à Paris", place: "Paris", author: "Getfunky Paris", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Eiffel_Tower_and_Pont_Alexandre_III_at_night.jpg", width: 1600, height: 1025 },
    { src: "/photos-pays/etudes-france-2.jpg", alt: "La tour Saint-Jacques au crépuscule, avec la tour Eiffel à l’horizon, à Paris", place: "Paris", author: "Fabien Barrau", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Tour_Saint-Jacques_au_cr%C3%A9puscule.jpg", width: 1100, height: 825 },
  ],
  belgique: [
    { src: "/photos-pays/etudes-belgique-1.jpg", alt: "La Grand-Place de Bruxelles et ses façades dorées, à la tombée de la nuit", place: "Bruxelles", author: "Trougnouf (Benoit Brummer)", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Grand_Place_1-7_during_civil_twilight,_Brussels_(DSCF1982).jpg", width: 1600, height: 1191 },
    { src: "/photos-pays/etudes-belgique-2.jpg", alt: "Un canal bordé de maisons anciennes à Bruges", place: "Bruges", author: "Marc Ryckaert (MJJR)", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Brugge_Langerei_R02.jpg", width: 1100, height: 724 },
  ],
  allemagne: [
    { src: "/photos-pays/etudes-allemagne-1.jpg", alt: "La porte de Brandebourg, sous un ciel dégagé, à Berlin", place: "Berlin", author: "Pierre-Selim Huard", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Berlin_-_0266_-_16052015_-_Brandenburger_Tor.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/etudes-allemagne-2.jpg", alt: "Le château de Neuschwanstein, en Bavière", place: "Bavière", author: "Wilfredor", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Neuschwanstein_Castle_2024-02.jpg", width: 1100, height: 749 },
  ],
  pologne: [
    { src: "/photos-pays/etudes-pologne-1.jpg", alt: "Le château royal du Wawel, à Cracovie", place: "Cracovie", author: "Igor123121", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Wawel_Royal_Castle,_view_from_Stradomska_Street,_Old_Town,_Krak%C3%B3w,_Poland.jpg", width: 1600, height: 1199 },
    { src: "/photos-pays/etudes-pologne-2.jpg", alt: "La place du marché de la vieille ville de Varsovie et ses maisons colorées", place: "Varsovie", author: "Igor123121", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Old_Town_Market_Square,_..2026,_Warsaw,_Poland.jpg", width: 1100, height: 736 },
  ],
  australie: [
    { src: "/photos-pays/etudes-australie-1.jpg", alt: "L’opéra de Sydney illuminé de nuit au bord du port", place: "Sydney", author: "Thomas Adams", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Sydneyoperahouse_at_night.jpg", width: 1600, height: 1013 },
    { src: "/photos-pays/etudes-australie-2.jpg", alt: "Les Douze Apôtres, falaises de la Great Ocean Road, dans le parc national de Port Campbell", place: "Victoria", author: "Dietmar Rabich", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Princetown_(AU),_Port_Campbell_National_Park,_Twelve_Apostles_--_2019_--_0930.jpg", width: 1100, height: 733 },
  ],
  "royaume-uni": [
    { src: "/photos-pays/etudes-royaume-uni-1.jpg", alt: "Big Ben et le palais de Westminster au coucher du soleil, à Londres", place: "Londres", author: "Colin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Big_Ben_at_sunset_-_2014-10-27_17-30.jpg", width: 1600, height: 1083 },
    { src: "/photos-pays/etudes-royaume-uni-2.jpg", alt: "La Radcliffe Camera, bibliothèque de l’université d’Oxford, vue d’en haut", place: "Oxford", author: "Julian Herzog", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Radcliffe_Camera_Oxford_2018_02.jpg", width: 1100, height: 613 },
  ],
  "etats-unis": [
    { src: "/photos-pays/etudes-etats-unis-1.jpg", alt: "L’Empire State Building et les gratte-ciel de Manhattan au coucher du soleil", place: "New York", author: "Dllu", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu.jpg", width: 1600, height: 1202 },
    { src: "/photos-pays/etudes-etats-unis-2.jpg", alt: "Le sud de Manhattan et ses gratte-ciel au crépuscule", place: "New York", author: "Superbass", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:2024-11-17-Lower_Manhattan-0593.jpg", width: 1100, height: 733 },
  ],
  irlande: [
    { src: "/photos-pays/etudes-irlande-1.jpg", alt: "La Long Room, bibliothèque historique de Trinity College, à Dublin", place: "Dublin", author: "Diliff", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Long_Room_Interior,_Trinity_College_Dublin,_Ireland_-_Diliff.jpg", width: 1600, height: 1208 },
    { src: "/photos-pays/etudes-irlande-2.jpg", alt: "L’abbaye de Kylemore au bord d’un lac, dans le Connemara", place: "Connemara", author: "Berthold Werner", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Kylemore_Abbey_BW_2025-09-10_15-27-09.jpg", width: 1100, height: 731 },
  ],
  maroc: [
    { src: "/photos-pays/etudes-maroc-1.jpg", alt: "Un escalier bleu dans une ruelle de Chefchaouen", place: "Chefchaouen", author: "Fbrandao.1963", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:2018_01_(Blue)_-_Chaouen.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/etudes-maroc-2.jpg", alt: "Barques de pêche sur le fleuve Bouregreg, entre Rabat et Salé", place: "Rabat", author: "MarwanAndrew", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Boats_in_Bouregreg_(1).jpg", width: 1100, height: 736 },
  ],
  // Pays des pages /procedures/<pays> (formation et travail qualifié) : photos ajoutées le 2026-09-26.
  "pays-bas": [
    { src: "/photos-pays/pays-pays-bas-1.jpg", alt: "Des maisons de canal aux façades colorées à la lumière dorée du soir, sur le Damrak à Amsterdam", place: "Amsterdam", author: "Basile Morin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Colorful_canal_houses_at_golden_hour_in_Damrak_avenue_Amsterdam_the_Netherlands.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/pays-pays-bas-2.jpg", alt: "Un canal d’Amsterdam, l’Herengracht, bordé de maisons anciennes", place: "Amsterdam", author: "Michielverbeek", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Amsterdam,_Herengracht_80tm84_RM1725%2B6_-_Herenstraat_IMG_3425_2024-06-24_13.12.jpg", width: 1100, height: 767 },
  ],
  portugal: [
    { src: "/photos-pays/pays-portugal-1.jpg", alt: "Les toits de Lisbonne, la place du Commerce et le Tage, vus depuis le château Saint-Georges", place: "Lisbonne", author: "Jakub Hałun", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:View_from_Castelo_de_S%C3%A3o_Jorge_towards_Pra%C3%A7a_do_Com%C3%A9rcio,_Lisbon,_20250604_1653_9372.jpg", width: 1600, height: 1068 },
    { src: "/photos-pays/pays-portugal-2.jpg", alt: "Des bateaux rabelos sur le Douro devant le quartier de la Ribeira, à Porto", place: "Porto", author: "Jakub Hałun", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Rabelo_boats_and_Ribeira_seen_from_Cais_de_Gaia,_20250605_1623_9879.jpg", width: 1100, height: 734 },
  ],
  espagne: [
    { src: "/photos-pays/pays-espagne-1.jpg", alt: "L’Alhambra, ensemble palatial de Grenade, entouré de verdure", place: "Grenade", author: "Jebulon", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Alhambra_detail.jpg", width: 1600, height: 1084 },
    { src: "/photos-pays/pays-espagne-2.jpg", alt: "Le banc en mosaïque du parc Güell, avec la ville de Barcelone en arrière-plan", place: "Barcelone", author: "Jorge Franganillo", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Parque_G%C3%BCell_-_50031001212.jpg", width: 1100, height: 733 },
  ],
  italie: [
    { src: "/photos-pays/pays-italie-1.jpg", alt: "Le Colisée illuminé au crépuscule, à Rome", place: "Rome", author: "Wilfredor", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Colosseum_of_Rome,_Italy.jpg", width: 1600, height: 1008 },
    { src: "/photos-pays/pays-italie-2.jpg", alt: "Le Grand Canal de Venise et ses palais", place: "Venise", author: "Marc Ryckaert", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Venezia_Canal_Grande_R07.jpg", width: 1100, height: 662 },
  ],
  malte: [
    { src: "/photos-pays/pays-malte-1.jpg", alt: "Le clocher et le dôme de l’église Notre-Dame-du-Mont-Carmel, à La Valette", place: "La Valette", author: "Anton Zelenov", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Our_Lady_of_Mount_Carmel_and_St_Pauls_Pro-Cathedral.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/pays-malte-2.jpg", alt: "Des voiliers dans le port de Senglea, à Malte", place: "Senglea", author: "Berthold Werner", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Malta_Senglea_2011-10-06_10-27-55.JPG", width: 1100, height: 738 },
  ],
  norvege: [
    { src: "/photos-pays/pays-norvege-1.jpg", alt: "Le Geirangerfjord, entouré de montagnes verdoyantes, en Norvège", place: "Geirangerfjord", author: "Ximonic (Simo Räsänen)", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Geirangerfjord_from_%C3%98rnesvingen,_2013_June.jpg", width: 1600, height: 898 },
    { src: "/photos-pays/pays-norvege-2.jpg", alt: "Des cabanes de pêcheurs rouges au bord de l’eau, dans les îles Lofoten", place: "Lofoten", author: "Jules Henze", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:%C3%85_i_Lofoten_III_(perspective_corrected).jpg", width: 1100, height: 727 },
  ],
  "nouvelle-zelande": [
    { src: "/photos-pays/pays-nouvelle-zelande-1.jpg", alt: "Queenstown, le lac Wakatipu et la chaîne des Remarkables, en Nouvelle-Zélande", place: "Queenstown", author: "Bernard Spragg. NZ from Christchurch, New Zealand", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Queenstown._Lake_Wakatipu._(50854629786).jpg", width: 1600, height: 1071 },
    { src: "/photos-pays/pays-nouvelle-zelande-2.jpg", alt: "Les gratte-ciel d’Auckland et la Sky Tower illuminés de nuit", place: "Auckland", author: "lumoplank", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:T%C4%81maki_Makaurau_Auckland,_Part_I_-_Auckland9663.jpg", width: 1100, height: 733 },
  ],
  emirats: [
    { src: "/photos-pays/pays-emirats-1.jpg", alt: "Les gratte-ciel de Dubaï et la tour Burj Khalifa se reflétant sur l’eau la nuit", place: "Dubaï", author: "Robert Bock", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Dubai_skyline_unsplash.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/pays-emirats-2.jpg", alt: "La tour Burj Khalifa au crépuscule, au-dessus de la fontaine de Dubaï", place: "Dubaï", author: "Christian Raggini", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:The_Dubai_Fountain_%26_Burj_Khalifa_Pixabay.jpg", width: 1100, height: 619 },
  ],
  qatar: [
    { src: "/photos-pays/pays-qatar-1.jpg", alt: "Les tours du quartier de West Bay, à Doha, sous un ciel bleu", place: "Doha", author: "Zairon", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Doha_Skyline_09.jpg", width: 1600, height: 882 },
    { src: "/photos-pays/pays-qatar-2.jpg", alt: "Le front de mer de Doha et les tours de West Bay", place: "Doha", author: "Zairon", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Doha_Corniche_Skyline_View_2.jpg", width: 1100, height: 715 },
  ],
  "arabie-saoudite": [
    { src: "/photos-pays/pays-arabie-saoudite-1.jpg", alt: "Riyad, son quartier financier et la tour Kingdom Centre dans une lumière dorée", place: "Riyad", author: "B.alotaby", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Riyadh_Skyline_showing_the_King_Abdullah_Financial_District_(KAFD)_and_the_famous_Kingdom_Tower_.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/pays-arabie-saoudite-2.jpg", alt: "Le rocher de l’Éléphant, formation de grès dans le désert d’AlUla", place: "AlUla", author: "Uhooep", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Elephant_rock,_Al-'Ula.jpg", width: 1100, height: 825 },
  ],
  "coree-du-sud": [
    { src: "/photos-pays/pays-coree-du-sud-1.jpg", alt: "Le pavillon Gyeonghoeru du palais Gyeongbokgung, reflété dans l’eau, à Séoul", place: "Séoul", author: "Frank Schulenburg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Gyeonghoeru_(Royal_Banquet_Hall)_at_Gyeongbokgung_Palace,_Seoul.jpg", width: 1600, height: 1067 },
    { src: "/photos-pays/pays-coree-du-sud-2.jpg", alt: "Une ruelle du village de hanoks de Bukchon, à Séoul", place: "Séoul", author: "Bgag", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Bukchon_Hanok_Village_01.jpg", width: 1100, height: 733 },
  ],
  japon: [
    { src: "/photos-pays/pays-japon-1.jpg", alt: "La pagode Chureito et le mont Fuji, entourés de feuillages d’automne", place: "Fujiyoshida", author: "Dang Son", license: "CC0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:12-Chureito-pagoda-and-Mount-Fuji-Japan_(29677439878).jpg", width: 1600, height: 900 },
    { src: "/photos-pays/pays-japon-2.jpg", alt: "Le quartier de Minato, à Tokyo, avec la tour de Tokyo, au coucher du soleil", place: "Tokyo", author: "David Kernan", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", fileUrl: "https://commons.wikimedia.org/wiki/File:Minato_City,_Tokyo,_Japan.jpg", width: 1100, height: 619 },
  ],
};

export function getCountryPhotos(slug: string): CountryPhoto[] {
  return countryPhotos[slug] ?? [];
}
