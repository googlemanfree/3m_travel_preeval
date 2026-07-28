import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Video,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  advisor: string;
}

interface AppointmentType {
  id: string;
  name: string;
  description: string;
  duration: number;
  icon: React.ReactNode;
  price: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

// ─── Composant : Sélection du Type de RDV ───
const AppointmentTypeSelector = ({
  onSelect,
}: {
  onSelect: (type: AppointmentType) => void;
}) => {
  const types: AppointmentType[] = [
    {
      id: "consultation",
      name: "Consultation Générale",
      description: "Évaluation de votre profil et discussion des options",
      duration: 30,
      icon: <User className="w-6 h-6" />,
      price: 0,
    },
    {
      id: "evaluation",
      name: "Évaluation Complète",
      description: "Analyse approfondie de votre dossier avec recommandations",
      duration: 60,
      icon: <Zap className="w-6 h-6" />,
      price: 15000,
    },
    {
      id: "followup",
      name: "Suivi de Dossier",
      description: "Point de suivi sur l'avancement de votre demande",
      duration: 20,
      icon: <CheckCircle2 className="w-6 h-6" />,
      price: 0,
    },
    {
      id: "document",
      name: "Aide Documents",
      description: "Assistance pour la préparation de vos documents",
      duration: 45,
      icon: <Mail className="w-6 h-6" />,
      price: 10000,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Type de Rendez-vous
        </h2>
        <p className="text-gray-600">Sélectionnez le type de consultation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((type, index) => (
          <motion.button
            key={type.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={index}
            onClick={() => onSelect(type)}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                {type.icon}
              </div>
              <span className="text-sm font-bold text-blue-600">
                {type.duration} min
              </span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{type.description}</p>
            {type.price > 0 && (
              <p className="text-sm font-semibold text-blue-600">
                {type.price.toLocaleString()} XAF
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Sélection de la Date ───
const DateSelector = ({
  selectedType,
  onSelect,
}: {
  selectedType: AppointmentType;
  onSelect: (date: string) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    onSelect(dateStr);
  };

  const monthName = currentMonth.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sélectionner une Date
        </h2>
        <p className="text-gray-600">
          {selectedType.name} - {selectedType.duration} minutes
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
              )
            }
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-gray-900 capitalize">{monthName}</h3>
          <button
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
              )
            }
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-xs font-bold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split("T")[0];
            const isSelected = selectedDate === dateStr;
            const isDisabled = date < new Date();

            return (
              <motion.button
                key={day}
                whileHover={!isDisabled ? { scale: 1.1 } : {}}
                onClick={() => !isDisabled && handleDateSelect(day)}
                disabled={isDisabled}
                className={`p-2 rounded-lg font-semibold text-sm transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : isDisabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                }`}
              >
                {day}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Composant : Sélection de l'Heure ───
const TimeSelector = ({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (time: string) => void;
}) => {
  const timeSlots: TimeSlot[] = [
    {
      id: "1",
      date: selectedDate,
      time: "09:00",
      available: true,
      advisor: "Alain Fouda",
    },
    {
      id: "2",
      date: selectedDate,
      time: "10:00",
      available: true,
      advisor: "Marie Dupont",
    },
    {
      id: "3",
      date: selectedDate,
      time: "11:00",
      available: false,
      advisor: "Jean Martin",
    },
    {
      id: "4",
      date: selectedDate,
      time: "14:00",
      available: true,
      advisor: "Alain Fouda",
    },
    {
      id: "5",
      date: selectedDate,
      time: "15:00",
      available: true,
      advisor: "Marie Dupont",
    },
    {
      id: "6",
      date: selectedDate,
      time: "16:00",
      available: true,
      advisor: "Jean Martin",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sélectionner une Heure
        </h2>
        <p className="text-gray-600">
          {new Date(selectedDate).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {timeSlots.map((slot, index) => (
          <motion.button
            key={slot.id}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={index}
            onClick={() => slot.available && onSelect(slot.time)}
            disabled={!slot.available}
            whileHover={slot.available ? { scale: 1.05 } : {}}
            className={`p-4 rounded-lg border-2 transition-all ${
              slot.available
                ? "border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
            }`}
          >
            <p className="font-bold text-lg text-gray-900">{slot.time}</p>
            <p className="text-xs text-gray-600 mt-1">{slot.advisor}</p>
            {!slot.available && (
              <p className="text-xs text-red-600 mt-1">Indisponible</p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Confirmation ───
const ConfirmationStep = ({
  appointmentType,
  date,
  time,
  onConfirm,
}: {
  appointmentType: AppointmentType;
  date: string;
  time: string;
  onConfirm: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    meetingType: "video",
    notes: "",
  });

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Confirmer Votre Rendez-vous
        </h2>
        <p className="text-gray-600">Vérifiez les détails et confirmez</p>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Type de Consultation</span>
          <span className="font-bold text-gray-900">{appointmentType.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Date</span>
          <span className="font-bold text-gray-900">{formattedDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Heure</span>
          <span className="font-bold text-gray-900">{time}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Durée</span>
          <span className="font-bold text-gray-900">{appointmentType.duration} minutes</span>
        </div>
        {appointmentType.price > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-blue-200">
            <span className="text-gray-700 font-semibold">Total</span>
            <span className="font-bold text-blue-600 text-lg">
              {appointmentType.price.toLocaleString()} XAF
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Nom Complet
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Votre nom"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="votre@email.com"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+237 6 98 10 48 32"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Mode de Consultation
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="meetingType"
                value="video"
                checked={formData.meetingType === "video"}
                onChange={(e) =>
                  setFormData({ ...formData, meetingType: e.target.value })
                }
              />
              <Video className="w-4 h-4" />
              <span className="text-sm">Vidéo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="meetingType"
                value="phone"
                checked={formData.meetingType === "phone"}
                onChange={(e) =>
                  setFormData({ ...formData, meetingType: e.target.value })
                }
              />
              <Phone className="w-4 h-4" />
              <span className="text-sm">Téléphone</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="meetingType"
                value="office"
                checked={formData.meetingType === "office"}
                onChange={(e) =>
                  setFormData({ ...formData, meetingType: e.target.value })
                }
              />
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Bureau</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Notes Supplémentaires
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Décrivez vos questions ou besoins spécifiques..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button onClick={onConfirm} className="w-full gap-2" size="lg">
        <CheckCircle2 className="w-5 h-5" />
        Confirmer le Rendez-vous
      </Button>
    </motion.div>
  );
};

// ─── Composant Principal : AppointmentBooking ───
export default function AppointmentBooking() {
  const [step, setStep] = useState<"type" | "date" | "time" | "confirm" | "success">("type");
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleTypeSelect = (type: AppointmentType) => {
    setSelectedType(type);
    setStep("date");
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("success");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Prendre un Rendez-vous
            </h1>
            <p className="text-gray-600 mt-1">
              Étape {step === "type" ? 1 : step === "date" ? 2 : step === "time" ? 3 : 4} sur 4
            </p>
          </motion.div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {["Type", "Date", "Heure", "Confirmation"].map((label, index) => (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 && step === "type"
                      ? "bg-blue-600 text-white"
                      : index === 1 && (step === "date" || step === "time" || step === "confirm" || step === "success")
                      ? "bg-blue-600 text-white"
                      : index === 2 && (step === "time" || step === "confirm" || step === "success")
                      ? "bg-blue-600 text-white"
                      : index === 3 && (step === "confirm" || step === "success")
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                {index < 3 && <ChevronRight className="w-5 h-5 text-gray-300 ml-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <AnimatePresence mode="wait">
            {step === "type" && (
              <AppointmentTypeSelector key="type" onSelect={handleTypeSelect} />
            )}
            {step === "date" && selectedType && (
              <DateSelector
                key="date"
                selectedType={selectedType}
                onSelect={handleDateSelect}
              />
            )}
            {step === "time" && selectedDate && (
              <TimeSelector
                key="time"
                selectedDate={selectedDate}
                onSelect={handleTimeSelect}
              />
            )}
            {step === "confirm" && selectedType && selectedDate && selectedTime && (
              <ConfirmationStep
                key="confirm"
                appointmentType={selectedType}
                date={selectedDate}
                time={selectedTime}
                onConfirm={handleConfirm}
              />
            )}
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rendez-vous Confirmé!
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Un email de confirmation a été envoyé à votre adresse
                  </p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-left space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Numéro de Confirmation:</strong> RDV-2026-0042
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Lien de Réunion:</strong> https://meet.3mtravel.com/rdv-0042
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Rappel:</strong> Vous recevrez un rappel 24h avant
                  </p>
                </div>
                <Button className="w-full gap-2">
                  Retour à l'Accueil
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
