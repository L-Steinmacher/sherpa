import type { DataFunctionArgs } from "@remix-run/node"
import { Form, Link } from "@remix-run/react"
import { useOptionalUser } from "~/utils";

export function Nav() {
    const user =  useOptionalUser();
    if (user) console.log(user)
    else console.log("no user")
    return (
        <div className="px-5vw py-9 lg:py-12" >
            <nav>
                <ul className="flex text-primary mx-auto max-w-8xl items-center justify-between container ">
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/trails">Trails</Link>
                    </li>
                        {
                            user ? (
                                <>
                                <li>
                                    <Link to="/hikes">Hikes</Link>
                                </li>
                                <li>
                                    <Link to="me">{user.name}</Link>
                                </li>
                                <Form action="/logout" method="post">
                                    <button
                                        type="submit"
                                        className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
                                    >
                                        Logout
                                    </button>
                                </Form>
                                </>
                            ):
                            <li>
                                <Link to="/login">Log In</Link>
                            </li>
                        }
                </ul>
            </nav>
        </div>
    )
}