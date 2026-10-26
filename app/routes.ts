import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("practice/:textId?", "routes/practice.tsx"),
  route("texts", "routes/texts.tsx"),
  route("texts/new", "routes/texts.new.tsx"),
  route("history", "routes/history.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
] satisfies RouteConfig;
