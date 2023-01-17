import { DataFunctionArgs, json } from "@remix-run/node"
import { useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";

export async function loader({params}: DataFunctionArgs) {
  invariant(params.adventureId, "adventureId is missing...")
  const adventureId = params.adventureId;
  const adventure = await prisma.adventure.findUnique({
    where: { id: adventureId },
    select: {
      id: true,
      hiker: {
        select: { user: { select: { id: true, name: true, imageUrl:true } } },
      },
      trail: {
        select: { id: true, name: true, length: true },
      },
      startDate: true,
      endDate: true,
      sherpaReview: true,
      hikerReview: true,
      hike: true
    },
  })
  if (!adventure) {
    throw new Response("Adventure not found", { status: 404 })
  }
  return json(adventure)
};

export default function AdventureRoute() {
  const data = useLoaderData()
  return (
    <div>
      <h1>Adventure Route</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
};

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

    if (caught.status === 404) {
        return <div>Adventure {params.adventureId} not found</div>
    }
    throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`)
}