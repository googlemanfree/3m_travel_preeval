import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Award, Star, Eye, EyeOff } from "lucide-react";

const COUNTRIES = ["France", "Canada", "Allemagne", "Belgique", "USA", "Maroc", "Pologne", "Luxembourg", "UK", "Qatar", "Australie"];
const VISA_TYPES = ["Étudiant", "Travail", "Tourisme", "Regroupement familial", "Chancenkarte", "Visiteur"];

export default function AdminApprovedVisas() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterType, setFilterType] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    country: "",
    visaType: "",
    destination: "",
    approvedDate: "",
    testimonial: "",
    isPublic: true,
    imageUrl: "",
  });

  const { data: visas, refetch } = trpc.extras.getApprovedVisas.useQuery({
    country: filterCountry || undefined,
    visaType: filterType || undefined,
    limit: 50,
  });

  const addMutation = trpc.extras.addApprovedVisa.useMutation({
    onSuccess: () => {
      toast({ title: "✅ Visa ajouté", description: "Le visa a été ajouté à la galerie." });
      setIsOpen(false);
      setForm({ firstName: "", country: "", visaType: "", destination: "", approvedDate: "", testimonial: "", isPublic: true, imageUrl: "" });
      refetch();
    },
    onError: (err) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.firstName || !form.country || !form.visaType || !form.destination || !form.approvedDate) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
      return;
    }
    addMutation.mutate(form);
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      France: "🇫🇷", Canada: "🇨🇦", Allemagne: "🇩🇪", Belgique: "🇧🇪",
      USA: "🇺🇸", Maroc: "🇲🇦", Pologne: "🇵🇱", Luxembourg: "🇱🇺",
      UK: "🇬🇧", Qatar: "🇶🇦", Australie: "🇦🇺",
    };
    return flags[country] || "🌍";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a2744] to-[#2d4a8a] text-white py-12">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <span className="text-blue-200 text-sm">Administration</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Galerie des Visas Accordés</h1>
              <p className="text-blue-200">Gérez les témoignages de succès affichés sur le site.</p>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un visa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un visa accordé</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Prénom du candidat *</Label>
                      <Input
                        placeholder="ex: Marie"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Pays de destination *</Label>
                      <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                        <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Type de visa *</Label>
                      <Select value={form.visaType} onValueChange={(v) => setForm({ ...form, visaType: v })}>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                          {VISA_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Ville/Destination *</Label>
                      <Input
                        placeholder="ex: Paris, Montréal"
                        value={form.destination}
                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Date d'approbation *</Label>
                    <Input
                      type="date"
                      value={form.approvedDate}
                      onChange={(e) => setForm({ ...form, approvedDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Témoignage (optionnel)</Label>
                    <Textarea
                      placeholder="Témoignage du candidat..."
                      value={form.testimonial}
                      onChange={(e) => setForm({ ...form, testimonial: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>URL de l'image (optionnel)</Label>
                    <Input
                      placeholder="https://..."
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <Label>Afficher publiquement</Label>
                      <p className="text-xs text-gray-500">Visible dans la galerie du site</p>
                    </div>
                    <Switch
                      checked={form.isPublic}
                      onCheckedChange={(v) => setForm({ ...form, isPublic: v })}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={addMutation.isPending}
                    className="w-full bg-[#1a2744] hover:bg-[#2d4a8a]"
                  >
                    {addMutation.isPending ? "Ajout en cours..." : "Ajouter le visa"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <div className="container max-w-6xl py-8">
        {/* Filtres */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1 flex-1 min-w-[160px]">
                <Label className="text-xs text-gray-500">Filtrer par pays</Label>
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les pays</SelectItem>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex-1 min-w-[160px]">
                <Label className="text-xs text-gray-500">Filtrer par type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    {VISA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setFilterCountry(""); setFilterType(""); }}
                className="h-9"
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total visas", value: visas?.length ?? 0, icon: "🏆", color: "bg-blue-50 text-blue-700" },
            { label: "Publics", value: visas?.filter(v => v.isPublic).length ?? 0, icon: "👁️", color: "bg-green-50 text-green-700" },
            { label: "Privés", value: visas?.filter(v => !v.isPublic).length ?? 0, icon: "🔒", color: "bg-gray-50 text-gray-700" },
            { label: "Pays couverts", value: new Set(visas?.map(v => v.country)).size ?? 0, icon: "🌍", color: "bg-purple-50 text-purple-700" },
          ].map((stat) => (
            <Card key={stat.label} className={`border-0 shadow-sm ${stat.color}`}>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Liste des visas */}
        {!visas || visas.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun visa enregistré</h3>
              <p className="text-gray-500 text-sm mb-4">
                Commencez à ajouter des visas accordés pour alimenter la galerie du site.
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                className="bg-[#1a2744] hover:bg-[#2d4a8a]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier visa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visas.map((visa) => (
              <Card key={visa.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(visa.country)}</span>
                      <div>
                        <CardTitle className="text-sm font-bold text-[#1a2744]">
                          {visa.firstName}
                        </CardTitle>
                        <p className="text-xs text-gray-500">{visa.destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {visa.isPublic ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Privé
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{visa.visaType}</Badge>
                    <Badge className="bg-indigo-100 text-indigo-700 text-xs">{visa.country}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  {visa.testimonial && (
                    <p className="text-xs text-gray-600 italic line-clamp-2 mb-2">
                      "{visa.testimonial}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Approuvé le {new Date(visa.approvedDate).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
