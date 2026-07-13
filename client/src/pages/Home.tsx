import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Globe, Plane, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceType: "",
    destination: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.serviceType) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast.success("Pré-évaluation envoyée ! Nous vous contacterons bientôt.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        serviceType: "",
        destination: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-lg text-blue-900">3M Travel</div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Services</a>
            <a href="#evaluation" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Pré-évaluation</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium">Contact</a>
          </nav>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            +237 620-996-045
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-400/10" />
        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Réalisez vos projets</p>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Pré-évaluez vos options de voyage
                </h1>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Complétez notre pré-évaluation gratuite pour déterminer les services de voyage et visa qui correspondent le mieux à votre projet. Nos experts analyseront votre profil et vous proposeront les meilleures solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-base">
                  Commencer l'évaluation
                </Button>
                <Button size="lg" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  En savoir plus
                </Button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                  <Globe className="w-24 h-24 mx-auto opacity-80" />
                  <p className="text-2xl font-bold">Explorez le monde</p>
                  <p className="text-blue-100">Avec 3M Travel & Services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Nos services</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              3M Travel & Services offre une gamme complète de services pour faciliter vos déplacements et réaliser vos projets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Plane,
                title: "Vente de billets d'avion",
                description: "Accédez aux meilleures tarifs et horaires pour vos vols internationaux et domestiques.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: Users,
                title: "Assistance Visa",
                description: "Obtenez une assistance complète pour vos demandes de visa vers 8 pays différents.",
                color: "from-blue-600 to-blue-700"
              },
              {
                icon: Globe,
                title: "Tourisme & Hôtels",
                description: "Planifiez vos vacances avec nos packages touristiques et réservations d'hôtels.",
                color: "from-blue-700 to-blue-800"
              }
            ].map((service, idx) => {
              const Icon = service.icon;
              return (
                <Card key={idx} className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-100">
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Evaluation Form Section */}
      <section id="evaluation" className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Formulaire gratuit</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pré-évaluation gratuite
              </h2>
              <p className="text-gray-600">
                Remplissez ce formulaire pour que nos experts évaluent votre profil et vous proposent les meilleures options.
              </p>
            </div>

            <Card className="p-8 md:p-12 border-blue-100 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Row 1: Name & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-semibold">
                      Nom complet *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jean Dupont"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-semibold">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 2: Phone & Service Type */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">
                      Téléphone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+237 620-996-045"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceType" className="text-gray-700 font-semibold">
                      Type de service *
                    </Label>
                    <Select value={formData.serviceType} onValueChange={(value) => handleSelectChange(value, "serviceType")}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Sélectionnez un service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Assistance Visa</SelectItem>
                        <SelectItem value="billet">Vente de billet d'avion</SelectItem>
                        <SelectItem value="hotel">Réservation d'hôtel</SelectItem>
                        <SelectItem value="tourisme">Tourisme</SelectItem>
                        <SelectItem value="assurance">Assurance voyage</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Destination */}
                <div className="space-y-2">
                  <Label htmlFor="destination" className="text-gray-700 font-semibold">
                    Destination souhaitée
                  </Label>
                  <Select value={formData.destination} onValueChange={(value) => handleSelectChange(value, "destination")}>
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Sélectionnez une destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="allemagne">Allemagne</SelectItem>
                      <SelectItem value="uk">Royaume-Uni</SelectItem>
                      <SelectItem value="espagne">Espagne</SelectItem>
                      <SelectItem value="italie">Italie</SelectItem>
                      <SelectItem value="belgique">Belgique</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="chine">Chine</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 4: Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700 font-semibold">
                    Message supplémentaire
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Décrivez votre projet ou vos besoins spécifiques..."
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6 font-semibold"
                  >
                    {isSubmitting ? "Envoi en cours..." : "Envoyer la pré-évaluation"}
                  </Button>
                  <p className="text-sm text-gray-500 text-center">
                    * Champs obligatoires. Nous vous contacterons dans les 24 heures.
                  </p>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Pourquoi nous choisir</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              L'expertise à votre service
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: "Expertise réglementée",
                description: "Nos professionnels sont experts en services de voyage et visa. Nous connaissons les critères de chaque pays et les meilleures pratiques."
              },
              {
                title: "Accompagnement personnalisé",
                description: "Chaque projet est unique. Nous analysons votre profil pour vous proposer les solutions les plus adaptées à vos besoins."
              },
              {
                title: "Gain de temps précieux",
                description: "Nous prenons en charge toutes les démarches de A à Z, vous évitant les retards et les complications administratives."
              },
              {
                title: "Tranquillité d'esprit",
                description: "Vos démarches sont entre de bonnes mains. Nous respectons les normes internationales et les réglementations en vigueur."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mt-1" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à réaliser votre projet ?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Contactez nos experts dès aujourd'hui pour une consultation gratuite et personnalisée.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
              Pré-évaluation gratuite
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700 font-semibold">
              Nous contacter
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div className="font-bold text-white">3M Travel</div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Votre partenaire de confiance pour tous vos besoins de voyage et visa.
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Visa & Immigration</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Billets d'avion</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Hôtels & Tourisme</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Assurance voyage</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Notre équipe</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Carrière</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-400">Adresse:</span><br />
                  Yaoundé Biyem-Assi, Montée chapelle Obili
                </p>
                <p>
                  <span className="text-gray-400">Téléphone:</span><br />
                  <a href="tel:+237620996045" className="hover:text-blue-400">+237 620-996-045</a>
                </p>
                <p>
                  <span className="text-gray-400">Email:</span><br />
                  <a href="mailto:hello@3mtravelegency.com" className="hover:text-blue-400">hello@3mtravelegency.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
              <p>&copy; 2026 3M Travel & Services SARL. Tous droits réservés.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-blue-400 transition-colors">Politique de confidentialité</a>
                <a href="#" className="hover:text-blue-400 transition-colors">Conditions d'utilisation</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
