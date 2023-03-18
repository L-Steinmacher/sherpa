import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';
import { useState } from 'react';
import invariant from 'tiny-invariant';
import { requireUserId } from '~/session.server';
import { chatEmitter, EVENTS } from '~/utils/chat.server';
import { prisma } from '~/utils/db.server';
import { useEventSource } from '~/utils/hooks';
import type { Message, NewMessageChange } from './$chatId.events';
import { isMessageChange } from './$chatId.events';

export async function loader({ request, params }: DataFunctionArgs) {
  invariant(params.chatId, 'chatId is missing');
  const userId = await requireUserId(request);
  const chatId = params.chatId;
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, users: { some: { id: userId } } },
    select: {
      id: true,
      users: { select: { id: true, name: true, imageUrl: true } },
      messages: { select: { id: true, senderId: true, content: true } },
    },
  });
  if (!chat) {
    throw new Response('Chat not found', { status: 404 });
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
  invariant(params.chatId, 'chatId is missing');
  const formData = await request.formData();
  const { intent, content } = Object.fromEntries(formData);
  invariant(typeof content === 'string', 'content is invalid');

  switch (intent) {
    case 'send-message': {
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
        type: 'new',
        timestamp: Date.now(),
        message: newMessage,
      };
      chatEmitter.emit(`${EVENTS.NEW_MESSAGE}:${params.chatId}`, change);
      console.dir(chatEmitter);
      return json({ success: true });
    }
    default: {
      throw new Error(`Unexpected intent: ${intent}`);
    }
  }
}

export default function ChatRoute() {
  const { chatId } = useParams();
  invariant(chatId, 'Missing chatId');

  const data = useLoaderData<typeof loader>();
  const messageFetcher = useFetcher<typeof action>();
  const [changes, setChanges] = useState<Array<NewMessageChange>>([]);

  useEventSource(`/chats/${chatId}/events`, event => {
    let change: NewMessageChange;
    try {
      change = JSON.parse(event.data);
    } catch (error) {
      console.error(`Unable to parse event data: ${event.data}`);
    }
    setChanges(changes => {
      if (isMessageChange(change)) {
        return [...changes, change];
      } else {
        console.error(`Cannot process change: ${change}`);
        return changes;
      }
    });
  });

  const relevantChanges = changes.filter(
    change => change.timestamp > data.timestamp,
  );

  const messages = [...data.chat.messages];
  for (const change of relevantChanges) {
    if (change.type === 'new') {
      messages.push(change.message);
    } else {
      // TODO: Handle other change types
      console.error('Unknown change type', { change });
    }
  }

  return (
    <div className="container">
      <h2>Chat</h2>
      <details>
        <summary>Chat data</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>
      <hr />
      <ul className="flex flex-col">
        {messages.map(message => {
          const sender = data.chat.users.find(
            user => user.id === message.senderId,
          );
          return (
            <li key={message.id} className="flex items-center">
              <img
                src={sender?.imageUrl ?? ''}
                alt={sender?.name ?? 'Unknown user'}
                className="h-8 w-8 rounded-full"
              />
              <div className="ml-2">{message.content}</div>
            </li>
          );
        })}
      </ul>
      <hr />
      <messageFetcher.Form
        method="post"
        onSubmit={event => {
          const form = event.currentTarget;
          requestAnimationFrame(() => {
            form.reset();
          });
        }}
      >
        <input
          type="text"
          name="content"
          placeholder="Type a message..."
          className="w-full"
        />
        <button name="intent" value="send-message" type="submit">
          Send
        </button>
      </messageFetcher.Form>
    </div>
  );
}
