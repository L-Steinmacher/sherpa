import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useCatch,
  useFetcher,
  useLoaderData,
  useParams,
  useRevalidator,
} from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { requireUserId } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { chatEmitter, EVENTS } from "~/utils/chat.server";
import { prisma } from "~/utils/db.server";
import { useEventSource} from "~/utils/hooks";
import type { Message, NewMessageChange } from "./$chatId.events";
import { isMessageChange } from "./$chatId.events";

export async function loader({ params }: DataFunctionArgs) {
  invariant(params.chatId, "chatId is missing");

  const chatId = params.chatId;
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: {
      id: true,
      users: true,
      messages: {select: {id: true, senderId: true, content: true}},
    },
  });
  if (!chat) {
    throw new Response("Chat not found", { status: 404 });
  }

  // type assertion-ish (is there a better way to do this?)
  // my goal is to ensure that the type we get from prisma for the messages
  // is the same as the one we get from the emitted changes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let messages: Array<Message> = chat.messages;


  return json({ chat, timestamp: Date.now() });
}

export async function action({ request, params }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  invariant(params.chatId, "chatId is missing");
  const formData = await request.formData();
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
      console.log("*****************************emitted", change);
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
  invariant(chatId, "chatId is missing");

  const messageFetcher = useFetcher<typeof action>();
  const [changes, setChanges] = useState<Array<NewMessageChange>>([]);

  useEventSource(`/chats/${chatId}/events`, event => {
    let change: unknown;
    try {
      change = JSON.parse(event.data);
      console.log("*****************************CHANGE!!??!?!?", change)
    } catch (error) {
      console.error(`Unable to parse event data: ${event.data}`);
    }
    setChanges((changes) => {
      if (isMessageChange(change)) {
        return [...changes, change];
      } else {
        console.error(`Cannot process change: ${change}`);
        return changes;
      }
    });
  });

  const relevantChanges = changes.filter(
    (change) => change.timestamp > data.timestamp
  );
  // TODO: this is not working Fix Event stream

  const messages = [...data.chat.messages];

  for (const change of relevantChanges) {
    console.log("*****************************change", change)
    if (change.type === "new") {
      messages.push(change.message);
    } else {
      console.error("Unexpected change", change);
    }
  }

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
          {messages.map((message) => {
            const sender = data.chat.users.find(
              (user) => user.id === message.senderId
            );
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

      <messageFetcher.Form
        method="post"
        onSubmit={(event) => {
          const formData = event.currentTarget;
          requestAnimationFrame(() => {
            formData.reset();
          });
        }}
      >
        <label htmlFor="content">Message</label>
        <input
          type="text"
          name="content"
          id="content"
          className="w-full items-center rounded-md border border-gray-300"
          placeholder="Type here..."
        />
        {/* a button with style */}
        <button
          name="intent"
          value="send-message"
          type="submit"
          className=" hover:bg-grey-500 text-grey-700 hover:text-grey-900 border-grey-500 rounded border bg-transparent py-2 px-4 font-semibold hover:border-transparent"
        >
          Send
        </button>
      </messageFetcher.Form>
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
