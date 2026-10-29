import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, CheckCircle2, Code2, Eraser, FileUp, Heading2, Heading3, Highlighter, Italic, Link2, List, ListOrdered, Minus, Palette, Quote, Redo2, Strikethrough, Table2, Trash2, Type, Underline, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BILAN_MAX_HTML_LENGTH, bilanPlainText, inspectBilan, renderBilanStandalone, sanitizeBilanHtml, styleBilanHtml, toBilanHtml } from "@shared/bilanContent";
import { BILAN_CALLOUTS, BILAN_HIGHLIGHTS, BILAN_HIGHLIGHT_LABELS, BILAN_SIZE_LABELS, BILAN_TABLE_DESIGNS, BILAN_TABLE_DESIGN_LABELS, BILAN_TEXT_COLORS, BILAN_TEXT_COLOR_LABELS } from "@shared/bilanDesign";
import { BilanDocumentActions } from "@/components/BilanDocumentActions";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  label?: string;
  minHeight?: string;
  /** Identité du bilan pour l'impression, le téléchargement et la copie sur papier à en-tête. */
  documentMeta?: { title: string; candidateName: string; reference?: string | null; projectLabel?: string | null; destination?: string | null; score?: number | null };
};

type Panel = "color" | "highlight" | "size" | "callout" | "table" | null;

/**
 * Zone de saisie du bilan complet : on y COLLE un bilan déjà rédigé ailleurs (Word, Google Docs, page web, ChatGPT, e-mail, texte brut, Markdown, code HTML)
 * et il est converti en une mise en forme propre — la même que verra le candidat, dans son espace comme par e-mail. Aucune limite de longueur imposée.
 */
