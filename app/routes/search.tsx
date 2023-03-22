import type { DataFunctionArgs} from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Form,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react';
import { useRef } from 'react';
import { prisma } from '~/utils/db.server';
import { TrailCombobox } from './resources+/trail-combobox';

export async function loader({ request }: DataFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const searchParamsIsEmpty = !searchParams.toString();
  if (searchParamsIsEmpty) {
    return json({ trails: [] });
  }
  const trailId = searchParams.get('trailId');
  // TODO: validate searchParams and figure out what to do here!

  const trails = await prisma.trail.findUnique({
    where: {
      id: trailId,
    },
    select: {
      id: true,
      name: true,
      routeType: true,
    },
  });

  return json({ trails });
}

export default function Search() {
  const data = useLoaderData<typeof loader>();
  const [ searchParams ] = useSearchParams();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const trails = data.trails
  console.log(trails)
  console.log(trails.find(t => t.id === searchParams.get('trailId')))

  return (
    <div className="container">
      <h1>Search the Trails</h1>
      <hr />
      <Form ref={formRef} action="search">
        <TrailCombobox
          name="trailId"
          defaultSelectedTrail={trails?.find(
            t => t.id === searchParams.get('trailId'),
            )}
            onChange={selectedTrail => {
              if (selectedTrail) {
                submit(formRef.current)
              }
            }}
            />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      {/* //TODO: add search results here */}
    </div>
  );
}
