export interface TestimonialData {
  name: string;
  comment: string;
}

export interface DestinationCosts {
  visaApplication: string;
  tuitionFees: string;
  livingExpenses: string;
}

export interface EnhancedDestination {
  advantages: string[];
  costs: DestinationCosts;
  testimonials: TestimonialData[];
}

export type DestinationId = 'canada' | 'poland' | 'germany' | 'luxembourg' | 'united_kingdom' | 'united_states';

export const enhancedDestinationData: Record<DestinationId, EnhancedDestination> = {
  canada: {
    advantages: [
      "Éducation de haute qualité",
      "Économie stable et opportunités d'emploi",
      "Société multiculturelle et accueillante",
      "Système de santé universel",
    ],
    costs: {
      visaApplication: "200 CAD",
      tuitionFees: "15,000 - 30,000 CAD/an",
      livingExpenses: "10,000 - 15,000 CAD/an",
    },
    testimonials: [
      {
        name: "Marie Dupont",
        comment: "Le Canada a changé ma vie ! J'ai trouvé un excellent emploi et la qualité de vie est incroyable.",
      },
      {
        name: "Jean Pierre",
        comment: "Mes enfants adorent l'école ici. Le processus d'immigration a été simple grâce à 3M Travel.",
      },
    ],
  },
  luxembourg: {
    advantages: [
      "Hauts salaires et forte économie",
      "Position centrale en Europe",
      "Multilinguisme et diversité culturelle",
      "Excellente qualité de vie",
    ],
    costs: {
      visaApplication: "80 EUR",
      tuitionFees: "Gratuit pour les universités publiques (UE/EEE), 200-400 EUR/semestre",
      livingExpenses: "1,500 - 2,500 EUR/mois",
    },
    testimonials: [
      {
        name: "Fatima Zahra",
        comment: "Le Luxembourg est une opportunité incroyable pour ma carrière. Je suis très reconnaissante.",
      },
      {
        name: "Carlos Silva",
        comment: "Vivre en plein cœur de l'Europe avec un salaire aussi bon, c'est un rêve devenu réalité.",
      },
    ],
  },
  poland: {
    advantages: [
      "Coût de la vie abordable",
      "Éducation de qualité et reconnue",
      "Culture riche et histoire fascinante",
      "Porte d'entrée vers l'Europe de l'Est",
    ],
    costs: {
      visaApplication: "60 EUR",
      tuitionFees: "2,000 - 5,000 EUR/an",
      livingExpenses: "400 - 800 EUR/mois",
    },
    testimonials: [
      {
        name: "Anna Kowalski",
        comment: "J'adore mes études en Pologne. Le coût de la vie est bas et les gens sont très accueillants.",
      },
      {
        name: "David Miller",
        comment: "Une expérience culturelle unique et une excellente éducation. Je recommande la Pologne !",
      },
    ],
  },
  germany: {
    advantages: [
      "Économie la plus forte d'Europe",
      "Excellentes opportunités pour les ingénieurs et informaticiens",
      "Système éducatif gratuit ou très abordable",
      "Excellente qualité de vie et sécurité",
    ],
    costs: {
      visaApplication: "75 EUR",
      tuitionFees: "0 - 1,500 EUR/semestre",
      livingExpenses: "850 - 1,200 EUR/mois",
    },
    testimonials: [
      {
        name: "Ahmed Benali",
        comment: "Travailler comme ingénieur en Allemagne est une expérience fantastique. Les conditions de travail sont excellentes.",
      },
      {
        name: "Sophie Martin",
        comment: "J'ai pu étudier gratuitement dans une université de renommée mondiale. Merci 3M Travel pour l'accompagnement !",
      },
    ],
  },
  united_kingdom: {
    advantages: [
      "Universités de renommée mondiale",
      "Langue anglaise, idéale pour la carrière internationale",
      "Marché du travail dynamique",
      "Riche diversité culturelle",
    ],
    costs: {
      visaApplication: "363 - 490 GBP",
      tuitionFees: "10,000 - 38,000 GBP/an",
      livingExpenses: "1,000 - 1,500 GBP/mois",
    },
    testimonials: [
      {
        name: "Lucas Dubois",
        comment: "Londres est une ville incroyable pour lancer sa carrière. Le processus de visa a été rapide et efficace.",
      },
      {
        name: "Emma Tremblay",
        comment: "Mes études au Royaume-Uni m'ont ouvert des portes partout dans le monde. Un investissement qui en vaut la peine.",
      },
    ],
  },
  united_states: {
    advantages: [
      "Opportunités de carrière illimitées",
      "Centres d'innovation technologique et scientifique",
      "Diversité géographique et culturelle",
      "Salaires parmi les plus élevés au monde",
    ],
    costs: {
      visaApplication: "160 - 190 USD",
      tuitionFees: "20,000 - 50,000 USD/an",
      livingExpenses: "1,500 - 3,000 USD/mois",
    },
    testimonials: [
      {
        name: "Julien Leroy",
        comment: "Le rêve américain est réel ! J'ai trouvé un poste dans la Silicon Valley grâce à mon visa de travail.",
      },
      {
        name: "Camille Gagnon",
        comment: "Étudier aux États-Unis a été la meilleure décision de ma vie. Le campus est immense et les opportunités sont infinies.",
      },
    ],
  },
};
