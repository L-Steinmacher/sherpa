import type { DataFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Form,
  useCatch,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react';
import { useRef } from 'react';
import { prisma } from '~/utils/db.server';
import { TrailCombobox } from './resources+/trail-combobox';

export async function loader({ request }: DataFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  console.log("search loader ",request.url)
  const searchParamsIsEmpty = !searchParams.toString();
  const noResults = { trails: [] } ;
  if (searchParamsIsEmpty ) {
    return json(noResults);
  }
  const trailId = searchParams.get('trailId') || undefined;

  // TODO: validate searchParams and figure out what to do here!

  const trail = await prisma.trail.findUnique({
    where: {
      id: trailId,
    },
    select: {
      id: true,
      name: true,
      routeType: true,
      distance: true,
      lat: true,
      long: true,
    },
  })

  return json({ trails: [trail] });
}

export default function Search() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const trails  = data.trails;
  const geo = navigator.geolocation.getCurrentPosition;
  console.log("search func", trails)
  console.log("navigator", geo)


  return (
    <div className="container">
      <h1>Search the Trails</h1>
      <hr />

      <Form ref={formRef} action="search">
        <TrailCombobox
          name="trailId"
          defaultSelectedTrail={trails.find(trail => trail?.id === searchParams.get('trailId'))}
          onChange={selectedTrail => {
            if (selectedTrail) {
              submit(formRef.current);
            }
          }}
        />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {/* //TODO: add search results here */}
    </div>
  );
}
export function CatchBoundary() {
  const caught = useCatch();
  return (
    <div>
      <h1>Caught</h1>
      <p>Status: {caught.status}</p>
      <pre>
        <code>{JSON.stringify(caught.data, null, 2)}</code>
      </pre>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
      <p>The stack trace is:</p>
      <pre>{error.stack}</pre>
    </div>
  );
}

