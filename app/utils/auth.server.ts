import bcrypt from 'bcryptjs'
import { createCookieSessionStorage } from "@remix-run/node";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import invariant from "tiny-invariant";
import { verifyLogin } from "~/models/user.server.ts"


// The code in this file is borrowed from Kent C. Dodds Rocket Rental App

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

export let { getSession, commitSession, destroySession } = sessionStorage;
// you can also export the methods individually for your own usage

export const authenticator = new Authenticator<string>(sessionStorage, {
  // This is the key that will be used to store the token in the session
  sessionKey: "token",
});

authenticator.use(
  new FormStrategy(async ({ form }) => {
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

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}
