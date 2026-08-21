import mysql from "mysql2/promise";

const cities = [
  { key: "douala", city: "Douala", country: "Cameroun", bbox: "4.000,9.550,4.150,9.850" },
  { key: "yaounde", city: "Yaoundé", country: "Cameroun", bbox: "3.750,11.400,3.980,11.650" },
  { key: "kribi", city: "Kribi", country: "Cameroun", bbox: "2.850,9.860,2.990,9.970" },
  { key: "limbe", city: "Limbe", country: "Cameroun", bbox: "4.000,9.150,4.080,9.280" },
  { key: "libreville", city: "Libreville", country: "Gabon", bbox: "0.310,9.350,0.550,9.570" },
  { key: "brazzaville", city: "Brazzaville", country: "République du Congo", bbox: "-4.360,15.150,-4.150,15.360" },
  { key: "ndjamena", city: "N'Djamena", country: "Tchad", bbox: "12.000,15.000,12.200,15.200" },
  { key: "malabo", city: "Malabo", country: "Guinée équatoriale", bbox: "3.700,8.690,3.820,8.860" },
  { key: "bangui", city: "Bangui", country: "République centrafricaine", bbox: "4.280,18.480,4.480,18.700" },
];

const endpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const attribution = "© OpenStreetMap contributors, ODbL";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function asOfficialUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("www.") ? `https://${value}` : value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toEntry(element, city) {
  const tags = element.tags ?? {};
  const amenities = [
    ...(tags.swimming_pool === "yes" || tags.pool === "yes" || tags.leisure === "swimming_pool" ? ["pool"] : []),
    ...(tags.internet_access === "wlan" || tags.internet_access === "wifi" || tags.wifi === "yes" ? ["wifi"] : []),
    ...(tags.parking === "yes" || tags.amenity === "parking" ? ["parking"] : []),
  ];
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  return {
    sourceId: `osm:${element.type}:${element.id}`,
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    name: tags.name.trim(),
    country: city.country,
    city: city.city,
    address: [tags["addr:housenumber"], tags["addr:street"], tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ") || null,
    latitude,
    longitude,
    officialWebsiteUrl: asOfficialUrl(tags.website || tags["contact:website"]),
    officialBookingUrl: asOfficialUrl(tags["booking:website"] || tags["reservation:website"]),
    phone: tags.phone || tags["contact:phone"] || null,
    stars: /^\d+$/.test(tags.stars || "") ? Number(tags.stars) : null,
    amenitiesJson: JSON.stringify(amenities),
    rawSourceJson: JSON.stringify({ type: element.type, id: element.id, tags }),
  };
}

async function fetchCity(city) {
  const data = `[out:json][timeout:25];(nwr["tourism"="hotel"](${city.bbox}););out center tags;`;
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const endpoint = endpoints[attempt % endpoints.length];
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "3M-Booking-Catalog/1.0 (hello@3mtravelagency.com)" },
        body: new URLSearchParams({ data }).toString(),
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) throw new Error(`${endpoint} → HTTP ${response.status}`);
      const payload = await response.json();
      return (payload.elements ?? []).filter((element) => element.tags?.name?.trim()).map((element) => toEntry(element, city));
    } catch (error) {
      lastError = error;
      await sleep(2_000 * (attempt + 1));
    }
  }
  throw lastError;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL indisponible.");
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  const reports = [];
  try {
    for (const city of cities) {
      try {
        const entries = await fetchCity(city);
        for (const entry of entries) {
          await db.execute(
            `INSERT INTO hotel_catalog (source, sourceId, sourceUrl, sourceAttribution, name, country, city, address, latitude, longitude, officialWebsiteUrl, officialBookingUrl, phone, stars, amenitiesJson, rawSourceJson, verificationStatus)
             VALUES ('openstreetmap', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'imported')
             ON DUPLICATE KEY UPDATE sourceUrl = VALUES(sourceUrl), sourceAttribution = VALUES(sourceAttribution), name = VALUES(name), country = VALUES(country), city = VALUES(city), address = VALUES(address), latitude = VALUES(latitude), longitude = VALUES(longitude), officialWebsiteUrl = VALUES(officialWebsiteUrl), officialBookingUrl = VALUES(officialBookingUrl), phone = VALUES(phone), stars = VALUES(stars), amenitiesJson = VALUES(amenitiesJson), rawSourceJson = VALUES(rawSourceJson), lastImportedAt = CURRENT_TIMESTAMP`,
            [entry.sourceId, entry.sourceUrl, attribution, entry.name, entry.country, entry.city, entry.address, entry.latitude, entry.longitude, entry.officialWebsiteUrl, entry.officialBookingUrl, entry.phone, entry.stars, entry.amenitiesJson, entry.rawSourceJson],
          );
        }
        reports.push({ city: city.city, imported: entries.length, missingOfficialLink: entries.filter((entry) => !entry.officialBookingUrl && !entry.officialWebsiteUrl).length });
      } catch (error) {
        reports.push({ city: city.city, imported: 0, error: error instanceof Error ? error.message : String(error) });
      }
    }
  } finally {
    await db.end();
  }
  console.log(JSON.stringify(reports, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
