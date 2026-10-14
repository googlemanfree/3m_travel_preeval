import { useEffect } from "react";
import { COMPANY_FOUNDER, COMPANY_PROFILE, GROUP_LEGAL_NAME } from "@/lib/companyContacts";
import { setPageSeo } from "@/lib/pageSeo";

export default function ConditionsUtilisation() {
  useEffect(() => {
    setPageSeo({
      title: "Conditions d’utilisation | 3M TRAVEL AGENCY",
      description:
        "Conditions d’utilisation 3M TRAVEL AGENCY : entité, prestations et exclusions, paiement, réclamations, confidentialité et annulation.",
    });
  }, []);

  const yaounde = COMPANY_PROFILE.offices.cameroon;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
        <div className="container mx-auto px-4">
          <h1 className="mb-2 text-4xl font-bold">Conditions d’utilisation</h1>
          <p className="text-blue-100">Dernière mise à jour : 14 octobre 2026</p>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8 rounded-lg bg-white p-8 shadow-sm">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Entité éditrice</h2>
            <p className="leading-relaxed text-gray-700">
              Le site est édité par <strong>{COMPANY_PROFILE.legalName}</strong> (exploitation commerciale de{" "}
              <strong>{GROUP_LEGAL_NAME}</strong>), agence enregistrée sous le numéro {COMPANY_PROFILE.legalIdentifiers.registration}
              {COMPANY_PROFILE.legalIdentifiers.taxpayerId ? ` (NIU : ${COMPANY_PROFILE.legalIdentifiers.taxpayerId})` : ""}, spécialisée dans
              l’accompagnement à la mobilité internationale.
            </p>
            <p className="mt-3 leading-relaxed text-gray-700">
              Fondateur et PDG :{" "}
              <a href="/about#aureol-donfack" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                {COMPANY_FOUNDER.name}
              </a>
              . Siège : {yaounde.addressLines.join(", ")}. Contact :{" "}
              <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="text-blue-700 hover:underline">
                {COMPANY_PROFILE.publicEmail}
              </a>
              .
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Marque publique : <strong>3M TRAVEL AGENCY</strong>. Le nom légal figure sur les contrats, reçus et documents juridiques.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Prestations et exclusions</h2>
            <p className="mb-4 leading-relaxed text-gray-700">
              3M TRAVEL AGENCY propose des services de conseil, d’évaluation de profil, de préparation de dossiers, de suivi
              administratif, de billetterie, d’assurance voyage et de traduction assermentée, dans le périmètre écrit convenu avec le client.
            </p>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-900">
                3M TRAVEL AGENCY ne délivre aucun visa, permis de travail, admission universitaire ni contrat d’emploi. La décision
                finale appartient exclusivement aux autorités, établissements, employeurs ou fournisseurs concernés.
              </p>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
              <li>Aucune garantie de résultat consulaire, d’admission ou de placement n’est vendue comme telle.</li>
              <li>Les informations publiées (délais, coûts consulaires) sont indicatives et doivent être confirmées sur les portails officiels.</li>
              <li>Les frais payés à des tiers (consulats, biométrie, assurances, traductions, universités, compagnies aériennes) sont exclus des honoraires d’agence, sauf mention écrite contraire.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">3. Compte candidat et évaluation</h2>
            <p className="leading-relaxed text-gray-700">
              Un formulaire d’évaluation rapide peut être commencé sans compte. Pour enregistrer un dossier, suivre son statut et
              déposer des pièces sensibles (notamment un CV pour un projet travail), la création d’un compte gratuit avec activation
              par e-mail est requise. Vous êtes responsable de la confidentialité de vos identifiants et de l’exactitude des
              informations transmises.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">4. Modalités de paiement</h2>
            <p className="leading-relaxed text-gray-700">
              Les frais d’ouverture de dossier commencent indicativement à partir de 65 000 FCFA selon le profil ; le montant exact
              et les honoraires d’accompagnement sont confirmés par écrit avant tout règlement. Un reçu officiel est remis (paiement
              en ligne via le guichet sécurisé ou en agence).
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              <li>Aucun paiement n’est exigé pour la seule évaluation de profil.</li>
              <li>Les formules (intégral, échelonné, différé) et leurs conditions figurent dans le protocole avant le premier paiement.</li>
              <li>Les règlements d’ouverture s’effectuent uniquement via les canaux officiels de l’agence.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              Voir aussi la page{" "}
              <a href="/tarifs" className="font-semibold text-blue-700 hover:underline">
                Tarifs
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Annulation et remboursement</h2>
            <p className="leading-relaxed text-gray-700">
              Il n’existe pas de remboursement automatique. Les conditions d’arrêt de dossier ou de remboursement partiel sont celles
              du protocole signé avant paiement. Les frais d’ouverture ne sont en principe pas remboursables une fois le traitement
              engagé, sauf disposition légale impérative contraire. Les sommes déjà versées à des autorités ou fournisseurs tiers
              suivent les règles de ces organismes.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Obligations du client</h2>
            <p className="leading-relaxed text-gray-700">
              Le client s’engage à fournir des informations et documents exacts, complets et authentiques, et à répondre aux demandes
              de complément dans des délais raisonnables. 3M TRAVEL AGENCY ne saurait être tenue responsable des conséquences liées à
              des informations erronées, incomplètes ou falsifiées fournies par le client.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">7. Réclamations</h2>
            <p className="leading-relaxed text-gray-700">
              Toute réclamation relative à un service peut être adressée à{" "}
              <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="text-blue-700 hover:underline">
                {COMPANY_PROFILE.publicEmail}
              </a>{" "}
              ou via la page{" "}
              <a href="/contact" className="font-semibold text-blue-700 hover:underline">
                Contact
              </a>
              , en précisant la référence de dossier le cas échéant. L’agence accuse réception et répond dans un délai raisonnable
              (objectif : sous 5 jours ouvrés). Les litiges non résolus amiablement relèvent des juridictions compétentes de Yaoundé.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">8. Confidentialité et données personnelles</h2>
            <p className="leading-relaxed text-gray-700">
              Le traitement des données personnelles (évaluation, compte, pièces, suivi) est décrit dans la{" "}
              <a href="/politique-confidentialite" className="font-semibold text-blue-700 hover:underline">
                Politique de confidentialité
              </a>
              . Les documents sensibles sont destinés au suivi du dossier et ne sont pas revendus. Le partage anonymisé avec des
              partenaires potentiels n’a lieu qu’avec votre accord explicite.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">9. Responsabilité</h2>
            <p className="leading-relaxed text-gray-700">
              3M TRAVEL AGENCY met en œuvre les moyens raisonnables pour accompagner chaque dossier, sans pouvoir garantir l’issue
              d’une procédure qui relève de la seule compétence des autorités ou tiers concernés. Les délais et coûts publiés sur le
              site sont des repères ; la source institutionnelle prime en cas d’écart.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">10. Propriété intellectuelle</h2>
            <p className="leading-relaxed text-gray-700">
              L’ensemble des contenus du site (textes, guides, logo, visuels de marque) est la propriété de {COMPANY_PROFILE.legalName}
              ou de ses ayants droit et ne peut être reproduit sans autorisation.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">11. Droit applicable</h2>
            <p className="leading-relaxed text-gray-700">
              Les présentes conditions sont soumises au droit camerounais. Tout litige relève de la compétence des juridictions de
              Yaoundé, sous réserve des dispositions impératives applicables.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">12. Contact</h2>
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-6 text-gray-700">
              <p>
                <strong>{COMPANY_PROFILE.legalName}</strong>
              </p>
              <p>
                {yaounde.addressLines[0]}
                {yaounde.addressLines[1] ? ` — ${yaounde.addressLines[1]}` : ""}
              </p>
              <p>
                <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="text-blue-600 hover:underline">
                  {COMPANY_PROFILE.publicEmail}
                </a>
              </p>
              <p>
                <a href={`tel:+${yaounde.whatsappNumber}`} className="text-blue-600 hover:underline">
                  {yaounde.whatsappDisplay}
                </a>
                {yaounde.phoneDisplay ? (
                  <>
                    {" / "}
                    <a href={`tel:${yaounde.phoneDisplay.replace(/\s/g, "")}`} className="text-blue-600 hover:underline">
                      {yaounde.phoneDisplay}
                    </a>
                  </>
                ) : null}
              </p>
              <p className="pt-2 text-sm">
                <a href="/sources-officielles" className="font-semibold text-blue-700 hover:underline">
                  Sources officielles
                </a>
                {" · "}
                <a href="/politique-confidentialite" className="font-semibold text-blue-700 hover:underline">
                  Confidentialité
                </a>
                {" · "}
                <a href="/tarifs" className="font-semibold text-blue-700 hover:underline">
                  Tarifs
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
