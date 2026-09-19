import React, { useState } from "react";
import { flagEmojiToIsoCode } from "@shared/candidateDestinationOptions";

type CountryFlagProps = { flag: string; className?: string };

// Les emoji drapeaux s'affichent en simples lettres (« CA », « FR ») sous Windows : on affiche donc
// une vraie miniature, avec l'emoji en repli si l'image ne peut pas se charger.
export default function CountryFlag({ flag, className = "" }: CountryFlagProps) {
  const [failed, setFailed] = useState(false);
  const code = flagEmojiToIsoCode(flag);

  if (!code || failed) return <span aria-hidden="true" className={className}>{flag}</span>;

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={20}
      height={15}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`inline-block h-[15px] w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10 ${className}`}
    />
  );
}
