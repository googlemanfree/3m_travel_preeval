import { useEffect, useRef, useState } from "react";
import { Bold, Eraser, Eye, Heading3, Italic, Link2, List, ListOrdered, Table2, Underline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
};

export function RichTextEditor({ label, value, onChange, placeholder = "Rédigez votre contenu…", minHeight = "11rem", disabled = false, maxCharacters = 8000, className }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState(false);
  const textLength = richTextToPlainText(value).length;
  const editorValue = /<\/?[a-z][^>]*>/i.test(value) ? value : value.replace(/\n/g, "<br>");

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
        <Button type="button" variant={preview ? "secondary" : "ghost"} size="sm" onClick={() => setPreview((current) => !current)} className="gap-1"><Eye className="h-4 w-4" />{preview ? "Éditer" : "Aperçu"}</Button>
      </div>
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
