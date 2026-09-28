import { useEffect, useRef, useState } from "react";
import { useParams, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import PaymentFallbackPanel from "@/components/PaymentFallbackPanel";

type PaymentStatus = "idle" | "registering" | "opening" | "waiting" | "verifying" | "success" | "failed" | "error";

const CINETPAY_SDK_URL = "https://cdn.cinetpay.com/seamless/main.js";

/** Charge le SDK CinetPay une seule fois (absent de index.html) ; réutilise le script s'il est déjà présent ou déjà chargé par une autre page. */
function loadCinetPaySdk(): Promise<void> {
  if ((window as any).CinetPay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${CINETPAY_SDK_URL}"]`) as HTMLScriptElement | null;
  return new Promise((resolve, reject) => {
    if (existing) {
      if ((window as any).CinetPay) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("sdk_load_failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = CINETPAY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk_load_failed"));
    document.head.appendChild(script);
  });
}

export default function CinetPayFlightPayment() {
  const { requestId: requestIdParam } = useParams<{ requestId: string }>();
  const requestId = Number(requestIdParam);
  const email = new URLSearchParams(useSearch()).get("email") ?? "";
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const transactionIdRef = useRef<string>("");

  useEffect(() => {
    loadCinetPaySdk().then(() => setSdkReady(true)).catch(() => setErrorMessage("Le module de paiement n'a pas pu se charger. Rechargez la page ou utilisez un autre moyen ci-dessous."));
  }, []);

  const validParams = Number.isInteger(requestId) && requestId > 0 && email.includes("@");
  const { data: info, isLoading, error: loadError, refetch } = trpc.cinetpayFlightPayment.getFlightOnlinePaymentInfo.useQuery(
    { requestId, candidateEmail: email },
    { enabled: validParams, retry: 1 }
  );

  const initiateMutation = trpc.cinetpayFlightPayment.initiateFlightOnlinePayment.useMutation();
  const verifyQuery = trpc.cinetpayFlightPayment.verifyFlightOnlinePaymentStatus.useQuery(
    { transactionId: transactionIdRef.current },
    { enabled: false }
  );

  const launchCinetPay = (transactionId: string, amount: number) => {
    const CinetPay = (window as any).CinetPay;
    const apikey = import.meta.env.VITE_CINETPAY_API_KEY;
    const siteId = import.meta.env.VITE_CINETPAY_SITE_ID;
    if (!apikey || !siteId) throw new Error("Le paiement en ligne n'est pas encore configuré. Contactez-nous sur WhatsApp.");

    CinetPay.setConfig({
      apikey,
      site_id: siteId,
      notify_url: `${window.location.origin}/api/cinetpay/webhook`,
      mode: import.meta.env.PROD ? "PRODUCTION" : "TEST",
    });

    // Le retour de CinetPay n'est qu'une indication côté client : la confirmation réelle revient au serveur
    // (verifyFlightOnlinePaymentStatus revérifie directement auprès de CinetPay avant de marquer quoi que ce soit).
    CinetPay.waitResponse(async (data: { status: string }) => {
      if (data.status !== "ACCEPTED") {
        setStatus("failed");
        setErrorMessage(data.status === "REFUSED" ? "Paiement refusé. Vérifiez votre solde ou essayez un autre moyen de paiement." : "Le paiement n'a pas abouti. Vous pouvez réessayer.");
        return;
      }
      setStatus("verifying");
      try {
        const result = await verifyQuery.refetch();
        if (result.data?.success && result.data.status === "SUCCESS") {
          setStatus("success");
        } else {
          setStatus("failed");
          setErrorMessage("CinetPay indique un paiement accepté, mais notre vérification n'a pas encore pu le confirmer. Réessayez dans un instant ou contactez-nous.");
        }
      } catch {
        setStatus("failed");
        setErrorMessage("Vérification impossible pour le moment. Réessayez dans un instant.");
      }
      void refetch();
    });

    setStatus("waiting");
    CinetPay.getCheckout({
      transaction_id: transactionId,
      amount,
      currency: "XAF",
      channels: "ALL",
      description: `Réservation de vol — ${info?.requestRef ?? ""}`,
      customer_name: info?.passengerName?.split(" ")[0] || "",
      customer_surname: info?.passengerName?.split(" ").slice(1).join(" ") || "",
      customer_email: email,
      customer_phone_number: "",
      customer_address: "N/A",
      customer_city: "Yaoundé",
      customer_country: "CM",
      customer_state: "CM",
      customer_zip_code: "00000",
    });
  };

  const handlePayment = async () => {
    const CinetPay = (window as any).CinetPay;
    if (!sdkReady || !CinetPay || typeof CinetPay.waitResponse !== "function") {
      setStatus("error");
      setErrorMessage("Le module de paiement n'a pas pu se charger. Rechargez la page et réessayez.");
      return;
    }
    setStatus("registering");
    setErrorMessage(null);
    try {
      const initiated = await initiateMutation.mutateAsync({ requestId, candidateEmail: email });
      transactionIdRef.current = initiated.transactionId;
      setStatus("opening");
      launchCinetPay(initiated.transactionId, initiated.amount);
    } catch (err: any) {
      setErrorMessage(err?.message || "Une erreur est survenue lors de l'initialisation du paiement.");
      setStatus("error");
    }
  };

  if (!validParams) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="mb-2 text-lg font-bold text-gray-900">Lien de paiement incomplet</h1>
          <p className="text-sm text-gray-600">Ce lien ne contient pas les informations nécessaires. Utilisez celui reçu par e-mail, ou contactez-nous.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Chargement de votre réservation...</p>
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="mb-2 text-lg font-bold text-gray-900">Réservation introuvable</h1>
          <p className="text-sm text-gray-600">Vérifiez le lien reçu ou contactez notre équipe.</p>
        </Card>
      </div>
    );
  }

  if (info.status === "SUCCESS") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-600" />
          <h1 className="mb-2 text-lg font-bold text-gray-900">Paiement déjà confirmé</h1>
          <p className="text-sm text-gray-600">Votre réservation {info.requestRef} est réglée. Notre équipe prépare l'émission du billet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="p-8 shadow-lg">
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-gray-800">Paiement du vol</h1>
              <p className="text-gray-600">Réservation : {info.requestRef}</p>
            </div>

            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-6 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-1 text-sm text-gray-600">Montant à payer</p>
                <p className="text-3xl font-bold text-blue-600">{info.amount ? `${info.amount.toLocaleString()} ${info.currency}` : "À confirmer"}</p>
              </div>
              {(info.originCity || info.destinationCity) && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Itinéraire</p>
                  <p className="font-semibold text-gray-800">{info.originCity} → {info.destinationCity}</p>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="mb-1 text-sm text-gray-600">E-mail</p>
                <p className="font-semibold text-gray-800">{email}</p>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!sdkReady || !info.amount || ["registering", "opening", "waiting", "verifying"].includes(status)}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700"
            >
              {status === "registering" ? (
                <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" />Préparation du paiement...</span>
              ) : status === "opening" ? (
                <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" />Ouverture du guichet...</span>
              ) : status === "waiting" ? (
                <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" />En attente de votre paiement...</span>
              ) : status === "verifying" ? (
                <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" />Vérification du paiement...</span>
              ) : status === "success" ? (
                "Paiement confirmé ✓"
              ) : status === "failed" || status === "error" ? (
                "Réessayer le paiement"
              ) : !sdkReady ? (
                "Chargement du module de paiement..."
              ) : (
                "Procéder au paiement CinetPay"
              )}
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">Vous serez redirigé vers CinetPay pour sécuriser votre paiement.</p>
          </Card>

          <div className="mt-6">
            <PaymentFallbackPanel
              reference={info.requestRef}
              kind="flight"
              amount={info.amount}
              name={info.passengerName || null}
              reason={status === "failed" || status === "error" ? "failed" : "alternatives"}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
