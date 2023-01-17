import { DataFunctionArgs, json } from "@remix-run/node";
import { Outlet, useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";


export async function loader({ params }: DataFunctionArgs) {
    invariant(params.trailId, "trailId is missing...")
    const trailId = params.trailId;
    const trail = await prisma.trail.findUnique({
        where: { id: trailId },
    })
    if (!trail) {
        throw new Response("Trail not found", { status: 404 })
    }
    return json({ trail })
}

export default function TrailRoute() {
    const data = useLoaderData()
    return (
        <div>
            <h1>{data.trail.name}</h1>
            <pre>{JSON.stringify(data.trail, null, 2)}</pre>
            <Outlet />
        </div>
    )
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

    if (caught.status === 404) {
        return <div>Trail {params.trailId} not found</div>
    }
    throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`)
}