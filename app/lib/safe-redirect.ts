// Only allow redirects to paths on this site. Without this check,
// /login?redirectTo=https://evil.example could send users to another website.
export function safeRedirect(
  to: string | null | undefined,
  defaultPath = "/",
): string {
  if (!to || !to.startsWith("/") || to.startsWith("//") || to.includes("\\")) {
    return defaultPath;
  }

  return to;
}
