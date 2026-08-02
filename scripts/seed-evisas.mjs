import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Liste complète des pays du monde avec leurs codes ISO
const COUNTRIES = [
  { code: 'AFG', name: 'Afghanistan', continent: 'Asie', flag: '🇦🇫' },
  { code: 'ALB', name: 'Albanie', continent: 'Europe', flag: '🇦🇱' },
  { code: 'DZA', name: 'Algérie', continent: 'Afrique', flag: '🇩🇿' },
  { code: 'AND', name: 'Andorre', continent: 'Europe', flag: '🇦🇩' },
  { code: 'AGO', name: 'Angola', continent: 'Afrique', flag: '🇦🇴' },
  { code: 'ATG', name: 'Antigua-et-Barbuda', continent: 'Amérique du Nord', flag: '🇦🇬' },
  { code: 'ARG', name: 'Argentine', continent: 'Amérique du Sud', flag: '🇦🇷' },
  { code: 'ARM', name: 'Arménie', continent: 'Asie', flag: '🇦🇲' },
  { code: 'AUS', name: 'Australie', continent: 'Océanie', flag: '🇦🇺' },
  { code: 'AUT', name: 'Autriche', continent: 'Europe', flag: '🇦🇹' },
  { code: 'AZE', name: 'Azerbaïdjan', continent: 'Asie', flag: '🇦🇿' },
  { code: 'BHS', name: 'Bahamas', continent: 'Amérique du Nord', flag: '🇧🇸' },
  { code: 'BHR', name: 'Bahreïn', continent: 'Asie', flag: '🇧🇭' },
  { code: 'BGD', name: 'Bangladesh', continent: 'Asie', flag: '🇧🇩' },
  { code: 'BRB', name: 'Barbade', continent: 'Amérique du Nord', flag: '🇧🇧' },
  { code: 'BLR', name: 'Biélorussie', continent: 'Europe', flag: '🇧🇾' },
  { code: 'BEL', name: 'Belgique', continent: 'Europe', flag: '🇧🇪' },
  { code: 'BLZ', name: 'Belize', continent: 'Amérique du Nord', flag: '🇧🇿' },
  { code: 'BEN', name: 'Bénin', continent: 'Afrique', flag: '🇧🇯' },
  { code: 'BTN', name: 'Bhoutan', continent: 'Asie', flag: '🇧🇹' },
  { code: 'BOL', name: 'Bolivie', continent: 'Amérique du Sud', flag: '🇧🇴' },
  { code: 'BIH', name: 'Bosnie-Herzégovine', continent: 'Europe', flag: '🇧🇦' },
  { code: 'BWA', name: 'Botswana', continent: 'Afrique', flag: '🇧🇼' },
  { code: 'BRA', name: 'Brésil', continent: 'Amérique du Sud', flag: '🇧🇷' },
  { code: 'BRN', name: 'Brunei', continent: 'Asie', flag: '🇧🇳' },
  { code: 'BGR', name: 'Bulgarie', continent: 'Europe', flag: '🇧🇬' },
  { code: 'BFA', name: 'Burkina Faso', continent: 'Afrique', flag: '🇧🇫' },
  { code: 'BDI', name: 'Burundi', continent: 'Afrique', flag: '🇧🇮' },
  { code: 'KHM', name: 'Cambodge', continent: 'Asie', flag: '🇰🇭' },
  { code: 'CMR', name: 'Cameroun', continent: 'Afrique', flag: '🇨🇲' },
  { code: 'CAN', name: 'Canada', continent: 'Amérique du Nord', flag: '🇨🇦' },
  { code: 'CPV', name: 'Cap-Vert', continent: 'Afrique', flag: '🇨🇻' },
  { code: 'CAF', name: 'République centrafricaine', continent: 'Afrique', flag: '🇨🇫' },
  { code: 'TCD', name: 'Tchad', continent: 'Afrique', flag: '🇹🇩' },
  { code: 'CHL', name: 'Chili', continent: 'Amérique du Sud', flag: '🇨🇱' },
  { code: 'CHN', name: 'Chine', continent: 'Asie', flag: '🇨🇳' },
  { code: 'COL', name: 'Colombie', continent: 'Amérique du Sud', flag: '🇨🇴' },
  { code: 'COM', name: 'Comores', continent: 'Afrique', flag: '🇰🇲' },
  { code: 'COG', name: 'Congo', continent: 'Afrique', flag: '🇨🇬' },
  { code: 'COD', name: 'République Démocratique du Congo', continent: 'Afrique', flag: '🇨🇩' },
  { code: 'CRI', name: 'Costa Rica', continent: 'Amérique du Nord', flag: '🇨🇷' },
  { code: 'HRV', name: 'Croatie', continent: 'Europe', flag: '🇭🇷' },
  { code: 'CUB', name: 'Cuba', continent: 'Amérique du Nord', flag: '🇨🇺' },
  { code: 'CYP', name: 'Chypre', continent: 'Europe', flag: '🇨🇾' },
  { code: 'CZE', name: 'République tchèque', continent: 'Europe', flag: '🇨🇿' },
  { code: 'DNK', name: 'Danemark', continent: 'Europe', flag: '🇩🇰' },
  { code: 'DJI', name: 'Djibouti', continent: 'Afrique', flag: '🇩🇯' },
  { code: 'DMA', name: 'Dominique', continent: 'Amérique du Nord', flag: '🇩🇲' },
  { code: 'DOM', name: 'République Dominicaine', continent: 'Amérique du Nord', flag: '🇩🇴' },
  { code: 'ECU', name: 'Équateur', continent: 'Amérique du Sud', flag: '🇪🇨' },
  { code: 'EGY', name: 'Égypte', continent: 'Afrique', flag: '🇪🇬' },
  { code: 'SLV', name: 'Salvador', continent: 'Amérique du Nord', flag: '🇸🇻' },
  { code: 'GNQ', name: 'Guinée équatoriale', continent: 'Afrique', flag: '🇬🇶' },
  { code: 'ERI', name: 'Érythrée', continent: 'Afrique', flag: '🇪🇷' },
  { code: 'EST', name: 'Estonie', continent: 'Europe', flag: '🇪🇪' },
  { code: 'ETH', name: 'Éthiopie', continent: 'Afrique', flag: '🇪🇹' },
  { code: 'FJI', name: 'Fidji', continent: 'Océanie', flag: '🇫🇯' },
  { code: 'FIN', name: 'Finlande', continent: 'Europe', flag: '🇫🇮' },
  { code: 'FRA', name: 'France', continent: 'Europe', flag: '🇫🇷' },
  { code: 'GAB', name: 'Gabon', continent: 'Afrique', flag: '🇬🇦' },
  { code: 'GMB', name: 'Gambie', continent: 'Afrique', flag: '🇬🇲' },
  { code: 'GEO', name: 'Géorgie', continent: 'Asie', flag: '🇬🇪' },
  { code: 'DEU', name: 'Allemagne', continent: 'Europe', flag: '🇩🇪' },
  { code: 'GHA', name: 'Ghana', continent: 'Afrique', flag: '🇬🇭' },
  { code: 'GRC', name: 'Grèce', continent: 'Europe', flag: '🇬🇷' },
  { code: 'GRD', name: 'Grenade', continent: 'Amérique du Nord', flag: '🇬🇩' },
  { code: 'GTM', name: 'Guatemala', continent: 'Amérique du Nord', flag: '🇬🇹' },
  { code: 'GIN', name: 'Guinée', continent: 'Afrique', flag: '🇬🇳' },
  { code: 'GNB', name: 'Guinée-Bissau', continent: 'Afrique', flag: '🇬🇼' },
  { code: 'GUY', name: 'Guyana', continent: 'Amérique du Sud', flag: '🇬🇾' },
  { code: 'HTI', name: 'Haïti', continent: 'Amérique du Nord', flag: '🇭🇹' },
  { code: 'HND', name: 'Honduras', continent: 'Amérique du Nord', flag: '🇭🇳' },
  { code: 'HUN', name: 'Hongrie', continent: 'Europe', flag: '🇭🇺' },
  { code: 'ISL', name: 'Islande', continent: 'Europe', flag: '🇮🇸' },
  { code: 'IND', name: 'Inde', continent: 'Asie', flag: '🇮🇳' },
  { code: 'IDN', name: 'Indonésie', continent: 'Asie', flag: '🇮🇩' },
  { code: 'IRN', name: 'Iran', continent: 'Asie', flag: '🇮🇷' },
  { code: 'IRQ', name: 'Irak', continent: 'Asie', flag: '🇮🇶' },
  { code: 'IRL', name: 'Irlande', continent: 'Europe', flag: '🇮🇪' },
  { code: 'ISR', name: 'Israël', continent: 'Asie', flag: '🇮🇱' },
  { code: 'ITA', name: 'Italie', continent: 'Europe', flag: '🇮🇹' },
  { code: 'CIV', name: 'Côte d\'Ivoire', continent: 'Afrique', flag: '🇨🇮' },
  { code: 'JAM', name: 'Jamaïque', continent: 'Amérique du Nord', flag: '🇯🇲' },
  { code: 'JPN', name: 'Japon', continent: 'Asie', flag: '🇯🇵' },
  { code: 'JOR', name: 'Jordanie', continent: 'Asie', flag: '🇯🇴' },
  { code: 'KAZ', name: 'Kazakhstan', continent: 'Asie', flag: '🇰🇿' },
  { code: 'KEN', name: 'Kenya', continent: 'Afrique', flag: '🇰🇪' },
  { code: 'KIR', name: 'Kiribati', continent: 'Océanie', flag: '🇰🇮' },
  { code: 'KWT', name: 'Koweït', continent: 'Asie', flag: '🇰🇼' },
  { code: 'KGZ', name: 'Kirghizistan', continent: 'Asie', flag: '🇰🇬' },
  { code: 'LAO', name: 'Laos', continent: 'Asie', flag: '🇱🇦' },
  { code: 'LVA', name: 'Lettonie', continent: 'Europe', flag: '🇱🇻' },
  { code: 'LBN', name: 'Liban', continent: 'Asie', flag: '🇱🇧' },
  { code: 'LSO', name: 'Lesotho', continent: 'Afrique', flag: '🇱🇸' },
  { code: 'LBR', name: 'Liberia', continent: 'Afrique', flag: '🇱🇷' },
  { code: 'LBY', name: 'Libye', continent: 'Afrique', flag: '🇱🇾' },
  { code: 'LIE', name: 'Liechtenstein', continent: 'Europe', flag: '🇱🇮' },
  { code: 'LTU', name: 'Lituanie', continent: 'Europe', flag: '🇱🇹' },
  { code: 'LUX', name: 'Luxembourg', continent: 'Europe', flag: '🇱🇺' },
  { code: 'MDG', name: 'Madagascar', continent: 'Afrique', flag: '🇲🇬' },
  { code: 'MWI', name: 'Malawi', continent: 'Afrique', flag: '🇲🇼' },
  { code: 'MYS', name: 'Malaisie', continent: 'Asie', flag: '🇲🇾' },
  { code: 'MDV', name: 'Maldives', continent: 'Asie', flag: '🇲🇻' },
  { code: 'MLI', name: 'Mali', continent: 'Afrique', flag: '🇲🇱' },
  { code: 'MLT', name: 'Malte', continent: 'Europe', flag: '🇲🇹' },
  { code: 'MHL', name: 'Îles Marshall', continent: 'Océanie', flag: '🇲🇭' },
  { code: 'MRT', name: 'Mauritanie', continent: 'Afrique', flag: '🇲🇷' },
  { code: 'MUS', name: 'Île Maurice', continent: 'Afrique', flag: '🇲🇺' },
  { code: 'MEX', name: 'Mexique', continent: 'Amérique du Nord', flag: '🇲🇽' },
  { code: 'FSM', name: 'Micronésie', continent: 'Océanie', flag: '🇫🇲' },
  { code: 'MDA', name: 'Moldavie', continent: 'Europe', flag: '🇲🇩' },
  { code: 'MCO', name: 'Monaco', continent: 'Europe', flag: '🇲🇨' },
  { code: 'MNG', name: 'Mongolie', continent: 'Asie', flag: '🇲🇳' },
  { code: 'MNE', name: 'Monténégro', continent: 'Europe', flag: '🇲🇪' },
  { code: 'MAR', name: 'Maroc', continent: 'Afrique', flag: '🇲🇦' },
  { code: 'MOZ', name: 'Mozambique', continent: 'Afrique', flag: '🇲🇿' },
  { code: 'MMR', name: 'Birmanie', continent: 'Asie', flag: '🇲🇲' },
  { code: 'NAM', name: 'Namibie', continent: 'Afrique', flag: '🇳🇦' },
  { code: 'NRU', name: 'Nauru', continent: 'Océanie', flag: '🇳🇷' },
  { code: 'NPL', name: 'Népal', continent: 'Asie', flag: '🇳🇵' },
  { code: 'NLD', name: 'Pays-Bas', continent: 'Europe', flag: '🇳🇱' },
  { code: 'NZL', name: 'Nouvelle-Zélande', continent: 'Océanie', flag: '🇳🇿' },
  { code: 'NIC', name: 'Nicaragua', continent: 'Amérique du Nord', flag: '🇳🇮' },
  { code: 'NER', name: 'Niger', continent: 'Afrique', flag: '🇳🇪' },
  { code: 'NGA', name: 'Nigéria', continent: 'Afrique', flag: '🇳🇬' },
  { code: 'PRK', name: 'Corée du Nord', continent: 'Asie', flag: '🇰🇵' },
  { code: 'NOR', name: 'Norvège', continent: 'Europe', flag: '🇳🇴' },
  { code: 'OMN', name: 'Oman', continent: 'Asie', flag: '🇴🇲' },
  { code: 'PAK', name: 'Pakistan', continent: 'Asie', flag: '🇵🇰' },
  { code: 'PLW', name: 'Palaos', continent: 'Océanie', flag: '🇵🇼' },
  { code: 'PSE', name: 'Palestine', continent: 'Asie', flag: '🇵🇸' },
  { code: 'PAN', name: 'Panama', continent: 'Amérique du Nord', flag: '🇵🇦' },
  { code: 'PNG', name: 'Papouasie-Nouvelle-Guinée', continent: 'Océanie', flag: '🇵🇬' },
  { code: 'PRY', name: 'Paraguay', continent: 'Amérique du Sud', flag: '🇵🇾' },
  { code: 'PER', name: 'Pérou', continent: 'Amérique du Sud', flag: '🇵🇪' },
  { code: 'PHL', name: 'Philippines', continent: 'Asie', flag: '🇵🇭' },
  { code: 'POL', name: 'Pologne', continent: 'Europe', flag: '🇵🇱' },
  { code: 'PRT', name: 'Portugal', continent: 'Europe', flag: '🇵🇹' },
  { code: 'QAT', name: 'Qatar', continent: 'Asie', flag: '🇶🇦' },
  { code: 'ROU', name: 'Roumanie', continent: 'Europe', flag: '🇷🇴' },
  { code: 'RUS', name: 'Russie', continent: 'Europe', flag: '🇷🇺' },
  { code: 'RWA', name: 'Rwanda', continent: 'Afrique', flag: '🇷🇼' },
  { code: 'KNA', name: 'Saint-Christophe-et-Niévès', continent: 'Amérique du Nord', flag: '🇰🇳' },
  { code: 'LCA', name: 'Sainte-Lucie', continent: 'Amérique du Nord', flag: '🇱🇨' },
  { code: 'VCT', name: 'Saint-Vincent-et-les-Grenadines', continent: 'Amérique du Nord', flag: '🇻🇨' },
  { code: 'WSM', name: 'Samoa', continent: 'Océanie', flag: '🇼🇸' },
  { code: 'SMR', name: 'Saint-Marin', continent: 'Europe', flag: '🇸🇲' },
  { code: 'STP', name: 'São Tomé-et-Príncipe', continent: 'Afrique', flag: '🇸🇹' },
  { code: 'SAU', name: 'Arabie saoudite', continent: 'Asie', flag: '🇸🇦' },
  { code: 'SEN', name: 'Sénégal', continent: 'Afrique', flag: '🇸🇳' },
  { code: 'SRB', name: 'Serbie', continent: 'Europe', flag: '🇷🇸' },
  { code: 'SYC', name: 'Seychelles', continent: 'Afrique', flag: '🇸🇨' },
  { code: 'SLE', name: 'Sierra Leone', continent: 'Afrique', flag: '🇸🇱' },
  { code: 'SGP', name: 'Singapour', continent: 'Asie', flag: '🇸🇬' },
  { code: 'SVK', name: 'Slovaquie', continent: 'Europe', flag: '🇸🇰' },
  { code: 'SVN', name: 'Slovénie', continent: 'Europe', flag: '🇸🇮' },
  { code: 'SLB', name: 'Îles Salomon', continent: 'Océanie', flag: '🇸🇧' },
  { code: 'SOM', name: 'Somalie', continent: 'Afrique', flag: '🇸🇴' },
  { code: 'ZAF', name: 'Afrique du Sud', continent: 'Afrique', flag: '🇿🇦' },
  { code: 'KOR', name: 'Corée du Sud', continent: 'Asie', flag: '🇰🇷' },
  { code: 'SSD', name: 'Soudan du Sud', continent: 'Afrique', flag: '🇸🇸' },
  { code: 'ESP', name: 'Espagne', continent: 'Europe', flag: '🇪🇸' },
  { code: 'LKA', name: 'Sri Lanka', continent: 'Asie', flag: '🇱🇰' },
  { code: 'SDN', name: 'Soudan', continent: 'Afrique', flag: '🇸🇩' },
  { code: 'SUR', name: 'Surinam', continent: 'Amérique du Sud', flag: '🇸🇷' },
  { code: 'SWZ', name: 'Eswatini', continent: 'Afrique', flag: '🇸🇿' },
  { code: 'SWE', name: 'Suède', continent: 'Europe', flag: '🇸🇪' },
  { code: 'CHE', name: 'Suisse', continent: 'Europe', flag: '🇨🇭' },
  { code: 'SYR', name: 'Syrie', continent: 'Asie', flag: '🇸🇾' },
  { code: 'TWN', name: 'Taïwan', continent: 'Asie', flag: '🇹🇼' },
  { code: 'TJK', name: 'Tadjikistan', continent: 'Asie', flag: '🇹🇯' },
  { code: 'TZA', name: 'Tanzanie', continent: 'Afrique', flag: '🇹🇿' },
  { code: 'THA', name: 'Thaïlande', continent: 'Asie', flag: '🇹🇭' },
  { code: 'TLS', name: 'Timor oriental', continent: 'Asie', flag: '🇹🇱' },
  { code: 'TGO', name: 'Togo', continent: 'Afrique', flag: '🇹🇬' },
  { code: 'TON', name: 'Tonga', continent: 'Océanie', flag: '🇹🇴' },
  { code: 'TTO', name: 'Trinité-et-Tobago', continent: 'Amérique du Nord', flag: '🇹🇹' },
  { code: 'TUN', name: 'Tunisie', continent: 'Afrique', flag: '🇹🇳' },
  { code: 'TUR', name: 'Turquie', continent: 'Asie', flag: '🇹🇷' },
  { code: 'TKM', name: 'Turkménistan', continent: 'Asie', flag: '🇹🇲' },
  { code: 'TUV', name: 'Tuvalu', continent: 'Océanie', flag: '🇹🇻' },
  { code: 'UGA', name: 'Ouganda', continent: 'Afrique', flag: '🇺🇬' },
  { code: 'UKR', name: 'Ukraine', continent: 'Europe', flag: '🇺🇦' },
  { code: 'ARE', name: 'Émirats arabes unis', continent: 'Asie', flag: '🇦🇪' },
  { code: 'GBR', name: 'Royaume-Uni', continent: 'Europe', flag: '🇬🇧' },
  { code: 'USA', name: 'États-Unis', continent: 'Amérique du Nord', flag: '🇺🇸' },
  { code: 'URY', name: 'Uruguay', continent: 'Amérique du Sud', flag: '🇺🇾' },
  { code: 'UZB', name: 'Ouzbékistan', continent: 'Asie', flag: '🇺🇿' },
  { code: 'VUT', name: 'Vanuatu', continent: 'Océanie', flag: '🇻🇺' },
  { code: 'VAT', name: 'Vatican', continent: 'Europe', flag: '🇻🇦' },
  { code: 'VEN', name: 'Venezuela', continent: 'Amérique du Sud', flag: '🇻🇪' },
  { code: 'VNM', name: 'Vietnam', continent: 'Asie', flag: '🇻🇳' },
  { code: 'YEM', name: 'Yémen', continent: 'Asie', flag: '🇾🇪' },
  { code: 'ZMB', name: 'Zambie', continent: 'Afrique', flag: '🇿🇲' },
  { code: 'ZWE', name: 'Zimbabwe', continent: 'Afrique', flag: '🇿🇼' },
];

