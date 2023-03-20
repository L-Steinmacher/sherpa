import {  DataFunctionArgs, json } from "@remix-run/node"
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { TrailCombobox } from "./resources+/trail-combobox";


export async function loader({request}: DataFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  // TODO: validate searchParams and figure out what to do here!

  return json({ });
};

// export async function action({ request }: DataFunctionArgs) {
//   const formData = await request.formData();
//   // TODO: validate formData and figure out what to do here!
//   return json({ "search": "results"});
// };

export default function Search() {
  const data = useLoaderData<typeof loader>();
  const params = useSearchParams();

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <h1>Search Results</h1>
      <TrailCombobox name="trail" />
    </div>
  //TODO: add search results here
  );
}