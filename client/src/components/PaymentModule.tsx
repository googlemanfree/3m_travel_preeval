import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentModuleProps {
  amount: number;
  formule: string;
  onPaymentSuccess?: (receipt: PaymentReceipt) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentReceipt {
  id: string;
  amount: number;
  formule: string;
  method: string;
  date: Date;
  reference: string;
}

export function PaymentModule({
  amount,
  formule,
  onPaymentSuccess,
  onPaymentError,
}: PaymentModuleProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const paymentMethods = [
    {
      id: "orange-money",
      name: "Orange Money",
      icon: "🟠",
      description: "Paiement par Orange Money",
      countries: "Cameroun, Sénégal, Mali...",
    },
    {
      id: "mtn-mobile",
      name: "MTN Mobile Money",
      icon: "🟡",
      description: "Paiement par MTN Mobile Money",
      countries: "Cameroun, Ouganda, Rwanda...",
    },
    {
      id: "card",
      name: "Carte Bancaire",
      icon: "💳",
      description: "Visa / Mastercard",
      countries: "Monde entier",
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      onPaymentError?.("Veuillez sélectionner un mode de paiement");
      return;
    }

    if (selectedMethod !== "card" && !phoneNumber) {
      onPaymentError?.("Veuillez entrer votre numéro de téléphone");
      return;
    }

    if (selectedMethod === "card" && (!cardNumber || !cardExpiry || !cardCVC)) {
      onPaymentError?.("Veuillez remplir tous les champs de la carte");
      return;
    }

    setLoading(true);

    try {
      // Simulation du paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentReceipt: PaymentReceipt = {
        id: `PAY-${Date.now()}`,
        amount,
        formule,
        method: selectedMethod,
        date: new Date(),
        reference: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };

      setReceipt(paymentReceipt);
      setPaymentComplete(true);
      onPaymentSuccess?.(paymentReceipt);
    } catch (error) {
      onPaymentError?.("Erreur lors du paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!receipt) return;

    const content = `
═══════════════════════════════════════
    3M TRAVEL & SERVICES
    REÇU DE PAIEMENT
═══════════════════════════════════════

Numéro de Transaction: ${receipt.id}
Référence: ${receipt.reference}
Date: ${receipt.date.toLocaleDateString('fr-FR')}
Heure: ${receipt.date.toLocaleTimeString('fr-FR')}

───────────────────────────────────────
DÉTAILS DU PAIEMENT
───────────────────────────────────────

Formule: ${receipt.formule}
Montant: ${receipt.amount.toLocaleString('fr-FR')} XAF
Mode de paiement: ${receipt.method}

───────────────────────────────────────
STATUT: ✓ PAIEMENT CONFIRMÉ
───────────────────────────────────────

Merci pour votre confiance!
Pour toute question, contactez-nous:
📧 support@3mtravelagency.click
📱 WhatsApp: +237 6XX XXX XXX

═══════════════════════════════════════
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recu-paiement-${receipt.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (paymentComplete && receipt) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle>Paiement Confirmé!</CardTitle>
              <CardDescription>Votre transaction a été traitée avec succès</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Référence:</span>
              <span className="font-semibold">{receipt.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-semibold">{receipt.amount.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Formule:</span>
              <span className="font-semibold">{receipt.formule}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-semibold">{receipt.date.toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          <Button
            onClick={downloadReceipt}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            📥 Télécharger le Reçu
          </Button>

          <p className="text-sm text-gray-600 text-center">
            Un email de confirmation a été envoyé à votre adresse.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiement Sécurisé</CardTitle>
        <CardDescription>
          Montant à payer: <span className="font-bold text-lg">{amount.toLocaleString('fr-FR')} XAF</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection du mode de paiement */}
        <div>
          <h3 className="font-semibold mb-3">Choisissez votre mode de paiement</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <p className="font-semibold text-sm">{method.name}</p>
                <p className="text-xs text-gray-600 mt-1">{method.description}</p>
                <p className="text-xs text-gray-500 mt-2">{method.countries}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire selon le mode sélectionné */}
        {selectedMethod && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {selectedMethod === "orange-money" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Numéro Orange Money
                </label>
                <input
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {selectedMethod === "mtn-mobile" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Numéro MTN Mobile Money
                </label>
                <input
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            )}

            {selectedMethod === "card" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Numéro de Carte
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
                    maxLength={16}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date d'Expiration
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Vos données de paiement sont sécurisées et chiffrées. Nous ne stockons jamais vos informations sensibles.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Bouton de paiement */}
        <Button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg"
        >
          {loading ? "Traitement en cours..." : `Payer ${amount.toLocaleString('fr-FR')} XAF`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          En cliquant sur "Payer", vous acceptez nos conditions de paiement
        </p>
      </CardContent>
    </Card>
  );
}
