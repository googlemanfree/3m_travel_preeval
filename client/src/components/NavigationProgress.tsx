import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

const NAVIGATION_EVENT = "3m:navigation-start";

export function notifyNavigationStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT));
  }
}

function isSameDocumentNavigation(anchor: HTMLAnchorElement) {
  if (!anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  if (anchor.origin !== window.location.origin) return false;
  if (anchor.hash && anchor.pathname === window.location.pathname && anchor.search === window.location.search) return false;
  return true;
}

export default function NavigationProgress() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(8);
  const [announcement, setAnnouncement] = useState("");
  const previousLocation = useRef(location);
  const { animationsEnabled } = useAnimationPreferences();

  useEffect(() => {
    const start = () => {
      setVisible(true);
      setAnnouncement("Chargement de la nouvelle page");
      setValue((current) => Math.max(current, 18));
      window.requestAnimationFrame(() => setValue((current) => Math.max(current, 68)));
      const fallbackTimeout = window.setTimeout(() => {
        setVisible(false);
        setAnnouncement("");
        setValue(8);
      }, 8_000);
      return () => window.clearTimeout(fallbackTimeout);
    };

    const onStart = () => { void start(); };
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (target instanceof HTMLAnchorElement && isSameDocumentNavigation(target)) notifyNavigationStart();
    };

    window.addEventListener(NAVIGATION_EVENT, onStart);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener(NAVIGATION_EVENT, onStart);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    if (previousLocation.current === location) return;
    previousLocation.current = location;
    setVisible(true);
    setAnnouncement("Page chargée");
    setValue(100);

    const timeout = window.setTimeout(() => {
      setVisible(false);
      setAnnouncement("");
      setValue(8);
    }, animationsEnabled ? 220 : 0);

    return () => window.clearTimeout(timeout);
  }, [animationsEnabled, location]);

  useEffect(() => {
    const onBeforeUnload = () => {
      setVisible(true);
      setAnnouncement("Chargement de la page");
      setValue(72);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <>
      <p className="sr-only" aria-live="polite">{announcement}</p>
      {visible && (
        <div
          aria-label="Chargement de la page"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-blue-950/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={announcement || "Navigation en cours"}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]"
            style={{
              width: `${value}%`,
              transition: animationsEnabled ? "width 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 180ms ease-out" : "none",
            }}
          />
        </div>
      )}
    </>
  );
}
