import { Form, Link, useLoaderData } from "@remix-run/react";
import type { DataFunctionArgs } from "@remix-run/node"
import { prisma } from "~/utils/db.server";
import { getUserId } from "~/session.server";

export async function loader({ request }: DataFunctionArgs) {
  const userId = getUserId(request);
  
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, username:true, name: true } }) : null;

  return ({ user })
};

export function Nav() {
  const data = useLoaderData<typeof loader>();
  const { user } = data;
  console.log(JSON.stringify(data, null, 2))
  return (
    <div className="px-5vw py-9 lg:py-12">
      <nav>
        <ul className="container flex items-center justify-between mx-auto text-primary max-w-8xl ">
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
                  className="px-4 py-2 text-blue-100 rounded bg-slate-600 hover:bg-blue-500 active:bg-blue-600"
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
