import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, FileText, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";

type Category = "Visas" | "Études" | "Voyages" | "Immigration" | "Conseils" | "Actualités";

interface ArticleForm {
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  authorName: string;
  imageUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  readTimeMinutes: number;
}

const emptyForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "Conseils",
  authorName: "Équipe 3M Travel",
  imageUrl: "",
  isPublished: false,
  isFeatured: false,
  readTimeMinutes: 5,
};

const categoryColors: Record<Category, string> = {
  Visas: "bg-blue-100 text-blue-700",
  Études: "bg-green-100 text-green-700",
  Voyages: "bg-orange-100 text-orange-700",
  Immigration: "bg-purple-100 text-purple-700",
  Conseils: "bg-yellow-100 text-yellow-700",
  Actualités: "bg-red-100 text-red-700",
};

export default function AdminBlog() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: posts, refetch } = trpc.blog.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => {
      toast({ title: "Article créé avec succès" });
      setIsDialogOpen(false);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast({ title: "Article mis à jour" });
      setIsDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      refetch();
    },
    onError: (err) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Article supprimé" });
      setDeleteConfirmId(null);
      refetch();
    },
    onError: (err) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const togglePublishMutation = trpc.blog.togglePublish.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Accès réservé aux administrateurs.</p>
          <Button className="mt-4" onClick={() => setLocation("/admin/login")}>Se connecter</Button>
        </Card>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (post: any) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      category: post.category as Category,
      authorName: post.authorName,
      imageUrl: post.imageUrl || "",
      isPublished: post.isPublished,
      isFeatured: post.isFeatured,
      readTimeMinutes: post.readTimeMinutes,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Titre et contenu requis", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form, imageUrl: form.imageUrl || undefined });
    } else {
      createMutation.mutate({ ...form, imageUrl: form.imageUrl || undefined });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion du Blog</h1>
              <p className="text-sm text-gray-500">{posts?.length || 0} article(s) au total</p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Nouvel Article
          </Button>
        </div>

        {/* Liste des articles */}
        {!posts || posts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun article pour l'instant.</p>
            <Button onClick={handleOpenCreate}>Créer le premier article</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[post.category as Category] || "bg-gray-100 text-gray-600"}`}>
                          {post.category}
                        </span>
                        {post.isFeatured && (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" /> Mis en avant
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${post.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {post.isPublished ? "Publié" : "Brouillon"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Par {post.authorName} · {post.readTimeMinutes} min · {post.viewCount} vues
                        {post.publishedAt && ` · Publié le ${new Date(post.publishedAt).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublishMutation.mutate({ id: post.id, isPublished: !post.isPublished })}
                        title={post.isPublished ? "Dépublier" : "Publier"}
                      >
                        {post.isPublished ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(post)}>
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(post.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Création / Édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'article" : "Nouvel article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre de l'article" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["Visas", "Études", "Voyages", "Immigration", "Conseils", "Actualités"] as Category[]).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temps de lecture (min)</Label>
                <Input type="number" min={1} max={60} value={form.readTimeMinutes}
                  onChange={(e) => setForm({ ...form, readTimeMinutes: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
            <div>
              <Label>Auteur</Label>
              <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            </div>
            <div>
              <Label>Extrait (résumé court)</Label>
              <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Résumé de l'article (max 500 caractères)" rows={2} maxLength={500} />
            </div>
            <div>
              <Label>Contenu * (Markdown supporté)</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Contenu complet de l'article..." rows={10} />
            </div>
            <div>
              <Label>URL de l'image (optionnel)</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..." />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                <Label>Publié</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm({ ...form, isFeatured: v })} />
                <Label>Mis en avant</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer l'article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation Suppression */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer cet article ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
