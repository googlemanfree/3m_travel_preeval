import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentFormData {
  agency: "douala" | "yaounde";
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  visaType: string;
}

export default function ScheduleAgency() {
  const [location, setLocation] = useLocation();
  const [formData, setFormData] = useState<AppointmentFormData>({
    agency: "douala",
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Canada",
    visaType: "Étudiant",
  });
  const [loading, setLoading] = useState(false);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  const agencies = {
    douala: {
      name: "Agence Douala",
      address: "[Adresse à confirmer]",
      phone: "+237 6XX XXX XXX",
      hours: "Lun-Ven 09:00-17:00",
      email: "douala@3mtravelagency.click",
    },
    yaounde: {
      name: "Agence Yaoundé",
      address: "[Adresse à confirmer]",
      phone: "+237 6XX XXX XXX",
      hours: "Lun-Ven 09:00-17:00",
      email: "yaounde@3mtravelagency.click",
    },
  };

  const countries = ["Canada", "USA", "France", "Royaume-Uni", "Australie"];
  const visaTypes = ["Étudiant", "Travail", "Tourisme", "Résidence"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    if (!formData.date || !formData.time) {
      alert("Veuillez sélectionner une date et une heure");
      return;
    }

    setLoading(true);

    try {
      // Simulation de l'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));

      const appointmentRef = `RDV-${Date.now()}`;
      setConfirmationData({
        ...formData,
        reference: appointmentRef,
        agency: agencies[formData.agency],
      });
      setAppointmentConfirmed(true);
    } catch (error) {
      alert("Erreur lors de la prise de rendez-vous. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (appointmentConfirmed && confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <CardTitle>Rendez-vous Confirmé!</CardTitle>
                  <CardDescription>Votre rendez-vous a été enregistré avec succès</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Détails du rendez-vous */}
              <div className="bg-white p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Référence</p>
                    <p className="font-bold text-lg">{confirmationData.reference}</p>
                  </div>
                  <Badge>Confirmé</Badge>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Agence</p>
                      <p className="font-semibold">{confirmationData.agency.name}</p>
                      <p className="text-sm text-gray-700">{confirmationData.agency.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Date et Heure</p>
                      <p className="font-semibold">
                        {new Date(confirmationData.date).toLocaleDateString('fr-FR')} à {confirmationData.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Contact Agence</p>
                      <p className="font-semibold">{confirmationData.agency.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{confirmationData.agency.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents à apporter */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Documents à apporter en original:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>✓ Passeport valide</li>
                    <li>✓ Pièce d'identité</li>
                    <li>✓ Tous les documents mentionnés dans la checklist</li>
                    <li>✓ Preuve de paiement (si applicable)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Confirmation email */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription>
                  <p className="text-sm">
                    ✓ Un email de confirmation a été envoyé à <strong>{confirmationData.email}</strong>
                  </p>
                  <p className="text-sm mt-2">
                    ✓ Un message WhatsApp a été envoyé au <strong>{confirmationData.phone}</strong>
                  </p>
                </AlertDescription>
              </Alert>

              {/* Boutons d'action */}
              <div className="space-y-2">
                <Button
                  onClick={() => setLocation("/")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Retour à l'accueil
                </Button>
                <Button
                  onClick={() => setLocation("/mon-espace")}
                  variant="outline"
                  className="w-full"
                >
                  Accéder à mon espace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Prendre Rendez-vous en Agence</h1>
          <p className="text-lg text-gray-600">Rencontrez nos experts en personne</p>
        </div>

        {/* Sélection Agence */}
        <Card>
          <CardHeader>
            <CardTitle>Choisissez une Agence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(agencies).map(([key, agency]) => (
                <button
                  key={key}
                  onClick={() => setFormData(prev => ({ ...prev, agency: key as any }))}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.agency === key
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-semibold text-lg mb-2">{agency.name}</p>
                  <p className="text-sm text-gray-700 mb-1">{agency.address}</p>
                  <p className="text-sm text-gray-600">{agency.hours}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Vos Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email et Téléphone */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jean@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+237 6XX XXX XXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Pays et Type Visa */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pays Destination</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type de Visa</label>
                  <select
                    name="visaType"
                    value={formData.visaType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {visaTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date et Heure */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Heure</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Bouton Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
              >
                {loading ? "Traitement..." : "Confirmer mon Rendez-vous"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous recevrez une confirmation par email et WhatsApp avec tous les détails de votre rendez-vous.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
