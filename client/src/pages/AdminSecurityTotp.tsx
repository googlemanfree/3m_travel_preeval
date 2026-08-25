import { useState } from "react";
import { toDataURL } from "qrcode";
import { ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminSecurityTotp() {
  const sessionToken = typeof window === "undefined" ? "" : sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "";
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const status = trpc.adminAuth.twoFactorStatus.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const begin = trpc.adminAuth.beginTwoFactorEnrollment.useMutation({ onSuccess: async (result) => { setQrDataUrl(await toDataURL(result.otpAuthUri, { margin: 1, width: 240 })); toast.info("Scannez le QR code avec une application d’authentification, puis confirmez le code affiché."); }, onError: (error) => toast.error("Configuration 2FA impossible", { description: error.message }) });
  const confirm = trpc.adminAuth.confirmTwoFactorEnrollment.useMutation({ onSuccess: async (result) => { setRecoveryCodes(result.recoveryCodes); setQrDataUrl(""); setCode(""); await utils.adminAuth.twoFactorStatus.invalidate(); toast.success("2FA activée pour les prochaines connexions."); }, onError: (error) => toast.error("Code 2FA invalide", { description: error.message }) });

  return <main className="min-h-screen bg-slate-50 px-4 py-12"><section className="mx-auto max-w-2xl"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-indigo-700" />Sécurité de connexion</CardTitle><CardDescription>La 2FA est demandée à chaque nouvelle connexion. Votre session valide de 24 h n’est pas interrompue.</CardDescription></CardHeader><CardContent className="space-y-5">{status.error ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">Session administrateur requise pour gérer la 2FA.</p> : status.data?.enabled ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">La protection TOTP est active. Conservez vos codes de récupération dans un emplacement sûr hors ligne.</p> : !qrDataUrl ? <Button disabled={begin.isPending || !sessionToken} onClick={() => begin.mutate({ sessionToken })}>Configurer l’authentification 2FA</Button> : <div className="grid gap-5 sm:grid-cols-[240px_1fr]"><img src={qrDataUrl} alt="QR code de configuration TOTP" className="h-[240px] w-[240px] border bg-white p-2" /><div className="space-y-3"><p className="text-sm text-slate-600">Après avoir ajouté le compte dans votre application d’authentification, saisissez le code à six chiffres.</p><Input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Code à six chiffres" /><Button disabled={!code || confirm.isPending} onClick={() => confirm.mutate({ sessionToken, code })}>Confirmer et générer les codes</Button></div></div>}{recoveryCodes.length > 0 && <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Codes de récupération — affichés une seule fois</p><p className="mt-2 break-words">{recoveryCodes.join(" · ")}</p></div>}</CardContent></Card></section></main>;
}
