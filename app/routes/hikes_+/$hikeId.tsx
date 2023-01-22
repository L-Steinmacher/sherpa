import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";

export async function loader(params: DataFunctionArgs) {
  const { hikeId } = params.params;
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
  });

  if (!hike) {
    throw new Response("Hike not found", { status: 404 });
  }

  return json({ hike });
}

export default function HikeRoute() {
  const data = useLoaderData();
  invariant(data.hike, "hike is missing...");
  return (
    <div>
      <h1>{data.hike.name}</h1>
      <pre>{JSON.stringify(data.hike, null, 2)}</pre>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <div>
      <h1>Caught</h1>
      <p>Status: {caught.status}</p>
      <pre>{JSON.stringify(caught.data, null, 2)}</pre>
    </div>
  );
}
