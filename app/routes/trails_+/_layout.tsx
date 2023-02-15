import { LoaderArgs, json } from "@remix-run/node"
import { useLoaderData } from "react-router"
import { prisma } from "~/utils/db.server"

export async function loader({ request }: LoaderArgs) {
  // trails is the first 10 trails
  const trails = await prisma.trail.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  })

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