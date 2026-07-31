import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Copy, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminAddDossier() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    destinationCountry: '',
    visaType: '',
  });

  const [createdDossier, setCreatedDossier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createDossierMutation = trpc.admin.createManualDossier.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setCreatedDossier(data.dossier);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          nationality: '',
          destinationCountry: '',
          visaType: '',
        });
        toast.success('Dossier créé avec succès !');
      } else {
        toast.error(data.error || 'Erreur lors de la création du dossier');
      }
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createDossierMutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📋 Ajouter un Dossier Manuellement</h1>
        <p className="text-gray-600 mt-2">Créez un dossier pour les candidats qui viennent directement en agence</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du Candidat</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom Complet *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Jean Dupont"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="jean@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+237 6XX XXX XXX"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="nationality">Nationalité *</Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  required
                  placeholder="Camerounaise"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="destinationCountry">Pays de Destination *</Label>
                <select
                  id="destinationCountry"
                  name="destinationCountry"
                  value={formData.destinationCountry}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none mt-1"
                >
                  <option value="">Sélectionner un pays</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                  <option value="Allemagne">Allemagne</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Pologne">Pologne</option>
                  <option value="Belgique">Belgique</option>
                  <option value="Suisse">Suisse</option>
                </select>
              </div>

              <div>
                <Label htmlFor="visaType">Type de Visa *</Label>
                <select
                  id="visaType"
                  name="visaType"
                  value={formData.visaType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none mt-1"
                >
                  <option value="">Sélectionner un type</option>
                  <option value="etude">Études</option>
                  <option value="travail">Travail</option>
                  <option value="tourisme">Tourisme</option>
                  <option value="rp">Résidence Permanente</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={isLoading || createDossierMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading || createDossierMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  '✅ Créer le Dossier'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Résultat */}
        {createdDossier && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 size={24} />
                  Dossier Créé avec Succès
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de Dossier</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono font-bold text-lg">
                        {createdDossier.dossierNumber}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdDossier.dossierNumber)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Code d'Accès Temporaire</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono font-bold text-lg">
                        {createdDossier.accessCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(createdDossier.accessCode)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>À communiquer au candidat :</strong><br/>
                      Numéro de dossier : {createdDossier.dossierNumber}<br/>
                      Code d'accès : {createdDossier.accessCode}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Copier les deux informations
                    const info = `Numéro de dossier: ${createdDossier.dossierNumber}\nCode d'accès: ${createdDossier.accessCode}`;
                    navigator.clipboard.writeText(info);
                    toast.success('Informations copiées');
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier les Informations
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCreatedDossier(null)}
                >
                  Créer un Autre Dossier
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
