import { type } from "os";

type InitFunction = (send: SendFunction) => CleanupFuncion
type SendFunction = (event: string, data: string) => void
type CleanupFuncion = () => void

export function eventStream (request: Request, init: InitFunction) {
    const stream = new ReadableStream({
        start (controller) {
            const encoder = new TextEncoder();
            const send = (event: string, data: string) => {
                controller.enqueue(encoder.encode(`event: ${event}\n `));
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };
            const cleanup = init(send);

            let closed = false;
            const close = () => {
                if (closed) return;
                closed = true;
                cleanup();
                controller.close();
            }

            request.signal.addEventListener('abort', close);
            if (request.signal.aborted) {
                close();
                return;
            }
        }
    });
    // TODO: Cache-Control: no-cache not needed perhaps?
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
    });
}
