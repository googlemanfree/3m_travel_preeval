import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Conditions d'Utilisation</h1>
          <p className="text-blue-100">Dernière mise à jour : Juillet 2026</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Présentation</h2>
            <p className="text-gray-700 leading-relaxed">
              Le site 3mtravelagency.click est édité par 3M Travel & Services SARL, agence agréée sous le numéro RC/YAO/2019/A/2567 (NIU : M112417203369H), spécialisée dans l'accompagnement à la mobilité internationale et à l'immigration.
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Nature de nos services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              3M Travel & Services SARL propose des services de conseil, d'accompagnement et de préparation de dossiers de visa, d'immigration, de billetterie, d'assurance voyage et de traduction assermentée.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 font-semibold">
                ⚠️ 3M Travel & Services ne délivre aucun visa ni permis de travail. La décision finale d'octroi appartient exclusivement aux autorités consulaires et administratives compétentes de chaque pays.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Compte candidat</h2>
            <p className="text-gray-700 leading-relaxed">
              La création d'un compte permet d'accéder au suivi de dossier, à la recherche de vols et à la messagerie avec votre conseiller. Vous êtes responsable de la confidentialité de vos identifiants.
            </p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Honoraires et paiement</h2>
            <p className="text-gray-700 leading-relaxed">
              Les honoraires d'agence couvrent l'accompagnement, la préparation du dossier et le suivi administratif — ils ne garantissent pas l'obtention du visa, sauf dans le cadre explicite de la formule « Permis Garanti » dont les conditions d'éligibilité sont vérifiées au cas par cas.
            </p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Obligations du client</h2>
            <p className="text-gray-700 leading-relaxed">
              Le client s'engage à fournir des informations et documents exacts, complets et authentiques. 3M Travel & Services ne saurait être tenue responsable des conséquences liées à des informations erronées ou falsifiées fournies par le client.
            </p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Responsabilité</h2>
            <p className="text-gray-700 leading-relaxed">
              3M Travel & Services SARL met tout en œuvre pour accompagner au mieux chaque dossier, sans pouvoir garantir l'issue d'une procédure qui relève de la seule compétence des autorités du pays de destination.
            </p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed">
              L'ensemble des contenus du site (textes, guides, logo) est la propriété de 3M Travel & Services SARL et ne peut être reproduit sans autorisation.
            </p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes conditions sont soumises au droit camerounais. Tout litige relève de la compétence des juridictions de Yaoundé.
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
              <strong>Note :</strong> Ce texte est un modèle de base à faire valider par un juriste avant publication définitive.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
