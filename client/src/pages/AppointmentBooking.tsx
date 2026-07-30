import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Video, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { toast } from 'sonner';

type AppointmentType = 'agency' | 'visio';
type TimeSlot = string;

const AVAILABLE_DATES = [
  '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
  '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12',
];

const TIME_SLOTS: TimeSlot[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export default function AppointmentBooking() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleTypeSelect = (type: AppointmentType) => {
    setAppointmentType(type);
    setStep(2);
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Veuillez sélectionner une date et une heure');
      return;
    }
    setStep(3);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Rendez-vous confirmé ! Vérifiez votre email.');
      setIsConfirmed(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setStep(1);
        setAppointmentType(null);
        setSelectedDate(null);
        setSelectedTime(null);
        setFormData({ fullName: '', email: '', phone: '', subject: '' });
        setIsConfirmed(false);
      }, 3000);
    } catch (error) {
      toast.error('Erreur lors de la confirmation du rendez-vous');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      {/* Hero */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-[#0B192C] to-[#1E3E62]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Prenez un Rendez-vous
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Consultez nos experts en visa et immigration directement en agence à Yaoundé ou en visio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4">
          {isConfirmed ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-12 text-center border-green-200 bg-green-50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-green-900 mb-3">Rendez-vous Confirmé !</h2>
                <p className="text-green-700 mb-2">
                  Votre rendez-vous a été confirmé avec succès.
                </p>
                <p className="text-sm text-green-600">
                  Un email de confirmation a été envoyé à {formData.email}
                </p>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Step 1: Type Selection */}
              {step === 1 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                    Choisissez votre mode de consultation
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Agency Option */}
                    <motion.div
                      custom={0}
                      variants={fadeUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTypeSelect('agency')}
                      className="cursor-pointer"
                    >
                      <Card className="p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mb-6 mx-auto">
                          <MapPin className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                          En Agence à Yaoundé
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                          Consultez nos experts directement dans nos bureaux à Yaoundé pour une expérience personnalisée.
                        </p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <p>📍 Avenue Marché Biyem-Assi</p>
                          <p>⏰ Lundi - Vendredi: 09:00 - 17:00</p>
                          <p>☎️ +237 698 104 832</p>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Visio Option */}
                    <motion.div
                      custom={1}
                      variants={fadeUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTypeSelect('visio')}
                      className="cursor-pointer"
                    >
                      <Card className="p-8 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center mb-6 mx-auto">
                          <Video className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                          En Visio (Google Meet / WhatsApp)
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                          Consultez nos experts depuis chez vous via Google Meet ou WhatsApp Video Call.
                        </p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <p>💻 Accès facile depuis votre ordinateur</p>
                          <p>⏰ Créneaux flexibles</p>
                          <p>📱 Support WhatsApp disponible</p>
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === 2 && appointmentType && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="mb-6"
                  >
                    ← Retour
                  </Button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Sélectionnez une date et une heure
                  </h2>

                  <Card className="p-8">
                    <div className="space-y-6">
                      {/* Date Selection */}
                      <motion.div custom={0} variants={fadeUp}>
                        <Label className="text-lg font-semibold text-gray-900 mb-4 block">
                          <Calendar className="w-5 h-5 inline mr-2" />
                          Date
                        </Label>
                        <Select value={selectedDate || ''} onValueChange={setSelectedDate}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionnez une date" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_DATES.map(date => (
                              <SelectItem key={date} value={date}>
                                {new Date(date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      {/* Time Selection */}
                      <motion.div custom={1} variants={fadeUp}>
                        <Label className="text-lg font-semibold text-gray-900 mb-4 block">
                          <Clock className="w-5 h-5 inline mr-2" />
                          Heure
                        </Label>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {TIME_SLOTS.map(time => (
                            <motion.button
                              key={time}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                selectedTime === time
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              {time}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>

                      {/* Confirmation */}
                      {selectedDate && selectedTime && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <p className="text-sm text-blue-900">
                            <strong>Rendez-vous prévu :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR')} à {selectedTime}
                          </p>
                        </motion.div>
                      )}

                      <Button
                        onClick={handleDateTimeSelect}
                        disabled={!selectedDate || !selectedTime}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                      >
                        Continuer <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Contact Information */}
              {step === 3 && appointmentType && selectedDate && selectedTime && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="mb-6"
                  >
                    ← Retour
                  </Button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Confirmez vos informations
                  </h2>

                  <Card className="p-8">
                    <div className="space-y-6">
                      {/* Appointment Summary */}
                      <motion.div custom={0} variants={fadeUp} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3">Résumé de votre rendez-vous</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <strong>Type :</strong> {appointmentType === 'agency' ? 'En Agence à Yaoundé' : 'En Visio (Google Meet / WhatsApp)'}
                          </p>
                          <p>
                            <strong>Date :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR')}
                          </p>
                          <p>
                            <strong>Heure :</strong> {selectedTime}
                          </p>
                        </div>
                      </motion.div>

                      {/* Contact Form */}
                      <motion.div custom={1} variants={fadeUp} className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" className="text-gray-700 font-semibold mb-2 block">
                            Nom complet <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="fullName"
                            placeholder="Jean Dupont"
                            value={formData.fullName}
                            onChange={(e) => handleFormChange('fullName', e.target.value)}
                            className="border-gray-200"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-semibold mb-2 block">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="jean@example.com"
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            className="border-gray-200"
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone" className="text-gray-700 font-semibold mb-2 block">
                            Téléphone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            placeholder="+237 620-996-045"
                            value={formData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            className="border-gray-200"
                          />
                        </div>

                        <div>
                          <Label htmlFor="subject" className="text-gray-700 font-semibold mb-2 block">
                            Sujet de consultation
                          </Label>
                          <Select value={formData.subject} onValueChange={(value) => handleFormChange('subject', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionnez un sujet" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="visa-etude">Visa Étude</SelectItem>
                              <SelectItem value="visa-travail">Visa Travail</SelectItem>
                              <SelectItem value="residence-permanente">Résidence Permanente</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>

                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                      >
                        {isSubmitting ? 'Confirmation en cours...' : 'Confirmer le Rendez-vous'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
