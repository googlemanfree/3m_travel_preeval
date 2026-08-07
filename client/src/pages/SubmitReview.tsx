import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Star, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SubmitReview() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    destinationCountry: "",
    serviceType: "",
    rating: 5,
    reviewText: "",
    consentToPublish: false,
    displayNameChoice: "first_name_only" as const,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submitMutation = trpc.customerReview.submit.useMutation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.fullName.length < 3) {
      newErrors.fullName = "Le nom doit contenir au moins 3 caractères";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (formData.reviewText.length < 10) {
      newErrors.reviewText = "L'avis doit contenir au moins 10 caractères";
    }

    if (formData.reviewText.length > 1000) {
      newErrors.reviewText = "L'avis ne doit pas dépasser 1000 caractères";
    }

    if (!formData.consentToPublish) {
      newErrors.consentToPublish = "Vous devez consentir à la publication de votre avis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await submitMutation.mutateAsync({
        fullName: formData.fullName,
        email: formData.email,
        destinationCountry: formData.destinationCountry || undefined,
        serviceType: formData.serviceType || undefined,
        rating: formData.rating,
        reviewText: formData.reviewText,
        consentToPublish: formData.consentToPublish,
        displayNameChoice: formData.displayNameChoice,
      });

      setSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        destinationCountry: "",
        serviceType: "",
        rating: 5,
        reviewText: "",
        consentToPublish: false,
        displayNameChoice: "first_name_only",
      });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Partagez votre Expérience</h1>
          <p className="text-lg text-slate-600">
            Votre avis nous aide à améliorer nos services et guide d'autres candidats
          </p>
        </motion.div>

        {/* Success Message */}
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Merci pour votre avis !</h3>
              <p className="text-sm text-green-700">
                Votre avis a été reçu et sera publié après validation par notre équipe.
              </p>
            </div>
          </motion.div>
        )}

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <Label htmlFor="fullName" className="text-sm font-semibold">
                  Nom Complet *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Votre nom complet"
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-semibold">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre.email@exemple.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Destination and Service Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination" className="text-sm font-semibold">
                    Destination (Optionnel)
                  </Label>
                  <Input
                    id="destination"
                    value={formData.destinationCountry}
                    onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
                    placeholder="ex: Canada, France"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceType" className="text-sm font-semibold">
                    Type de Service (Optionnel)
                  </Label>
                  <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                    <SelectTrigger id="serviceType">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Visa Travail">Visa Travail</SelectItem>
                      <SelectItem value="Visa Études">Visa Études</SelectItem>
                      <SelectItem value="Visa Visiteur">Visa Visiteur</SelectItem>
                      <SelectItem value="E-Visa">E-Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Votre Note *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= formData.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="reviewText" className="text-sm font-semibold">
                  Votre Avis *
                </Label>
                <Textarea
                  id="reviewText"
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  placeholder="Partagez votre expérience avec 3M Travel Agency..."
                  rows={6}
                  className={errors.reviewText ? "border-red-500" : ""}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-slate-500">
                    Minimum 10 caractères
                  </p>
                  <p className={`text-xs ${formData.reviewText.length > 1000 ? "text-red-600" : "text-slate-500"}`}>
                    {formData.reviewText.length}/1000
                  </p>
                </div>
                {errors.reviewText && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.reviewText}
                  </p>
                )}
              </div>

              {/* Display Name Choice */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Comment afficher votre nom ?</Label>
                <div className="space-y-2">
                  {[
                    { value: "full_name", label: "Nom complet" },
                    { value: "first_name_only", label: "Prénom uniquement" },
                    { value: "initials", label: "Initiales" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="displayNameChoice"
                        value={option.value}
                        checked={formData.displayNameChoice === option.value}
                        onChange={(e) => setFormData({ ...formData, displayNameChoice: e.target.value as any })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={formData.consentToPublish}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, consentToPublish: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    Je consens à la publication de mon avis sur le site 3M Travel Agency.
                    Mon avis sera validé par l'équipe avant publication.
                  </span>
                </label>
                {errors.consentToPublish && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.consentToPublish}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? "Envoi en cours..." : "Soumettre mon Avis"}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                * Champs obligatoires
              </p>
            </form>
          </Card>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h3 className="font-semibold text-blue-900 mb-2">Pourquoi laisser un avis ?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Aider d'autres candidats à prendre une décision éclairée</li>
            <li>✓ Nous permettre d'améliorer nos services</li>
            <li>✓ Partager votre succès avec la communauté</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
