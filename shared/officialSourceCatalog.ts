export type OfficialSource = { label: string; url: string };
export type OfficialSourceRecord = { country: string; verificationStatus: "verified" | "partial" | "unverified"; sources: OfficialSource[] };

export const OFFICIAL_SOURCE_CATALOG: Record<string, OfficialSourceRecord> = {
  "allemagne": {
    "country": "Allemagne",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Auswärtiges Amt — Visiteur, études, travail et affaires —",
        "url": "https://www.auswaertiges-amt.de/en/visa-service"
      }
    ]
  },
  "australie": {
    "country": "Australie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Department of Home Affairs — Visas (visiteur, études, travail) —",
        "url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing"
      }
    ]
  },
  "autriche": {
    "country": "Autriche",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Federal Ministry for European and International Affairs (BMEIA) — Visiteur, études, travail —",
        "url": "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"
      }
    ]
  },
  "belgique": {
    "country": "Belgique",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Office des Étrangers (SPF Intérieur) — Visiteur, Études, Travail —",
        "url": "https://dofi.ibz.be/fr"
      }
    ]
  },
  "bulgarie": {
    "country": "Bulgarie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires étrangères de la République de Bulgarie — Visiteur, Études, Travail —",
        "url": "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"
      }
    ]
  },
  "canada": {
    "country": "Canada",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Immigration, Réfugiés et Citoyenneté Canada (IRCC) — Général —",
        "url": "https://www.canada.ca/en/services/immigration-citizenship.html"
      }
    ]
  },
  "chypre": {
    "country": "Chypre",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Département de l'État Civil et de l'Immigration — visiteur —",
        "url": "https://www.gov.cy/mip-md/en/documents/visitors-and-family-members/"
      }
    ]
  },
  "croatie": {
    "country": "Croatie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires étrangères et européennes (MVEP) — visiteur, études, travail —",
        "url": "https://mvep.gov.hr/"
      }
    ]
  },
  "danemark": {
    "country": "Danemark",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Danish Immigration Service and SIRI — visiteur, études, travail —",
        "url": "https://www.nyidanmark.dk/en-GB/"
      }
    ]
  },
  "espagne": {
    "country": "Espagne",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministerio de Asuntos Exteriores, Unión Europea y Cooperación — Visado Schengen (Visiteur) et Visas Nationaux (Études, Travail) —",
        "url": "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Servicios-consulares.aspx"
      }
    ]
  },
  "estonie": {
    "country": "Estonie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Politsei- ja Piirivalveamet (Police and Border Guard Board) — Travail, études et séjour —",
        "url": "https://www.politsei.ee/en"
      }
    ]
  },
  "etats unis": {
    "country": "États-Unis",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "U.S. Department of State — Visiteur —",
        "url": "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html"
      }
    ]
  },
  "finlande": {
    "country": "Finlande",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Maahanmuuttovirasto (Migri) — études —",
        "url": "https://migri.fi/en/studying-in-finland"
      }
    ]
  },
  "france": {
    "country": "France",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère de l'Europe et des Affaires étrangères — Visiteur, études, travail —",
        "url": "https://france-visas.gouv.fr/"
      }
    ]
  },
  "gabon": {
    "country": "Gabon",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Direction Générale de la Documentation et de l'Immigration (DGDI) — Visiteur (e-visa) —",
        "url": "https://evisa.dgdi.ga/"
      }
    ]
  },
  "grece": {
    "country": "Grèce",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires Étrangères — Visiteur —",
        "url": "https://www.mfa.gr/en/services/visas-for-foreigners-traveling-to-greece/"
      }
    ]
  },
  "hongrie": {
    "country": "Hongrie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "National Directorate-General for Aliens Policing (OIF) — Visiteur, Études, Travail —",
        "url": "https://oif.gov.hu/"
      }
    ]
  },
  "irlande": {
    "country": "Irlande",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Department of Foreign Affairs — Visas —",
        "url": "https://www.ireland.ie/en/dfa/visas-for-ireland/"
      }
    ]
  },
  "islande": {
    "country": "Islande",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ísland.is — Visas, études, travail et séjour —",
        "url": "https://island.is/en/category/immigrating-to-iceland"
      }
    ]
  },
  "italie": {
    "country": "Italie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministero degli Affari Esteri e della Cooperazione Internazionale — Visiteur, Études, Travail —",
        "url": "https://vistoperitalia.esteri.it/"
      }
    ]
  },
  "kenya": {
    "country": "Kenya",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Department of Immigration Services — Études —",
        "url": "https://immigration.go.ke/students-pass/"
      }
    ]
  },
  "lettonie": {
    "country": "Lettonie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires étrangères de la République de Lettonie — Visas, visiteur, études et travail —",
        "url": "https://www.mfa.gov.lv/en/applying-visa"
      }
    ]
  },
  "liechtenstein": {
    "country": "Liechtenstein",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Migration and Passport Office (Liechtenstein National Administration) — visiteur —",
        "url": "https://www.llv.li/en/national-administration/migration-and-passport-office/visa"
      }
    ]
  },
  "lituanie": {
    "country": "Lituanie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Migration Department under the Ministry of the Interior — Visiteur, études, travail —",
        "url": "https://www.migracija.lt/home?lang=en"
      }
    ]
  },
  "luxembourg": {
    "country": "Luxembourg",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Guichet.lu (Gouvernement du Luxembourg) — visiteur (court séjour / entrée) —",
        "url": "https://guichet.public.lu/en/citoyens/immigration/moins-3-mois/ressortissant-tiers/entree-visa.html"
      }
    ]
  },
  "malaisie": {
    "country": "Malaisie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Jabatan Imigresen Malaysia — Général et Visas —",
        "url": "https://www.imi.gov.my/index.php/en/"
      }
    ]
  },
  "malte": {
    "country": "Malte",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Identità — Visiteur (Schengen) —",
        "url": "https://identita.gov.mt/central-visa-unit-main-page/"
      }
    ]
  },
  "maurice": {
    "country": "Maurice",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Passport and Immigration Office — visiteur, études, travail —",
        "url": "https://passport.govmu.org/passport/"
      }
    ]
  },
  "norvege": {
    "country": "Norvège",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Direction norvégienne de l'immigration (UDI) — Visiteur —",
        "url": "https://www.udi.no/en/want-to-apply/visit-and-holiday/visitors-visa-to-norway/"
      }
    ]
  },
  "nouvelle zelande": {
    "country": "Nouvelle-Zélande",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Immigration New Zealand — Visiteur —",
        "url": "https://www.immigration.govt.nz/visas/visitor-visa"
      }
    ]
  },
  "pays bas": {
    "country": "Pays-Bas",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "IND — Visiteur —",
        "url": "https://ind.nl/en/short-stay"
      }
    ]
  },
  "pologne": {
    "country": "Pologne",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires étrangères de Pologne — Visiteur, études et travail —",
        "url": "https://www.gov.pl/web/diplomacy/visas"
      }
    ]
  },
  "portugal": {
    "country": "Portugal",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires Étrangères (Portal Diplomático) — Visiteur, études et travail —",
        "url": "https://vistos.mne.gov.pt/"
      }
    ]
  },
  "qatar": {
    "country": "Qatar",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère de l'Intérieur (MOI Qatar) / Plateforme Hayya — Visiteur —",
        "url": "https://hayya.qa"
      }
    ]
  },
  "republique tcheque": {
    "country": "République tchèque",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministerstvo vnitra České republiky — Visiteur, études, travail et séjour —",
        "url": "https://ipc.gov.cz/en/"
      }
    ]
  },
  "roumanie": {
    "country": "Roumanie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires Étrangères de Roumanie (MAE) — Visas (visiteur, études, travail) —",
        "url": "http://www.mae.ro/en/node/2035"
      }
    ]
  },
  "royaume uni": {
    "country": "Royaume-Uni",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "UK Visas and Immigration (Home Office) — Général —",
        "url": "https://www.gov.uk/browse/visas-immigration"
      }
    ]
  },
  "senegal": {
    "country": "Sénégal",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère de l'Intégration Africaine et des Affaires Étrangères — Visiteur —",
        "url": "https://diplomatie.gouv.sn/visiter-le-senegal"
      }
    ]
  },
  "slovaquie": {
    "country": "Slovaquie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Ministère des Affaires étrangères et européennes de la République slovaque — Visiteur, études, travail —",
        "url": "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr"
      }
    ]
  },
  "slovenie": {
    "country": "Slovénie",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Gouvernement de la République de Slovénie — Visiteur, études et travail —",
        "url": "https://www.gov.si/en/topics/entry-and-residence/"
      }
    ]
  },
  "suede": {
    "country": "Suède",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Migrationsverket — visite —",
        "url": "https://www.migrationsverket.se/en/you-want-to-apply/visiting-sweden.html"
      }
    ]
  },
  "suisse": {
    "country": "Suisse",
    "verificationStatus": "verified",
    "sources": [
      {
        "label": "Secrétariat d'État aux migrations (SEM) — visiteur, études, travail —",
        "url": "https://www.sem.admin.ch/sem/fr/home.html"
      }
    ]
  }
};
