import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';
import { trpc } from '@/lib/trpc';

interface EvisaRequestFormProps {
  countryCode?: string;
  countryName?: string;
}

export default function EvisaRequestForm() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    countryCode: new URLSearchParams(window.location.search).get('countryCode') || '',
    countryName: new URLSearchParams(window.location.search).get('countryName') || '',
    notes: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Constantes
  const ACCOMPANIMENT_FEE = 25000;
  const CURRENCY = 'XOF';

  // Mutation pour soumettre la demande
  const submitRequestMutation = trpc.evisa.submitRequest.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setError(null);
      // Réinitialiser le formulaire
      setTimeout(() => {
        navigate('/evisas');
      }, 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Une erreur est survenue lors de la soumission');
      setIsLoading(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation basique
    if (!formData.fullName || !formData.email || !formData.phone || !formData.countryCode) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsLoading(false);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsLoading(false);
      return;
    }

    // Soumettre la demande
    submitRequestMutation.mutate({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      nationality: formData.nationality || 'Non spécifiée',
      dateOfBirth: formData.dateOfBirth || '',
      countryCode: formData.countryCode,
      countryName: formData.countryName,
      evisaType: 'Tourism',
      visaFee: 0,
      accompanimentFee: ACCOMPANIMENT_FEE,
      totalCost: ACCOMPANIMENT_FEE,
      currency: CURRENCY,
      notes: formData.notes,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande Soumise !</h2>
          <p className="text-gray-600 mb-6">
            Votre demande de e-visa a été reçue avec succès. Vous recevrez un email de confirmation dans quelques instants.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirection vers la page des e-visas dans 3 secondes...
          </p>
          <Button
            onClick={() => navigate('/evisas')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Retour aux e-visas
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/evisas')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour aux e-visas
          </button>
          <h1 className="text-4xl font-bold mb-2">Demande de E-Visa</h1>
          <p className="text-lg text-blue-100">
            {formData.countryName ? `Pour ${formData.countryName}` : 'Remplissez le formulaire ci-dessous'}
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                <div className="space-y-4">
                  {/* Nom complet */}
                  <div>
                    <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom Complet *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Jean Dupont"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>

                  {/* Téléphone */}
                  <div>
                    <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+221 77 123 45 67"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>

                  {/* Nationalité */}
                  <div>
                    <Label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">
                      Nationalité
                    </Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      type="text"
                      placeholder="Sénégalaise"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Naissance
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Informations e-visa */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations E-Visa</h3>
                <div className="space-y-4">
                  {/* Pays */}
                  <div>
                    <Label htmlFor="countryCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Pays Destination *
                    </Label>
                    <Input
                      id="countryName"
                      type="text"
                      placeholder="Sélectionnez un pays"
                      value={formData.countryName}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 min-h-[44px]"
                    />
                  </div>

                  {/* Tarification */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Tarification</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais de visa :</span>
                        <span className="font-medium text-gray-900">0 {CURRENCY}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais d'accompagnement :</span>
                        <span className="font-medium text-gray-900">{ACCOMPANIMENT_FEE.toLocaleString('fr-FR')} {CURRENCY}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-2 flex justify-between">
                        <span className="font-semibold text-gray-900">Total :</span>
                        <span className="font-bold text-lg text-blue-600">{ACCOMPANIMENT_FEE.toLocaleString('fr-FR')} {CURRENCY}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes supplémentaires */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes Supplémentaires</h3>
                <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Informations Additionnelles
                </Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Ajoutez des informations supplémentaires si nécessaire..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/evisas')}
                  className="flex-1 min-h-[44px]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                >
                  {isLoading ? 'Soumission en cours...' : 'Soumettre la Demande'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Information supplémentaire */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">À propos de votre demande</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Votre demande sera traitée dans les 24 heures</li>
              <li>✓ Vous recevrez un email de confirmation</li>
              <li>✓ Notre équipe vous contactera pour les prochaines étapes</li>
              <li>✓ Le tarif affiché est définitif et non modifiable</li>
            </ul>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
