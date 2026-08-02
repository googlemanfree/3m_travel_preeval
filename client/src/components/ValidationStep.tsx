import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Edit2, Check, X } from 'lucide-react';

interface ExtractedData {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  issuingCountry?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  gender?: string | null;
  placeOfBirth?: string | null;
}

interface ValidationStepProps {
  extractedData: ExtractedData;
  onConfirm: (validatedData: ExtractedData) => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export function ValidationStep({
  extractedData,
  onConfirm,
  onEdit,
  isLoading = false,
}: ValidationStepProps) {
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleEditField = (fieldName: string) => {
    const newEditingFields = new Set(editingFields);
    if (newEditingFields.has(fieldName)) {
      newEditingFields.delete(fieldName);
    } else {
      newEditingFields.add(fieldName);
    }
    setEditingFields(newEditingFields);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [fieldName]: value || null,
    }));
    // Effacer l'erreur pour ce champ
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const validateData = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du nom complet
    if (!editedData.fullName || editedData.fullName.trim().length < 2) {
      newErrors.fullName = 'Le nom complet est requis et doit contenir au moins 2 caractères';
    }

    // Validation de la date de naissance
    if (editedData.dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(editedData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Format de date invalide (YYYY-MM-DD)';
      } else {
        const birthDate = new Date(editedData.dateOfBirth);
        const today = new Date();
        if (birthDate > today) {
          newErrors.dateOfBirth = 'La date de naissance ne peut pas être dans le futur';
        }
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          newErrors.dateOfBirth = 'Vous devez avoir au moins 18 ans';
        }
      }
    }

    // Validation de la nationalité
    if (editedData.nationality && editedData.nationality.trim().length < 2) {
      newErrors.nationality = 'La nationalité doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateData()) {
      onConfirm(editedData);
    }
  };

  const renderField = (
    label: string,
    fieldName: string,
    value: string | null | undefined,
    required: boolean = false
  ) => {
    const isEditing = editingFields.has(fieldName);
    const hasError = !!errors[fieldName];
    const displayValue = value || '—';

    return (
      <div key={fieldName} className="border-b border-gray-200 last:border-b-0 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
              {required && <span className="text-red-600 ml-1">*</span>}
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  type={fieldName === 'dateOfBirth' ? 'date' : 'text'}
                  value={editedData[fieldName as keyof ExtractedData] || ''}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className={hasError ? 'border-red-500' : ''}
                />
                {hasError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors[fieldName]}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-sm ${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {displayValue}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleEditField(fieldName)}
            className="mt-6 text-blue-600 hover:text-blue-700"
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Valider
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-1" />
                Modifier
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-blue-900">Vérification des Informations</h3>
          <p className="text-sm text-blue-700 mt-1">
            Veuillez vérifier et corriger les informations extraites de votre passeport si nécessaire.
          </p>
        </div>
      </div>

      {/* Formulaire de validation */}
      <Card className="p-6">
        <div className="space-y-1">
          {renderField('Nom Complet', 'fullName', editedData.fullName, true)}
          {renderField('Prénom', 'firstName', editedData.firstName)}
          {renderField('Nom de Famille', 'lastName', editedData.lastName)}
          {renderField('Date de Naissance', 'dateOfBirth', editedData.dateOfBirth)}
          {renderField('Nationalité', 'nationality', editedData.nationality)}
          {renderField('Genre', 'gender', editedData.gender)}
          {renderField('Numéro de Passeport', 'passportNumber', editedData.passportNumber)}
          {renderField('Pays d\'Émission', 'issuingCountry', editedData.issuingCountry)}
          {renderField('Date d\'Émission', 'issueDate', editedData.issueDate)}
          {renderField('Date d\'Expiration', 'expiryDate', editedData.expiryDate)}
          {renderField('Lieu de Naissance', 'placeOfBirth', editedData.placeOfBirth)}
        </div>
      </Card>

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          disabled={isLoading}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Télécharger à Nouveau
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? 'Validation en cours...' : 'Confirmer et Continuer'}
        </Button>
      </div>

      {/* Résumé */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Conseil :</strong> Vérifiez attentivement que toutes les informations sont correctes avant de continuer.
          Vous pourrez modifier ces informations ultérieurement si nécessaire.
        </p>
      </div>
    </div>
  );
}
