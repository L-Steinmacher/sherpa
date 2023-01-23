import type { DataFunctionArgs } from "@remix-run/node";

export async function loader({ request }: DataFunctionArgs) {
  return {};
}

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();

  return 0;
}

export default function UserEditRoute() {
  return (
    <div>
      <h1>User Edit Route</h1>
    </div>
  );
}
