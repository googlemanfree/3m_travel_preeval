import { useMemo } from "react";
import { useLocation } from "wouter";
import { Archive, Mail, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";
import { AdminSystemStatus } from "@/components/AdminSystemStatus";
import { toast } from "sonner";

export default function AdminEmailCenter() {
  const [, navigate] = useLocation();
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || ""
    : "";
  const input = useMemo(() => ({ sessionToken }), [sessionToken]);
  const demoQuery = trpc.admin.getEmailDeliveryDemo.useQuery(input, { enabled: !!sessionToken });
  const utils = trpc.useUtils();
  const prepareDemo = trpc.admin.prepareEmailDeliveryDemo.useMutation({
    onSuccess: (result) => {
      toast.success(result.created ? `Dossier ${result.folderCode} préparé.` : `Dossier ${result.folderCode} déjà prêt.`);
      void utils.admin.getEmailDeliveryDemo.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const sendDemo = trpc.admin.sendEmailDeliveryDemo.useMutation({
    onSuccess: (result) => {
      toast.success(`Remise de démonstration ${result.folderCode} envoyée à la boîte interne.`);
      void utils.admin.getEmailDeliveryDemo.invalidate();
      void utils.admin.getEmailDeliveryLogs.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const archiveDemo = trpc.admin.archiveEmailDeliveryDemo.useMutation({
    onSuccess: (result) => {
      toast.success(`Dossier ${result.folderCode} archivé. Le journal de remise est conservé.`);
      void utils.admin.getEmailDeliveryDemo.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-950 to-blue-800 p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-blue-200">Back-office sécurisé</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Mail className="h-6 w-6" /> Centre de suivi e-mail</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">Journaux de remise, relances autorisées et état de santé de la messagerie.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")} className="border-white/40 bg-white/10 text-white hover:bg-white/20">Retour au tableau de bord</Button>
            <Button onClick={() => navigate("/admin/insurance-requests")} className="bg-white text-blue-900 hover:bg-blue-50">Dossiers assurance</Button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <AdminSystemStatus />
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-blue-700" /> Dossier de démonstration e-mail</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>Ce dossier isolé utilise une boîte interne configurée sur le serveur. Il ne doit jamais être rattaché à un client ni à une procédure réelle.</p>
              {demoQuery.data ? <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><p className="font-semibold text-blue-950">{demoQuery.data.folderCode}</p><p className="mt-1 text-xs text-blue-800">Statut : {demoQuery.data.readyForDeliveryTest ? "prêt pour un test de remise" : "remise de test déjà envoyée"}</p></div> : <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">Aucun dossier de démonstration n’est encore préparé.</p>}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={!sessionToken || prepareDemo.isPending} onClick={() => prepareDemo.mutate(input)} className="gap-2"><RefreshCw className={`h-4 w-4 ${prepareDemo.isPending ? "animate-spin" : ""}`} />Préparer le dossier</Button>
                <Button disabled={!sessionToken || !demoQuery.data || sendDemo.isPending} onClick={() => sendDemo.mutate(input)} className="gap-2"><Server className="h-4 w-4" />Envoyer la remise de test</Button>
                {demoQuery.data && !demoQuery.data.readyForDeliveryTest && <Button variant="outline" disabled={archiveDemo.isPending} onClick={() => {
                  if (window.confirm("Archiver ce dossier de démonstration ? Le journal de remise sera conservé.")) archiveDemo.mutate(input);
                }} className="gap-2"><Archive className="h-4 w-4" />Archiver le dossier</Button>}
              </div>
              <p className="text-xs text-amber-700">L’envoi déclenche un e-mail réel vers la boîte interne configurée et apparaît dans le journal ci-dessous.</p>
            </CardContent>
          </Card>
        </section>

        <AdminEmailDeliveryManagement />
      </div>
    </main>
  );
}
