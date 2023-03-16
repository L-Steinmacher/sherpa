import type { DataFunctionArgs } from "@remix-run/node"


export async function action({request, params}: DataFunctionArgs) {
    return new Response("Hello world!")
}

export default function NewHike() {
    return (
        <div>
        <h2>New Hike</h2>
        </div>
    )
}

