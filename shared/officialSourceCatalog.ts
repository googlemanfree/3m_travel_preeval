export type OfficialSource = { label: string; url: string };
export type OfficialSourceRecord = { country: string; verificationStatus: "verified" | "partial" | "unverified"; sources: OfficialSource[] };

export const OFFICIAL_SOURCE_CATALOG: Record<string, OfficialSourceRecord> = {
  "allemagne": {
    "country": "Allemagne",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Auswärtiges Amt — Visa et séjour", "url": "https://www.auswaertiges-amt.de/en/visa-service/215870-215870" },
      { "label": "Federal Foreign Office — Informations visas", "url": "https://www.germany.info/us-en/service/visa" },
      { "label": "Federal Foreign Office — Emploi en Allemagne", "url": "https://www.germany.info/us-en/service/visa/employment-visa-922292" }
    ]
  },
  "australie": {
    "country": "Australie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Department of Home Affairs — Visitor visa subclass 600", "url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas" },
      { "label": "Department of Home Affairs — Student visa subclass 500", "url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" },
      { "label": "Department of Home Affairs — Explore visa options for working", "url": "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx" },
      { "label": "Department of Home Affairs — Visa listing", "url": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing" }
    ]
  },
  "autriche": {
    "country": "Autriche",
    "verificationStatus": "verified",
    "sources": [
      { "label": "BMEIA — Visa et entrée/séjour", "url": "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa" },
      { "label": "BMEIA — Étudier en Autriche", "url": "https://www.bmeia.gv.at/en/austrian-embassy-baku/travels-to-austria/study-in-austria" },
      { "label": "Migration.gv.at — Travailleurs hautement qualifiés", "url": "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/very-highly-qualified-workers/" },
      { "label": "EU Immigration Portal — Étudiant en Autriche", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-austria_en" }
    ]
  },
  "belgique": {
    "country": "Belgique",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Office des étrangers — Court séjour", "url": "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay" },
      { "label": "Office des étrangers — Études", "url": "https://dofi.ibz.be/en/themes/third-country-nationals/study" },
      { "label": "EU Immigration Portal — Travailleur salarié", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en" },
      { "label": "SPF Affaires étrangères — Visa D", "url": "https://canada.diplomatie.belgium.be/en/visa/visa-belgium/long-stay-visa-d-visa" }
    ]
  },
  "bulgarie": {
    "country": "Bulgarie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Bulgarian Ministry of Foreign Affairs — Visa for Bulgaria", "url": "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria" },
      { "label": "Bulgarian MFA — Visa application forms", "url": "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-application-forms" },
      { "label": "EU Immigration Portal — Student in Bulgaria", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-bulgaria_en" },
      { "label": "EU Immigration Portal — Employed worker in Bulgaria", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-bulgaria_en" }
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
      { "label": "MVEP — Visa et séjour", "url": "https://mvep.gov.hr/consular-information-152362/visa-152363/152363" },
      { "label": "Croatia Visa Application — crovisa", "url": "https://crovisa.mvep.hr/?lang=en" },
      { "label": "gov.hr — Visas", "url": "https://gov.hr/en/visas/1216" },
      { "label": "EU Immigration Portal — Student in Croatia", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en" }
    ]
  },
  "danemark": {
    "country": "Danemark",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Nyidanmark — Visa de court séjour", "url": "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa" },
      { "label": "Nyidanmark — Études", "url": "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study" },
      { "label": "Nyidanmark — Portail de demande", "url": "https://www.nyidanmark.dk/en-GB/You-want-to-apply" },
      { "label": "Ministry of Foreign Affairs — Demande de visa", "url": "https://um.dk/en/travel-and-residence/how-to-apply-for-a-visa/" },
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
      { "label": "Ministerio de Asuntos Exteriores — Visas nationales", "url": "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx" },
      { "label": "Consulat d’Espagne — Visa d’études", "url": "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx" },
      { "label": "Consulat d’Espagne — Visa salarié", "url": "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx" }
    ]
  },
  "estonie": {
    "country": "Estonie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Estonian Ministry of Foreign Affairs — Schengen visa", "url": "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa" },
      { "label": "Estonian Ministry of Foreign Affairs — Long-stay D visa", "url": "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-long-stay-d-visa" },
      { "label": "Police and Border Guard Board — Residence permit for study", "url": "https://www.politsei.ee/en/instructions/residence-permit-for-study" },
      { "label": "EU Immigration Portal — Employed worker in Estonia", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en" }
    ]
  },
  "etats unis": {
    "country": "États-Unis",
    "verificationStatus": "verified",
    "sources": [
      { "label": "U.S. Department of State — Visitor Visa", "url": "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa" },
      { "label": "U.S. Department of State — Student Visa", "url": "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" },
      { "label": "U.S. Department of State — Temporary Worker Visas", "url": "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html" },
      { "label": "U.S. Department of State — Visa Wizard", "url": "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wizard.html" }
    ]
  },
  "finlande": {
    "country": "Finlande",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Migri — Visiter la Finlande", "url": "https://migri.fi/en/visiting-finland" },
      { "label": "Migri — Permis de séjour pour études", "url": "https://migri.fi/en/residence-permit-application-for-studies" },
      { "label": "Migri — Permis pour personne employée", "url": "https://migri.fi/en/residence-permit-for-an-employed-person" },
      { "label": "Ministry for Foreign Affairs — Finlande", "url": "https://um.fi/frontpage" },
      { "label": "Finland Abroad — Permis de séjour", "url": "https://finlandabroad.fi/web/usa/residence-permits-to-finland" }
    ]
  },
  "france": {
    "country": "France",
    "verificationStatus": "verified",
    "sources": [
      { "label": "France-Visas — Portail officiel", "url": "https://france-visas.gouv.fr/en/" },
      { "label": "France-Visas — Étudiant", "url": "https://france-visas.gouv.fr/en/etudiant" },
      { "label": "France-Visas — Motif professionnel", "url": "https://france-visas.gouv.fr/en/motif-professionnel" },
      { "label": "Diplomatie française — Demande de visa", "url": "https://us.diplomatie.gouv.fr/en/applying-for-a-visa" }
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
      { "label": "Ministry of Foreign Affairs — Visas", "url": "https://www.mfa.gr/usa/en/services/visas/" },
      { "label": "EU Immigration Portal — Student in Greece", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en" },
      { "label": "EU Immigration Portal — Employed worker in Greece", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en" }
    ]
  },
  "hongrie": {
    "country": "Hongrie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Hungarian MFA — General Information for Entering Hungary", "url": "https://konzinfo.mfa.gov.hu/en/how-apply-visa" },
      { "label": "EU Immigration Portal — Student in Hungary", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-hungary_en" },
      { "label": "EU Immigration Portal — Employed worker in Hungary", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en" },
      { "label": "National Directorate-General for Aliens Policing — Enter Hungary", "url": "https://oif.gov.hu/" }
    ]
  },
  "irlande": {
    "country": "Irlande",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Department of Foreign Affairs — Visas for Ireland", "url": "https://www.ireland.ie/en/dfa/visas-for-ireland/" },
      { "label": "Irish Immigration — Études long séjour", "url": "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/" },
      { "label": "Irish Immigration — Travail", "url": "https://www.irishimmigration.ie/coming-to-work-in-ireland/" },
      { "label": "Department of Enterprise — Employment Permits", "url": "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/" },
      { "label": "AVATS — Demande de visa/préclearance", "url": "https://www.visas.inis.gov.ie/avats/onlinehome.aspx" }
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
  "japon": {
    "country": "Japon",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Ministry of Foreign Affairs of Japan — VISA", "url": "https://www.mofa.go.jp/j_info/visit/visa/index.html" },
      { "label": "MOFA — General visa: Student", "url": "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html" },
      { "label": "MOFA — Work or Long-term stay", "url": "https://www.mofa.go.jp/j_info/visit/visa/long/index.html" }
    ]
  },
  "italie": {
    "country": "Italie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Visa for Italy — portail officiel", "url": "http://vistoperitalia.esteri.it/home/en" },
      { "label": "Consulat d’Italie — Visas d’entrée", "url": "https://consnewyork.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/visas-to-enter-italy/" },
      { "label": "Consulat d’Italie — Instructions pour les visas", "url": "https://conssanfrancisco.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/instructions-for-visas/" },
      { "label": "EU Immigration Portal — Travail salarié en Italie", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en" }
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
      { "label": "Latvian Ministry of Foreign Affairs — Applying for a visa", "url": "https://www.mfa.gov.lv/en/applying-visa" },
      { "label": "Latvian Ministry of Foreign Affairs — Documents required", "url": "https://www.mfa.gov.lv/en/documents-required-apply-visa" },
      { "label": "PMLP/OCMA — Residence permit", "url": "https://www.pmlp.gov.lv/en/residence-permit" },
      { "label": "EU Immigration Portal — Employed worker in Latvia", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-latvia_en" }
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
      { "label": "Ministry of Foreign Affairs of Lithuania", "url": "https://www.urm.lt/en" },
      { "label": "Migration Department / MIGRIS", "url": "https://www.migracija.lt/home?lang=en" },
      { "label": "EU Immigration Portal — Student in Lithuania", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-lithuania_en" },
      { "label": "EU Immigration Portal — Employed worker in Lithuania", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-lithuania_en" }
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
  "nouvelle zelande": {
    "country": "Nouvelle-Zélande",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Immigration New Zealand — Visitor Visa", "url": "https://www.immigration.govt.nz/visas/visitor-visa/" },
      { "label": "Immigration New Zealand — Visas for studying", "url": "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/" },
      { "label": "Immigration New Zealand — Accredited Employer Work Visa", "url": "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/" }
    ]
  },
  "norvege": {
    "country": "Norvège",
    "verificationStatus": "verified",
    "sources": [
      { "label": "UDI — Visa D et entrée", "url": "https://www.udi.no/en/word-definitions/entry-visas-d-visas/" },
      { "label": "Norway.no — Visa visiteur", "url": "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/" },
      { "label": "Norway.no — Permis de séjour", "url": "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/" },
      { "label": "UDI — Portail des demandes", "url": "https://www.udi.no/en/" }
    ]
  },
  "pays bas": {
    "country": "Pays-Bas",
    "verificationStatus": "verified",
    "sources": [
      { "label": "IND — Court séjour", "url": "https://ind.nl/en/short-stay/short-stay-holiday-or-business-visa" },
      { "label": "IND — Études", "url": "https://ind.nl/en/residence-permits/study" },
      { "label": "Government.nl — Venir travailler", "url": "https://www.government.nl/faq/checklist-coming-to-the-nederlands-for-work" },
      { "label": "NetherlandsWorldwide — Visa", "url": "https://www.netherlandsworldwide.nl/visa-the-netherlands" }
    ]
  },
  "pologne": {
    "country": "Pologne",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Gov.pl — Informations générales visas", "url": "https://www.gov.pl/web/usa-en/visas---general-information" },
      { "label": "Study.gov.pl — Demande de visa étudiant", "url": "https://study.gov.pl/visa-application" },
      { "label": "Gov.pl — Visa national D", "url": "https://www.gov.pl/web/usa-en/d-type-national-visa" },
      { "label": "EU Immigration Portal — Étudiant en Pologne", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-poland_en" }
    ]
  },
  "portugal": {
    "country": "Portugal",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Ministère portugais — Portail des visas", "url": "https://vistos.mne.gov.pt/en/" },
      { "label": "Ministère portugais — Types de visas nationaux", "url": "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa" },
      { "label": "Consulat du Portugal — Visas", "url": "https://newark.consuladoportugal.mne.gov.pt/en/consular-matters/visa" },
      { "label": "EU Immigration Portal — Étudiant au Portugal", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-portugal_en" }
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
      { "label": "MZV — Types de visas C et D", "url": "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html" },
      { "label": "IPC — Visa long séjour études", "url": "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-visa/long-term-visa-for-the-purpose-of-studies/" },
      { "label": "IPC — Employee Card", "url": "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/" },
      { "label": "IPC — Information Portal for Foreigners", "url": "https://ipc.gov.cz/en/" }
    ]
  },
  "royaume uni": {
    "country": "Royaume-Uni",
    "verificationStatus": "verified",
    "sources": [
      { "label": "GOV.UK — Standard Visitor visa", "url": "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa" },
      { "label": "GOV.UK — Student visa", "url": "https://www.gov.uk/student-visa" },
      { "label": "GOV.UK — Skilled Worker visa", "url": "https://www.gov.uk/skilled-worker-visa" },
      { "label": "UK Visas and Immigration — Général", "url": "https://www.gov.uk/browse/visas-immigration" }
    ]
  },
  "roumanie": {
    "country": "Roumanie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "MAE Romania — Visas et Schengen", "url": "http://www.mae.ro/en/node/2035" },
      { "label": "MAE Romania — Visa national D emploi", "url": "https://www.mae.ro/en/node/2054" },
      { "label": "EU Immigration Portal — Student in Romania", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en" },
      { "label": "EU Immigration Portal — Employed worker in Romania", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-romania_en" }
    ]
  },
  "serbie": {
    "country": "Serbie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Ministry of Foreign Affairs — Visa requirements", "url": "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements" },
      { "label": "Welcome to Serbia — Portail officiel des étrangers", "url": "http://welcometoserbia.gov.rs/home" },
      { "label": "Welcome to Serbia — Residence and work permit", "url": "http://welcometoserbia.gov.rs/residence-and-work-permit" },
      { "label": "Welcome to Serbia — Visa C/D et permis", "url": "http://welcometoserbia.gov.rs/visa-d" }
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
      { "label": "Ministère slovaque — Visas pour entrer en République slovaque", "url": "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr" },
      { "label": "Ministère de l’Intérieur — Visa national", "url": "https://www.minv.sk/?application-for-national-visa-1" },
      { "label": "EU Immigration Portal — Étudiant en Slovaquie", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovakia_en" },
      { "label": "EU Immigration Portal — Travailleur salarié en Slovaquie", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovakia_en" }
    ]
  },
  "slovenie": {
    "country": "Slovénie",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Government.si — Entry and residence", "url": "https://www.gov.si/en/topics/entry-and-residence/" },
      { "label": "Government.si — Electronic visa application form", "url": "https://www.gov.si/en/registries/services/electronic-visa-application-form/" },
      { "label": "EU Immigration Portal — Student in Slovenia", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovenia_en" },
      { "label": "EU Immigration Portal — Employed worker in Slovenia", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovenia_en" }
    ]
  },
  "suede": {
    "country": "Suède",
    "verificationStatus": "verified",
    "sources": [
      { "label": "Government.se — Information sur les visas", "url": "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/" },
      { "label": "Migrationsverket — Études supérieures", "url": "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html" },
      { "label": "EU Immigration Portal — Étudiant en Suède", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-sweden_en" },
      { "label": "EU Immigration Portal — Travailleur hautement qualifié en Suède", "url": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en" }
    ]
  },
  "suisse": {
    "country": "Suisse",
    "verificationStatus": "verified",
    "sources": [
      { "label": "SEM — Travail en Suisse", "url": "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html" },
      { "label": "Confédération — Visas pour ressortissants étrangers", "url": "https://www.ch.ch/en/foreign-nationals-in-switzerland/entry-and-stay-in-switzerland/visas-for-foreign-nationals/" },
      { "label": "Représentation suisse — Visa, entrée et séjour", "url": "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland" }
    ]
  },
  "turkiye": {
    "country": "Türkiye",
    "verificationStatus": "verified",
    "sources": [
      { "label": "MFA Türkiye — Visa information for foreigners", "url": "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa" },
      { "label": "MFA Türkiye — General information about visas", "url": "https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa" },
      { "label": "Presidency of Migration Management — Residence permit types", "url": "https://en.goc.gov.tr/residence-permit-types" },
      { "label": "Presidency of Migration Management — Work permit", "url": "https://en.goc.gov.tr/work-permit" },
      { "label": "Ministry of Labour — Work permit evaluation documents", "url": "https://www.csgb.gov.tr/uigm/en/general-information/information-and-documents-required-in-the-work-permit-evaluation-process/" }
    ]
  }
};
