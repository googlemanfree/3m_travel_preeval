import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Phone, Mail, Globe, MapPin, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import type { CountryProcedure } from "@/data/countryProcedures/types";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";
import DocumentProcessIllustration from "@/components/illustrations/DocumentProcessIllustration";

/**
 * Fiche procédure pays réutilisable — structure officielle 3M Travel & Services
 * (vision, alerte anti-arnaque, étapes détaillées, frais, paiement, FAQ).
 * Alimentée par les données de /data/countryProcedures/<pays>.ts — pour ajouter
 * un nouveau pays, créer un fichier de données suivant le même modèle
 * (types.ts) et l'utiliser avec ce composant.
 */
export default function CountryProcedureTemplate({ data }: { data: CountryProcedure }) {
  const whatsappHref = `https://wa.me/${data.contact.phones[0].replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je souhaite une consultation gratuite pour la procédure ${data.country} (${data.visaType}).`
  )}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bandeau */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-5xl">{data.flag}</span>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-4">{data.title}</h1>
          <p className="text-blue-200 mt-2">{data.subtitle} — édition {data.editionYear}</p>
          <p className="text-sm text-blue-300 mt-4 italic">« Votre mobilité, notre expertise. Votre réussite, notre mission. »</p>
          <div className="max-w-sm mx-auto mt-6">
            <DocumentProcessIllustration className="w-full h-auto opacity-95" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* 01 — Introduction */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">01 — Introduction & Vision Globale</h2>
          <Card className="p-6">
            <p className="text-gray-700 mb-4">{data.intro.vision}</p>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-semibold text-gray-900">Éligibilité</dt><dd className="text-gray-600">{data.intro.eligibility}</dd></div>
              <div><dt className="font-semibold text-gray-900">Secteurs couverts</dt><dd className="text-gray-600">{data.intro.sectors.join(", ")}</dd></div>
              <div><dt className="font-semibold text-gray-900">Dossier requis</dt><dd className="text-gray-600">{data.intro.requiredDocs}</dd></div>
              <div><dt className="font-semibold text-gray-900">Notre engagement</dt><dd className="text-gray-600">{data.intro.commitment}</dd></div>
              <div><dt className="font-semibold text-gray-900">Représentation consulaire</dt><dd className="text-green-700 font-medium">{data.intro.consularRepresentation}</dd></div>
            </dl>
          </Card>
        </section>

        {data.officialSources?.length ? (
          <section aria-labelledby="official-sources-title">
            <h2 id="official-sources-title" className="text-xl font-bold text-blue-900 mb-4">Sources officielles à vérifier</h2>
            <Card className="p-6 border-blue-100 bg-blue-50/40">
              <p className="text-sm text-gray-600 mb-4">Ces portails publics servent de référence. Les conditions et pièces doivent être vérifiées au moment de la démarche.</p>
              <ul className="space-y-3">
                {data.officialSources.map((source) => (
                  <li key={source.url} className="rounded-lg border border-blue-100 bg-white p-4">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{source.label}</a>
                    <p className="mt-1 text-sm text-gray-600">{source.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ) : null}

        {/* 02 — Alerte anti-arnaque */}
        <section>
          <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> 02 — Alerte Officielle : Arnaques Confirmées
          </h2>
          <Card className="p-6 border-2 border-red-200">
            <p className="text-gray-800 mb-4">{data.fraudAlert.summary}</p>
            <div className="space-y-3 mb-4">
              {data.fraudAlert.fakeExamples.map((ex) => (
                <div key={ex.name} className="bg-red-50 rounded-lg p-3">
                  <p className="font-semibold text-red-800 text-sm">{ex.name}</p>
                  <p className="text-red-700 text-sm">{ex.description}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-700 text-white rounded-lg p-4 mb-4">
              <p className="font-semibold">Règle d'or officielle :</p>
              <p>{data.fraudAlert.goldenRule}</p>
            </div>
            <p className="text-xs text-gray-500 mb-4">{data.fraudAlert.sources}</p>
            <p className="font-semibold text-gray-900 mb-2">Signaux d'alerte à connaître :</p>
            <ul className="space-y-1">
              {data.fraudAlert.warningSigns.map((sign) => (
                <li key={sign} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-red-500">•</span> {sign}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* 03 — Vue d'ensemble des étapes */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">03 — Les {data.steps.length} Étapes de la Procédure</h2>
          <div className="space-y-3">
            {data.steps.map((step) => (
              <Card key={step.number} className="p-4 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                  {step.number}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{step.title}</p>
                  <p className="text-sm text-blue-700">{step.responsible}</p>
                  <p className="text-sm text-gray-600 mt-1">{step.shortDescription}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 04 — Détail des étapes */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">04 — Détail des Étapes</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {data.steps.map((step) => (
              <AccordionItem key={step.number} value={`step-${step.number}`} className="bg-white border border-gray-200 rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold text-gray-900">{step.number}. {step.title}</span>
                  <span className="text-sm text-gray-500 ml-2">— {step.responsible}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <dl className="space-y-2">
                    {step.details.map((d) => (
                      <div key={d.label}>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">{d.label}</dt>
                        <dd className={d.highlight ? "text-green-700 font-medium text-sm" : "text-gray-700 text-sm"}>{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* 05 — Protection anti-arnaque */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Comment 3M Travel Vous Protège
          </h2>
          <Card className="p-6">
            <ul className="space-y-2">
              {data.antiScamMeasures.map((m) => (
                <li key={m} className="flex gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> {m}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* 06 — Frais */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">06 — Estimation des Frais — Budget Global {data.totalBudgetLabel}</h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="text-left p-3">Poste de frais</th>
                  <th className="text-left p-3 hidden sm:table-cell">Détail</th>
                  <th className="text-right p-3">Montant</th>
                  <th className="text-right p-3">Charge</th>
                </tr>
              </thead>
              <tbody>
                {data.fees.map((fee, i) => (
                  <tr key={fee.label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-3 font-medium text-gray-900">{fee.label}</td>
                    <td className="p-3 text-gray-600 hidden sm:table-cell">{fee.detail}</td>
                    <td className="p-3 text-right font-semibold">{fee.amount}</td>
                    <td className={`p-3 text-right text-xs font-semibold ${fee.chargedTo === "Employeur" ? "text-green-600" : "text-gray-500"}`}>{fee.chargedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-red-50 border-t border-red-200 p-4 text-sm text-red-800">
              {data.transparencyNote}
            </div>
          </Card>
        </section>

        {/* 07 — Modalités de paiement */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">07 — Modalités de Paiement</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.paymentOptions.map((opt) => (
              <Card key={opt.name} className="p-4">
                <p className="font-semibold text-gray-900">{opt.name}</p>
                <p className="text-xl font-bold text-blue-700 my-1">{opt.amount}</p>
                <p className="text-xs text-gray-600">{opt.conditions}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3 bg-blue-50 rounded-lg p-3">{data.paymentNote}</p>
        </section>

        {/* 08 — FAQ */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-4">08 — Foire Aux Questions</h2>
          <Accordion type="single" collapsible className="space-y-3">
            {data.faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-gray-200 rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold text-gray-900">{item.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Demande de consultation avec CV */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-2 text-center">Demander ma consultation gratuite</h2>
          <p className="text-center text-gray-500 text-sm mb-6 max-w-xl mx-auto">
            Joignez votre CV pour une analyse personnalisée de votre profil par notre équipe. Vous recevrez une réponse détaillée par email.
          </p>
          <ConsultationRequestForm defaultCountry={data.country} />
        </section>

        {/* Contacts officiels */}
        <section>
          <Card className="p-6 bg-gradient-to-br from-blue-900 to-indigo-900 text-white text-center">
            <h3 className="font-bold text-lg mb-1">3M TRAVEL & SERVICES SARL</h3>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {data.contact.phones.join(" / ")}</span>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {data.contact.email}</span>
              <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {data.contact.website}</span>
            </div>
            <p className="flex items-center justify-center gap-1 text-sm mt-3 text-blue-200"><MapPin className="w-4 h-4" /> {data.contact.address}</p>
            <p className="text-sm mt-2 text-blue-200">{data.contact.consulate}</p>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-block mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full transition-colors">
              💬 Nous contacter directement sur WhatsApp
            </a>
            <p className="text-xs text-blue-300 mt-4 italic">{data.documentNote}</p>
          </Card>
        </section>
      </div>
    </div>
  );
}
