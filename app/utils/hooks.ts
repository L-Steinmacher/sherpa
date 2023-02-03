import { useEffect, useRef } from "react";


export function useEventSource(
    href: string,
    onMessage: (this: EventSource, event: EventSourceEventMap['message']) => void
) {
    const latestOnMessageRef = useLatestRef(onMessage);
    useEffect(() => {
        const eventSource = new EventSource(href);
        eventSource.addEventListener('message', latestOnMessageRef.current);
        return () => eventSource.close();
    }, [href, latestOnMessageRef]);
}

function useLatestRef<ThingType>(thing: ThingType) {
    const latestRef = useRef(thing)
    useEffect(() => {
        latestRef.current = thing
    })
    return latestRef
}
