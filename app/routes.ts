import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("practice", "routes/practice.tsx"),
  route("texts", "routes/texts.tsx"),
  route("texts/new", "routes/texts.new.tsx"),
  route("texts/wikipedia", "routes/texts.wikipedia.tsx"),
  route("history", "routes/history.tsx"),
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("locale", "routes/locale.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/users", "routes/admin.users.tsx"),
  route("admin/texts", "routes/admin.texts.tsx"),
  route("admin/results", "routes/admin.results.tsx"),
] satisfies RouteConfig;
