import { createCookieSessionStorage } from '@remix-run/node';
import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import invariant from 'tiny-invariant';
import { verifyLogin } from '~/models/user.server';


invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set')

export let sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '_session',
		sameSite: 'lax',
		path: '/',
		httpOnly: true,
		secrets: [process.env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production',
	},
})

// you can also export the methods individually for your own usage
export let { getSession, commitSession, destroySession } = sessionStorage


export const auth = new Authenticator<string>(sessionStorage, {
    // This is the key that will be used to store the token in the session
    sessionKey: 'token',
});

auth.use(
    new FormStrategy(async ({ form }) => {
        const username  = form.get('username');
        const password = form.get('password');

        invariant(username === 'string', 'Username must be a string');
        invariant(username.length > 0, 'Username must not me empty');

        invariant(password === 'string', 'Password must be a string');
        invariant(password.length > 0, 'Password must not me empty');

        const user = await verifyLogin(username, password);
        if (!user) {
            throw new Error('Invalid username or password');
        }
        return user.id;
    }),
    FormStrategy.name,
)