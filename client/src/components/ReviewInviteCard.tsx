import { useState } from "react";
import { MessageSquareHeart, X } from "lucide-react";
import { buildReviewInviteUrl, REVIEW_SERVICE_OPTIONS } from "@/lib/reviewInvitation";

const DISMISS_KEY = "3m-review-invite-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Service du formulaire d'avis le plus proche du type de visa (vide si aucun ne correspond franchement). */
function serviceFor(visaType: string | null | undefined) {
  const text = String(visaType ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/(^|\W)(e-?visa|evisa)(\W|$)/.test(text)) return REVIEW_SERVICE_OPTIONS[3];
  if (/etude|student|formation/.test(text)) return REVIEW_SERVICE_OPTIONS[1];
  if (/travail|work|emploi/.test(text)) return REVIEW_SERVICE_OPTIONS[0];
  if (/touris|visit/.test(text)) return REVIEW_SERVICE_OPTIONS[2];
  return "";
}

/**
 * Invitation neutre à donner son avis une fois le visa approuvé. Rien n'est publié sans l'accord explicite du client
 * et la modération de l'équipe ; l'avis peut être positif ou critique. Le client peut la masquer.
 */
export function ReviewInviteCard({ approved, destination, visaType }: { approved: boolean; destination?: string | null; visaType?: string | null }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (!approved || dismissed) return null;

  const href = buildReviewInviteUrl({ serviceType: serviceFor(visaType), destinationCountry: destination ?? "" }, "/avis");

  return (
    <section aria-labelledby="review-invite-title" data-testid="review-invite-card" className="relative rounded-2xl border border-amber-200 bg-amber-50 p-5 pr-12 text-amber-950">
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // navigation privée : on masque seulement pour cette visite
          }
          setDismissed(true);
        }}
        aria-label="Masquer l’invitation à donner un avis"
        className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-3">
        <MessageSquareHeart className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <h2 id="review-invite-title" className="text-lg font-black">Votre expérience compte</h2>
          <p className="mt-1 text-sm leading-6">
            Positif ou critique, votre avis aide l’équipe à progresser et éclaire les personnes qui préparent un projet comme le vôtre. Il n’est publié qu’avec votre accord, sous le nom d’affichage de votre choix, après vérification par l’équipe.
          </p>
          <a href={href} className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800">
            Donner mon avis
          </a>
        </div>
      </div>
    </section>
  );
}
