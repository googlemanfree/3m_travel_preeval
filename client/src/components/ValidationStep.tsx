import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Download, FileCheck2, RotateCcw, Save, Upload, UserRoundCheck } from 'lucide-react';
import jsPDF from 'jspdf';
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
  passportFileUrl?: string | null;
  passportFileType?: string;
  passportFileName?: string;
  entryMode?: 'ai' | 'manual';
  analysisNotice?: string | null;
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
  passportFileUrl = null,
  passportFileType = '',
  passportFileName = '',
  entryMode = 'ai',
  analysisNotice = null,
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

  const downloadValidatedPdf = () => {
    const data = normalizeManualPassportData(editedData);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('3M Travel & Services', 15, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Récapitulatif des données passeport vérifiées', 15, 21);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(30);
    doc.text('3M TRAVEL', 105, 150, { angle: 35, align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Informations validées par le candidat', 15, 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const rows: Array<[string, string]> = [
      ['Nom complet', data.fullName],
      ['Prénom(s)', data.firstName || 'Non renseigné'],
      ['Nom de famille', data.lastName || 'Non renseigné'],
      ['Date de naissance', data.dateOfBirth || 'Non renseignée'],
      ['Nationalité', data.nationality || 'Non renseignée'],
      ['Numéro de passeport', data.passportNumber || 'Non renseigné'],
      ['Pays d’émission', data.issuingCountry || 'Non renseigné'],
      ['Date d’émission', data.issueDate || 'Non renseignée'],
      ['Date d’expiration', data.expiryDate || 'Non renseignée'],
      ['Genre', data.gender || 'Non renseigné'],
      ['Lieu de naissance', data.placeOfBirth || 'Non renseigné'],
    ];
    let y = 61;
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 67, y);
      y += 8;
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 4, pageWidth - 15, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Document de vérification préparatoire — ne constitue pas un visa officiel.', 15, y + 13);
    doc.text(`Fichier analysé : ${passportFileName || 'Passeport transmis'}`, 15, y + 19);
    doc.save(`recapitulatif-passeport-${Date.now()}.pdf`);
  };

  const isPdf = passportFileType === 'application/pdf' || passportFileName.toLowerCase().endsWith('.pdf');

  return (
    <form onSubmit={handleConfirm} className="space-y-6" noValidate>
      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${entryMode === 'ai' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`} role="status" aria-live="polite">
        {entryMode === 'ai' ? <UserRoundCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />}
        <div>
          <h3 className={`font-semibold ${entryMode === 'ai' ? 'text-emerald-950' : 'text-amber-950'}`}>{entryMode === 'ai' ? 'Vérifiez les informations extraites' : 'Saisissez les informations de votre passeport'}</h3>
          <p className={`mt-1 text-sm ${entryMode === 'ai' ? 'text-emerald-800' : 'text-amber-800'}`}>
            {entryMode === 'ai'
              ? 'L’IA a préparé ces données à partir de votre passeport. Modifiez directement les champs qui ne correspondent pas à votre document, puis confirmez.'
              : analysisNotice || 'Complétez les informations visibles sur la page biographique de votre passeport, puis confirmez pour poursuivre votre demande.'}
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {modifiedFields.size > 0 ? `${modifiedFields.size} correction(s) manuelle(s)` : 'Extraction terminée'}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={downloadValidatedPdf} disabled={isLoading} className="h-8 border-blue-200 text-blue-700">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PDF récapitulatif
            </Button>
          </div>
        </div>

        {errors.form && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start">
          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:sticky xl:top-4" aria-label="Aperçu du passeport">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Aperçu du document</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Relisez la page biographique</p>
              </div>
              <FileCheck2 className="h-4 w-4 text-blue-600" />
            </div>
            {passportFileUrl ? (
              isPdf ? (
                <object data={passportFileUrl} type="application/pdf" className="h-[280px] w-full rounded-xl border border-slate-200 bg-white" aria-label={`Aperçu de ${passportFileName || 'votre passeport'}`}>
                  <p className="p-3 text-xs text-slate-600">L’aperçu PDF n’est pas disponible dans ce navigateur. Utilisez le fichier transmis pour relire vos informations.</p>
                </object>
              ) : (
                <img src={passportFileUrl} alt="Aperçu de la page d’identité du passeport" className="h-[280px] w-full rounded-xl border border-slate-200 bg-white object-contain" />
              )
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
                Aucun aperçu disponible
              </div>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">L’image reste utilisée uniquement pour vous aider à comparer les champs extraits avec votre document.</p>
          </aside>
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
