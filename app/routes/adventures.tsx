import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const adventures = await prisma.adventure.findMany({
    where: {
      OR: [{ hikerId: userId }, { sherpaId: userId }],
    },
    select: {
      id: true,
    },
  });
  if (!adventures) throw new Response("Adventures not found", { status: 404 });

  return json({ adventures });
}

export default function AdventureRoute() {
  const data = useLoaderData<typeof loader>();
  invariant(data, "data is missing")
  return (
    <div>
      <h1>Adventure Route</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <div className="flex gap-12">
        <ul>
          {data.adventures.map(adventure => (
            <li key={adventure.id}>
              <Link to={`/adventure/${adventure.id}`}>{adventure.id}</Link>
            </li>
          ))}
        </ul>
      </div>
      <Outlet />
    </div>
  );
}

