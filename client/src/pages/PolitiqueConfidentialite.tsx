import Footer from "@/components/Footer";

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Politique de Confidentialité</h1>
          <p className="text-blue-100">Dernière mise à jour : Juillet 2026</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-700 leading-relaxed">
              3M Travel & Services SARL (RC/YAO/2019/A/2567, NIU M112417203369H), sise à Yaoundé, Biyem-Assi, Montée Chapelle Obili, accorde une importance particulière à la protection des données personnelles de ses clients et visiteurs.
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage des données</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données peuvent être transmises aux autorités consulaires et administratives compétentes dans le cadre strict de votre demande de visa. Elles ne sont jamais vendues à des tiers à des fins commerciales.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Conservation</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données sont conservées pendant la durée nécessaire au traitement de votre dossier, puis archivées conformément aux obligations légales applicables.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité</h2>
            <p className="text-gray-700 leading-relaxed">
              Les données transmises via le site sont protégées par chiffrement SSL. L'accès à votre espace candidat est protégé par mot de passe.
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
              <p><strong>3M Travel & Services SARL</strong></p>
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

          {/* Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 italic">
              <strong>Note :</strong> Ce texte est un modèle de base. Il est recommandé de le faire valider par un juriste pour garantir sa conformité avec la réglementation camerounaise sur la protection des données personnelles.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
