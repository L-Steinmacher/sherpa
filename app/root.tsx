import type {
  DataFunctionArgs,
  LinksFunction,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";
import { Nav } from "./routes/nav";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Sherpa" },
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
  ];
};

export async function loader({ request }: DataFunctionArgs) {
  return json({
    user: await getUser(request),
  });
}

export default function App() {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <header>
          <Nav />
        </header>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        {/* <NoHydrate className="fixed inset-0 -z-10"  /> */}
      </body>
    </html>
  );
}
