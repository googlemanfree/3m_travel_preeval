import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  FolderPlus,
  Mail,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

type PreDossierAccount = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  destinationPreference: string | null;
  dossierStatus: string;
  emailVerified: boolean;
  createdAt: string | Date;
  lastLoginAt: string | Date | null;
  documentsCount: number;
  pendingEvaluationReference?: string | null;
  evaluationValidated?: boolean;
};

function formatDate(value: string | Date | null) {
  return value
    ? new Date(value).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
}

export default function AdminPreDossierAccountsPanel({
  sessionToken,
}: {
  sessionToken: string;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<PreDossierAccount | null>(null);
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      250
    );
    return () => window.clearTimeout(timeoutId);
  }, [search]);
  const [destination, setDestination] = useState("canada");
  const [visaType, setVisaType] = useState("Études");
  const [adminNotes, setAdminNotes] = useState("");
  const [offlineChannel, setOfflineChannel] = useState<
    "agence" | "appel" | "email"
  >("agence");
  const [offlineNote, setOfflineNote] = useState("");
  const [activationSuccess, setActivationSuccess] = useState<{
    previousAccountReference: string;
    dossierReference: string;
    linkedExistingDossier?: boolean;
  } | null>(null);
  const [copiedDossierReference, setCopiedDossierReference] = useState(false);
  const activationSuccessTimer = useRef<number | null>(null);
  const copiedReferenceTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (activationSuccessTimer.current !== null)
        window.clearTimeout(activationSuccessTimer.current);
      if (copiedReferenceTimer.current !== null)
        window.clearTimeout(copiedReferenceTimer.current);
    },
    []
  );
  const queryInput = useMemo(
    () => ({ sessionToken, search: debouncedSearch }),
    [sessionToken, debouncedSearch]
  );
  const query = trpc.adminCandidateManagement.listPreDossierAccounts.useQuery(
    queryInput,
    { enabled: Boolean(sessionToken), retry: false }
  );
  // Conditions d'ouverture (évaluation validée + paiement validé) : affichées AVANT le clic, jamais découvertes par un refus muet.
  const readiness =
    trpc.adminCandidateManagement.preDossierActivationReadiness.useQuery(
      { sessionToken, candidateId: selected?.id ?? 1 },
      { enabled: Boolean(sessionToken && selected), retry: false }
    );
  const refreshReadiness = () => {
    void utils.adminCandidateManagement.preDossierActivationReadiness.invalidate();
  };
  const offlineEvaluationMutation =
    trpc.adminCandidateManagement.validateOfflineEvaluation.useMutation({
      onSuccess: () => {
        setSelected(current =>
          current ? { ...current, evaluationValidated: true } : current
        );
        setOfflineNote("");
        refreshReadiness();
        void utils.adminCandidateManagement.listPreDossierAccounts.invalidate();
        toast({
          title: "Évaluation confirmée",
          description:
            "L’évaluation est enregistrée comme validée par vous. Vérifiez le paiement puis activez le dossier.",
        });
      },
      onError: error =>
        toast({
          title: "Confirmation impossible",
          description: error.message,
          variant: "destructive",
        }),
    });
  const reviewMutation =
    trpc.adminCandidateManagement.reviewEvaluationDeclaration.useMutation({
      onSuccess: () => {
        setSelected(current =>
          current ? { ...current, evaluationValidated: true } : current
        );
        refreshReadiness();
        void utils.adminCandidateManagement.listPreDossierAccounts.invalidate();
        toast({
          title: "Évaluation validée",
          description:
            "Vous pouvez maintenant rattacher ou activer le dossier.",
        });
      },
      onError: error =>
        toast({
          title: "Validation impossible",
          description: error.message,
          variant: "destructive",
        }),
    });
  const activateMutation =
    trpc.adminCandidateManagement.activatePreDossierAccount.useMutation({
      onSuccess: result => {
        setActivationSuccess(result);
        toast({
          title: result.linkedExistingDossier
            ? "Dossier rattaché et activé"
            : "Dossier activé",
          description: `${result.previousAccountReference} devient ${result.dossierReference}. ${result.emailSent ? "Le dossier est actif dans l’espace client et l’e-mail a été envoyé." : "Le dossier est actif dans l’espace client ; l’e-mail devra être relancé."}${result.archivedDuplicates?.length ? ` ${result.archivedDuplicates.length} doublon(s) mis en corbeille (réversible) : ${result.archivedDuplicates.join(", ")}.` : ""}`,
        });
        setAdminNotes("");
        void utils.adminCandidateManagement.listPreDossierAccounts.invalidate();
        void utils.adminCandidateManagement.list.invalidate();
        activationSuccessTimer.current = window.setTimeout(() => {
          setActivationSuccess(null);
          setSelected(null);
        }, 2200);
      },
      onError: error =>
        toast({
          title: "Activation impossible",
          description: error.message,
          variant: "destructive",
        }),
    });

  const copyDossierReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopiedDossierReference(true);
      toast({
        title: "Référence copiée",
        description: `${reference} est prête à être collée.`,
      });
      if (copiedReferenceTimer.current !== null)
        window.clearTimeout(copiedReferenceTimer.current);
      copiedReferenceTimer.current = window.setTimeout(
        () => setCopiedDossierReference(false),
        1800
      );
    } catch {
      toast({
        title: "Copie impossible",
        description:
          "Autorisez l’accès au presse-papiers ou sélectionnez la référence manuellement.",
        variant: "destructive",
      });
    }
  };

  const openActivation = (account: PreDossierAccount) => {
    setCopiedDossierReference(false);
    setActivationSuccess(null);
    if (activationSuccessTimer.current !== null)
      window.clearTimeout(activationSuccessTimer.current);
    setSelected(account);
    setDestination(
      account.destinationPreference && account.destinationPreference !== "autre"
        ? account.destinationPreference
        : "canada"
    );
    setVisaType("Études");
    setAdminNotes("");
    setOfflineNote("");
    setOfflineChannel("agence");
    activateMutation.reset();
  };

  const evaluationOk = readiness.data
    ? readiness.data.evaluationValidated
    : Boolean(selected?.evaluationValidated);
  const evaluationDeclared = Boolean(selected?.pendingEvaluationReference);
  const blockers = readiness.data?.blockers ?? [];
  const busy =
    activateMutation.isPending ||
    reviewMutation.isPending ||
    offlineEvaluationMutation.isPending;
  const disabledReason = !visaType.trim()
    ? "Indiquez la procédure (études, travail, tourisme…)."
    : readiness.isLoading
      ? "Vérification des conditions d’ouverture…"
      : blockers.length > 0
        ? blockers[0].message
        : !readiness.data &&
            selected?.pendingEvaluationReference &&
            !selected.evaluationValidated
          ? "Validez d’abord l’évaluation déclarée."
          : "";

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <UserRound className="h-5 w-5 text-blue-600" /> Comptes à ouvrir
              en dossier
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Chaque compte créé sans dossier est visible ici. Activez le
              dossier après réception des pièces en agence.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
            />{" "}
            Actualiser
          </Button>
        </div>
        {Boolean(query.data?.coveredByActiveDossier) && (
          <p
            data-testid="covered-accounts-note"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
          >
            {query.data?.coveredByActiveDossier} compte(s) masqué(s) de cette
            liste : la personne a déjà un dossier actif (rien n’a été supprimé).
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-blue-50 p-3">
            <p className="text-xs text-blue-700">Comptes sans dossier</p>
            <p className="text-2xl font-bold text-blue-950">
              {query.data?.total ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Pièces déjà reçues</p>
            <p className="text-2xl font-bold text-slate-900">
              {
                (query.data?.accounts ?? []).filter(
                  item => item.documentsCount > 0
                ).length
              }
            </p>
          </div>
          <div className="rounded-xl border bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">E-mails confirmés</p>
            <p className="text-2xl font-bold text-emerald-900">
              {
                (query.data?.accounts ?? []).filter(item => item.emailVerified)
                  .length
              }
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Rechercher par nom, e-mail, téléphone ou destination…"
            className="pl-9"
            maxLength={200}
          />
        </div>
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Chargement des comptes…
          </p>
        ) : query.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Impossible de charger les comptes : {query.error.message}
          </p>
        ) : !query.data?.accounts.length ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
            Aucun compte pré-dossier ne correspond à la recherche.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Compte client</th>
                  <th className="px-4 py-3">Préférence</th>
                  <th className="px-4 py-3">Pièces & activité</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {query.data.accounts.map(account => {
                  const validationRequired = Boolean(
                    account.pendingEvaluationReference &&
                    !account.evaluationValidated
                  );
                  return (
                    <tr key={account.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {account.fullName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {account.email}
                          {account.phone ? ` · ${account.phone}` : ""}
                        </p>
                        {account.emailVerified ? (
                          <Badge
                            variant="outline"
                            className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> E-mail
                            confirmé
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="mt-1 border-amber-200 bg-amber-50 text-amber-700"
                          >
                            <Mail className="mr-1 h-3 w-3" /> À confirmer
                          </Badge>
                        )}
                        {account.pendingEvaluationReference && (
                          <Badge
                            variant="outline"
                            className={`ml-1 mt-1 ${account.evaluationValidated ? "border-violet-200 bg-violet-50 text-violet-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                          >
                            {account.evaluationValidated
                              ? "Évaluation validée"
                              : "Évaluation à valider"}{" "}
                            · {account.pendingEvaluationReference}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700">
                        {account.destinationPreference || "À préciser"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1 text-slate-700">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />{" "}
                          {account.documentsCount} pièce(s)
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Dernière connexion : {formatDate(account.lastLoginAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          className={
                            validationRequired
                              ? "bg-violet-700 text-white hover:bg-violet-800"
                              : "bg-blue-700 text-white hover:bg-blue-800"
                          }
                          onClick={() =>
                            openActivation(account as PreDossierAccount)
                          }
                        >
                          <FolderPlus className="mr-1.5 h-4 w-4" />{" "}
                          {validationRequired
                            ? "Valider l’évaluation"
                            : account.pendingEvaluationReference
                              ? "Rattacher et activer"
                              : "Activer le dossier"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={open =>
          !open && !busy && !activationSuccess && setSelected(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activer le dossier client</DialogTitle>
            <DialogDescription>
              Cette action rattache un dossier agence existant ou crée un
              nouveau dossier, active le suivi dans l’espace client et notifie
              le candidat.
            </DialogDescription>
          </DialogHeader>
          {activationSuccess ? (
            <div
              data-testid="activation-success"
              role="status"
              className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg motion-safe:animate-bounce">
                <Check className="h-9 w-9" strokeWidth={3} />
              </div>
              <h3 className="mt-4 text-xl font-black text-emerald-950">
                Dossier activé avec succès
              </h3>
              <p className="mt-2 text-sm text-emerald-800">
                L’espace client est maintenant opérationnel.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
                <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-slate-600 line-through">
                  {activationSuccess.previousAccountReference}
                </span>
                <span className="text-emerald-600" aria-hidden="true">
                  →
                </span>
                <button
                  type="button"
                  data-testid="copy-dossier-reference"
                  onClick={() =>
                    void copyDossierReference(
                      activationSuccess.dossierReference
                    )
                  }
                  aria-label={
                    copiedDossierReference
                      ? `Référence ${activationSuccess.dossierReference} copiée`
                      : `Copier la référence ${activationSuccess.dossierReference}`
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 font-mono text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.98] motion-safe:animate-in motion-safe:slide-in-from-right-2"
                >
                  <span>{activationSuccess.dossierReference}</span>
                  {copiedDossierReference ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Cliquez sur la nouvelle référence pour la copier dans le
                presse-papiers.
              </p>
              <p data-testid="copy-dossier-reference-status" role="status" aria-live="polite" className="sr-only">
                {copiedDossierReference
                  ? `La référence ${activationSuccess.dossierReference} a été copiée dans le presse-papiers.`
                  : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                <strong>{selected?.fullName}</strong>
                <br />
                {selected?.email}
                {readiness.data && (
                  <>
                    <br />
                    <span className="text-xs text-blue-800">
                      Référence actuelle : {readiness.data.accountReference} —
                      elle deviendra automatiquement le numéro de dossier 3M-… à
                      l’activation.
                    </span>
                  </>
                )}
              </div>
              <div
                data-testid="activation-checklist"
                className="space-y-1.5 rounded-xl border p-3 text-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Conditions d’ouverture
                </p>
                <p
                  className={
                    evaluationOk ? "text-emerald-800" : "text-amber-800"
                  }
                >
                  {evaluationOk
                    ? "✓ Évaluation validée"
                    : "✗ Évaluation à valider"}
                </p>
                <p
                  className={
                    readiness.data
                      ? readiness.data.paymentValidated
                        ? "text-emerald-800"
                        : "text-amber-800"
                      : "text-slate-500"
                  }
                >
                  {readiness.data
                    ? readiness.data.paymentValidated
                      ? "✓ Paiement validé"
                      : "✗ Paiement à valider par un administrateur (onglet Paiements)"
                    : "… Paiement : vérification en cours"}
                </p>
              </div>
              {!evaluationOk && !evaluationDeclared && (
                <div
                  data-testid="offline-evaluation-block"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="text-sm font-semibold text-amber-950">
                    Aucune évaluation déclarée par ce candidat
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-900">
                    Si l’évaluation a bien été réalisée et remise (appel, agence
                    ou e-mail), confirmez-le ici : elle sera enregistrée comme
                    validée à votre nom.
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={offlineChannel}
                      onValueChange={value =>
                        setOfflineChannel(value as "agence" | "appel" | "email")
                      }
                    >
                      <SelectTrigger
                        className="sm:w-48"
                        aria-label="Canal de remise de l’évaluation"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agence">En agence</SelectItem>
                        <SelectItem value="appel">Par appel</SelectItem>
                        <SelectItem value="email">Par e-mail</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={offlineNote}
                      onChange={event => setOfflineNote(event.target.value)}
                      placeholder="Note facultative (date, conseiller…)"
                      maxLength={500}
                      aria-label="Note sur l’évaluation remise"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !selected}
                    onClick={() =>
                      selected &&
                      offlineEvaluationMutation.mutate({
                        sessionToken,
                        candidateId: `account_${selected.id}`,
                        channel: offlineChannel,
                        note: offlineNote || undefined,
                      })
                    }
                    className="mt-3 bg-amber-700 text-white hover:bg-amber-800"
                  >
                    {offlineEvaluationMutation.isPending
                      ? "Enregistrement…"
                      : "Confirmer que l’évaluation a été remise"}
                  </Button>
                </div>
              )}
              {selected?.pendingEvaluationReference &&
                !selected.evaluationValidated && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <p className="text-sm font-semibold text-violet-950">
                      Valider l’évaluation avant activation
                    </p>
                    <p className="mt-1 text-xs leading-5 text-violet-900">
                      Le candidat a déclaré une évaluation reçue avant la
                      création du compte. Un conseiller doit la vérifier avant
                      le rattachement ou l’activation.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        reviewMutation.mutate({
                          sessionToken,
                          candidateId: selected.id,
                          decision: "validate",
                        })
                      }
                      disabled={reviewMutation.isPending}
                      className="mt-3 bg-violet-700 text-white hover:bg-violet-800"
                    >
                      {reviewMutation.isPending
                        ? "Validation…"
                        : "Valider l’évaluation"}
                    </Button>
                  </div>
                )}
              <div>
                <Label>Destination confirmée</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="europe">Europe / Schengen</SelectItem>
                    <SelectItem value="pologne">Pologne</SelectItem>
                    <SelectItem value="golfe">Golfe</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Allemagne">Allemagne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="predossier-visa">Procédure</Label>
                <Input
                  id="predossier-visa"
                  value={visaType}
                  onChange={event => setVisaType(event.target.value)}
                  className="mt-1"
                  placeholder="Études, travail, tourisme…"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="predossier-notes">
                  Note interne facultative
                </Label>
                <Textarea
                  id="predossier-notes"
                  value={adminNotes}
                  onChange={event => setAdminNotes(event.target.value)}
                  className="mt-1"
                  placeholder="Contexte du dépôt en agence, prochaines pièces attendues…"
                  maxLength={2000}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={busy || Boolean(activationSuccess)}
            >
              Annuler
            </Button>
            {!activationSuccess && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    title={disabledReason || undefined}
                    className="inline-flex"
                  >
                    <Button
                      aria-describedby={
                        disabledReason
                          ? "activation-disabled-reason"
                          : undefined
                      }
                      onClick={() =>
                        selected &&
                        activateMutation.mutate({
                          sessionToken,
                          candidateId: selected.id,
                          destination,
                          visaType,
                          adminNotes: adminNotes || undefined,
                        })
                      }
                      disabled={busy || Boolean(disabledReason)}
                      className="bg-blue-700 text-white hover:bg-blue-800"
                    >
                      {activateMutation.isPending
                        ? "Activation…"
                        : "Confirmer et activer"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {disabledReason && (
                  <TooltipContent side="top">
                    Étape manquante : {disabledReason}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </DialogFooter>
          {!activationSuccess && disabledReason && (
            <p
              id="activation-disabled-reason"
              data-testid="activation-disabled-reason"
              className="text-xs font-medium text-amber-800"
            >
              Activation impossible pour l’instant : {disabledReason}
            </p>
          )}
          {!activationSuccess && activateMutation.error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800"
            >
              {activateMutation.error.message}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
