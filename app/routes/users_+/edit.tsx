import type { DataFunctionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { authenticator } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    const requestUrl = new URL(request.url);
    const loginParams = new URLSearchParams([
      ["redirectTo", `${requestUrl.pathname}${requestUrl.search}`],
    ]);
    const redirectTo = `/login?${loginParams}`;
    await authenticator.logout(request, { redirectTo });
    return redirect(redirectTo);
  }
  return json({ user });
}

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();

  return 0;
}

export default function UserEditRoute() {
  return (
    <div>
      <h1>User Edit Route</h1>
    </div>
  );
}
