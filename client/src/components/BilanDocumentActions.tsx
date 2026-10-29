import { Copy, Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bilanFileBase, makePrintableDocument, makeWordDocument } from "@shared/bilanPrint";
import { bilanPlainText } from "@shared/bilanContent";

type Props = {
  /** Document complet à l'identité de l'agence (papier à en-tête). Appelé au clic : toujours la version à jour. */
  getDocumentHtml: () => string;
  title: string;
  candidateName?: string | null;
  reference?: string | null;
  /** PDF déjà généré par le serveur, s'il existe. */
  pdfUrl?: string | null;
  disabled?: boolean;
  className?: string;
};

function saveBlob(content: string, type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Imprimer, enregistrer en PDF, télécharger en Word, copier avec l'en-tête : mêmes boutons côté administration et côté candidat. */
export function BilanDocumentActions({ getDocumentHtml, title, candidateName, reference, pdfUrl, disabled = false, className }: Props) {
  const base = bilanFileBase(candidateName, reference);

  const openPrintable = () => {
    const html = getDocumentHtml();
    if (!html.trim()) { toast.error("Le bilan est vide."); return; }
    const url = URL.createObjectURL(new Blob([makePrintableDocument(html, { title })], { type: "text/html;charset=utf-8" }));
    const opened = window.open(`${url}#print`, "_blank");
    if (!opened) toast.error("Autorisez les fenêtres de ce site pour imprimer, ou utilisez « Télécharger en Word ».");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  const downloadWord = () => {
    const html = getDocumentHtml();
    if (!html.trim()) { toast.error("Le bilan est vide."); return; }
    saveBlob(`﻿${makeWordDocument(html, { title })}`, "application/msword;charset=utf-8", `${base}.doc`);
    toast.success("Bilan téléchargé : ouvrez-le avec Word, l'en-tête est conservé.");
  };
  const copyWithLetterhead = async () => {
    const html = getDocumentHtml();
    if (!html.trim()) { toast.error("Le bilan est vide."); return; }
    const text = bilanPlainText(html);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]);
      } else {
        const holder = document.createElement("div");
        holder.contentEditable = "true";
        holder.style.cssText = "position:fixed;left:-9999px;top:0;width:640px";
        // Repli sans innerHTML : le document est analysé hors page, vidé de tout script, objet et gestionnaire d'événement, puis importé.
        const parsed = new DOMParser().parseFromString(html, "text/html");
        parsed.querySelectorAll("script,iframe,object,embed,link,meta,style").forEach((node) => node.remove());
        parsed.body.querySelectorAll("*").forEach((node) => {
          for (const attribute of Array.from(node.attributes)) if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
        });
        holder.appendChild(document.importNode(parsed.body, true));
        document.body.appendChild(holder);
        const range = document.createRange();
        range.selectNodeContents(holder);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        const done = document.execCommand("copy");
        selection?.removeAllRanges();
        holder.remove();
        if (!done) throw new Error("copy refused");
      }
      toast.success("Bilan copié avec son en-tête : collez-le dans Word, Gmail ou Outlook.");
    } catch {
      toast.error("Copie impossible sur ce navigateur : utilisez « Télécharger en Word ».");
    }
  };

  return (
    <div className={className ?? "flex flex-wrap gap-2"} role="group" aria-label="Imprimer ou télécharger le bilan" data-testid="bilan-document-actions">
      <Button type="button" variant="outline" className="min-h-11" disabled={disabled} onClick={openPrintable} data-testid="bilan-print"><Printer className="mr-2 h-4 w-4" aria-hidden="true" />Imprimer / PDF</Button>
      {pdfUrl && (
        <Button asChild variant="outline" className="min-h-11"><a href={pdfUrl} target="_blank" rel="noopener noreferrer" data-testid="bilan-pdf"><Download className="mr-2 h-4 w-4" aria-hidden="true" />Télécharger le PDF</a></Button>
      )}
      <Button type="button" variant="outline" className="min-h-11" disabled={disabled} onClick={downloadWord} data-testid="bilan-word"><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Télécharger en Word</Button>
      <Button type="button" variant="outline" className="min-h-11" disabled={disabled} onClick={() => { void copyWithLetterhead(); }} data-testid="bilan-copy"><Copy className="mr-2 h-4 w-4" aria-hidden="true" />Copier avec l'en-tête</Button>
    </div>
  );
}
