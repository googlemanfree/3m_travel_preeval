import { useEffect } from "react";
import { toast } from "sonner";
import { CHUNK_RELOAD_NOTICE_KEY } from "@/lib/lazyWithTimeout";

export default function ChunkReloadNotice() {
  useEffect(() => {
    try {
      const reason = sessionStorage.getItem(CHUNK_RELOAD_NOTICE_KEY);
      if (!reason) return;

      sessionStorage.removeItem(CHUNK_RELOAD_NOTICE_KEY);
      toast.info("Rechargement automatique terminé", {
        description: "Un problème réseau a interrompu le chargement d’une page. La version actuelle a été rechargée.",
        duration: 6000,
      });
    } catch {
      // Le stockage peut être indisponible en navigation privée ; le site reste utilisable.
    }
  }, []);

  return null;
}
