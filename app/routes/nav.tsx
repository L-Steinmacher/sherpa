import { Form, Link, useLoaderData } from "@remix-run/react";
import { useOptionalUser } from "~/utils";
import type { DataFunctionArgs } from "@remix-run/node"
import { authenticator } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import invariant from "tiny-invariant";
import { getEnv } from "~/utils/env.server";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await authenticator.isAuthenticated(request);

  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (userId && !user) {
    console.info("Something Fucky happened");
    await authenticator.logout(request, { redirectTo: "/" });
  }

  return ({ user, ENV: getEnv()})
};

export function Nav() {
  const data = useLoaderData<typeof loader>();
  const { user } = data;

  return (
    <div className="px-5vw py-9 lg:py-12">
      <nav>
        <ul className="text-primary max-w-8xl  container mx-auto flex items-center justify-between ">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/trails">Trails</Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/hikes">Hikes</Link>
              </li>
              <li>
                <Link to="me">{user.name}</Link>
              </li>
              <Form action="/logout" method="post">
                <button
                  type="submit"
                  className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                >
                  Logout
                </button>
              </Form>
            </>
          ) : (
            <li>
              <Link to="/login">Log In</Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
