import { useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { Link } from "wouter";
import { ImagePlus, Flag, Search, Trash2, Upload, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { procedures107Complete } from "@/data/procedures107Complete";
import { getProcedureVisual } from "@/data/procedureVisuals";
import { trpc } from "@/lib/trpc";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type MediaKind = "image" | "flag";

type MediaRecord = {
  destinationId?: string;
  imageUrl?: string | null;
  flagUrl?: string | null;
  imageAlt?: string | null;
  flagAlt?: string | null;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture du fichier impossible."));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

export default function AdminDestinationMedia() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(procedures107Complete[0]?.id ?? "");
  const [busyKind, setBusyKind] = useState<MediaKind | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const mediaQuery = trpc.destinationMedia.listAdmin.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const saveMutation = trpc.destinationMedia.save.useMutation({
    onSuccess: async (_result, variables) => {
      await Promise.all([
        utils.destinationMedia.listAdmin.invalidate(),
        utils.destinationMedia.listPublic.invalidate(),
        utils.destinationMedia.getByDestination.invalidate({ destinationId: selectedId }),
      ]);
      toast.success(`${busyKind === "flag" ? "Drapeau" : "Image"} de ${selectedCountry?.name ?? "la destination"} mis à jour.`);
    },
    onError: error => toast.error(error.message || "La mise à jour du média a échoué."),
    onSettled: () => setBusyKind(null),
  });
  const removeMutation = trpc.destinationMedia.remove.useMutation({
    onSuccess: async (_result, variables) => {
      await Promise.all([
        utils.destinationMedia.listAdmin.invalidate(),
        utils.destinationMedia.listPublic.invalidate(),
        utils.destinationMedia.getByDestination.invalidate({ destinationId: selectedId }),
      ]);
      toast.success("Média personnalisé retiré. Le visuel de secours est rétabli.");
    },
    onError: error => toast.error(error.message || "La suppression du média a échoué."),
  });

  const [isBulkDragging, setIsBulkDragging] = useState(false);
  const [bulkType, setBulkType] = useState<MediaKind>("image");
  const [isBulkBusy, setIsBulkBusy] = useState(false);

  const bulkSaveMutation = trpc.destinationMedia.bulkSave.useMutation({
    onSuccess: async (res) => {
      await Promise.all([
        utils.destinationMedia.listAdmin.invalidate(),
        utils.destinationMedia.listPublic.invalidate(),
      ]);
      setIsBulkBusy(false);
      if (res.errors.length > 0) {
        toast.warning(`Import terminé : ${res.successCount} succès, ${res.errors.length} échec(s).`);
      } else {
        toast.success(`Import en masse réussi : ${res.successCount} fichier(s) mis à jour.`);
      }
    },
    onError: (err) => {
      setIsBulkBusy(false);
      toast.error(err.message || "L’import en masse a échoué.");
    },
  });

  const handleBulkFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).slice(0, 20);
    setIsBulkBusy(true);

    const items: Array<{
      destinationId: string;
      destinationName: string;
      mediaType: MediaKind;
      dataUrl: string;
      mimeType: string;
      altText?: string;
    }> = [];

    for (const file of fileList) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const rawName = file.name.replace(/\.[^/.]+$/, "").toLowerCase().trim();
      const matchedCountry = procedures107Complete.find(c =>
        c.id === rawName ||
        c.name.toLowerCase() === rawName ||
        rawName.includes(c.id) ||
        c.name.toLowerCase().includes(rawName)
      );

      if (matchedCountry) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          items.push({
            destinationId: matchedCountry.id,
            destinationName: matchedCountry.name,
            mediaType: bulkType,
            dataUrl,
            mimeType: file.type,
            altText: `${matchedCountry.name} — ${bulkType === "flag" ? "drapeau officiel" : "visuel de mobilité internationale"}`,
          });
        } catch {
          // Ignorer les fichiers non lisibles
        }
      }
    }

    if (items.length === 0) {
      setIsBulkBusy(false);
      toast.error("Aucun fichier valide n'a pu être associé automatiquement à un pays. Nommez vos fichiers avec l'ID exact ou le nom du pays (ex: 'allemagne.jpg').");
      return;
    }

    bulkSaveMutation.mutate({ items });
  };

  const mediaByDestination = useMemo(() => {
    const map = new Map<string, MediaRecord>();
    for (const item of mediaQuery.data?.media ?? []) {
      if (item.destinationId) map.set(item.destinationId, item);
    }
    return map;
  }, [mediaQuery.data?.media]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return procedures107Complete;
    return procedures107Complete.filter(country => `${country.name} ${country.id} ${country.region}`.toLowerCase().includes(query));
  }, [search]);

  const selectedCountry = procedures107Complete.find(country => country.id === selectedId) ?? filteredCountries[0] ?? procedures107Complete[0];
  const selectedMedia = selectedCountry ? mediaByDestination.get(selectedCountry.id) : undefined;

  const handleFile = async (file: File | undefined, mediaType: MediaKind) => {
    if (!file || !selectedCountry) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format refusé. Utilisez une image JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("L’image doit peser au maximum 5 Mo.");
      return;
    }
    setBusyKind(mediaType);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      saveMutation.mutate({
        destinationId: selectedCountry.id,
        destinationName: selectedCountry.name,
        mediaType,
        dataUrl,
        mimeType: file.type,
        altText: `${selectedCountry.name} — ${mediaType === "flag" ? "drapeau officiel" : "visuel de mobilité internationale"}`,
      });
    } catch (error) {
      setBusyKind(null);
      toast.error(error instanceof Error ? error.message : "Le fichier n’a pas pu être lu.");
    }
  };

  const chooseCountry = (id: string) => setSelectedId(id);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#071426] dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Link href="/admin/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Retour au dashboard
            </Link>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Visuels des destinations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Remplacez l’image éditoriale et le drapeau d’une destination sans modifier son contenu de procédure. Les fichiers sont validés puis stockés de façon persistante.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <span>Accès administrateur vérifié</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="border-0 shadow-lg dark:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Destinations</span>
                <Badge variant="secondary">{procedures107Complete.length}</Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un pays" className="pl-9" aria-label="Rechercher une destination" />
              </div>
            </CardHeader>
            <CardContent className="max-h-[620px] space-y-1 overflow-y-auto pr-3">
              {filteredCountries.map(country => {
                const media = mediaByDestination.get(country.id);
                const isSelected = country.id === selectedCountry?.id;
                return (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => chooseCountry(country.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelected ? "bg-blue-700 text-white shadow-md" : "hover:bg-blue-50 dark:hover:bg-slate-800"}`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-lg dark:bg-slate-800">
                      {media?.flagUrl ? <img src={media.flagUrl} alt="" className="h-full w-full object-cover" /> : country.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{country.name}</span>
                      <span className={`block truncate text-[11px] ${isSelected ? "text-blue-100" : "text-slate-500"}`}>{country.region}</span>
                    </span>
                    {(media?.imageUrl || media?.flagUrl) && <CheckCircle2 className={`h-4 w-4 shrink-0 ${isSelected ? "text-emerald-200" : "text-emerald-600"}`} aria-label="Média personnalisé" />}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selectedCountry ? (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg dark:bg-slate-900/80">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Upload className="h-5 w-5 text-blue-600" />
                        Importation en masse par Glisser-Déposer
                      </CardTitle>
                      <p className="mt-1 text-xs text-slate-500">
                        Glissez plusieurs fichiers image nommés d’après le pays (ex: <span className="font-mono text-blue-600">canada.jpg</span>, <span className="font-mono text-blue-600">france.png</span>) pour les affecter en un clic.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={bulkType}
                        onChange={(e) => setBulkType(e.target.value as MediaKind)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm dark:border-slate-700 dark:bg-slate-800"
                        aria-label="Type de média pour l'import en masse"
                      >
                        <option value="image">Type : Image destination</option>
                        <option value="flag">Type : Drapeau officiel</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsBulkDragging(true); }}
                    onDragLeave={() => setIsBulkDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsBulkDragging(false);
                      handleBulkFiles(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${isBulkDragging ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30"}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner dark:bg-blue-900/50 dark:text-blue-300">
                      <Upload className={`h-6 w-6 ${isBulkBusy ? "animate-bounce" : ""}`} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isBulkBusy ? "Traitement et téléversement en cours..." : "Glissez-déposez vos images ici (jusqu'à 20 fichiers)"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Les fichiers sont automatiquement reliés au pays correspondant selon leur nom de fichier.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      id="bulk-file-input"
                      onChange={(e) => {
                        handleBulkFiles(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <label
                      htmlFor="bulk-file-input"
                      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-800"
                    >
                      Sélectionner des fichiers
                    </label>
                  </div>
                </CardContent>
              </Card>

            <Card className="border-0 shadow-lg dark:bg-slate-900/80">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-blue-700 text-white">{selectedCountry.region}</Badge>
                      <Badge variant="outline">/{selectedCountry.id}</Badge>
                    </div>
                    <CardTitle className="mt-3 text-2xl">{selectedCountry.flag} {selectedCountry.name}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Les changements sont appliqués à la fiche publique de cette destination après enregistrement.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => mediaQuery.refetch()} disabled={mediaQuery.isFetching} className="gap-2 self-start">
                    <RefreshCw className={`h-4 w-4 ${mediaQuery.isFetching ? "animate-spin" : ""}`} /> Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <MediaEditorCard
                    title="Image de destination"
                    description="Visuel principal de la fiche pays, affiché dans l’en-tête de la procédure."
                    icon={<ImagePlus className="h-5 w-5 text-blue-600" />}
                    currentUrl={selectedMedia?.imageUrl ?? getProcedureVisual(selectedCountry)}
                    fallbackLabel="Visuel régional par défaut"
                    isCustom={Boolean(selectedMedia?.imageUrl)}
                    isBusy={busyKind === "image"}
                    inputRef={imageInputRef}
                    onChoose={() => imageInputRef.current?.click()}
                    onFile={file => handleFile(file, "image")}
                    onRemove={() => removeMutation.mutate({ destinationId: selectedCountry.id, mediaType: "image" })}
                    canRemove={Boolean(selectedMedia?.imageUrl)}
                  />
                  <MediaEditorCard
                    title="Drapeau"
                    description="Drapeau personnalisé utilisé dans la liste et la fiche de la destination."
                    icon={<Flag className="h-5 w-5 text-amber-600" />}
                    currentUrl={selectedMedia?.flagUrl ?? undefined}
                    fallbackLabel={selectedCountry.flag}
                    isCustom={Boolean(selectedMedia?.flagUrl)}
                    isBusy={busyKind === "flag"}
                    inputRef={flagInputRef}
                    onChoose={() => flagInputRef.current?.click()}
                    onFile={file => handleFile(file, "flag")}
                    onRemove={() => removeMutation.mutate({ destinationId: selectedCountry.id, mediaType: "flag" })}
                    canRemove={Boolean(selectedMedia?.flagUrl)}
                    isFlag
                  />
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
                  <p className="font-bold">Formats acceptés</p>
                  <p className="mt-1 leading-6">JPG, PNG ou WebP, 5 Mo maximum. Utilisez une image nette et libre de droits. Le retrait d’un fichier rétablit automatiquement le visuel régional existant.</p>
                </div>
              </CardContent>
            </Card>
            </div>
          ) : (
            <Card className="flex min-h-[420px] items-center justify-center border-0 shadow-lg dark:bg-slate-900/80">
              <p className="text-sm text-slate-500">Aucune destination trouvée.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaEditorCard({
  title,
  description,
  icon,
  currentUrl,
  fallbackLabel,
  isCustom,
  isBusy,
  inputRef,
  onChoose,
  onFile,
  onRemove,
  canRemove,
  isFlag = false,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  currentUrl?: string;
  fallbackLabel: string;
  isCustom: boolean;
  isBusy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChoose: () => void;
  onFile: (file: File | undefined) => void;
  onRemove: () => void;
  canRemove: boolean;
  isFlag?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/50">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </div>
        </div>
        <Badge variant={isCustom ? "default" : "outline"}>{isCustom ? "Personnalisé" : "Secours"}</Badge>
      </div>
      <div className={`flex items-center justify-center bg-slate-100 p-4 dark:bg-slate-900 ${isFlag ? "min-h-[190px]" : "min-h-[240px]"}`}>
        {currentUrl ? (
          <img src={currentUrl} alt={fallbackLabel} className={`max-h-56 w-full rounded-xl object-cover shadow-sm ${isFlag ? "max-w-xs object-contain" : ""}`} />
        ) : (
          <span className="text-7xl" role="img" aria-label={fallbackLabel}>{fallbackLabel}</span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4 sm:flex-row">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { onFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        <Button type="button" onClick={onChoose} disabled={isBusy} className="flex-1 gap-2 bg-blue-700 text-white hover:bg-blue-800">
          {isBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isBusy ? "Enregistrement..." : isCustom ? "Remplacer" : "Importer"}
        </Button>
        <Button type="button" variant="outline" onClick={onRemove} disabled={!canRemove || isBusy} className="gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700" title={canRemove ? "Retirer le média personnalisé" : "Le visuel de secours est déjà utilisé"}>
          <Trash2 className="h-4 w-4" /> Retirer
        </Button>
      </div>
    </div>
  );
}
