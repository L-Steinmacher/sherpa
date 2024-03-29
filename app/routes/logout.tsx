import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { logout } from "~/session.server.ts";

export async function action({ request }: ActionArgs) {
  console.log("logout action", request);
  return logout(request);
}

export async function loader() {
  return redirect("/");
}