export function BilanPasteEditor({ value, onChange, disabled = false, label = "Bilan complet", minHeight = "22rem", documentMeta }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<"visuel" | "source">("visuel");
  const [panel, setPanel] = useState<Panel>(null);
  const [source, setSource] = useState(value);
  const inspection = useMemo(() => inspectBilan(value), [value]);
  const styled = useMemo(() => styleBilanHtml(value), [value]);

  useEffect(() => {
    if (!editorRef.current || focused || mode !== "visuel") return;
    if (editorRef.current.dataset.last !== value) {
      // Défense en profondeur : la valeur est re-nettoyée avant d'atteindre innerHTML, même si elle vient d'un brouillon ancien.
      editorRef.current.innerHTML = styleBilanHtml(sanitizeBilanHtml(value));
      editorRef.current.dataset.last = value;
    }
  }, [value, focused, mode, styled]);
  useEffect(() => { if (mode === "source") setSource(value); }, [mode, value]);

  const emit = () => {
    const clean = sanitizeBilanHtml(editorRef.current?.innerHTML ?? "");
    if (editorRef.current) editorRef.current.dataset.last = clean;
    onChange(clean);
  };
  const command = (name: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    emit();
  };
  const applyRaw = (raw: string, notice?: string) => {
    const html = toBilanHtml(raw);
    if (raw.trim() && !html) { toast.error("Rien d’exploitable dans ce contenu."); return; }
    if (html.length >= BILAN_MAX_HTML_LENGTH) toast.warning("Le bilan est très long : il a été tronqué à la limite de sécurité.");
    onChange(html);
    if (editorRef.current) editorRef.current.dataset.last = "";
    if (notice) toast.success(notice);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    event.preventDefault();
    // HTML riche (Word, Docs, web) si présent ; sinon le texte brut, qui peut lui-même être du code HTML ou du Markdown.
    // Un bilan rédigé en texte (traits ━━━, lignes à points, ✓ ▸ ①) perd sa structure dans le HTML d'un chat ou d'un e-mail : le texte brut est alors préféré.
    const preferText = /[━═]{6,}|\.{6,}\s*\S/.test(text);
    const converted = toBilanHtml(preferText ? text : (html || text));
    if (!converted) return;
    document.execCommand("insertHTML", false, styleBilanHtml(converted));
    emit();
    toast.success("Contenu collé et mis en forme : styles parasites, scripts et images retirés.");
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Fichier trop volumineux (2 Mo maximum)."); return; }
    if (!/\.(html?|txt|md|markdown)$/i.test(file.name)) { toast.error("Formats acceptés : .html, .htm, .txt, .md. Pour un document Word, ouvrez-le puis copiez-collez son contenu ici."); return; }
    applyRaw(await file.text(), `Fichier « ${file.name} » importé.`);
  };
  const addLink = () => {
    const href = window.prompt("Adresse du lien (https://…) :");
    if (href && /^https:\/\//i.test(href.trim())) command("createLink", href.trim());
  };

  /** Remet à jour l'affichage (styles en ligne) après un changement d'attribut posé directement sur un bloc. */
  const restyle = () => {
    if (!editorRef.current) return;
    const clean = sanitizeBilanHtml(editorRef.current.innerHTML);
    editorRef.current.innerHTML = styleBilanHtml(clean);
    editorRef.current.dataset.last = clean;
    onChange(clean);
  };
  const closestFromSelection = (selector: string): HTMLElement | null => {
    const anchor = window.getSelection()?.anchorNode;
    const element = anchor instanceof HTMLElement ? anchor : anchor?.parentElement;
    const found = element?.closest(selector) as HTMLElement | null;
    return found && editorRef.current?.contains(found) ? found : null;
  };
  const withCss = (name: string, argument: string) => {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(name, false, argument);
    emit();
    setPanel(null);
  };
  const setCallout = (kind: keyof typeof BILAN_CALLOUTS | "none") => {
    editorRef.current?.focus();
    let box = closestFromSelection("blockquote");
    if (!box && kind !== "none") { document.execCommand("formatBlock", false, "BLOCKQUOTE"); box = closestFromSelection("blockquote"); }
    if (box) { if (kind === "none") box.removeAttribute("data-v"); else box.setAttribute("data-v", kind); restyle(); }
    setPanel(null);
  };
  const setTableDesign = (design: (typeof BILAN_TABLE_DESIGNS)[number]) => {
    const table = closestFromSelection("table");
    if (!table) { toast.info("Placez le curseur dans un tableau pour changer son style."); return; }
    if (design === "classic") table.removeAttribute("data-d"); else table.setAttribute("data-d", design);
    restyle();
    setPanel(null);
  };
  const Swatch = ({ label: title, color, onClick }: { label: string; color: string; onClick: () => void }) => (
    <button type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="h-7 w-7 rounded-full border border-slate-300 shadow-sm" style={{ background: color }} />
  );
  const documentHtml = () => {
    if (!documentMeta || !value.trim()) return "";
    return renderBilanStandalone({ html: value, title: documentMeta.title, candidateName: documentMeta.candidateName, reference: documentMeta.reference, projectLabel: documentMeta.projectLabel, destination: documentMeta.destination, score: documentMeta.score });
  };

  const Tool = ({ label: title, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
    <Button type="button" size="sm" variant="ghost" className="h-8 px-2" title={title} aria-label={title} disabled={disabled || mode !== "visuel"} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</Button>
  );

  return (
    <div className="space-y-2" data-testid="bilan-paste-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-slate-900">{label}</Label>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Mode de saisie du bilan">
          <Button type="button" size="sm" variant={mode === "visuel" ? "default" : "outline"} onClick={() => setMode("visuel")} role="tab" aria-selected={mode === "visuel"}>Éditeur</Button>
          <Button type="button" size="sm" variant={mode === "source" ? "default" : "outline"} onClick={() => setMode("source")} role="tab" aria-selected={mode === "source"}><Code2 className="mr-1 h-3.5 w-3.5" />Code HTML / texte</Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => fileRef.current?.click()}><FileUp className="mr-1 h-3.5 w-3.5" />Importer un fichier</Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled || !value} onClick={() => { if (window.confirm("Vider entièrement le bilan collé ?")) onChange(""); }}><Trash2 className="mr-1 h-3.5 w-3.5" />Vider</Button>
          <input ref={fileRef} type="file" accept=".html,.htm,.txt,.md,.markdown,text/html,text/plain" className="hidden" onChange={(event) => { void importFile(event.target.files?.[0]); event.target.value = ""; }} />
        </div>
      </div>

      {mode === "visuel" ? (
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5" role="toolbar" aria-label="Mise en forme du bilan">
            <Tool label="Gras" onClick={() => command("bold")}><Bold className="h-4 w-4" /></Tool>
            <Tool label="Italique" onClick={() => command("italic")}><Italic className="h-4 w-4" /></Tool>
            <Tool label="Titre de section" onClick={() => command("formatBlock", "H2")}><Heading2 className="h-4 w-4" /></Tool>
            <Tool label="Sous-titre" onClick={() => command("formatBlock", "H3")}><Heading3 className="h-4 w-4" /></Tool>
            <Tool label="Liste à puces" onClick={() => command("insertUnorderedList")}><List className="h-4 w-4" /></Tool>
            <Tool label="Liste numérotée" onClick={() => command("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Tool>
            <Tool label="Tableau" onClick={() => command("insertHTML", "<table><thead><tr><th>Critère</th><th>Détail</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>")}><Table2 className="h-4 w-4" /></Tool>
            <Tool label="Séparateur" onClick={() => command("insertHorizontalRule")}><Minus className="h-4 w-4" /></Tool>
            <Tool label="Lien" onClick={addLink}><Link2 className="h-4 w-4" /></Tool>
            <Tool label="Effacer la mise en forme de la sélection" onClick={() => command("removeFormat")}><Eraser className="h-4 w-4" /></Tool>
            <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
            <Tool label="Souligné" onClick={() => command("underline")}><Underline className="h-4 w-4" /></Tool>
            <Tool label="Barré" onClick={() => command("strikeThrough")}><Strikethrough className="h-4 w-4" /></Tool>
            <Tool label="Aligner à gauche" onClick={() => command("justifyLeft")}><AlignLeft className="h-4 w-4" /></Tool>
            <Tool label="Centrer" onClick={() => command("justifyCenter")}><AlignCenter className="h-4 w-4" /></Tool>
            <Tool label="Aligner à droite" onClick={() => command("justifyRight")}><AlignRight className="h-4 w-4" /></Tool>
            <Tool label="Justifier" onClick={() => command("justifyFull")}><AlignJustify className="h-4 w-4" /></Tool>
            <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
            <Tool label="Couleur du texte" onClick={() => setPanel(panel === "color" ? null : "color")}><Palette className="h-4 w-4" /></Tool>
            <Tool label="Surlignage" onClick={() => setPanel(panel === "highlight" ? null : "highlight")}><Highlighter className="h-4 w-4" /></Tool>
            <Tool label="Taille du texte" onClick={() => setPanel(panel === "size" ? null : "size")}><Type className="h-4 w-4" /></Tool>
            <Tool label="Encadré (information, point fort, attention, alerte)" onClick={() => setPanel(panel === "callout" ? null : "callout")}><Quote className="h-4 w-4" /></Tool>
            <Tool label="Style du tableau" onClick={() => setPanel(panel === "table" ? null : "table")}><Table2 className="h-4 w-4" /><span className="ml-0.5 text-[10px] font-bold">Style</span></Tool>
            <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
            <Tool label="Annuler" onClick={() => command("undo")}><Undo2 className="h-4 w-4" /></Tool>
            <Tool label="Rétablir" onClick={() => command("redo")}><Redo2 className="h-4 w-4" /></Tool>
          </div>
          {panel && (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-2 py-1.5" role="group" aria-label="Options de mise en forme" data-testid={`bilan-panel-${panel}`}>
              {panel === "color" && (<>
                <span className="text-xs font-semibold text-slate-600">Couleur du texte</span>
                {(Object.keys(BILAN_TEXT_COLORS) as Array<keyof typeof BILAN_TEXT_COLORS>).map((name) => <Swatch key={name} label={BILAN_TEXT_COLOR_LABELS[name]} color={BILAN_TEXT_COLORS[name]} onClick={() => withCss("foreColor", BILAN_TEXT_COLORS[name])} />)}
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => withCss("foreColor", "#1f2937")}>Par défaut</Button>
              </>)}
              {panel === "highlight" && (<>
                <span className="text-xs font-semibold text-slate-600">Surlignage</span>
                {(Object.keys(BILAN_HIGHLIGHTS) as Array<keyof typeof BILAN_HIGHLIGHTS>).map((name) => <Swatch key={name} label={BILAN_HIGHLIGHT_LABELS[name]} color={BILAN_HIGHLIGHTS[name]} onClick={() => withCss("hiliteColor", BILAN_HIGHLIGHTS[name])} />)}
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => withCss("hiliteColor", "#ffffff")}>Sans surlignage</Button>
              </>)}
              {panel === "size" && (<>
                <span className="text-xs font-semibold text-slate-600">Taille</span>
                {([["sm", "2"], ["lg", "5"], ["xl", "6"]] as const).map(([name, size]) => <Button key={name} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => withCss("fontSize", size)}>{BILAN_SIZE_LABELS[name]}</Button>)}
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => withCss("fontSize", "3")}>Normale</Button>
              </>)}
              {panel === "callout" && (<>
                <span className="text-xs font-semibold text-slate-600">Encadré</span>
                {(Object.keys(BILAN_CALLOUTS) as Array<keyof typeof BILAN_CALLOUTS>).map((name) => <Button key={name} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" style={{ borderColor: BILAN_CALLOUTS[name].border, background: BILAN_CALLOUTS[name].background, color: BILAN_CALLOUTS[name].color }} onMouseDown={(event) => event.preventDefault()} onClick={() => setCallout(name)}>{BILAN_CALLOUTS[name].label}</Button>)}
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => setCallout("none")}>Citation simple</Button>
              </>)}
              {panel === "table" && (<>
                <span className="text-xs font-semibold text-slate-600">Style du tableau (curseur dans le tableau)</span>
                {BILAN_TABLE_DESIGNS.map((design) => <Button key={design} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => setTableDesign(design)}>{BILAN_TABLE_DESIGN_LABELS[design]}</Button>)}
              </>)}
            </div>
          )}
          <div
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); emit(); }}
            onInput={emit}
            onPaste={onPaste}
            data-placeholder="Collez ici le bilan complet (depuis Word, Google Docs, un e-mail, ChatGPT, une page web ou un fichier texte). La mise en forme est conservée et nettoyée."
            className={cn("prose-bilan max-w-none overflow-y-auto p-4 text-sm leading-7 text-slate-900 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]")}
            style={{ minHeight }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} className="min-h-[18rem] font-mono text-xs" placeholder="Collez ici du code HTML, du texte brut ou du Markdown, puis cliquez sur « Appliquer »." disabled={disabled} aria-label="Code source du bilan" />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={disabled} onClick={() => { applyRaw(source, "Contenu converti et mis en forme."); setMode("visuel"); }}>Appliquer et revenir à l’éditeur</Button>
            <span className="text-xs text-slate-500">HTML, texte brut et Markdown sont reconnus ; seuls titres, paragraphes, listes, tableaux, citations et liens sont conservés.</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" role="status" aria-live="polite">
        <span className="text-slate-600">{inspection.words} mot{inspection.words > 1 ? "s" : ""} · {inspection.headings} titre{inspection.headings > 1 ? "s" : ""}</span>
        {inspection.empty ? (
          <span className="text-slate-500">Aucun bilan collé pour l’instant.</span>
        ) : inspection.forbiddenTerms.length === 0 && inspection.sensitiveData.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Aucune formulation à risque détectée</span>
        ) : null}
      </div>
      {inspection.forbiddenTerms.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900" role="alert" data-testid="bilan-forbidden">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><strong>Formulation à revoir avant validation</strong> (promesse de résultat) : {inspection.forbiddenTerms.join(", ")}. Le bilan ne peut pas être validé tant qu’elle figure dans le texte.</span>
        </p>
      )}
      {inspection.sensitiveData.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900" role="alert" data-testid="bilan-sensitive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><strong>Donnée sensible à retirer</strong> : {inspection.sensitiveData.join(", ")}.</span>
        </p>
      )}
      {inspection.placeholders.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-950" role="alert" data-testid="bilan-placeholders">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><strong>Zone à compléter</strong> : {inspection.placeholders.join(", ")}. Renseignez-la (montant, destination…) : le bilan ne peut pas être validé tant qu’elle reste dans le texte.</span>
        </p>
      )}
      {documentMeta && !inspection.empty && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2" data-testid="bilan-document-zone">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Papier à en-tête : imprimer, enregistrer en PDF, télécharger en Word ou copier le bilan prêt à coller.</p>
          <BilanDocumentActions getDocumentHtml={documentHtml} title={documentMeta.title} candidateName={documentMeta.candidateName} reference={documentMeta.reference} />
        </div>
      )}
      {!inspection.empty && <p className="text-[11px] text-slate-500">Texte lu par le candidat : {bilanPlainText(value).slice(0, 90).replace(/\s+/g, " ")}…</p>}
    </div>
  );
}
