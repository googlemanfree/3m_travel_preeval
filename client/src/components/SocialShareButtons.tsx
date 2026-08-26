import { useState } from "react";
import { Check, Copy, Facebook, Linkedin, Twitter } from "lucide-react";

type SocialShareButtonsProps = {
  title: string;
  className?: string;
};

export function buildShareUrls(pageUrl: string, title: string) {
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
}

export function SocialShareButtons({ title, className = "" }: SocialShareButtonsProps) {
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
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const buttons = [
    { key: "facebook" as const, label: "Partager sur Facebook", icon: Facebook, tone: "bg-[#1877F2] hover:bg-[#0f65d1]" },
    { key: "twitter" as const, label: "Partager sur Twitter", icon: Twitter, tone: "bg-slate-900 hover:bg-slate-700" },
    { key: "linkedin" as const, label: "Partager sur LinkedIn", icon: Linkedin, tone: "bg-[#0A66C2] hover:bg-[#084f96]" },
  ];

  return (
    <section aria-labelledby="social-share-title" className={`flex flex-wrap items-center gap-3 ${className}`}>
      <h2 id="social-share-title" className="mr-1 text-sm font-bold text-slate-700">Partager cette page</h2>
      <button type="button" onClick={copyLink} aria-label="Copier le lien de cette page" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
        {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        <span>{copied ? "Lien copié" : "Copier le lien"}</span>
      </button>
      <p role="status" aria-live="polite" className="sr-only">{copied ? "Le lien a été copié dans le presse-papiers." : ""}</p>
      {buttons.map(({ key, label, icon: Icon, tone }) => (
        <button key={key} type="button" onClick={() => share(key)} aria-label={label} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{key === "twitter" ? "Twitter" : key[0].toUpperCase() + key.slice(1)}</span>
        </button>
      ))}
    </section>
  );
}
