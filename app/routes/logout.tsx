// Logout has no page. The header's "Log out" button POSTs here; a GET just goes home.
import { redirect } from "react-router";
import { logout } from "~/session.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

// Logging out must never happen on GET (a link or <img src> could trigger it).
export async function loader() {
  return redirect("/");
}
