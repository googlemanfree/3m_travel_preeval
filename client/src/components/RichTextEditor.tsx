import { useEffect, useRef, useState } from "react";
import { Bold, BookOpenText, Eraser, Eye, Heading3, Italic, Link2, List, ListOrdered, Sparkles, Table2, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function richTextToPlainText(value: string) {
  if (typeof document === "undefined") return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const container = document.createElement("div");
  container.innerHTML = value;
  return (container.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function sanitizeRichText(value: string) {
  if (typeof document === "undefined") return value.replace(/<[^>]+>/g, "");
  const source = new DOMParser().parseFromString(value, "text/html");
  const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "UL", "OL", "LI", "H3", "A", "TABLE", "TBODY", "TR", "TD", "TH"]);

  const clean = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const children = Array.from(element.childNodes).map(clean).filter((child): child is Node => Boolean(child));
    if (!allowed.has(element.tagName)) {
      const fragment = document.createDocumentFragment();
      children.forEach((child) => fragment.appendChild(child));
      return fragment;
    }
    const output = document.createElement(element.tagName.toLowerCase());
    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      if (href.startsWith("/") || href.startsWith("https://")) {
        output.setAttribute("href", href);
        output.setAttribute("target", "_blank");
        output.setAttribute("rel", "noopener noreferrer");
      }
    }
    children.forEach((child) => output.appendChild(child));
    return output;
  };

  const result = document.createElement("div");
  Array.from(source.body.childNodes).map(clean).filter((node): node is Node => Boolean(node)).forEach((node) => result.appendChild(node));
  return result.innerHTML.trim();
}

type Props = {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  maxCharacters?: number;
  className?: string;
  sessionToken?: string;
  templateScope?: "candidate_message" | "evaluation_message" | "general";
};

