import React from "react";

/**
 * Piège à robots : un champ que seuls les programmes automatiques remplissent. Hors écran, sans focus clavier, ignoré des lecteurs d'écran ;
 * un visiteur ne le voit ni ne le remplit. Quand il est rempli, le serveur n'enregistre rien et répond comme pour un succès.
 * Même principe que le formulaire de contact. `name` vaut « website » : c'est le champ attendu par les routes serveur.
 */
export function HoneypotField({ value, onChange, testId = "honeypot" }: { value?: string; onChange?: (value: string) => void; testId?: string }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }} data-testid={testId}>
      <label>
        Ne pas remplir ce champ
        <input type="text" name="website" aria-label="Ne pas remplir ce champ" tabIndex={-1} autoComplete="off" {...(onChange ? { value: value ?? "", onChange: (event) => onChange(event.target.value) } : { defaultValue: "" })} />
      </label>
    </div>
  );
}
