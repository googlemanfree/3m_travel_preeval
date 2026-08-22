import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Upload, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function EvisaDemande() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    country: '',
    fullName: '',
    email: '',
    phone: '',
    passportNumber: '',
    passportExpiry: '',
    dateOfBirth: '',
    travelDate: '',
    duration: '',
  });

  const countries = [
    'Émirats Arabes Unis / Dubaï',
    'Inde',
    'Vietnam',
    'Thaïlande',
    'Qatar',
    'Ouzbékistan',
    "Côte d'Ivoire",
    'Zambie',
    'Zimbabwe',
    'Moldavie',
    'Suriname',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const lines = [
      `Bonjour, je souhaite faire une demande d'eVisa pour ${formData.country}.`,
      ``,
      `Nom complet : ${formData.fullName}`,
      `Email : ${formData.email}`,
      `Téléphone : ${formData.phone}`,
      formData.dateOfBirth ? `Date de naissance : ${formData.dateOfBirth}` : null,
      formData.passportNumber ? `Numéro de passeport : ${formData.passportNumber}` : null,
      formData.passportExpiry ? `Expiration du passeport : ${formData.passportExpiry}` : null,
      formData.travelDate ? `Date de voyage prévue : ${formData.travelDate}` : null,
      formData.duration ? `Durée du séjour : ${formData.duration} jours` : null,
    ].filter(Boolean);
    const message = lines.join('\n');
    const whatsappUrl = `https://wa.me/16728972999?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    s <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <CheckCircle size={24} /> : s}
                </motion.div>
              ))}
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step 1: Destination */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Étape 1 : Choisissez votre destination
              </h2>
              <div className="space-y-4">
                {countries.map((country) => (
                  <motion.button
                    key={country}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, country }))}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left font-semibold ${
                      formData.country === country
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {country}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Étape 2 : Informations personnelles
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="evisa-fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="evisa-fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="evisa-email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre.email@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="evisa-phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="evisa-dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Passport Info */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Étape 3 : Informations du passeport
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="evisa-passportNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de passeport
                  </label>
                  <input
                    type="text"
                    name="passportNumber"
                    id="evisa-passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: AB123456"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-passportExpiry" className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration du passeport
                  </label>
                  <input
                    type="date"
                    name="passportExpiry"
                    id="evisa-passportExpiry"
                    value={formData.passportExpiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-travelDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Date de voyage prévue
                  </label>
                  <input
                    type="date"
                    name="travelDate"
                    id="evisa-travelDate"
                    value={formData.travelDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="evisa-duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Durée du séjour (jours)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    id="evisa-duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Étape 4 : Vérification
              </h2>
              <div className="bg-white rounded-lg p-6 space-y-4 border border-gray-200">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Destination :</span>
                  <span className="text-gray-900">{formData.country}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Nom :</span>
                  <span className="text-gray-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Email :</span>
                  <span className="text-gray-900">{formData.email}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Téléphone :</span>
                  <span className="text-gray-900">{formData.phone}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Passeport :</span>
                  <span className="text-gray-900">{formData.passportNumber}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-medium text-gray-700">Durée :</span>
                  <span className="text-gray-900">{formData.duration} jours</span>
                </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  ✓ Vérifiez vos informations avant de soumettre votre demande
                </p>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              disabled={step === 1}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Précédent
            </motion.button>
            {step < 4 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!formData.country && step === 1}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
              >
                Suivant
                <ArrowRight size={20} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all inline-flex items-center justify-center gap-2"
              >
                <Phone size={20} />
                Soumettre via WhatsApp
              </motion.button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
