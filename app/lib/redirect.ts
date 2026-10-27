// Validates the redirectTo query parameter so login can never redirect off-site (open redirect).
export const DEFAULT_REDIRECT = "/practice";

export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof to !== "string" || to === "") return fallback;
  if (!to.startsWith("/") || to.startsWith("//") || to.startsWith("/\\")) {
    return fallback;
  }
  return to;
}

// When React Router navigates inside the app, it fetches a page's data from
// "<page>.data" (and "/_root.data" for the home page). If a guard redirects
// that request to login, redirectTo must name the page, not the data URL,
// or after login the user lands on raw data instead of the page.
export function pagePathFromRequestPath(pathname: string): string {
  // The home page's data URL has its own special name.
  if (pathname === "/_root.data") return "/";
  // Every other page: drop the ".data" ending; normal page paths are unchanged.
  return pathname.replace(/\.data$/, "");
}
