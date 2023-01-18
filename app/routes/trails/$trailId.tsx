import { DataFunctionArgs, json } from "@remix-run/node";
import { Outlet, useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";


export async function loader({ params }: DataFunctionArgs) {
    invariant(params.trailId, "trailId is missing...")
    const trailId = params.trailId;
    const averageRating = await prisma.hike.aggregate({
        where: { trailId },
        _avg: { rating: true },
    })
    const trail = await prisma.trail.findUnique({
        where: { id: trailId },
        select: {
            id: true,
            name: true,
            description: true,
            length: true,
            latitude: true,
            longitude: true,
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
    })
    if (!trail) {
        throw new Response("Trail not found", { status: 404 })
    }
    return json({ trail, averageRating: averageRating._avg?.rating ?? 0 })
}

export default function TrailRoute() {
    const data = useLoaderData()
    return (
        <div>
            <h1>{data.trail.name}</h1>
            <p>{data.averageRating}</p>
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