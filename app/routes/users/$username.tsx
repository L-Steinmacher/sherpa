import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";

export async function loader({ params }: DataFunctionArgs) {
    invariant(params.username, "username is missing")
    const user = await prisma.user.findUnique({
        where: { username: params.username },
        select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
            hiker: {
                select: {
                    bio: true,
                    adventures: {
                        select: {
                            id: true,
                            trail: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                    hikes: {
                        select: {
                            id: true,
                            imageUrl: true,
                            date: true,
                            trail: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
            sherpa: {
                select: {
                    bio: true,
                    trails: {
                        select: {
                            id: true,
                            trail: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    adventures: {
                        select: {
                            id: true,
                            trail: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })


    if (!user) {
        throw new Response("User not found", { status: 404 })
    }
  return json({ user })
};

export default function UserRoute() {
    const data = useLoaderData()
    return (
        <div>
            <h1>{data.user.name}</h1>
            <pre>{JSON.stringify(data.user, null, 2)}</pre>
            <Outlet />
        </div>
    )
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

    if (caught.status === 404) {
        return <div>User {params.username} not found</div>
    }
    throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`)
}