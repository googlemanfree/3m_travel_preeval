import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, FileCheck2, RotateCcw, Save, Upload, UserRoundCheck } from 'lucide-react';
import { normalizeManualPassportData, validateManualPassportData } from '@/lib/passportValidation';

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

type EditableField = keyof ExtractedData;

type FieldConfig = {
  key: EditableField;
  label: string;
  placeholder: string;
  type?: 'text' | 'date';
  required?: boolean;
};

const fields: FieldConfig[] = [
  { key: 'fullName', label: 'Nom complet', placeholder: 'Nom et prénoms tels qu’ils figurent sur le passeport', required: true },
  { key: 'firstName', label: 'Prénom(s)', placeholder: 'Prénom(s) figurant sur le passeport' },
  { key: 'lastName', label: 'Nom de famille', placeholder: 'Nom de famille figurant sur le passeport' },
  { key: 'dateOfBirth', label: 'Date de naissance', placeholder: 'AAAA-MM-JJ', type: 'date' },
  { key: 'nationality', label: 'Nationalité', placeholder: 'Ex. Camerounaise', required: true },
  { key: 'passportNumber', label: 'Numéro de passeport', placeholder: 'Numéro inscrit sur la page biographique', required: true },
  { key: 'issuingCountry', label: 'Pays d’émission', placeholder: 'Ex. Cameroun', required: true },
  { key: 'issueDate', label: 'Date d’émission', placeholder: 'AAAA-MM-JJ', type: 'date' },
  { key: 'expiryDate', label: 'Date d’expiration', placeholder: 'AAAA-MM-JJ', type: 'date' },
  { key: 'gender', label: 'Genre', placeholder: 'Ex. M ou F' },
  { key: 'placeOfBirth', label: 'Lieu de naissance', placeholder: 'Ville et pays si disponibles' },
];

export function ValidationStep({
  extractedData,
  onConfirm,
  onEdit,
  isLoading = false,
}: ValidationStepProps) {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modifiedFields, setModifiedFields] = useState<Set<EditableField>>(new Set());

  useEffect(() => {
    setEditedData(extractedData);
    setErrors({});
    setModifiedFields(new Set());
  }, [extractedData]);

  const handleFieldChange = (field: EditableField, value: string) => {
    setEditedData(previous => ({ ...previous, [field]: value }));
    setModifiedFields(previous => new Set(previous).add(field));
    setErrors(previous => {
      const next = { ...previous };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const validateData = (): boolean => {
    const nextErrors = validateManualPassportData(editedData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors({ ...nextErrors, form: 'Corrigez les champs signalés avant de continuer.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleConfirm = (event: FormEvent) => {
    event.preventDefault();
    if (!validateData()) return;

    onConfirm(normalizeManualPassportData(editedData));
  };

  return (
    <form onSubmit={handleConfirm} className="space-y-6" noValidate>
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" role="status" aria-live="polite">
        <UserRoundCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <h3 className="font-semibold text-emerald-950">Vérifiez les informations extraites</h3>
          <p className="mt-1 text-sm text-emerald-800">
            L’IA a préparé ces données à partir de votre passeport. Modifiez directement les champs qui ne correspondent pas à votre document, puis confirmez.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-base font-bold text-slate-950">
              <FileCheck2 className="h-5 w-5 text-blue-600" />
              Données du passeport
            </h4>
            <p className="mt-1 text-xs text-slate-500">Les champs marqués d’un astérisque sont obligatoires. Les valeurs modifiées sont signalées.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {modifiedFields.size > 0 ? `${modifiedFields.size} correction(s) manuelle(s)` : 'Extraction terminée'}
          </span>
        </div>

        {errors.form && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map(field => {
            const value = editedData[field.key] || '';
            const hasError = Boolean(errors[field.key]);
            const isModified = modifiedFields.has(field.key);
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`passport-${field.key}`} className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800">
                  <span>{field.label}{field.required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}</span>
                  {isModified && <span className="text-[11px] font-medium text-blue-600">Modifié</span>}
                </Label>
                <Input
                  id={`passport-${field.key}`}
                  name={field.key}
                  type={field.type || 'text'}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={event => handleFieldChange(field.key, event.target.value)}
                  aria-required={field.required}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `passport-${field.key}-error` : undefined}
                  className={hasError ? 'border-red-500 focus-visible:ring-red-500' : isModified ? 'border-blue-400 bg-blue-50/30' : ''}
                />
                {hasError && (
                  <p id={`passport-${field.key}-error`} className="flex items-center gap-1 text-xs text-red-600" role="alert">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors[field.key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
        <Button type="button" variant="outline" onClick={onEdit} disabled={isLoading} className="flex-1">
          <Upload className="mr-2 h-4 w-4" />
          Choisir un autre passeport
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setEditedData(extractedData); setErrors({}); setModifiedFields(new Set()); }} disabled={isLoading || modifiedFields.size === 0} className="sm:flex-none">
          <RotateCcw className="mr-2 h-4 w-4" />
          Annuler mes corrections
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Validation en cours…' : 'Enregistrer et continuer'}
        </Button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Vos corrections seront utilisées pour préremplir la suite de votre demande. Vous pourrez encore modifier les informations du formulaire final.
      </p>
    </form>
  );
}
