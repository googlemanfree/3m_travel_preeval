
export default function PolitiqueConfidentialite() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Politique de Confidentialité</h1>
          <p className="text-blue-100">Dernière mise à jour : 14 octobre 2026</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          <div
            className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 space-y-3"
            data-testid="privacy-concrete-summary"
            role="region"
            aria-label="Accès et conservation en résumé"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">En résumé</p>
            <ul className="space-y-2 text-sm leading-6 text-slate-800">
              <li>
                <strong>Qui consulte vos documents :</strong> vous (via Mon espace) et les conseillers 3M affectés à votre dossier.
                Pas de consultation publique, ni par des partenaires B2B, sauf transmission volontaire vers une autorité pour votre procédure.
              </li>
              <li>
                <strong>Combien de temps :</strong> pendant le traitement actif du dossier ; puis archivage interne jusqu’à 5 ans après clôture
                (obligations comptables / litiges éventuels), sauf demande de suppression recevable plus tôt.
              </li>
            </ul>
          </div>
          
          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-700 leading-relaxed">
              3M Travel Agency SARL (RC/YAO/2019/A/2567, NIU M112417203369H), sise à Yaoundé, Biyem-Assi, Montée Chapelle Obili, accorde une importance particulière à la protection des données personnelles de ses clients et visiteurs.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données collectées</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dans le cadre de nos services (pré-évaluation, ouverture de dossier, suivi de dossier, création de compte), nous pouvons collecter :
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Identité :</strong> nom, prénom, date de naissance, nationalité</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Coordonnées :</strong> email, téléphone, adresse</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Documents d'immigration :</strong> passeport, diplômes, relevés de notes, casier judiciaire, justificatifs financiers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Données de connexion :</strong> email/mot de passe du compte candidat</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Finalité du traitement</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ces données sont utilisées exclusivement pour :
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>L'évaluation de votre éligibilité à un visa ou une procédure d'immigration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>La constitution et le suivi de votre dossier</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>La communication avec vous concernant votre dossier</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>L'amélioration de nos services</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4" id="acces-documents">4. Qui peut consulter vos documents</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les pièces déposées dans le coffre (passeport, CV, diplômes, justificatifs, etc.) ne sont pas publiques. En pratique :
            </p>
            <ul className="space-y-2 text-gray-700" data-testid="privacy-who-access">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Vous :</strong> via votre compte candidat dans Mon espace (consultation et dépôt).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>L’équipe 3M affectée à votre dossier :</strong> conseillers et opérationnels habilités pour instruire, vérifier ou demander une correction.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Autorités compétentes :</strong> uniquement si vous poursuivez une procédure et que la transmission est nécessaire à cette démarche (consulat, portail officiel, etc.).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Non concernés :</strong> le public, les moteurs de recherche, et les partenaires B2B (agences / employeurs) — ces derniers ne voient que des profils anonymisés après votre consentement, jamais le contenu brut du coffre.</span>
              </li>
            </ul>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Vos données ne sont jamais vendues à des tiers à des fins commerciales.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4" id="conservation">5. Conservation — combien de temps</h2>
            <ul className="space-y-2 text-gray-700" data-testid="privacy-retention">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Dossier actif :</strong> conservation des pièces et données utiles pendant toute la durée du traitement (évaluation, protocole, suivi jusqu’à clôture ou abandon confirmé).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Après clôture :</strong> archivage interne sécurisé jusqu’à <strong>5 ans</strong> pour les obligations comptables, la preuve d’exécution du service et la gestion d’éventuels litiges.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Suppression anticipée :</strong> vous pouvez demander l’effacement à{" "}
                  <a href="mailto:hello@3mtravelagency.com" className="text-blue-600 hover:underline">hello@3mtravelagency.com</a>
                  {" "}— traité sous réserve des pièces que la loi nous impose de conserver.</span>
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité</h2>
            <p className="text-gray-700 leading-relaxed">
              Les données transmises via le site sont protégées par chiffrement SSL. L’accès à votre espace candidat et au coffre documentaire est protégé par authentification : seuls votre compte et l’équipe 3M affectée à votre dossier y accèdent. Les permissions de validation restent celles de l’agence.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Vos droits</h2>
            <p className="text-gray-700 leading-relaxed">
              Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:hello@3mtravelagency.com" className="text-blue-600 hover:underline">
                hello@3mtravelagency.com
              </a>{" "}
              ou au <a href="tel:+237698104832" className="text-blue-600 hover:underline">+237 698 104 832</a>.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Le site peut utiliser des cookies techniques nécessaires à son bon fonctionnement (session, préférences).
            </p>
          </div>

          {/* Section 9 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-gray-700 space-y-2">
              <p><strong>3M Travel Agency SARL</strong></p>
              <p>Yaoundé, Biyem-Assi, Montée Chapelle Obili</p>
              <p>
                <a href="mailto:hello@3mtravelagency.com" className="text-blue-600 hover:underline">
                  hello@3mtravelagency.com
                </a>
              </p>
              <p>
                <a href="tel:+237698104832" className="text-blue-600 hover:underline">+237 698 104 832</a> /{" "}
                <a href="tel:+237620996045" className="text-blue-600 hover:underline">+237 620 996 045</a>
              </p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
