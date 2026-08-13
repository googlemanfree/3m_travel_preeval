export default function Accessibility() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
        <div className="container px-4">
          <h1 className="text-4xl font-bold">Accessibilité</h1>
          <p className="mt-2 text-blue-100">Notre engagement pour un site utilisable par tous.</p>
        </div>
      </section>
      <section className="container max-w-4xl px-4 py-12">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Un accès simple et inclusif</h2>
          <p className="leading-relaxed text-gray-700">
            3M Travel Agency s’efforce de rendre ses services numériques accessibles aux candidats et voyageurs, quel que soit leur appareil ou leur mode de navigation.
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Mesures mises en place</h2>
          <p className="leading-relaxed text-gray-700">
            Nous privilégions des contrastes lisibles, une navigation utilisable au clavier, des libellés explicites, des états de focus visibles et des interfaces adaptées aux écrans mobiles.
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Besoin d’aide ?</h2>
          <p className="leading-relaxed text-gray-700">
            Si vous rencontrez une difficulté pour accéder à une information ou effectuer une démarche, écrivez à{' '}
            <a className="font-semibold text-blue-700 underline" href="mailto:hello@3mtravelagency.com">hello@3mtravelagency.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
