import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Upload, Trash2, Copy, Check, Search, Filter, ShieldCheck, ArrowLeft, RefreshCw, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminMediaLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"hero" | "procedure" | "service" | "flag" | "testimonial" | "other">("procedure");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: mediaItems, isLoading, refetch } = trpc.mediaLibrary.list.useQuery();
  const uploadMutation = trpc.mediaLibrary.upload.useMutation({
    onSuccess: () => {
      toast.success("Image importée et optimisée en WebP avec succès.");
      setIsUploading(false);
      setIsDialogOpen(false);
      setNewTitle("");
      setSelectedFile(null);
      setPreviewDataUrl(null);
      utils.mediaLibrary.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Échec de l’import : ${err.message}`);
      setIsUploading(false);
    },
  });

  const removeMutation = trpc.mediaLibrary.remove.useMutation({
    onSuccess: () => {
      toast.success("Média supprimé de la bibliothèque.");
      utils.mediaLibrary.list.invalidate();
    },
    onError: (err) => {
      toast.error(`Échec de la suppression : ${err.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier dépasse la taille maximale de 5 Mo.");
      return;
    }
    setSelectedFile(file);
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl || !newTitle) {
      toast.error("Veuillez renseigner un titre et sélectionner une image.");
      return;
    }
    setIsUploading(true);
    uploadMutation.mutate({
      title: newTitle,
      category: newCategory,
      dataUrl: previewDataUrl,
      mimeType: selectedFile?.type || "image/webp",
    });
  };

  const copyToClipboard = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL WebP copiée dans le presse-papiers !");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredItems = (mediaItems ?? []).filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/destination-media">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white p-0 h-auto">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Retour
                </Button>
              </Link>
              <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30">Gestion Admin</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-500" /> Bibliothèque de Médias Optimisés
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Stockage centralisé, conversion WebP automatique, réutilisation rapide et traçabilité pour les services et destinations de 3M Travel Agency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800">
              <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/20">
                  <Upload className="w-4 h-4 mr-2" /> Importer un Média
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border border-slate-800 text-slate-100 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-500" /> Importer & Optimiser en WebP
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 block">Titre de l’image / Service / Pays</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Hôte d’accueil Canada"
                      className="bg-slate-950 border-slate-800 text-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 block">Catégorie</label>
                    <Select value={newCategory} onValueChange={(val: any) => setNewCategory(val)}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border border-slate-800 text-slate-100">
                        <SelectItem value="procedure">Procédure / Pays</SelectItem>
                        <SelectItem value="service">Service (Assurance, e-Visa, Vols)</SelectItem>
                        <SelectItem value="hero">Héros d’accueil</SelectItem>
                        <SelectItem value="flag">Drapeau officiel</SelectItem>
                        <SelectItem value="testimonial">Témoignage client</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 block">Fichier image (JPG, PNG, WebP — max 5 Mo)</label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="bg-slate-950 border-slate-800 text-slate-300 file:bg-blue-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 cursor-pointer"
                      required
                    />
                  </div>

                  {previewDataUrl && (
                    <div className="relative h-40 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={previewDataUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-white">
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white">
                      {isUploading ? "Optimisation WebP..." : "Lancer l’import optimisé"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre ou catégorie..."
              className="bg-slate-950 border-slate-800 text-slate-100 pl-10"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            {["all", "procedure", "service", "hero", "flag", "testimonial", "other"].map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                className={categoryFilter === cat ? "bg-blue-600 text-white" : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"}
              >
                {cat === "all" ? "Toutes" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-400">Chargement de la bibliothèque de médias...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <Image className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">Aucun média trouvé</h3>
            <p className="text-slate-500 text-sm mt-1">Importez votre première image ou ajustez vos critères de recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-blue-500/50 transition-all duration-300 shadow-xl">
                <div>
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img src={item.url} alt={item.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-slate-950/80 backdrop-blur-md text-blue-400 border border-blue-500/30 text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {item.category}
                      </Badge>
                    </div>
                    {item.fileSize && (
                      <div className="absolute bottom-3 right-3">
                        <span className="text-[10px] font-mono bg-black/70 backdrop-blur-md text-slate-300 px-2 py-0.5 rounded-md border border-white/10">
                          {Math.round(item.fileSize / 1024)} Ko (WebP)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-semibold text-slate-100 truncate" title={item.title}>{item.title}</h3>
                    <p className="text-xs text-slate-400 font-mono truncate">{item.storageKey}</p>
                    {item.uploadedByAdminEmail && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Par {item.uploadedByAdminEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-800/60 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(item.url, item.id)}
                    className="flex-1 bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copiedId === item.id ? "Copié" : "Copier URL"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Voulez-vous vraiment supprimer "${item.title}" ?`)) {
                        removeMutation.mutate({ id: item.id });
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/40 p-2 h-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
