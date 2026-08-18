import React from "react";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";
import { useFontSizePreferences } from "@/contexts/FontSizePreferencesContext";
import { Button } from "@/components/ui/button";

export default function Accessibility() {
  const { preference, setPreference } = useAnimationPreferences();
  const { fontSize, setFontSize } = useFontSizePreferences();

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
        <div className="container px-4">
          <h1 className="text-4xl font-bold">Accessibilité &amp; Confort</h1>
          <p className="mt-2 text-blue-100">Notre engagement pour un site utilisable, inclusif et modulable par tous.</p>
        </div>
      </section>

      <section className="container max-w-4xl px-4 py-12 space-y-8">
        {/* Section Taille de la police */}
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Taille de la police</h2>
          <p className="leading-relaxed text-gray-700">
            Ajustez la taille du texte de l’ensemble du site pour un confort de lecture optimal selon vos besoins. Vos préférences sont enregistrées automatiquement sur votre appareil.
          </p>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Échelle typographique</h3>
            <p className="text-sm text-gray-600">
              Sélectionnez la taille d’affichage du texte :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                type="button"
                variant={fontSize === "standard" ? "default" : "outline"}
                onClick={() => setFontSize("standard")}
                className="justify-center text-base"
              >
                Standard (100%)
              </Button>
              <Button
                type="button"
                variant={fontSize === "large" ? "default" : "outline"}
                onClick={() => setFontSize("large")}
                className="justify-center text-lg font-medium"
              >
                Grand (112.5%)
              </Button>
              <Button
                type="button"
                variant={fontSize === "xlarge" ? "default" : "outline"}
                onClick={() => setFontSize("xlarge")}
                className="justify-center text-xl font-semibold"
              >
                Très grand (125%)
              </Button>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Taille active : <span className="font-medium text-gray-800 uppercase">{fontSize}</span>.
            </p>
          </div>
        </div>

        {/* Section Animations */}
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Préférences d’animation et de mouvement</h2>
          <p className="leading-relaxed text-gray-700">
            Vous pouvez à tout moment désactiver ou alléger les animations de l’interface, notamment la barre de progression de chargement en haut de l’écran.
          </p>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Animation de la barre de progression</h3>
            <p className="text-sm text-gray-600">
              Choisissez l’affichage des transitions visuelles lors des changements de page :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                type="button"
                variant={preference === "normal" ? "default" : "outline"}
                onClick={() => setPreference("normal")}
                className="justify-center"
              >
                Normal (Animé)
              </Button>
              <Button
                type="button"
                variant={preference === "fast" ? "default" : "outline"}
                onClick={() => setPreference("fast")}
                className="justify-center"
              >
                Rapide (0.7x)
              </Button>
              <Button
                type="button"
                variant={preference === "off" ? "destructive" : "outline"}
                onClick={() => setPreference("off")}
                className="justify-center"
              >
                Désactivé (Statique)
              </Button>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              Statut actuel : <span className="font-medium text-gray-800 uppercase">{preference}</span>.
            </p>
          </div>
        </div>

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
