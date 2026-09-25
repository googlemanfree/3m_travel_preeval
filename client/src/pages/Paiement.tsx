import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import PaymentMethodsPanel from "@/components/PaymentMethodsPanel";
import PaymentFallbackPanel from "@/components/PaymentFallbackPanel";

const GUARANTEES = [
  "Le paiement n’est pris en compte qu’après confirmation de réception par l’agence, avec reçu.",
  "Payez uniquement sur les coordonnées affichées sur cette page ou confirmées par l’agence, et vérifiez le nom du titulaire avant tout envoi.",
  "Indiquez toujours votre référence (dossier ou réservation) dans le motif du virement ou du dépôt.",
  "Un paiement en ligne qui échoue ne bloque pas votre démarche : vous pouvez régler par virement, dépôt Mobile Money ou en agence.",
];

export default function Paiement() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const reference = (params.get("ref") ?? "").slice(0, 60);
  const amountParam = Number(params.get("montant"));
  const kind = params.get("type") === "vol" ? "flight" : "dossier";

  return (
    <ServicePageShell
      eyebrow="Paiement"
      title="Moyens de paiement"
      introduction="Carte et Mobile Money en ligne dès que la passerelle est activée ; en attendant, et à tout moment, virement bancaire, dépôt Mobile Money sur le numéro de l’agence ou paiement en agence à Yaoundé."
      primaryHref="/consultation"
      primaryLabel="Parler à un conseiller"
      notice="Les coordonnées de paiement ne sont jamais envoyées par des tiers : vérifiez-les ici ou auprès de l’agence avant tout règlement."
    >
      <ServiceSection title="Tous les moyens de paiement" introduction="L’état de chaque moyen est réel : un moyen n’est indiqué « disponible » que lorsqu’il est configuré.">
        <PaymentMethodsPanel />
      </ServiceSection>

      <ServiceSection title={reference ? `Régler la référence ${reference}` : "Un paiement n’a pas abouti ?"} introduction="Contactez l’agence : nous vous indiquons la marche à suivre et confirmons la réception de votre règlement." tone="slate">
        <PaymentFallbackPanel reference={reference} kind={kind} amount={Number.isFinite(amountParam) && amountParam > 0 ? amountParam : null} reason={reference ? "failed" : "alternatives"} />
      </ServiceSection>

      <ServiceSection title="Vos garanties">
        <ul className="grid gap-3 md:grid-cols-2">
          {GUARANTEES.map((item) => (
            <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item}</li>
          ))}
        </ul>
      </ServiceSection>
    </ServicePageShell>
  );
}
