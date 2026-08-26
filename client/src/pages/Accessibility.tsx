import React from "react";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";
import { useFontSizePreferences } from "@/contexts/FontSizePreferencesContext";
import { useFloatingWidgetsPreferences } from "@/contexts/FloatingWidgetsPreferencesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function Accessibility() {
  const { preference, setPreference } = useAnimationPreferences();
  const { fontSize, setFontSize } = useFontSizePreferences();
  const { widgetsVisible, deviceMode, setWidgetsVisible } = useFloatingWidgetsPreferences();
  const { language } = useLanguage();
  const t = (fr: string, en: string) => language === "en" ? en : fr;
  const fontSizeLabel = { standard: t("Standard", "Standard"), large: t("Grand", "Large"), xlarge: t("Très grand", "Extra large") }[fontSize];
  const motionLabel = { normal: t("Normal (animé)", "Normal (animated)"), fast: t("Rapide", "Fast"), off: t("Désactivé", "Disabled") }[preference];

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-12 text-white">
        <div className="container px-4">
          <h1 className="text-4xl font-bold">{t("Accessibilité & confort", "Accessibility & comfort")}</h1>
          <p className="mt-2 text-blue-100">{t("Notre engagement pour un site utilisable, inclusif et modulable par tous.", "Our commitment to a usable, inclusive and adaptable website for everyone.")}</p>
        </div>
      </section>

      <section className="container max-w-4xl px-4 py-12 space-y-8">
        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">{t("Taille du texte", "Text size")}</h2>
          <p className="leading-relaxed text-gray-700">{t("Ajustez la taille du texte de l’ensemble du site pour un confort de lecture adapté à vos besoins. Vos préférences sont enregistrées sur cet appareil.", "Adjust text size across the website for comfortable reading. Your preferences are saved on this device.")}</p>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">{t("Échelle typographique", "Text scale")}</h3>
            <p className="text-sm text-gray-600">{t("Sélectionnez la taille d’affichage du texte :", "Choose your preferred text size:")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button type="button" variant={fontSize === "standard" ? "default" : "outline"} onClick={() => setFontSize("standard")} className="justify-center text-base">{t("Standard", "Standard")} (100%)</Button>
              <Button type="button" variant={fontSize === "large" ? "default" : "outline"} onClick={() => setFontSize("large")} className="justify-center text-lg font-medium">{t("Grand", "Large")} (112.5%)</Button>
              <Button type="button" variant={fontSize === "xlarge" ? "default" : "outline"} onClick={() => setFontSize("xlarge")} className="justify-center text-xl font-semibold">{t("Très grand", "Extra large")} (125%)</Button>
            </div>
            <p className="text-xs text-gray-500 pt-1">{t("Taille active :", "Active size:")} <span className="font-medium text-gray-800">{fontSizeLabel}</span>.</p>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">{t("Préférences d’animation et de mouvement", "Animation and motion preferences")}</h2>
          <p className="leading-relaxed text-gray-700">{t("Vous pouvez désactiver ou alléger les animations de l’interface, notamment la barre de progression affichée lors des changements de page.", "You can reduce or disable interface animations, including the progress bar shown during page changes.")}</p>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">{t("Transitions de navigation", "Navigation transitions")}</h3>
            <p className="text-sm text-gray-600">{t("Choisissez l’affichage des transitions visuelles lors des changements de page :", "Choose how visual transitions appear when changing pages:")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button type="button" variant={preference === "normal" ? "default" : "outline"} onClick={() => setPreference("normal")} className="justify-center">{t("Normal (animé)", "Normal (animated)")}</Button>
              <Button type="button" variant={preference === "fast" ? "default" : "outline"} onClick={() => setPreference("fast")} className="justify-center">{t("Rapide (0,7×)", "Fast (0.7×)")}</Button>
              <Button type="button" variant={preference === "off" ? "destructive" : "outline"} onClick={() => setPreference("off")} className="justify-center">{t("Désactivé (statique)", "Disabled (static)")}</Button>
            </div>
            <p className="text-xs text-gray-500 pt-1">{t("Réglage actuel :", "Current setting:")} <span className="font-medium text-gray-800">{motionLabel}</span>.</p>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">{t("Widgets flottants", "Floating widgets")}</h2>
          <p className="leading-relaxed text-gray-700">{t("Masquez les boutons d’assistance flottants si vous préférez une page plus dégagée. Votre choix est conservé sur cet appareil.", "Hide floating assistance buttons if you prefer a clearer page. Your choice is saved on this device.")}</p>
          <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{t("Afficher les widgets d’assistance", "Show assistance widgets")}</h3>
              <p className="text-sm text-gray-600">{widgetsVisible ? t("Les widgets sont visibles.", "Widgets are visible.") : t("Les widgets sont masqués.", "Widgets are hidden.")} {t(`Réglage pour : ${deviceMode === "mobile" ? "mobile" : deviceMode === "tablet" ? "tablette" : "ordinateur"}.`, `Setting for: ${deviceMode}.`)}</p>
            </div>
            <Button type="button" variant={widgetsVisible ? "default" : "outline"} onClick={() => setWidgetsVisible(!widgetsVisible)} aria-pressed={widgetsVisible} className="min-h-11 shrink-0">
              {widgetsVisible ? t("Masquer les widgets", "Hide widgets") : t("Afficher les widgets", "Show widgets")}
            </Button>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">{t("Un accès simple et inclusif", "Simple and inclusive access")}</h2>
          <p className="leading-relaxed text-gray-700">{t("3M Travel Agency s’efforce de rendre ses services numériques accessibles aux candidats et voyageurs, quel que soit leur appareil ou leur mode de navigation.", "3M Travel Agency works to make its digital services accessible to candidates and travellers, regardless of device or navigation method.")}</p>
          <h2 className="text-2xl font-bold text-gray-900">{t("Mesures mises en place", "Measures in place")}</h2>
          <p className="leading-relaxed text-gray-700">{t("Nous privilégions des contrastes lisibles, une navigation au clavier, des libellés explicites, des états de focus visibles et des interfaces adaptées aux écrans mobiles.", "We prioritise readable contrast, keyboard navigation, explicit labels, visible focus states and interfaces adapted to mobile screens.")}</p>
          <h2 className="text-2xl font-bold text-gray-900">{t("Besoin d’aide ?", "Need help?")}</h2>
          <p className="leading-relaxed text-gray-700">{t("Si vous rencontrez une difficulté pour accéder à une information ou effectuer une démarche, écrivez à", "If you have difficulty accessing information or completing a request, write to")} <a className="font-semibold text-blue-700 underline" href="mailto:hello@3mtravelagency.com">hello@3mtravelagency.com</a>.</p>
        </div>
      </section>
    </main>
  );
}
