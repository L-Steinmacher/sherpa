import { DataFunctionArgs, redirect } from "@remix-run/node"
import { prisma } from "~/utils/db.server"
import { authenticator } from "~/utils/auth.server"

export async function loader({ request }: DataFunctionArgs) {
    const userId = await authenticator.isAuthenticated(request, { failureRedirect: "/login" })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        const redirectTo = `/login?redirectTo=${request.url}`
        await authenticator.logout(request, { redirectTo })
        return redirect( redirectTo )
    }
    return redirect(`/users/${user.username}`)
};
