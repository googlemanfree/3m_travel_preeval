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
};

export function getCountryPhotos(slug: string): CountryPhoto[] {
  return countryPhotos[slug] ?? [];
}
