import { type DataFunctionArgs, json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Link, useLoaderData } from "@remix-run/react/dist/components";
import { requireUserId } from "~/session.server";
import { prisma } from "~/utils/db.server";

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const hikes = await prisma.hike.findMany({
    where: {
      hikerId: userId,
    },
    select: {
      id: true,
    },
  });
  if (!hikes)
    throw new Response("Hikes not found for this user", { status: 404 });
  return json({ hikes });
}

export default function HikesRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Hikes Route</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <div className="flex gap-12 ">
        <ul>
          {data.hikes.map((hike) => (
            <li key={hike.id}>
              <Link to={`/hike/${hike.id}`}>{hike.id}</Link>
            </li>
          ))}
        </ul>
      </div>
      <Outlet />
    </div>
  );
}
