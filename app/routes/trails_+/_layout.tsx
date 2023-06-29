import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server"

export async function loader({ request }: DataFunctionArgs) {
  // trails is the first 10 trails
  const trails = await prisma.trail.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  })
  invariant(trails, "No trails found")

  return json({ trails })
};

export default function TrailsRoute() {
  const data = useLoaderData<typeof loader>()

  return (
    <div>
      <h1>Trails</h1>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}