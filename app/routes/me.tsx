import type { DataFunctionArgs} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { prisma } from "~/utils/db.server.ts";
import { authenticator} from "~/utils/auth.server.ts";
import { requireUserId } from "~/session.server.ts";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const requestUrl = new URL(request.url);
    const loginParams = new URLSearchParams([
      ["redirectTo", `${requestUrl.pathname}${requestUrl.search}`],
    ]);
    const redirectTo = `/login?${loginParams}`;
    await authenticator.logout(request, { redirectTo });
    return redirect(redirectTo);
  }
  return redirect(`/users/${user.username}`);
}