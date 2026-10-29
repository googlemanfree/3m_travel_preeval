import { Printer } from "lucide-react";
import { toast } from "sonner";
import { brandedPrintDocument, type BrandedPrintInput } from "@shared/printSections";

/** Imprime ou enregistre en PDF un contenu sur le papier à en-tête de l'agence. Rien n'est envoyé au serveur. */
export function PrintBrandedButton({ build, label = "Imprimer sur papier à en-tête", className, onPrint }: { build: () => BrandedPrintInput; label?: string; className?: string; onPrint?: () => void }) {
  const open = () => {
    const html = brandedPrintDocument(build());
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const opened = window.open(`${url}#print`, "_blank");
    if (!opened) toast.error("Autorisez les fenêtres de ce site pour imprimer ou enregistrer en PDF.");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    onPrint?.();
  };
  return (
    <button type="button" onClick={open} className={className ?? "inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-900 hover:bg-blue-50"} data-testid="print-branded">
      <Printer className="h-4 w-4" aria-hidden="true" />{label}
    </button>
  );
}
