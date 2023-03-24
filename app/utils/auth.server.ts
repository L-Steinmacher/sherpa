import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import { verifyLogin } from "~/models/user.server"
import { prisma } from "./db.server";

// The code in this file is borrowed from Kent C. Dodds Rocket Rental App

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage;

export const authenticator = new Authenticator<string>(sessionStorage, {
  // This is the key that will be used to store the token in the session
  sessionKey: "token",
});

authenticator.use(
  new FormStrategy(async ({ form }) => {
    console.log("FormStrategy");
    const email = form.get("email");
    const password = form.get("password");

    invariant(typeof email === "string", "email must be a string");
    invariant(email.length > 0, "email must not me empty");

    invariant(typeof password === "string", "Password must be a string");
    invariant(password.length > 0, "Password must not me empty");

    const user = await verifyLogin(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    return user.id;
  }),
  FormStrategy.name
);

export async function requireUserId(request: Request) {
	const requestUrl = new URL(request.url)
	const loginParams = new URLSearchParams([
		['redirectTo', `${requestUrl.pathname}${requestUrl.search}`],
	])
	const failureRedirect = `/login?${loginParams}`
	const userId = await authenticator.isAuthenticated(request, {
		failureRedirect,
	})
	return userId
}
