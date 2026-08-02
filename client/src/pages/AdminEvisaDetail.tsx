import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";

export default function AdminEvisaDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const requestId = parseInt(params?.id || "0");

  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [assignEmail, setAssignEmail] = useState("");

  const { data: request, isLoading, refetch } = trpc.evisaAdmin.getRequestDetails.useQuery(
    { id: requestId },
    { enabled: !!user && requestId > 0 }
  );

  const updateStatusMutation = trpc.evisaAdmin.updateRequestStatus.useMutation({
    onSuccess: () => {
      refetch();
      setNewStatus("");
    },
  });

  const addNoteMutation = trpc.evisaAdmin.addAdminNote.useMutation({
    onSuccess: () => {
      refetch();
      setNewNote("");
    },
  });

  const assignMutation = trpc.evisaAdmin.assignRequest.useMutation({
    onSuccess: () => {
      refetch();
      setAssignEmail("");
    },
  });

  const generateDossierMutation = trpc.evisaAdmin.generateDossierNumber.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-foreground/70">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
          <Button onClick={() => setLocation("/")} className="mt-6 w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/70">Chargement...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Demande non trouvée</h1>
          <Button onClick={() => setLocation("/admin/evisa")} className="w-full">
            Retour au tableau de bord
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "processing":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/evisa")}
          className="mb-6"
        >
          ← Retour au tableau de bord
        </Button>

        <h1 className="text-4xl font-bold mb-8">
          Demande E-Visa #{request.dossierNumber || request.id}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="md:col-span-2 space-y-6">
            {/* Informations du candidat */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Informations du Candidat</h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-foreground/70">Nom complet</Label>
                  <p className="text-lg font-semibold">{request.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Email</Label>
                  <p className="text-lg">{request.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Téléphone</Label>
                  <p className="text-lg">{request.phone}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Nationalité</Label>
                  <p className="text-lg">{request.nationality}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Date de naissance</Label>
                  <p className="text-lg">{request.dateOfBirth}</p>
                </div>
              </div>
            </Card>

            {/* Informations de la demande */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Informations de la Demande</h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-foreground/70">Pays de destination</Label>
                  <p className="text-lg font-semibold">{request.countryName}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Type de visa</Label>
                  <p className="text-lg">{request.evisaType}</p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Coût total</Label>
                  <p className="text-lg font-semibold">
                    {(request.totalCost || 0).toLocaleString()} XOF
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-foreground/70">Date de soumission</Label>
                  <p className="text-lg">
                    {new Date(request.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </Card>

            {/* Passeport */}
            {request.passportFile && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Passeport</h2>
                <a
                  href={request.passportFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {request.passportFileName || "Voir le passeport"}
                </a>
              </Card>
            )}

            {/* Notes du candidat */}
            {request.notes && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Notes du Candidat</h2>
                <p className="text-foreground/80 whitespace-pre-wrap">{request.notes}</p>
              </Card>
            )}

            {/* Notes admin */}
            {request.adminNotes && (
              <Card className="p-6 bg-blue-50 dark:bg-blue-950">
                <h2 className="text-xl font-bold mb-4">Notes Admin</h2>
                <p className="text-foreground/80 whitespace-pre-wrap text-sm">
                  {request.adminNotes}
                </p>
              </Card>
            )}
          </div>

          {/* Panneau d'action */}
          <div className="space-y-6">
            {/* Statut actuel */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Statut Actuel</h2>
              <div className="flex items-center gap-2 mb-6">
                {getStatusIcon(request.status)}
                <span className="text-lg font-semibold">
                  {request.status === "pending"
                    ? "En attente"
                    : request.status === "processing"
                    ? "En traitement"
                    : request.status === "approved"
                    ? "Approuvée"
                    : "Rejetée"}
                </span>
              </div>

              {!request.dossierNumber && (
                <Button
                  onClick={() =>
                    generateDossierMutation.mutate({ requestId })
                  }
                  className="w-full mb-4"
                  disabled={generateDossierMutation.isPending}
                >
                  Générer Numéro de Dossier
                </Button>
              )}
            </Card>

            {/* Mettre à jour le statut */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Mettre à Jour le Statut</h2>
              <div className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="approved">Approuvée</SelectItem>
                    <SelectItem value="rejected">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: requestId,
                      status: newStatus as any,
                    })
                  }
                  className="w-full"
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  Mettre à jour
                </Button>
              </div>
            </Card>

            {/* Assigner */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Assigner à</h2>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email de l'admin"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                />
                <Button
                  onClick={() =>
                    assignMutation.mutate({
                      id: requestId,
                      adminEmail: assignEmail,
                    })
                  }
                  className="w-full"
                  disabled={!assignEmail || assignMutation.isPending}
                >
                  Assigner
                </Button>
              </div>
            </Card>

            {/* Ajouter une note */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Ajouter une Note</h2>
              <div className="space-y-3">
                <Textarea
                  placeholder="Votre note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-24"
                />
                <Button
                  onClick={() =>
                    addNoteMutation.mutate({
                      id: requestId,
                      note: newNote,
                    })
                  }
                  className="w-full"
                  disabled={!newNote || addNoteMutation.isPending}
                >
                  Ajouter
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
