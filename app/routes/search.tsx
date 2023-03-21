import { DataFunctionArgs, json } from '@remix-run/node';
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
  // TODO: validate searchParams and figure out what to do here!

  const trails = await prisma.trail.findMany({
    where: {
      name: {
        contains: searchParams.get('name') ?? '',
      },
    },
    take: 10,
    select: {
      id: true,
      name: true,
    },
  });
  return json({ trails });
}

export default function Search() {
  const data = useLoaderData<typeof loader>();
  const searchParams = useSearchParams();
  const submit = useSubmit();
  const formRef = useRef<HTMLFormElement>(null);
  const trails = data.trails


  // TODO fix defaultSelectedTrails
  return (
    <div className="container">
      <h1>Search Results</h1>
      <hr />
      <Form ref={formRef} action="search">
        <TrailCombobox
          name="trailId"
          defaultSelectedTrails={trails.find(
            t => t.name === searchParams.get('name'),
          )}
          onChange={selectedTrail => {
            if (selectedTrail) {
              submit(formRef.current)
            }
          }}
        />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
    //TODO: add search results here
  );
}
