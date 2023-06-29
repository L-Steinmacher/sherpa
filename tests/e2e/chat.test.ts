// import { faker } from '@faker-js/faker'
import { type Page, test as base } from '@playwright/test'
import { parse } from 'cookie'
import { createUser } from 'prisma/seed-utils'
import { authenticator, commitSession, getPasswordHash, getSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const test = base.extend<{
    login: (user?: { id: string }) => ReturnType<typeof LoginPage>
}>({
    login: [
        async ({ page, baseURL }, use) => {
            use(user => LoginPage({ page, baseURL, user }))
        },
        { auto: true },
    ],
})
const { expect } = test

async function NewUser(){
    const userData = await createUser()
    const user = await prisma.user.create({
        data: {
            ...userData,
            password: {
                create: {
                    hash: await getPasswordHash(userData.username),
                },
            },
        },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
        },
    })
    userCleanup.add(user.id)
    return user
}

const userCleanup = new Set<string>();

async function LoginPage({
    page,
    baseURL,
    user: givenUser,
}: {
    page: Page
    baseURL: string | undefined
    user?: { id: string }
}) {
    const user = givenUser ? await prisma.user.findUniqueOrThrow({
        where: { id: givenUser.id },
        select: { id: true, name: true, username: true, email: true },
    }) : await NewUser()
    const session = await getSession()
    session.set(authenticator.sessionKey, user.id)

    const cookieSession = await commitSession(session)
    const { _session } = parse(cookieSession)

    const cookie = {
        name: '_session',
        value: _session,
        url: baseURL,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
    page.context().addCookies([
        cookie,
    ])
    return user
}

test('Check LoginPage function', async ({ page }) => {
    // Use a valid URL for your test
    const baseURL = 'http://localhost:3000/';
    console.log('baseURL in test:', baseURL);
    // Call the LoginPage function and log the result
    const user = await LoginPage({ page, baseURL: baseURL });
    console.log(user);

    expect(user).toBeTruthy();
});

test('multi user chat', async ({ browser, page: hikerPage, baseURL }) => {
    const sherpaPage = await (await browser.newContext()).newPage()

    const hiker = await LoginPage({ page: hikerPage, baseURL })
    const sherpa = await LoginPage({ page: sherpaPage, baseURL })
    const regexPattern = /\/chats\/[a-zA-Z0-9]+/;

    await prisma.sherpa.create({
        data: {
            userId: sherpa.id,
        },
    })
    prisma.hiker.create({
        data: {
            userId: hiker.id,
        },
    })

    await hikerPage.goto(`users/${ hiker.username }`);
    await sherpaPage.goto(`users/${ sherpa.username }`);

    await hikerPage.goto(`users/${ sherpa.username }`);
    await hikerPage.getByRole('button', { name: /chat/i }).click();

    await expect(hikerPage).toHaveURL(new RegExp(`^${regexPattern.source}$`));

    await hikerPage.getByPlaceholder(/type a message.../).click();

    // const hikerMessage = faker.lorem.sentence();
    // await page.getByPlaceholder('Type a message...').fill(hikerMessage);
    // await page.getByRole('button', { name: 'Send' }).click();

})


test.afterEach(async () => {
    for (const id of userCleanup) {
        await prisma.user.delete({ where: { id } })
    }
    userCleanup.clear()
})
