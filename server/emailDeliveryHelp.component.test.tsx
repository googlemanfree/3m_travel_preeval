// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as any).React = React;

const hoisted = vi.hoisted(() => ({
  resendOptions: { current: null as null | { onSuccess?: (data?: unknown) => void; onError?: (error: { message: string }) => void } },
  resendMutate: vi.fn(),
  resetOptions: { current: null as null | { onSuccess?: (data?: unknown) => void; onError?: (error: { message: string }) => void } },
  resetMutate: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/verify-email-sent", hoisted.navigate],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    candidate: {
      resendVerificationEmail: {
        useMutation: (options: any) => {
          hoisted.resendOptions.current = options;
          return { mutate: hoisted.resendMutate, isPending: false };
        },
      },
      requestPasswordReset: {
        useMutation: (options: any) => {
          hoisted.resetOptions.current = options;
          return { mutate: hoisted.resetMutate, isPending: false };
        },
      },
    },
  },
}));

import EmailDeliveryHelp from "@/components/EmailDeliveryHelp";
import VerifyEmailSent from "@/pages/VerifyEmailSent";
import ForgotPassword from "@/pages/ForgotPassword";
import {
  RESEND_COOLDOWN_SECONDS,
  maskEmail,
  readCooldownEnd,
  secondsUntil,
  supportMessage,
  webmailShortcut,
  writeCooldownEnd,
} from "@/lib/emailDeliveryHelp";

