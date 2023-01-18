import { Link } from "@remix-run/react";
import { useOptionalUser } from "~/utils";


export default function Index() {
  const user = useOptionalUser();
  return (
    <main >
      <nav >
        <ul>
          <li>
            <Link to="/trails">Trails</Link>
          </li>
          <li>
            <Link to="/adventures">Adventures</Link>
          </li>
          <li>
          {
            user ? (

                <Link to="me">{user.name}</Link>

            ):
              <Link to="/login">Log In</Link>
            }
            </li>
        </ul>
      </nav>
    </main>
  );
}
