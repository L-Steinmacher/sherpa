import type { DataFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/session.server.ts";
import { EVENTS, chatEmitter } from "~/utils/chat.server.ts";
import { prisma } from "~/utils/db.server.ts";
import { eventStream } from "~/utils/event-stream.server.ts";

export type Message = {
  id: string;
  senderId: string;
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
    typeof message.content === "string"  // changed this line
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

export async function loader({ request, params }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const hasAccess = await prisma.chat.findFirst({
    where: {
      id: params.chatId,
      users: { some: { id: userId } },
    },
    select: { id: true },
  });
  if (!hasAccess) {
    return new Response("Access denied", { status: 403 });
  }

  return eventStream(request, (send) => {
    function handler(message: unknown) {
      if (isMessageChange(message)) {
        send("message", JSON.stringify(message));
      }
    }
    const eventType = `${EVENTS.NEW_MESSAGE}:${params.chatId}`;
    chatEmitter.addListener(eventType, handler);
    return () => {
      chatEmitter.removeListener(eventType, handler);
    };
  });
}

