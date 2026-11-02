import { useState } from "react";
import { Check, Copy, Facebook, Linkedin, Twitter } from "lucide-react";
import { toast } from "sonner";

type SocialShareButtonsProps = {
  title: string;
  className?: string;
  /** Langue des libellés (français par défaut). */
  lang?: "fr" | "en";
};

const SHARE_COPY = {
  fr: {
    heading: "Partager cette page",
    copyAria: "Copier le lien de cette page",
    copyLabel: "Copier le lien",
    copiedLabel: "Lien copié",
    copiedStatus: "Le lien a été copié dans le presse-papiers.",
    copiedToast: "Le lien de cette page est prêt à être partagé.",
    unavailable: "Copie indisponible",
    unavailableToast: "Votre navigateur n’autorise pas l’accès au presse-papiers.",
    facebook: "Partager sur Facebook",
    twitter: "Partager sur Twitter",
    linkedin: "Partager sur LinkedIn",
  },
  en: {
    heading: "Share this page",
    copyAria: "Copy this page’s link",
    copyLabel: "Copy link",
    copiedLabel: "Link copied",
    copiedStatus: "The link was copied to the clipboard.",
    copiedToast: "This page’s link is ready to share.",
    unavailable: "Copy unavailable",
    unavailableToast: "Your browser does not allow clipboard access.",
    facebook: "Share on Facebook",
    twitter: "Share on Twitter",
    linkedin: "Share on LinkedIn",
  },
} as const;

export function buildShareUrls(pageUrl: string, title: string) {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

export function SocialShareButtons({ title, className = "", lang = "fr" }: SocialShareButtonsProps) {
  const copy = SHARE_COPY[lang];
  const [copied, setCopied] = useState(false);
  const share = (network: "facebook" | "twitter" | "linkedin") => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://www.3mtravelagency.com/";
    const urls = buildShareUrls(pageUrl, title);
    window.open(urls[network], "_blank", "noopener,noreferrer,width=680,height=620");
  };

  const copyLink = async () => {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://www.3mtravelagency.com/";
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success(copy.copiedLabel, { description: copy.copiedToast });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      toast.error(copy.unavailable, { description: copy.unavailableToast });
    }
  };

  const buttons = [
    { key: "facebook" as const, label: copy.facebook, icon: Facebook, tone: "bg-[#0f65d1] hover:bg-[#0d54ac]" },
    { key: "twitter" as const, label: copy.twitter, icon: Twitter, tone: "bg-slate-900 hover:bg-slate-700" },
    { key: "linkedin" as const, label: copy.linkedin, icon: Linkedin, tone: "bg-[#0A66C2] hover:bg-[#084f96]" },
  ];

  return (
    <section aria-labelledby="social-share-title" className={`flex flex-wrap items-center gap-3 ${className}`}>
      <h2 id="social-share-title" className="mr-1 text-sm font-bold text-slate-700">{copy.heading}</h2>
      <button type="button" onClick={copyLink} aria-label={copy.copyAria} className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
        {copied ? <Check className="h-4 w-4 text-emerald-600 motion-safe:animate-bounce" aria-hidden="true" /> : <Copy className="h-4 w-4 transition-transform duration-200 group-active:scale-90" aria-hidden="true" />}
        <span>{copied ? copy.copiedLabel : copy.copyLabel}</span>
      </button>
      <p role="status" aria-live="polite" className="sr-only">{copied ? copy.copiedStatus : ""}</p>
      {buttons.map(({ key, label, icon: Icon, tone }) => (
        <button key={key} type="button" onClick={() => share(key)} aria-label={label} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{key === "twitter" ? "Twitter" : key[0].toUpperCase() + key.slice(1)}</span>
        </button>
      ))}
    </section>
  );
}
