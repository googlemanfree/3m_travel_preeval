import { useEffect } from "react";
import { COMPANY_FOUNDER, COMPANY_PROFILE, GROUP_LEGAL_NAME } from "@/lib/companyContacts";
import { setPageSeo } from "@/lib/pageSeo";

export default function MentionsLegales() {
  useEffect(() => {
    setPageSeo({
      title: "Mentions légales | 3M TRAVEL AGENCY",
      description:
        "Mentions légales 3M TRAVEL AGENCY : éditeur, RC et NIU, directeur de publication, hébergeur et contact.",
    });
  }, []);

  const yaounde = COMPANY_PROFILE.offices.cameroon;
  const identity = COMPANY_PROFILE.legalIdentifiers;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="mb-2 text-4xl font-bold">Mentions légales</h1>
          <p className="text-blue-100">Dernière mise à jour : 17 octobre 2026</p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8 rounded-lg bg-white p-8 shadow-sm text-gray-700 leading-relaxed">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Éditeur du site</h2>
            <p>
              Le site <strong>www.3mtravelagency.com</strong> est édité par{" "}
              <strong>{COMPANY_PROFILE.legalDisplayName}</strong>.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                Raison sociale : <strong>{COMPANY_PROFILE.legalName}</strong>
              </li>
              <li>
                Enseigne commerciale : <strong>{COMPANY_PROFILE.publicName}</strong>
              </li>
              <li>
                Société mère : <strong>{GROUP_LEGAL_NAME}</strong>
              </li>
              <li>
                Immatriculation : {COMPANY_PROFILE.legalIdentifiers.registration} — {identity.registryAuthority}
              </li>
              <li>NIU : {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</li>
              <li>Siège : {yaounde.addressLines.join(", ")}</li>
              <li>
                E-mail :{" "}
                <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="font-semibold text-blue-700 hover:underline">
                  {COMPANY_PROFILE.publicEmail}
                </a>
              </li>
              <li>
                Téléphone / WhatsApp Yaoundé : {yaounde.whatsappDisplay}
                {yaounde.phoneDisplay ? ` · fixe ${yaounde.phoneDisplay}` : ""}
              </li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">{COMPANY_PROFILE.groupRole}</p>
            <p className="mt-3 text-sm">
              Vérification au registre :{" "}
              <a href={identity.registrySearchUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
                portail RCCM OHADA
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Directeur de la publication</h2>
            <p>
              Directeur de la publication :{" "}
              <a href="/about#aureol-donfack" className="font-semibold text-blue-700 hover:underline">
                {COMPANY_FOUNDER.name}
              </a>
              , {COMPANY_FOUNDER.jobTitle} de {GROUP_LEGAL_NAME}.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Hébergeur</h2>
            <p>
              <strong>{COMPANY_PROFILE.hosting.providerName}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">{COMPANY_PROFILE.hosting.providerNote}</p>
            <p className="mt-2 text-sm">
              Contact éditeur pour l’hébergement :{" "}
              <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="text-blue-700 hover:underline">
                {COMPANY_PROFILE.publicEmail}
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Propriété intellectuelle</h2>
            <p>
              Les contenus du site (textes, visuels, marques, logos) sont protégés. Toute reproduction non autorisée est
              interdite. La marque publique <strong>3M TRAVEL AGENCY</strong> désigne l’enseigne exploitée par{" "}
              {COMPANY_PROFILE.legalName}.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Données personnelles et conditions</h2>
            <p>
              Le traitement des données est décrit dans la{" "}
              <a href="/politique-confidentialite" className="font-semibold text-blue-700 hover:underline">
                politique de confidentialité
              </a>
              . Les conditions de service figurent dans les{" "}
              <a href="/conditions-utilisation" className="font-semibold text-blue-700 hover:underline">
                conditions d’utilisation
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Noms de domaine</h2>
            <p>
              Le site officiel est <strong>www.3mtravelagency.com</strong>. Toute adresse alternative (notamment{" "}
              <strong>3mtravelagency.click</strong>) doit renvoyer vers ce domaine en redirection permanente (301).
              N’utilisez pas le .click pour les flyers, posts WhatsApp ou Facebook.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
