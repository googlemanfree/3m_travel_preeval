import React, { useState, useCallback } from "react";
import { AccessibleFormField, FormValidators } from "./AccessibleFormField";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Formulaire de Demande de Visa Accessible WCAG 2.1 AAA
 * 
 * Caractéristiques :
 * - Validation en temps réel pour tous les champs
 * - Messages d'erreur accessibles avec aria-live
 * - Indicateurs visuels et textuels
 * - Support lecteur d'écran complet
 * - Contraste conforme AAA
 * - Navigation clavier complète
 * - Résumé des erreurs au sommet
 */

export interface VisaFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visaType: string;
  destination: string;
  travelDate: string;
  purpose: string;
  notes: string;
}

interface AccessibleVisaFormProps {
  onSubmit?: (data: VisaFormData) => void;
  isLoading?: boolean;
}

export const AccessibleVisaForm: React.FC<AccessibleVisaFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<VisaFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    visaType: "",
    destination: "",
    travelDate: "",
    purpose: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Validateurs pour chaque champ
  const fieldValidators: Record<string, (value: string) => { valid: boolean; error?: string }> = {
    firstName: FormValidators.compose(
      FormValidators.required,
      FormValidators.minLength(2)
    ),
    lastName: FormValidators.compose(
      FormValidators.required,
      FormValidators.minLength(2)
    ),
    email: FormValidators.compose(
      FormValidators.required,
      FormValidators.email
    ),
    phone: FormValidators.compose(
      FormValidators.required,
      FormValidators.phone
    ),
    visaType: FormValidators.required,
    destination: FormValidators.required,
    travelDate: FormValidators.required,
    purpose: FormValidators.required,
  };

  // Gérer les changements de champ
  const handleFieldChange = useCallback((field: keyof VisaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validation en temps réel si le champ a été touché
    if (touched[field] || submitAttempted) {
      const validator = fieldValidators[field];
      if (validator) {
        const result = validator(value);
        setErrors((prev) => ({
          ...prev,
          [field]: result.error || "",
        }));
      }
    }
  }, [touched, submitAttempted, fieldValidators]);

  // Gérer le blur du champ
  const handleFieldBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Valider le champ
    const validator = fieldValidators[field];
    if (validator) {
      const value = formData[field as keyof VisaFormData];
      const result = validator(value);
      setErrors((prev) => ({
        ...prev,
        [field]: result.error || "",
      }));
    }
  }, [formData, fieldValidators]);

  // Valider le formulaire complet
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(fieldValidators).forEach(([field, validator]) => {
      const value = formData[field as keyof VisaFormData];
      const result = validator(value);
      if (!result.valid) {
        newErrors[field] = result.error || "";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, fieldValidators]);

  // Soumettre le formulaire
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitAttempted(true);

      if (validateForm()) {
        onSubmit?.(formData);
      } else {
        // Annoncer les erreurs aux lecteurs d'écran
        const errorCount = Object.keys(errors).length;
        const announcement = `Formulaire invalide. ${errorCount} erreur${errorCount > 1 ? "s" : ""} détectée${errorCount > 1 ? "s" : ""}. Veuillez corriger les champs marqués en rouge.`;
        
        const liveRegion = document.querySelector('[role="alert"]');
        if (liveRegion) {
          liveRegion.textContent = announcement;
        }

        // Focus sur le premier champ avec erreur
        const firstErrorField = Object.keys(errors)[0];
        const firstErrorInput = document.getElementById(firstErrorField);
        firstErrorInput?.focus();
      }
    },
    [formData, errors, validateForm, onSubmit]
  );

  // Compter les erreurs
  const errorCount = Object.values(errors).filter((e) => e).length;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto">
      {/* Résumé des erreurs */}
      {submitAttempted && errorCount > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-red-700 text-lg">
                Erreurs de validation détectées
              </h2>
              <p className="text-red-600 mt-1">
                Veuillez corriger les {errorCount} erreur{errorCount > 1 ? "s" : ""} ci-dessous avant de soumettre.
              </p>
              <ul className="mt-2 list-disc list-inside text-red-600 text-sm">
                {Object.entries(errors)
                  .filter(([_, error]) => error)
                  .map(([field, error]) => (
                    <li key={field}>
                      <strong>{field.replace(/([A-Z])/g, " $1")}:</strong> {error}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Titre du formulaire */}
      <h1 className="text-3xl font-bold mb-2 text-gray-900">
        Demande de Visa
      </h1>
      <p className="text-gray-600 mb-6">
        Remplissez tous les champs marqués d'un astérisque (*) pour continuer.
      </p>

      {/* Section Informations Personnelles */}
      <fieldset className="mb-8 p-6 border-2 border-gray-200 rounded-lg">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          Informations Personnelles
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AccessibleFormField
            id="firstName"
            label="Prénom"
            type="text"
            placeholder="Jean"
            value={formData.firstName}
            onChange={(value) => handleFieldChange("firstName", value)}
            onBlur={() => handleFieldBlur("firstName")}
            error={errors.firstName}
            errorDetails="Le prénom doit contenir au moins 2 caractères"
            required
            autoComplete="given-name"
            validator={fieldValidators.firstName}
            hint="Votre prénom tel qu'il apparaît sur votre passeport"
          />

          <AccessibleFormField
            id="lastName"
            label="Nom"
            type="text"
            placeholder="Dupont"
            value={formData.lastName}
            onChange={(value) => handleFieldChange("lastName", value)}
            onBlur={() => handleFieldBlur("lastName")}
            error={errors.lastName}
            errorDetails="Le nom doit contenir au moins 2 caractères"
            required
            autoComplete="family-name"
            validator={fieldValidators.lastName}
            hint="Votre nom de famille tel qu'il apparaît sur votre passeport"
          />
        </div>

        <AccessibleFormField
          id="email"
          label="Adresse Email"
          type="email"
          placeholder="jean.dupont@exemple.com"
          value={formData.email}
          onChange={(value) => handleFieldChange("email", value)}
          onBlur={() => handleFieldBlur("email")}
          error={errors.email}
          errorDetails="Veuillez vérifier le format de votre adresse email"
          required
          autoComplete="email"
          validator={fieldValidators.email}
          hint="Nous vous enverrons les mises à jour de votre dossier à cette adresse"
        />

        <AccessibleFormField
          id="phone"
          label="Numéro de Téléphone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={formData.phone}
          onChange={(value) => handleFieldChange("phone", value)}
          onBlur={() => handleFieldBlur("phone")}
          error={errors.phone}
          errorDetails="Veuillez entrer un numéro valide avec au moins 10 chiffres"
          required
          autoComplete="tel"
          validator={fieldValidators.phone}
          hint="Incluez l'indicatif pays (ex: +33 pour la France)"
        />
      </fieldset>

      {/* Section Détails du Visa */}
      <fieldset className="mb-8 p-6 border-2 border-gray-200 rounded-lg">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          Détails du Visa
        </legend>

        <AccessibleFormField
          id="visaType"
          label="Type de Visa"
          type="select"
          value={formData.visaType}
          onChange={(value) => handleFieldChange("visaType", value)}
          onBlur={() => handleFieldBlur("visaType")}
          error={errors.visaType}
          required
          validator={fieldValidators.visaType}
          options={[
            { value: "tourist", label: "Tourisme" },
            { value: "business", label: "Affaires" },
            { value: "student", label: "Études" },
            { value: "work", label: "Travail" },
            { value: "family", label: "Regroupement Familial" },
          ]}
          hint="Sélectionnez le type de visa correspondant à votre projet"
        />

        <AccessibleFormField
          id="destination"
          label="Pays de Destination"
          type="select"
          value={formData.destination}
          onChange={(value) => handleFieldChange("destination", value)}
          onBlur={() => handleFieldBlur("destination")}
          error={errors.destination}
          required
          validator={fieldValidators.destination}
          options={[
            { value: "france", label: "France" },
            { value: "canada", label: "Canada" },
            { value: "uk", label: "Royaume-Uni" },
            { value: "usa", label: "États-Unis" },
            { value: "australia", label: "Australie" },
          ]}
          hint="Sélectionnez le pays pour lequel vous demandez un visa"
        />

        <AccessibleFormField
          id="travelDate"
          label="Date de Départ Prévue"
          type="text"
          placeholder="JJ/MM/AAAA"
          value={formData.travelDate}
          onChange={(value) => handleFieldChange("travelDate", value)}
          onBlur={() => handleFieldBlur("travelDate")}
          error={errors.travelDate}
          required
          validator={fieldValidators.required}
          hint="Entrez la date au format JJ/MM/AAAA (ex: 15/08/2026)"
        />

        <AccessibleFormField
          id="purpose"
          label="Objectif du Voyage"
          type="textarea"
          placeholder="Décrivez brièvement l'objectif de votre voyage..."
          value={formData.purpose}
          onChange={(value) => handleFieldChange("purpose", value)}
          onBlur={() => handleFieldBlur("purpose")}
          error={errors.purpose}
          required
          maxLength={500}
          validator={fieldValidators.required}
          hint="Expliquez en détail l'objectif de votre voyage"
        />
      </fieldset>

      {/* Section Notes Additionnelles */}
      <fieldset className="mb-8 p-6 border-2 border-gray-200 rounded-lg">
        <legend className="text-xl font-bold text-gray-900 mb-4">
          Informations Supplémentaires
        </legend>

        <AccessibleFormField
          id="notes"
          label="Notes Additionnelles (Optionnel)"
          type="textarea"
          placeholder="Ajoutez toute information pertinente pour votre demande..."
          value={formData.notes}
          onChange={(value) => handleFieldChange("notes", value)}
          onBlur={() => handleFieldBlur("notes")}
          maxLength={1000}
          hint="Vous pouvez ajouter des informations supplémentaires ici"
        />
      </fieldset>

      {/* Boutons d'action */}
      <div className="flex gap-4 justify-end mb-6">
        <button
          type="reset"
          onClick={() => {
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              visaType: "",
              destination: "",
              travelDate: "",
              purpose: "",
              notes: "",
            });
            setErrors({});
            setTouched({});
            setSubmitAttempted(false);
          }}
          disabled={isLoading}
          className="px-6 py-3 border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          aria-label="Réinitialiser le formulaire"
        >
          Réinitialiser
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
          aria-label={isLoading ? "Envoi en cours..." : "Soumettre la demande de visa"}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Soumettre la Demande
            </>
          )}
        </button>
      </div>

      {/* Message de confirmation */}
      {submitAttempted && errorCount === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-green-50 border-2 border-green-500 rounded-lg flex items-start gap-3"
        >
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-green-700">Formulaire valide</h3>
            <p className="text-green-600 text-sm mt-1">
              Tous les champs sont correctement remplis. Cliquez sur "Soumettre la Demande" pour continuer.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};
