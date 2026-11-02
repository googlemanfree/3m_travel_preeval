import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      duration={4200}
      visibleToasts={4}
      className="toaster group"
      toastOptions={{
        duration: 4200,
        classNames: {
          toast: "w-[calc(100vw-2rem)] max-w-md shadow-xl backdrop-blur-md sm:w-auto",
          title: "text-sm font-bold leading-5",
          description: "text-xs leading-5",
          success: "border-emerald-500",
          error: "border-rose-500",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
