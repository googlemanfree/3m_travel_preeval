import React, { useState, useEffect } from "react";
import { AccessibleVisaForm, VisaFormData } from "./AccessibleVisaForm";
import { AutoSaveIndicator, AutoSaveNotification } from "./AutoSaveIndicator";
import { useAutoSaveForm } from "@/_core/hooks/useAutoSaveForm";

/**
 * Composant VisaFormWithAutoSave
 * 
 * Formulaire de visa avec sauvegarde automatique locale
 * - Sauvegarde toutes les 30 secondes
 * - Restauration automatique au chargement
 * - Indicateur visuel de l'état
 * - Notification de récupération
 */

const INITIAL_FORM_DATA: VisaFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  visaType: "",
  destination: "",
  travelDate: "",
  purpose: "",
  notes: "",
};

const STORAGE_KEY = "visa_form_autosave";

export const VisaFormWithAutoSave: React.FC = () => {
  const [formData, setFormData] = useState<VisaFormData>(INITIAL_FORM_DATA);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hook de sauvegarde automatique
  const autoSave = useAutoSaveForm(formData, {
    storageKey: STORAGE_KEY,
    saveInterval: 30000, // 30 secondes
    onSave: (data) => {
      console.log("✓ Formulaire sauvegardé automatiquement");
    },
    onRestore: (data) => {
      console.log("✓ Formulaire restauré depuis localStorage");
      setFormData(data);
    },
    onError: (error) => {
      console.error("✗ Erreur de sauvegarde:", error);
    },
  });

  // Vérifier s'il y a des données sauvegardées au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const savedData = parsed.data as VisaFormData;

        // Vérifier si les données sauvegardées sont différentes des données initiales
        if (
          JSON.stringify(savedData) !== JSON.stringify(INITIAL_FORM_DATA)
        ) {
          setShowRestoreNotification(true);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des données sauvegardées:", error);
    }
  }, []);

  // Gérer le changement de formulaire
  const handleFormChange = (field: keyof VisaFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (data: VisaFormData) => {
    setIsLoading(true);
    try {
      // Simuler l'envoi au serveur
      console.log("Envoi du formulaire:", data);

      // Effacer les données sauvegardées après soumission réussie
      autoSave.clearNow();

      // Réinitialiser le formulaire
      setFormData(INITIAL_FORM_DATA);

      // Afficher un message de succès
      alert("Votre demande de visa a été envoyée avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
      alert("Une erreur s'est produite lors de l'envoi du formulaire.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la restauration
  const handleRestore = () => {
    const restored = autoSave.restoreNow();
    if (restored) {
      setFormData(restored);
      setShowRestoreNotification(false);
    }
  };

  // Gérer l'effacement
  const handleClear = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer les données sauvegardées ?")) {
      autoSave.clearNow();
      setFormData(INITIAL_FORM_DATA);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Demande de Visa
          </h1>
          <p className="text-lg text-gray-600">
            Remplissez le formulaire ci-dessous pour demander un visa
          </p>
          <p className="text-sm text-gray-500 mt-2">
            💾 Votre formulaire est sauvegardé automatiquement
          </p>
        </div>

        {/* Conteneur du formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <AccessibleVisaForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Indicateur de sauvegarde */}
        <AutoSaveIndicator
          isSaving={autoSave.isSaving}
          lastSaved={autoSave.lastSaved}
          hasUnsavedChanges={autoSave.hasUnsavedChanges}
          hasSavedData={autoSave.hasSavedData}
          onClear={handleClear}
          onRestore={handleRestore}
        />

        {/* Notification de restauration */}
        <AutoSaveNotification
          show={showRestoreNotification}
          onRestore={handleRestore}
          onDismiss={() => setShowRestoreNotification(false)}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Besoin d'aide ? <a href="/contact" className="text-blue-600 hover:underline">Contactez-nous</a>
          </p>
        </div>
      </div>
    </div>
  );
};
