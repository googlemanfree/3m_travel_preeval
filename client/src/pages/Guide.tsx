import { useState } from "react";
import { ChevronRight, CheckCircle, Clock, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PROCEDURES, VISA_TYPES } from "@shared/visaData";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Guide() {
  const [, navigate] = useLocation();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const procedures = PROCEDURES.general;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Guide Complet</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Suivez notre guide étape par étape pour comprendre le processus de demande de visa et
            maximiser vos chances de succès.
          </p>
        </div>
      </section>

      {/* Procédures étape par étape */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl">
          {/* Timeline visuelle */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              {procedures.map((proc, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer transition-all ${
                      expandedStep === proc.step
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-blue-200 text-blue-600 hover:bg-blue-300"
                    }`}
                    onClick={() => setExpandedStep(expandedStep === proc.step ? null : proc.step)}
                  >
                    {proc.step}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center font-medium max-w-20">
                    {proc.title.split(" ")[0]}
                  </p>
                  {idx < procedures.length - 1 && (
                    <div className="hidden md:block w-full h-1 bg-blue-200 mx-2 mt-4 flex-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Détails des étapes */}
          <div className="space-y-4">
            {procedures.map((proc) => (
              <Card
                key={proc.step}
                className="overflow-hidden border-0 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setExpandedStep(expandedStep === proc.step ? null : proc.step)}
              >
                {/* En-tête de l'étape */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {proc.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{proc.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{proc.description}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={24}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${
                      expandedStep === proc.step ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {/* Contenu détaillé (expandable) */}
                {expandedStep === proc.step && (
                  <div className="p-6 bg-white border-t space-y-6">
                    {/* Durée */}
                    <div className="flex items-start gap-3 pb-6 border-b">
                      <Clock size={20} className="text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Durée estimée</p>
                        <p className="text-sm text-gray-600">{proc.duration}</p>
                      </div>
                    </div>

                    {/* Documents requis */}
                    {proc.documents.length > 0 && (
                      <div className="pb-6 border-b">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={20} className="text-blue-600" />
                          <p className="text-sm font-semibold text-gray-900">Documents à préparer</p>
                        </div>
                        <ul className="space-y-2 ml-8">
                          {proc.documents.map((doc, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-600 font-bold">•</span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Conseils pratiques */}
                    {proc.tips.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle size={20} className="text-amber-600" />
                          <p className="text-sm font-semibold text-gray-900">Conseils pratiques</p>
                        </div>
                        <ul className="space-y-2 ml-8">
                          {proc.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-amber-600 font-bold">✓</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">Questions Fréquemment Posées</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {[
              {
                q: "Combien de temps prend généralement une demande de visa ?",
                a: "Le délai varie selon le type de visa et la destination. Les visas touristiques prennent généralement 5-15 jours, tandis que les visas de résidence permanente peuvent prendre 6-18 mois.",
              },
              {
                q: "Quels documents sont absolument essentiels ?",
                a: "Un passeport valide, des documents d'identité, des certificats médicaux et une preuve de ressources financières sont généralement requis pour tous les types de visas.",
              },
              {
                q: "Puis-je demander plusieurs visas simultanément ?",
                a: "Oui, vous pouvez demander plusieurs visas, mais cela peut affecter votre demande. Consultez un expert avant de soumettre plusieurs demandes.",
              },
              {
                q: "Que faire si ma demande est rejetée ?",
                a: "Vous avez généralement le droit de faire appel ou de soumettre une nouvelle demande. Consultez notre équipe pour comprendre les raisons du rejet et améliorer votre dossier.",
              },
              {
                q: "Les traductions doivent-elles être certifiées ?",
                a: "Oui, la plupart des pays exigent que les traductions soient certifiées par un traducteur agréé. Vérifiez les exigences spécifiques de votre destination.",
              },
              {
                q: "Puis-je travailler pendant que j'attends ma demande ?",
                a: "Cela dépend du type de visa et de la destination. Certains pays permettent le travail temporaire pendant le traitement de la demande.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <p className="font-semibold text-gray-900 flex items-start gap-2">
                  <span className="text-blue-600 flex-shrink-0">Q:</span>
                  {faq.q}
                </p>
                <p className="text-gray-700 text-sm flex items-start gap-2 ml-6">
                  <span className="text-green-600 flex-shrink-0 font-bold">A:</span>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section types de visa */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-gray-900">Types de Visa Détaillés</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(VISA_TYPES).map((visa) => (
              <Card key={visa.id} className="p-6 border-0 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{visa.icon}</span>
                  <h3 className="font-bold text-gray-900">{visa.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">{visa.description}</p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-gray-900">Délai:</span>{" "}
                    <span className="text-gray-600">{visa.processingTime}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Coût:</span>{" "}
                    <span className="text-gray-600">{visa.cost}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate("/visa-types")}
                  className="w-full mt-4"
                >
                  En savoir plus
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Suivez notre guide, préparez vos documents et lancez votre demande dès aujourd'hui. Notre
            équipe d'experts est là pour vous accompagner.
          </p>
          <Button
            onClick={() => navigate("/open-dossier")}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
          >
            Ouvrir un dossier
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
