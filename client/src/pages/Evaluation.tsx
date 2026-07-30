import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Evaluation() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    destination: '',
    visaType: '',
    cv: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({ ...prev, cv: e.target.files![0] }));
    }
  };

  const handleStep1Submit = () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = () => {
    if (!formData.destination || !formData.visaType || !formData.cv) {
      toast.error('Veuillez remplir tous les champs et télécharger votre CV');
      return;
    }
    // Submit evaluation
    toast.success('Évaluation soumise avec succès! Nous vous contacterons bientôt.');
    setTimeout(() => {
      setStep(1);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        destination: '',
        visaType: '',
        cv: null,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 p-4 rounded-full">
              <Star className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Évaluation Gratuite</h1>
          <p className="text-lg text-gray-600">Découvrez vos opportunités de mobilité internationale en 2 étapes simples</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 h-1 mx-1 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-1 mx-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Étape 1: Vos Informations</CardTitle>
              <CardDescription>Commençons par vos coordonnées personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom Complet *</label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Jean Dupont"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="jean@example.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleStep1Submit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Evaluation Details */}
        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Étape 2: Détails de l'Évaluation</CardTitle>
              <CardDescription>Précisez votre projet et téléchargez votre CV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Destination Souhaitée *</label>
                <Select value={formData.destination} onValueChange={(value) => handleSelectChange('destination', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez une destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canada">🇨🇦 Canada</SelectItem>
                    <SelectItem value="france">🇫🇷 France</SelectItem>
                    <SelectItem value="australia">🇦🇺 Australie</SelectItem>
                    <SelectItem value="uk">🇬🇧 Royaume-Uni</SelectItem>
                    <SelectItem value="usa">🇺🇸 États-Unis</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de Visa *</label>
                <Select value={formData.visaType} onValueChange={(value) => handleSelectChange('visaType', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez un type de visa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">📚 Étudiant</SelectItem>
                    <SelectItem value="work">💼 Travail</SelectItem>
                    <SelectItem value="visitor">🎫 Visiteur</SelectItem>
                    <SelectItem value="skilled">🎓 Travailleur Qualifié</SelectItem>
                    <SelectItem value="entrepreneur">🚀 Entrepreneur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Télécharger votre CV *</label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <FileUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {formData.cv ? formData.cv.name : 'Cliquez pour télécharger votre CV'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 py-3 rounded-lg font-bold"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleStep2Submit}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Soumettre
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              <strong>💡 Conseil :</strong> Notre équipe d'experts analysera votre profil et vous proposera les meilleures options pour réaliser votre projet de mobilité. Vous recevrez les résultats de votre évaluation par email dans les 24 heures.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
