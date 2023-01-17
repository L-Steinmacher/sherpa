
import { DataFunctionArgs, json, LoaderArgs } from "@remix-run/node"
import { useCatch, useLoaderData, useParams } from "@remix-run/react";
import { prisma } from "~/utils/db.server";
export async function loader({ params }: DataFunctionArgs) {
  const chatId = params.chatId;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      id: true,
      users: true,
      messages: true,
    },
  })
  return json(chat)
};

export default function ChatRoute() {
  const data = useLoaderData()
  return (
    <div>
      <h1>Chat Route</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
};

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

    if (caught.status === 404) {
        return <div>Chat {params.chatId} not found</div>
    }
    throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`)
}
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
      <p>The stack trace is:</p>
      <pre>{error.stack}</pre>
    </div>
  );
}