// Fonction pour générer les informations e-visa avec l'IA
async function generateEvisaInfoWithAI(country) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not set');
    return null;
  }

  const prompt = `Generate e-visa information for ${country.name} in JSON format. Include:
{
  "description": "Brief description of the country and its e-visa program",
  "evisaType": "Type of e-visa (tourism, business, etc.)",
  "processingTime": "Processing time (e.g., '3-5 days')",
  "validity": "Visa validity (e.g., '90 days')",
  "stayDuration": "Maximum stay duration",
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "documents": ["Document 1", "Document 2", "Document 3"],
  "eligibility": ["Eligibility criterion 1", "Eligibility criterion 2"],
  "restrictions": ["Restriction 1", "Restriction 2"],
  "advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "visaFee": 0
}
Respond only with valid JSON, no markdown formatting.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error(`API error for ${country.name}:`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`No JSON found in response for ${country.name}`);
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Error generating info for ${country.name}:`, error.message);
    return null;
  }
}

// Fonction pour créer l'enregistrement e-visa
async function createEvisaRecord(country, aiInfo) {
  return {
    countryCode: country.code,
    countryName: country.name,
    countryFlag: country.flag,
    continent: country.continent,
    region: country.continent,
    description: aiInfo?.description || `E-visa program for ${country.name}`,
    evisaType: aiInfo?.evisaType || 'Tourism',
    visaFee: aiInfo?.visaFee || 0,
    accompanimentFee: 25000, // Frais d'accompagnement standardisés
    totalCost: (aiInfo?.visaFee || 0) + 25000,
    currency: 'XOF',
    processingTime: aiInfo?.processingTime || '5-10 days',
    validity: aiInfo?.validity || '90 days',
    stayDuration: aiInfo?.stayDuration || '90 days',
    requirements: JSON.stringify(aiInfo?.requirements || []),
    documents: JSON.stringify(aiInfo?.documents || []),
    eligibility: JSON.stringify(aiInfo?.eligibility || []),
    restrictions: JSON.stringify(aiInfo?.restrictions || []),
    advantages: JSON.stringify(aiInfo?.advantages || []),
    additionalInfo: `E-visa program for ${country.name}. Standard accompaniment fee: 25,000 XOF`,
    isActive: true,
    isPopular: ['CAN', 'USA', 'AUS', 'NZL', 'SGP', 'JPN', 'THA', 'ARE'].includes(country.code),
    aiGenerated: true,
  };
}

// Fonction principale
async function main() {
  console.log(`Starting e-visa data generation for ${COUNTRIES.length} countries...`);
  
  const evisaRecords = [];
  let processed = 0;
  
  for (const country of COUNTRIES) {
    try {
      console.log(`Processing ${country.name} (${country.code})...`);
      
      // Générer les informations avec l'IA (avec délai pour éviter les limites de taux)
      const aiInfo = await generateEvisaInfoWithAI(country);
      
      // Créer l'enregistrement
      const record = await createEvisaRecord(country, aiInfo);
      evisaRecords.push(record);
      
      processed++;
      
      // Ajouter un délai pour éviter les limites de taux API
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${COUNTRIES.length} countries. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error processing ${country.name}:`, error.message);
    }
  }
  
  // Sauvegarder les données dans un fichier JSON
  const outputPath = path.join(__dirname, '..', 'data', 'evisas-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(evisaRecords, null, 2));
  
  console.log(`\nGenerated ${evisaRecords.length} e-visa records`);
  console.log(`Data saved to ${outputPath}`);
}

main().catch(console.error);
