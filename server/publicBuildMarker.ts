const FALLBACK_BUILD_MARKER = "3m-travel-current";

/**
 * Stable, non-sensitive identifier used only to diagnose which server build
 * produced public HTML. It never contains secrets or candidate data.
 */
export function getPublicBuildMarker() {
  const marker = process.env.PUBLIC_BUILD_MARKER?.trim();
  if (!marker) return FALLBACK_BUILD_MARKER;
  return marker.slice(0, 64).replace(/[^a-zA-Z0-9._-]/g, "-");
}
