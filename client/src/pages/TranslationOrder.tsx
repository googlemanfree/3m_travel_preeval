import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { setPageSeo } from '@/lib/pageSeo';
import { ChecklistSection, FaqSection, StepsSection } from '@/components/PageEnrichment';
import { TRANSLATION_DOCUMENT_LABELS, TRANSLATION_FAQ, TRANSLATION_PREPARE, TRANSLATION_STEPS } from '@/data/contentCampaignTranslation';

const documentTypes = [
  "birth_certificate",
  "diploma",
  "transcript",
  "criminal_record",
  "marriage_certificate",
  "divorce_decree",
  "employment_letter",
  "bank_statement",
  "passport",
  "driver_license",
  "medical_report",
  "other"
];

const languages = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "ar", name: "العربية" },
  { code: "zh", name: "中文" },
];

export default function TranslationOrder() {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [numberOfPages, setNumberOfPages] = useState<number>(1);
  const [candidateName, setCandidateName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [pricePerPage, setPricePerPage] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('EUR');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPageSeo({
      title: 'Traduction de documents : demande en ligne | 3M TRAVEL AGENCY',
      description: 'Demandez la traduction de vos documents (actes, diplômes, relevés) : estimation par page avant l’envoi, paiement uniquement après confirmation écrite.',
    });
  }, []);

  const createTranslationRequest = trpc.translation.createTranslationRequest.useMutation({
    onSuccess: () => {
      toast({
        title: "Demande de traduction créée",
        description: "Votre demande a été soumise avec succès. Vous recevrez un email avec les instructions de paiement.",
      });
      // Reset form
      setDocumentType('');
      setSourceLanguage('');
      setTargetLanguage('');
      setFile(null);
      setFileName('');
      setFileSize(0);
      setNumberOfPages(1);
      setCandidateName('');
      setEmail('');
      setWhatsapp('');
      setPricePerPage(0);
      setTotalPrice(0);
      setCurrency('EUR');
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,

      });
    },
  });

  const getTranslationPricing = trpc.translation.getTranslationPricing.useQuery(
    {
      documentType: documentType as any,
      sourceLanguage,
      targetLanguage,
    },
    {
      enabled: !!documentType && !!sourceLanguage && !!targetLanguage,
    }
  );

  React.useEffect(() => {
    if (getTranslationPricing.data) {
      setPricePerPage(parseFloat(getTranslationPricing.data.pricePerPage));
      setCurrency(getTranslationPricing.data.currency);
      setTotalPrice(parseFloat(getTranslationPricing.data.pricePerPage) * numberOfPages);
    } else {
      setPricePerPage(0);
      setTotalPrice(0);
    }
  }, [getTranslationPricing.data, numberOfPages]);

  React.useEffect(() => {
    if (getTranslationPricing.error) {
      toast({
        title: "Erreur de tarification",
        description: getTranslationPricing.error.message,

      });
      setPricePerPage(0);
      setTotalPrice(0);
    }
  }, [getTranslationPricing.error]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(selectedFile.size);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un document à traduire.",

      });
      return;
    }

        setIsUploading(true);
    let fileUrl: string;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "document_traduction");
      const res = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Échec de l'envoi du document.");
      const data = await res.json();
      fileUrl = data.fileUrl;
    } catch {
      toast({
        title: "Erreur d'envoi",
        description: "Le document n’a pas pu être téléversé. Veuillez réessayer.",
      });
      setIsUploading(false);
      return;
    }

    createTranslationRequest.mutate({
      documentType: documentType as any,
      sourceLanguage,
      targetLanguage,
      fileUrl,
      fileName,
      fileSize,
      numberOfPages: Number(numberOfPages),
      pricePerPage: pricePerPage,
      totalPrice: String(totalPrice),
      currency,
      candidateName,
      email,
      whatsapp,
    }, {
      onSettled: () => setIsUploading(false),
    });
  };

  return (
    <main>
      <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Demande de traduction de documents</h1>
      <p className="mb-6 max-w-3xl text-gray-700" data-testid="translation-intro">
        Choisissez le type de document et les langues : le tarif par page s’affiche avant l’envoi. Vous ne payez qu’après avoir reçu, par e-mail, la confirmation écrite et les instructions de paiement.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="candidateName">Nom Complet</Label>
          <Input
            id="candidateName"
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={320}
          />
        </div>

        <div>
          <Label htmlFor="whatsapp">Numéro WhatsApp (optionnel)</Label>
          <Input
            id="whatsapp"
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            maxLength={50}
          />
        </div>

        <div>
          <Label htmlFor="documentType">Type de Document</Label>
          <Select onValueChange={setDocumentType} value={documentType}>
            <SelectTrigger id="documentType">
              <SelectValue placeholder="Sélectionner le type de document" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {TRANSLATION_DOCUMENT_LABELS[type] ?? type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sourceLanguage">Langue Source</Label>
          <Select onValueChange={setSourceLanguage} value={sourceLanguage}>
            <SelectTrigger id="sourceLanguage">
              <SelectValue placeholder="Sélectionner la langue source" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetLanguage">Langue Cible</Label>
          <Select onValueChange={setTargetLanguage} value={targetLanguage}>
            <SelectTrigger id="targetLanguage">
              <SelectValue placeholder="Sélectionner la langue cible" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="numberOfPages">Nombre de Pages</Label>
          <Input
            id="numberOfPages"
            type="number"
            value={numberOfPages}
            onChange={(e) => setNumberOfPages(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentFile">Document à Traduire</Label>
          <input
            ref={fileInputRef}
            id="documentFile"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              aria-controls="documentFile"
            >
              Choisir un document
            </Button>
            <span className="text-sm text-gray-600" aria-live="polite">
              {fileName ? `${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)` : "Aucun fichier sélectionné"}
            </span>
          </div>
          <p className="text-xs text-gray-500">PDF, image ou document bureautique accepté. Le fichier sera envoyé de manière sécurisée.</p>
        </div>

        {pricePerPage > 0 && (
          <div className="text-lg font-semibold">
            Prix par page: {pricePerPage.toFixed(2)} {currency}
          </div>
        )}

        {totalPrice > 0 && (
          <div className="text-xl font-bold">
            Prix Total Estimé: {totalPrice.toFixed(2)} {currency}
          </div>
        )}

        <p className="text-sm text-gray-600" data-testid="translation-price-note">
          {pricePerPage > 0 ? 'Cette estimation dépend du nombre de pages indiqué.' : 'Le tarif s’affiche dès que le type de document et les deux langues sont choisis.'} Le montant définitif et les instructions de paiement vous sont envoyés par e-mail avant tout paiement.
        </p>

        <Button type="submit" className="w-full" disabled={createTranslationRequest.isPending || getTranslationPricing.isFetching}>
          {createTranslationRequest.isPending ? 'Soumission en cours...' : 'Soumettre la Demande'}
        </Button>
      </form>
      </div>

      <div className="mt-10" data-testid="translation-guide">
        <StepsSection title="Comment se déroule la traduction" steps={TRANSLATION_STEPS} tone="white" testId="translation-steps" />
        <ChecklistSection title="Préparer votre document" introduction="Un fichier bien préparé évite un aller-retour et un retard." items={TRANSLATION_PREPARE} tone="slate" testId="translation-prepare" />
        <FaqSection title="Questions sur la traduction" items={TRANSLATION_FAQ} tone="white" testId="translation-faq" />
      </div>
    </main>
  );
}
