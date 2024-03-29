import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server.ts";

export async function loader({ params }: DataFunctionArgs) {
  invariant(params.trailId, "trailId is missing...");
  const trailId = params.trailId;
  const averageRating = await prisma.hike.aggregate({
    where: { trailId },
    _avg: { rating: true },
  });
  const trail = await prisma.trail.findUnique({
    where: { id: trailId },
    select: {
      id: true,
      name: true,
      description: true,
      distance: true,
      lat: true,
      long: true,
      hikes: {
        select: {
          id: true,
          imageUrl: true,
          review: true,
          rating: true,
        },
        take: 3,
      },
      sherpas: {
        select: {
          id: true,
          sherpa: {
            select: {
              userId: true,
              user: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
              bio: true,
            },
          },
        },
        take: 3,
      },
    },
  });
  if (!trail) {
    throw new Response("Trail not found", { status: 404 });
  }
  return json({ trail, averageRating: averageRating._avg?.rating ?? 0 });
}

export default function TrailRoute() {
  const data = useLoaderData<typeof loader>();
  invariant(data.trail, "trail is missing...");
  return (
    <div>
      <details>
        <summary>Trail Data</summary>
        <p>{data.averageRating}</p>
        <pre>{JSON.stringify(data.trail, null, 2)}</pre>
      </details>
      <div>
        <h1 className="">{data.trail.name}</h1>
        <p>{data.trail.description}</p>
        <span>{data.trail.distance} miles</span>
        <img src={data.trail.hikes[0].imageUrl} alt={data.trail.name} className="" />
      </div>

      <Outlet />
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return <div>Trail {params.trailId} not found</div>;
  }
  throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`);
}
