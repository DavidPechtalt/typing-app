import { redirect } from "react-router";
import { logout } from "~/session.server";
import type { Route } from "./+types/logout";

// Logging out changes data, so it is a POST (action), not a link anyone could trigger.
export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

export async function loader() {
  return redirect("/");
}
