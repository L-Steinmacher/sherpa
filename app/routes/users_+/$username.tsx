import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Outlet,
  useCatch,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { Key } from "react";
import invariant from "tiny-invariant";
import { getUserId } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { prisma } from "~/utils/db.server";

export async function loader({ params, request }: DataFunctionArgs) {
  const isLoggedIn = await getUserId(request);
  invariant(params.username, "username is missing");
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      name: true,
      username: true,
      imageUrl: true,
      hiker: {
        select: {
          bio: true,
          adventures: {
            select: {
              id: true,
              trail: {
                select: {
                  id: true,
                },
              },
            },
          },
          hikes: {
            select: {
              id: true,
              imageUrl: true,
              date: true,
              trail: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      chats: isLoggedIn ? {
        where : {
          users: {
            some: {
              id: { equals: isLoggedIn },
            },
          },
        },
        select: {
          id: true,
          users: {
            select: {
              id: true,
              name: true,
              username: true,
              imageUrl: true,
            },
          },
        },
      }
      : false,
      sherpa: {
        select: {
          bio: true,
          trails: {
            select: {
              id: true,
              trail: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          adventures: {
            select: {
              id: true,
              trail: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  return json({ user });
}

export default function UserRoute() {
  const data = useLoaderData<typeof loader>();
  const user = data.user;
  const loggedInUser = useOptionalUser();
  const isOwnProfile = loggedInUser?.id === user.id;
  invariant(data.user, "user is missing");

  return (
    <div>
      <details>
        <summary>Loader Data</summary>

        <h1>{user.name}</h1>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </details>
      <Outlet />
      <div className=" ">
        <h2>{user.name}</h2>
        {
          user.imageUrl && user.name && <img src={user.imageUrl} alt={user.name} />
        }
        {isOwnProfile && (
          <>
          <div className="container flex m-auto ">
            <Link to="/user/edit">Edit Profile</Link>
            <Link to="/adventures">My Adventures</Link>
            <Link to="/hikes">My Hikes</Link>

          </div>
          <hr/>
            {data.user.chats && (
              <div className="container flex m-auto ">
                {data.user.chats.map((chat: any) => {
                  const otherUser = chat.users.find((u: any) => u.id !== loggedInUser?.id);
                  return (
                    <Link to={`/chats/${chat.id}`} key={chat.id}>
                      {otherUser?.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
        {!isOwnProfile && (
          <div className="container flex m-auto ">
            <Link to="/adventures/new">Go on an Adventure</Link>
            <Link to="/chat">Chat</Link>
            </div>
            )}
        {user.hiker && (
          <div className="container flex m-auto ">
            <h3>Hiker</h3>
            <p>{user.hiker.bio}</p>
            <h4>Adventures</h4>
            <ul>
              {user.hiker.adventures.map((adventure: any) => (
                <li key={adventure.id}>
                  <Link to={`/trails/${adventure.trail.id}`}>
                    {adventure.trail.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4>Hikes</h4>
            <ul>
              {user.hiker.hikes.map((hike: any) => (
                <li key={hike.id}>
                  <Link to={`/trails/${hike.trail.id}`}>
                    {hike.trail.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {user.sherpa && (
          <div className="container flex m-auto ">
            <h3>Sherpa</h3>
            <p>{user.sherpa.bio}</p>
            <h4>Trails</h4>
            <ul>

              {user.sherpa.trails.map((trail: any) => (
                <li key={trail.id}>
                  <Link to={`/trails/${trail.trail.id}`}>
                    {trail.trail.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h4>Adventures</h4>
            <ul>
              {user.sherpa.adventures.map((adventure: any) => (
                <li key={adventure.id}>
                  <Link to={`/trails/${adventure.trail.id}`}>
                    {adventure.trail.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}


      </div>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return <div>User {params.username} not found</div>;
  }
  throw new Error(`Unexpected error: ${caught.status} ${caught.statusText}`);
}