/** Une seconde à la fois : React doit se rafraîchir entre deux tics du compte à rebours, comme dans un vrai navigateur. */
function elapse(seconds: number) {
  for (let i = 0; i < seconds; i += 1) act(() => { vi.advanceTimersByTime(1000); });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-10T10:00:00Z"));
  window.sessionStorage.clear();
  window.localStorage.clear();
  hoisted.resendMutate.mockClear();
  hoisted.resetMutate.mockClear();
  hoisted.navigate.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("outils d'aide à la réception d'e-mail", () => {
  it("masque l'adresse sans jamais la montrer en entier", () => {
    expect(maskEmail("jean.dupont@gmail.com")).toBe("j***t@gmail.com");
    expect(maskEmail("ab@x.cm")).toBe("a***@x.cm");
    expect(maskEmail("pasune-adresse")).toBe("");
    expect(maskEmail("")).toBe("");
  });

  it("propose la messagerie seulement quand le fournisseur est connu", () => {
    expect(webmailShortcut("a@gmail.com")?.label).toBe("Ouvrir Gmail");
    expect(webmailShortcut("a@hotmail.fr")?.label).toBe("Ouvrir Outlook");
    expect(webmailShortcut("a@yahoo.fr")?.label).toBe("Ouvrir Yahoo Mail");
    expect(webmailShortcut("a@entreprise-inconnue.cm")).toBeNull();
    expect(webmailShortcut("sans-arobase")).toBeNull();
  });

  it("le message au support contient l'adresse masquée, pas l'adresse complète", () => {
    const message = supportMessage("verification", "jean.dupont@gmail.com");
    expect(message).toContain("j***t@gmail.com");
    expect(message).not.toContain("jean.dupont");
    expect(supportMessage("reset", "")).not.toContain("adresse :");
  });

  it("le délai d'attente se lit, s'écrit et tolère un stockage refusé", () => {
    writeCooldownEnd("verification:a@b.cm", Date.now() + 30_000);
    expect(secondsUntil(readCooldownEnd("verification:a@b.cm"))).toBe(30);
    expect(secondsUntil(Date.now() - 1000)).toBe(0);
    const broken = { getItem: () => { throw new Error("refusé"); }, setItem: () => { throw new Error("refusé"); } };
    expect(readCooldownEnd("x", broken)).toBe(0);
    expect(() => writeCooldownEnd("x", 1, broken)).not.toThrow();
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});

describe("bloc EmailDeliveryHelp", () => {
  const base = { email: "jean.dupont@gmail.com", kind: "verification" as const, onResend: vi.fn(), isSending: false, secondsLeft: 0 };

  it("prêt : bouton actif, raccourci Gmail, WhatsApp et vérifications ; l'adresse n'apparaît qu'en version masquée", () => {
    const { container } = render(<EmailDeliveryHelp {...base} sentAt={Date.now()} />);
    const button = screen.getByTestId("email-resend-button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain("Renvoyer l’e-mail de confirmation");
    expect(screen.getByTestId("email-webmail-link").getAttribute("href")).toContain("mail.google.com");
    expect(screen.getByTestId("email-sent-status").textContent).toContain("j***t@gmail.com");
    expect(container.textContent).not.toContain("jean.dupont");
    const whatsapp = screen.getByTestId("email-whatsapp-support").getAttribute("href") ?? "";
    expect(whatsapp).toContain("wa.me");
    expect(decodeURIComponent(whatsapp)).not.toContain("jean.dupont");
    expect(screen.getByTestId("email-checklist").textContent).toContain("dernier");
    expect(screen.getByTestId("email-checklist").textContent).toContain("Spams");
  });

  it("en attente : bouton désactivé avec le décompte, et clic sans effet", () => {
    const onResend = vi.fn();
    render(<EmailDeliveryHelp {...base} onResend={onResend} secondsLeft={42} />);
    const button = screen.getByTestId("email-resend-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Renvoyer dans 42 s");
    fireEvent.click(button);
    expect(onResend).not.toHaveBeenCalled();
    expect(screen.getByTestId("email-cooldown-note").textContent).toContain("remplace");
  });

  it("une erreur s'annonce comme alerte et n'affiche pas « envoyé »", () => {
    render(<EmailDeliveryHelp {...base} errorMessage="L’e-mail n’a pas pu partir." />);
    expect(screen.getByRole("alert").textContent).toContain("n’a pas pu partir");
    expect(screen.queryByTestId("email-sent-status")).toBeNull();
  });

  it("fournisseur inconnu : aucun bouton de messagerie inventé ; mot de passe : pas de phrase sur les liens précédents", () => {
    render(<EmailDeliveryHelp {...base} email="a@entreprise-inconnue.cm" kind="reset" />);
    expect(screen.queryByTestId("email-webmail-link")).toBeNull();
    expect(screen.getByTestId("email-checklist").textContent).not.toContain("les liens précédents");
    expect(screen.getByTestId("email-resend-button").textContent).toContain("Renvoyer le lien");
  });

  it("sans adresse : envoi impossible", () => {
    render(<EmailDeliveryHelp {...base} email="" />);
    expect((screen.getByTestId("email-resend-button") as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("page /verify-email-sent", () => {
  const open = (query: string) => window.history.pushState({}, "", `/verify-email-sent${query}`);

  it("après l'inscription : le renvoi attend 60 s (le premier e-mail vient de partir)", () => {
    open("?email=jean.dupont%40gmail.com");
    render(<VerifyEmailSent />);
    const button = screen.getByTestId("email-resend-button") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Renvoyer dans 60 s");
    elapse(61);
    expect((screen.getByTestId("email-resend-button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("premier envoi échoué (sent=0) : message honnête et bouton disponible tout de suite", () => {
    open("?email=jean.dupont%40gmail.com&sent=0");
    render(<VerifyEmailSent />);
    expect(screen.getByRole("alert").textContent).toContain("premier e-mail n’a pas pu partir");
    const button = screen.getByTestId("email-resend-button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(hoisted.resendMutate).toHaveBeenCalledWith({ email: "jean.dupont@gmail.com" });
  });

  it("succès du renvoi : statut + nouveau délai ; refus « trop de demandes » : durée du serveur affichée", () => {
    open("?email=jean.dupont%40gmail.com&sent=0");
    render(<VerifyEmailSent />);
    act(() => hoisted.resendOptions.current!.onSuccess!({ success: true }));
    expect(screen.getByTestId("email-sent-status").textContent).toContain("j***t@gmail.com");
    expect((screen.getByTestId("email-resend-button") as HTMLButtonElement).textContent).toContain("Renvoyer dans 60 s");

    elapse(61);
    act(() => hoisted.resendOptions.current!.onError!({ message: "Trop de demandes de lien. Réessayez dans 12 minutes." }));
    expect(screen.getByRole("alert").textContent).toContain("Réessayez dans 12 minutes");
  });

  it("une panne d'envoi n'est jamais présentée comme un succès et ne bloque pas le bouton", () => {
    open("?email=jean.dupont%40gmail.com&sent=0");
    render(<VerifyEmailSent />);
    act(() => hoisted.resendOptions.current!.onError!({ message: "Erreur lors de l'envoi de l'email." }));
    expect(screen.getByRole("alert").textContent).toContain("n’a pas pu partir");
    expect(screen.queryByTestId("email-sent-status")).toBeNull();
    expect((screen.getByTestId("email-resend-button") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("page /forgot-password", () => {
  const submit = (email: string) => {
    window.history.pushState({}, "", "/forgot-password");
    render(<ForgotPassword />);
    fireEvent.change(screen.getByLabelText("Adresse email"), { target: { value: email } });
    fireEvent.submit(screen.getByLabelText("Adresse email").closest("form")!);
  };

  it("envoie la demande avec l'adresse nettoyée, puis affiche le bloc d'aide avec délai", () => {
    submit("  jean.dupont@gmail.com ");
    expect(hoisted.resetMutate).toHaveBeenCalledWith({ email: "jean.dupont@gmail.com" });
    act(() => hoisted.resetOptions.current!.onSuccess!({ success: true }));
    expect(screen.getByText("Demande envoyée")).toBeTruthy();
    expect(screen.getByTestId("email-resend-button").textContent).toContain("Renvoyer dans 60 s");
    expect(screen.queryByTestId("email-checklist")!.textContent).not.toContain("les liens précédents");
  });

  it("après le délai : le renvoi relance la même demande ; un échec s'affiche en alerte", () => {
    submit("jean.dupont@gmail.com");
    act(() => hoisted.resetOptions.current!.onSuccess!({ success: true }));
    elapse(61);
    hoisted.resetMutate.mockClear();
    fireEvent.click(screen.getByTestId("email-resend-button"));
    expect(hoisted.resetMutate).toHaveBeenCalledWith({ email: "jean.dupont@gmail.com" });
    act(() => hoisted.resetOptions.current!.onError!({ message: "Le lien n’a pas pu être envoyé. Veuillez réessayer." }));
    expect(screen.getByRole("alert").textContent).toContain("n’a pas pu être envoyé");
  });

  it("« La modifier » revient au formulaire pour corriger l'adresse", () => {
    submit("jean.dupont@gmail.com");
    act(() => hoisted.resetOptions.current!.onSuccess!({ success: true }));
    fireEvent.click(screen.getByTestId("email-change-button"));
    expect(screen.getByLabelText("Adresse email")).toBeTruthy();
  });
});
