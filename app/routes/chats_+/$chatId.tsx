import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { useOptionalUser } from "~/utils";
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
  });
  if (!chat) {
    throw new Response("Chat not found", { status: 404 });
  }
  return json({chat, timestamp: Date.now()});
}


export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();

  return json({ formData });
};

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();
  invariant(data.chat, "chat is missing")
  const isOwnProfile = useOptionalUser();

  return (
    <div>
      <details>
        <summary>Chat Route</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>

       {/* an h1 with the chat title (the username of the user you're chatting with) */}
      <h1>{`Chat with ${data.chat.users.filter(u => u.username !== isOwnProfile?.username)[0].name}`}</h1>


    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return <div>Chat {params.chatId} not found</div>;
  }
  throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`);
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
