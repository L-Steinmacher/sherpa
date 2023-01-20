import type { DataFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { prisma } from "~/utils/db.server";

export async function loader({ params }: DataFunctionArgs) {
  invariant(params.id, "id is not defined");

  const trail = await prisma.trail.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (trail) return redirect(`/trails/${trail.id}`);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { username: true },
  });
  if (user) return redirect(`/users/${user.username}`);

  const adventure = await prisma.adventure.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (adventure) return redirect(`/adventures/${adventure.id}`);

  const hike = await prisma.hike.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (hike) return redirect(`/hikes/${hike.id}`);

  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (chat) return redirect(`/chats/${chat.id}`);

  return redirect("/");
}
