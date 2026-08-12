export default function PageLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement de la page"
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-6 text-foreground"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        />
        <p className="text-sm font-medium text-muted-foreground">Chargement de la page…</p>
      </div>
    </div>
  );
}
