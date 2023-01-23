import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
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
  if (!adventures) throw new Response("Adventures not found for this user", { status: 404 });

  return json({ adventures });
}

export default function AdventuresRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Adventure Route</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <div className="flex gap-12 ">
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

