import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://3000-il64g2ys8m73441l65z0k-ae672cb7.us1.manus.computer/manus-storage/pasted_file_nP22ud_3m_logo.png";
const STORAGE_KEY = "3m_candidate_token";

export default function MagicLogin() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [candidateName, setCandidateName] = useState("");

  const verifyMutation = trpc.candidate.verifyMagicLink.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem(STORAGE_KEY, data.token);
      }
      setCandidateName(data.fullName ?? "");
      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 2500);
    },
    onError: (err) => {
      setErrorMsg(err.message || "Lien invalide ou expiré.");
      setStatus("error");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setErrorMsg("Aucun token trouvé dans l'URL.");
      setStatus("error");
      return;
    }
    verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="3M Travel" className="h-16 w-auto object-contain" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Vérification en cours…</h2>
            <p className="text-gray-500 text-sm">Nous activons votre compte, veuillez patienter.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Bienvenue, {candidateName} !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre compte est activé. Vous allez être redirigé vers votre espace candidat…
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-2 rounded-full animate-[progress_2.5s_linear_forwards]" style={{ width: "100%", animation: "none", transition: "width 2.5s linear" }} />
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Lien invalide ou expiré</h2>
            <p className="text-red-500 text-sm mb-6">{errorMsg}</p>
            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate("/register")}
              >
                Créer un nouveau compte
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Se connecter
              </Button>
              <a
                href="https://wa.me/237690000000?text=Bonjour, mon lien d'activation a expiré"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium mt-2"
              >
                <Mail className="w-4 h-4" />
                Contacter le support WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
