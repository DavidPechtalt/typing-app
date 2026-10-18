import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("practice", "routes/practice.tsx"),
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;
