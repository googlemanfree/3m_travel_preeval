/**
 * Template unifié pour les pages de services
 * Inclut : Hero, Avantages, Processus, Tarifs, FAQ, Formulaire de contact
 */
import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Phone, Mail, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceAdvantage {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface ServiceStep {
  number: number;
  title: string;
  description: string;
  duration?: string;
}

export interface ServicePricing {
  name: string;
  price: string;
  currency?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta?: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServicePageConfig {
  // Hero
  title: string;
  subtitle: string;
  description: string;
  heroIcon?: React.ReactNode;
  heroBadge?: string;
  ctaLabel?: string;
  ctaLink?: string;
  // Avantages
  advantages?: ServiceAdvantage[];
  // Processus
  steps?: ServiceStep[];
  // Tarifs
  pricing?: ServicePricing[];
  // FAQ
  faqs?: ServiceFAQ[];
  // Formulaire
  showContactForm?: boolean;
  contactFormTitle?: string;
  serviceOptions?: string[];
}

// ─── Composant FAQ ────────────────────────────────────────────────────────────

function FAQItem({ question, answer }: ServiceFAQ) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed border-t bg-gray-50">
          <p className="pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire de contact ────────────────────────────────────────────────────

function ContactForm({ title, serviceOptions }: { title?: string; serviceOptions?: string[] }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simuler l'envoi (à connecter à une procédure tRPC)
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Votre demande a été envoyée ! Nous vous répondrons dans les 24h.");
    setForm({ name: "", email: "", phone: "", service: "", message: "" });
    setLoading(false);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          {title || "Demander des informations"}
        </CardTitle>
        <p className="text-center text-gray-500 text-sm">Réponse garantie en moins de 24h</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jean Dupont"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jean@exemple.com"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            {serviceOptions && serviceOptions.length > 0 && (
              <div>
                <Label htmlFor="service">Service souhaité</Label>
                <Select value={form.service} onValueChange={v => setForm(f => ({ ...f, service: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Décrivez votre projet ou posez votre question..."
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer ma demande"}
          </Button>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 pt-2">
            <a href="tel:+237XXXXXXXX" className="flex items-center gap-1 hover:text-blue-600">
              <Phone className="w-4 h-4" /> Appeler
            </a>
            <a href="mailto:contact@3mtravel.cm" className="flex items-center gap-1 hover:text-blue-600">
              <Mail className="w-4 h-4" /> Email
            </a>
            <a href="https://wa.me/237XXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-green-600">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Template principal ───────────────────────────────────────────────────────

export function ServicePageTemplate({
  title,
  subtitle,
  description,
  heroIcon,
  heroBadge,
  ctaLabel = "Commencer maintenant",
  ctaLink = "/evaluation",
  advantages = [],
  steps = [],
  pricing = [],
  faqs = [],
  showContactForm = true,
  contactFormTitle,
  serviceOptions = [],
}: ServicePageConfig) {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1B2B5E] to-[#2A4A9E] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {heroIcon && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                {heroIcon}
              </div>
            </div>
          )}
          {heroBadge && (
            <Badge className="mb-4 bg-[#D4AF37] text-black font-semibold">{heroBadge}</Badge>
          )}
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="text-lg md:text-xl text-blue-200 mb-4">{subtitle}</p>
          <p className="text-base text-blue-100 max-w-2xl mx-auto mb-8">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={ctaLink}>
              <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold">
                {ctaLabel} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/schedule-agency">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Prendre rendez-vous
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Avantages ────────────────────────────────────────────────────── */}
      {advantages.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
              Pourquoi choisir notre service ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {adv.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{adv.title}</h3>
                        <p className="text-sm text-gray-600">{adv.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Processus ────────────────────────────────────────────────────── */}
      {steps.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10">
              Comment ça marche ?
            </h2>
            <div className="space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#1B2B5E] text-white rounded-full flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  <div className="flex-1 pb-6 border-b last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      {step.duration && (
                        <Badge variant="outline" className="text-xs">{step.duration}</Badge>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Tarifs ───────────────────────────────────────────────────────── */}
      {pricing.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
              Nos Tarifs
            </h2>
            <p className="text-center text-gray-500 mb-10">Transparents et sans frais cachés</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricing.map((plan, i) => (
                <Card key={i} className={`relative ${plan.highlighted ? "border-2 border-[#D4AF37] shadow-lg" : ""}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#D4AF37] text-black font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" /> Recommandé
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-[#1B2B5E] mt-2">
                      {plan.price}
                      {plan.currency && <span className="text-base font-normal text-gray-500 ml-1">{plan.currency}</span>}
                    </div>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={ctaLink}>
                      <Button className={`w-full ${plan.highlighted ? "bg-[#D4AF37] hover:bg-[#B8962E] text-black" : ""}`}>
                        {plan.cta || "Choisir ce plan"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ + Formulaire ─────────────────────────────────────────────── */}
      {(faqs.length > 0 || showContactForm) && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className={`grid gap-12 ${showContactForm ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {faqs.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
                  <div className="space-y-3">
                    {faqs.map((faq, i) => (
                      <FAQItem key={i} {...faq} />
                    ))}
                  </div>
                </div>
              )}
              {showContactForm && (
                <div>
                  <ContactForm title={contactFormTitle} serviceOptions={serviceOptions} />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA final ────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-[#1B2B5E] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Prêt à commencer ?</h2>
          <p className="text-blue-200 mb-6">Nos conseillers sont disponibles pour vous accompagner dans votre projet.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={ctaLink}>
              <Button size="lg" className="bg-[#D4AF37] hover:bg-[#B8962E] text-black font-bold">
                {ctaLabel} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="https://wa.me/237XXXXXXXX" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServicePageTemplate;
