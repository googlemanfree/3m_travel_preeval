import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

/** Champs que l'on peut relier à une étiquette (cases et boutons radio gardent leur propre <label> englobant). */
const LABELABLE_CONTROL = "input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select,button[role=combobox]";

function findControlAfter(label: HTMLElement): HTMLElement | null {
  // On ne regarde que les deux frères suivants : `<Label/><Input/>` ou `<Label/><div><Input/></div>`.
  // Un champ plus éloigné appartient presque toujours à une autre étiquette.
  let sibling = label.nextElementSibling;
  for (let hops = 0; sibling && hops < 2; hops += 1, sibling = sibling.nextElementSibling) {
    const control = sibling.matches(LABELABLE_CONTROL) ? sibling : sibling.querySelector(LABELABLE_CONTROL);
    if (control && !control.closest('[aria-hidden="true"]')) return control as HTMLElement;
  }
  return null;
}

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const labelRef = React.useRef<HTMLLabelElement>(null);
  const generatedId = React.useId();
  const hasExplicitTarget = Boolean(props.htmlFor);

  // Beaucoup de formulaires écrivent `<Label>Nom</Label><Input />` sans les relier : un lecteur d'écran annonce alors
  // « champ de saisie » sans nom. Sans `htmlFor` explicite, on relie l'étiquette au champ qui la suit immédiatement.
  React.useEffect(() => {
    const label = labelRef.current;
    if (!label || hasExplicitTarget || label.htmlFor || label.querySelector(LABELABLE_CONTROL)) return;
    const control = findControlAfter(label);
    if (!control || control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return;
    if (!control.id) control.id = `field-${generatedId.replace(/:/g, "")}`;
    // Un autre <label for> existe déjà pour ce champ : on ne le double pas.
    if (document.querySelector(`label[for="${CSS.escape(control.id)}"]`)) return;
    label.htmlFor = control.id;
  });

  return (
    <LabelPrimitive.Root
      ref={labelRef}
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm font-semibold leading-snug text-slate-800 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Label };
