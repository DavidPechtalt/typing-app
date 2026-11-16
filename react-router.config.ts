import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  // React Router 7.9+ blocks form submissions (actions) whose `Origin` header
  // does not match the server's own URL, as protection against CSRF.
  // In GitHub Codespaces the browser talks to https://<name>-5173.app.github.dev
  // while the dev server sees itself as http://localhost:5173, so every form
  // post (login, register, save result…) was rejected with "Bad Request".
  // Listing the Codespaces domain as an allowed origin lets those posts through.
  // Only hosts here are allowed; any other domain is still blocked.
  allowedActionOrigins: ["*.app.github.dev"],
} satisfies Config;
