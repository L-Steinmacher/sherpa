import type { LoaderArgs } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { EVENTS, chatEmitter } from "~/utils/chat.server";
import { prisma } from "~/utils/db.server";
import { eventStream } from "~/utils/event-stream.server";

export type Message = {
  id: String;
  senderId: String;
  content: string;
};

export type NewMessageChange = {
  type: "new";
  timestamp: number;
  message: Message;
};

export function isMessage(message: any): message is Message {
  return (
    message &&
    typeof message === "object" &&
    typeof message.id === "string" &&
    typeof message.senderId === "string" &&
    typeof message.message === "string"
  );
}

export function isMessageChange(change: any): change is NewMessageChange {
  return (
    change &&
    typeof change === "object" &&
    change.type === "new" &&
    typeof change.timestamp === "number" &&
    isMessage(change.message)
  );
}

export async function loader({ request, params }: LoaderArgs) {
  const userId = await requireUserId(request);
  const hasPermission = await prisma.chat.findFirst({
    where: {
      id: params.chatId,
      users: {
        some: {
          id: userId,
        },
      },
    },
    select: {
      id: true,
    },
  });
  if (!hasPermission) {
    throw new Response(
      "You don't have permission to view this chat... so go away...",
      { status: 403 }
    );
  }

  return eventStream(request, send => {
    function handleMessage(message: unknown) {
      if (isMessageChange(message)) {
        send("message", JSON.stringify(message));
      }
    }
    const eventType = `${EVENTS.NEW_MESSAGE}:${params.chatId}`;
    chatEmitter.addListener(eventType, handleMessage);
    return () => {
      chatEmitter.removeListener(eventType, handleMessage);
    };
  });
}