export function RichTextEditor({ label, value, onChange, placeholder = "Rédigez votre contenu…", minHeight = "11rem", disabled = false, maxCharacters = 8000, className, sessionToken, templateScope = "general" }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState(false);
  const [suggestion, setSuggestion] = useState<{ contentHtml: string; changeSummary: string } | null>(null);
  const [templateLanguage, setTemplateLanguage] = useState<"fr" | "en">("fr");
  const textLength = richTextToPlainText(value).length;
  const editorValue = /<\/?[a-z][^>]*>/i.test(value) ? value : value.replace(/\n/g, "<br>");
  const templates = trpc.richTextTemplates.list.useQuery({ sessionToken: sessionToken ?? "", scope: templateScope, language: templateLanguage }, { enabled: Boolean(sessionToken) });
  const createTemplate = trpc.richTextTemplates.create.useMutation({ onSuccess: () => { void templates.refetch(); toast.success("Modèle enregistré."); } });
  const bootstrapTemplates = trpc.richTextTemplates.bootstrapSharedBilingual.useMutation({ onSuccess: (result) => { void templates.refetch(); toast.success(result.created ? `${result.created} modèle(s) partagé(s) installés.` : "Les modèles partagés sont déjà disponibles."); }, onError: (error) => toast.error(error.message || "Les modèles partagés n’ont pas pu être installés.") });
  const improve = trpc.richTextTemplates.improve.useMutation({ onSuccess: (result) => setSuggestion(result), onError: (error) => toast.error(error.message || "La reformulation IA est indisponible.") });

  useEffect(() => {
    if (!editorRef.current || focused || editorRef.current.innerHTML === editorValue) return;
    editorRef.current.innerHTML = editorValue;
  }, [editorValue, focused]);

  const emit = () => {
    const html = editorRef.current?.innerHTML ?? "";
    const text = richTextToPlainText(html);
    if (text.length > maxCharacters) return;
    onChange(sanitizeRichText(html));
  };

  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    emit();
  };

  const addLink = () => {
    const href = window.prompt("URL du lien (https:// ou /chemin) :");
    if (!href || (!href.startsWith("https://") && !href.startsWith("/"))) return;
    command("createLink", href);
  };

  const insertTemplate = (template: { contentHtml?: string }) => {
    if (!template.contentHtml) return;
    const prefix = richTextToPlainText(value) ? "<p><br></p>" : "";
    onChange(sanitizeRichText(`${editorValue}${prefix}${template.contentHtml}`));
    toast.success("Modèle inséré. Vous pouvez le personnaliser avant envoi.");
  };

  const saveTemplate = () => {
    if (!sessionToken) return;
    const name = window.prompt("Nom du modèle :");
    if (!name?.trim()) return;
    createTemplate.mutate({ sessionToken, name: name.trim(), scope: templateScope, language: templateLanguage, contentHtml: editorValue });
  };

  const requestImprovement = () => {
    if (!sessionToken || textLength < 3) return;
    improve.mutate({ sessionToken, scope: templateScope, contentHtml: editorValue });
  };

  const pasteClean = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    event.preventDefault();
    const cleanHtml = html ? sanitizeRichText(html) : text.split(/\r?\n/).map((line) => `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") || "<br>"}</p>`).join("");
    document.execCommand("insertHTML", false, cleanHtml);
    emit();
    toast.success("Collage Word nettoyé : styles et balises superflus supprimés.");
  };

  return <div className={cn("space-y-2", className)}>
    {label && <Label>{label}</Label>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2" role="toolbar" aria-label={label ? `Outils de mise en forme pour ${label}` : "Outils de mise en forme"}>
        <Tool label="Gras" onClick={() => command("bold")} disabled={disabled}><Bold className="h-4 w-4" /></Tool>
        <Tool label="Italique" onClick={() => command("italic")} disabled={disabled}><Italic className="h-4 w-4" /></Tool>
        <Tool label="Souligné" onClick={() => command("underline")} disabled={disabled}><Underline className="h-4 w-4" /></Tool>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        <Tool label="Titre" onClick={() => command("formatBlock", "H3")} disabled={disabled}><Heading3 className="h-4 w-4" /></Tool>
        <Tool label="Liste à puces" onClick={() => command("insertUnorderedList")} disabled={disabled}><List className="h-4 w-4" /></Tool>
        <Tool label="Liste numérotée" onClick={() => command("insertOrderedList")} disabled={disabled}><ListOrdered className="h-4 w-4" /></Tool>
        <Tool label="Insérer un lien" onClick={addLink} disabled={disabled}><Link2 className="h-4 w-4" /></Tool>
        <Tool label="Insérer un tableau" onClick={() => command("insertHTML", "<table><tbody><tr><th>Intitulé</th><th>Détail</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>")} disabled={disabled}><Table2 className="h-4 w-4" /></Tool>
        <Tool label="Effacer la mise en forme" onClick={() => command("removeFormat")} disabled={disabled}><Eraser className="h-4 w-4" /></Tool>
        <span className="mx-1 h-5 w-px bg-slate-300" />
        {sessionToken && <Button type="button" variant="ghost" size="sm" onClick={saveTemplate} disabled={disabled || textLength < 3 || createTemplate.isPending} className="gap-1"><BookOpenText className="h-4 w-4" />Modèle</Button>}
        {sessionToken && <Button type="button" variant="ghost" size="sm" onClick={requestImprovement} disabled={disabled || textLength < 3 || improve.isPending} className="gap-1"><Sparkles className="h-4 w-4" />{improve.isPending ? "Correction…" : "Assistance IA"}</Button>}
        <Button type="button" variant={preview ? "secondary" : "ghost"} size="sm" onClick={() => setPreview((current) => !current)} className="gap-1"><Eye className="h-4 w-4" />{preview ? "Éditer" : "Aperçu"}</Button>
      </div>
      {sessionToken && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-3 py-2"><span className="text-xs font-medium text-slate-600">Modèles : français &amp; anglais</span><Button type="button" size="sm" variant={templateLanguage === "fr" ? "secondary" : "outline"} className="h-8" onClick={() => setTemplateLanguage("fr")}>Français</Button><Button type="button" size="sm" variant={templateLanguage === "en" ? "secondary" : "outline"} className="h-8" onClick={() => setTemplateLanguage("en")}>English</Button><Button type="button" size="sm" variant="outline" className="h-8" disabled={bootstrapTemplates.isPending} onClick={() => bootstrapTemplates.mutate({ sessionToken })}>{bootstrapTemplates.isPending ? "Installation…" : "Installer les modèles"}</Button>{templates.data?.map((template) => <Button key={template.id} type="button" size="sm" variant="outline" className="h-8" onClick={() => insertTemplate(template)}>{template.name.replace(/^(FR|EN)\s+—\s+/, "")}</Button>)}{templates.data?.length === 0 && <span className="text-xs text-slate-500">Aucun modèle {templateLanguage === "fr" ? "français" : "anglais"} pour cette procédure.</span>}</div>}
      {suggestion && <div className="border-b border-violet-200 bg-violet-50 p-3 text-sm text-violet-950"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-1 font-semibold"><Sparkles className="h-4 w-4" />Proposition de correction IA</p><p className="mt-1 text-xs">{suggestion.changeSummary}</p></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setSuggestion(null)}>Ignorer</Button><Button type="button" size="sm" onClick={() => { onChange(suggestion.contentHtml); setSuggestion(null); toast.success("Proposition IA appliquée. Relisez avant envoi."); }}>Appliquer</Button></div></div></div>}
      {preview ? <div style={{ minHeight }} className="prose prose-sm max-w-none p-4 text-slate-800 prose-a:text-blue-700 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-td:border prose-td:border-slate-300 prose-td:p-2" dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) || `<p class="text-slate-400">${placeholder}</p>` }} /> : <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label ?? "Éditeur de contenu"}
          data-placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); emit(); }}
          onInput={emit}
          onPaste={pasteClean}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") { event.preventDefault(); command("bold"); }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") { event.preventDefault(); command("italic"); }
          }}
          style={{ minHeight }}
          className="prose prose-sm max-w-none p-4 text-slate-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 prose-a:text-blue-700 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-td:border prose-td:border-slate-300 prose-td:p-2"
        />}
      <div className="border-t border-slate-100 px-3 py-1.5 text-right text-xs text-slate-500">{textLength}/{maxCharacters} caractères</div>
    </div>
  </div>;
}

function Tool({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return <Button type="button" variant="ghost" size="icon-sm" onMouseDown={(event) => event.preventDefault()} onClick={onClick} disabled={disabled} aria-label={label} title={label}>{children}</Button>;
}
