import React from "react";
import { MapPin, Clock, Phone } from "lucide-react";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { officeMapsUrl } from "@/lib/officeContacts";

const cameroon = { id: "cameroon" as const, ...COMPANY_PROFILE.offices.cameroon };

export default function LocationBanner() {
  return (
    <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex gap-4">
            <MapPin className="h-8 w-8 shrink-0 text-blue-300" aria-hidden="true" />
            <div>
              <h3 className="mb-1 text-lg font-bold">Siège &amp; bureau Yaoundé</h3>
              <p className="text-sm leading-relaxed text-blue-100">
                {cameroon.addressLines.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Clock className="h-8 w-8 shrink-0 text-blue-300" aria-hidden="true" />
            <div>
              <h3 className="mb-1 text-lg font-bold">Horaires</h3>
              <p className="text-sm leading-relaxed text-blue-100">
                {cameroon.openingHours.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Phone className="h-8 w-8 shrink-0 text-blue-300" aria-hidden="true" />
            <div>
              <h3 className="mb-2 text-lg font-bold">Prise de RDV</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${cameroon.whatsappNumber}?text=${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, je souhaite prendre un rendez-vous à l’agence de Yaoundé.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  WhatsApp
                </a>
                <a
                  href="/consultation"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Réserver
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-blue-400/30 pt-8 text-center">
          <p className="mb-4 text-blue-100">Visitez notre bureau Yaoundé pour un échange avec l’équipe.</p>
          <a
            href={officeMapsUrl(cameroon)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-white px-6 py-2 font-bold text-blue-900 transition hover:bg-blue-50"
            data-testid="location-banner-maps"
          >
            Voir sur Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
