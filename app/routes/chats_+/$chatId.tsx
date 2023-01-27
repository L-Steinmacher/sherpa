import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useCatch, useLoaderData, useParams } from "@remix-run/react";
import invariant from "tiny-invariant";
import { requireUserId } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { chatEmitter, EVENTS } from "~/utils/chat.server";
import { prisma } from "~/utils/db.server";

type Message = {
  id: String;
  senderId: String;
  content: string;
};

type NewMessageChange = {
  type: "new";
  timestamp: number;
  message: Message;
};


export async function loader({ params }: DataFunctionArgs) {
  invariant(params.chatId, "chatId is missing");

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
  return json({ chat, timestamp: Date.now() });
}

export async function action({ request, params }: DataFunctionArgs) {
  const formData = await request.formData();
  const userId = await requireUserId(request);
  invariant(params.chatId, "chatId is missing");
  const { intent, content } = Object.fromEntries(formData);
  invariant(typeof content === "string", "content is invalid");

  switch (intent) {
    case "send-message": {
      const newMessage = await prisma.message.create({
        data: {
          senderId: userId,
          chatId: params.chatId,
          content,
        },
        select: {
          id: true,
          senderId: true,
          content: true,
        },
      });

      const change: NewMessageChange = {
        type: "new",
        timestamp: Date.now(),
        message: newMessage,
      };
      chatEmitter.emit(`${EVENTS.NEW_MESSAGE}:${params.chatId}`, change);
      return json({ success: true });
    }
    default: {
      throw new Error(`Unexpected intent: ${intent}`);
    }
  }
}

export default function ChatRoute() {
  const data = useLoaderData<typeof loader>();
  invariant(data.chat, "chat is missing");
  const isOwnProfile = useOptionalUser();
  const { chatId } = useParams();

  // TODO: Finish writing the event stream

  return (
    <div>
      <div>
        <details>
          <summary>Chat Route</summary>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>

      <hr />
      <h1>{`Chat with ${
        data.chat.users.filter((u) => u.username !== isOwnProfile?.username)[0]
          .name
      }`}</h1>
      <div>
        <ul>
          {data.chat.messages.map((message) => {
            const sender = data.chat.users.find(
              (user) => user.id === message.senderId
            );
            invariant(sender, "sender is missing");
            return (
              <li key={message.id} className="flex items-center">
                <img
                  src={sender?.imageUrl ?? ""}
                  alt={sender?.name ?? "unknown user"}
                  className="h-10 rounded-full "
                />
                <strong>{sender?.name}</strong>: {message.content}
              </li>
            );
          })}
        </ul>
      </div>
      <hr />
      {/* TODO: Finish writing the submit and event stream */}
      <Form method="post">
        <label htmlFor="content">Message</label>
        <input type="text" name="content" id="content" />
        <button type="submit">Send</button>
      </Form>
      <div></div>
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
