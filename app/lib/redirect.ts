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
