import type { DataFunctionArgs, SerializeFrom } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { useCombobox } from "downshift";
import { useId, useState } from "react";
import clsx from "clsx";
import { useSpinDelay } from "spin-delay";
import invariant from "tiny-invariant";
import { getUserById } from "~/models/user.server";
import { logout, requireUserId } from "~/session.server";
import { prisma } from "~/utils/db.server";
import { Spinner } from "~/components/spinner";


const requireUser = async (request: Request) => {
  const userId = await requireUserId(request)
  const user = await getUserById(userId)
  if (user) return user;

  throw await logout(request);
}

export async function loader({request}: DataFunctionArgs) {
  await requireUser(request)
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  invariant(typeof query === "string", "query is required");
  const trails = await prisma.trail.findMany({
    where: {

        name: {
          contains: query,
        },

    },
    select: {
      id: true,
      name: true,
    },
    take: 10,
  });

  return ({ trails });
};

type Trail = SerializeFrom<typeof loader>['trails'][number]

export function TrailCombobox({
    error,
    name,
    defaultSelectedTrail,
    onChange,
  }:{
    error?: string | null,
    name : string,
    defaultSelectedTrail?: Trail | null,
    onChange?: (selectedTrail: Trail | null | undefined) => void,
  }) {
  const trailFetcher = useFetcher<typeof loader>();
  const id = useId();
  const trails = trailFetcher.data?.trails ?? [];
  type Trail = typeof trails[number];
  const [selectedTrail, setSelectedTrail] = useState<Trail | null | undefined>(null);

  const cb = useCombobox<Trail>({
    id,
    onSelectedItemChange: ({selectedItem}) => {
      setSelectedTrail(selectedItem);
    },
    items: trails,
    itemToString: (item) => item ? item.name : "",
    onInputValueChange: changes => {
      trailFetcher.submit(
        { query: changes.inputValue ?? "" },
        { method: "get", action: 'resources/trails' },
      );
    },
  })

  const busy = trailFetcher.state !== "idle";
  const showSpinner = useSpinDelay(busy, {
    delay: 200,
    minDuration: 200,
  });
  const displayMenu = cb.isOpen && trails.length > 0;

  return (
		<div className="relative">
			<input name={name} type="hidden" value={selectedTrail?.id ?? ''} />
			<div className="flex flex-wrap items-center gap-1">
				<label {...cb.getLabelProps()}>trail</label>
				{error ? (
					<em id="trail-error" className="text-d-p-xs text-red-600">
						{error}
					</em>
				) : null}
			</div>
			<div className="relative">
				<input
					{...cb.getInputProps({
						className: clsx('text-lg w-full border border-gray-500 px-2 py-1', {
							'rounded-t rounded-b-0': displayMenu,
							rounded: !displayMenu,
						}),
						'aria-invalid': Boolean(error) || undefined,
						'aria-errormessage': error ? 'trail-error' : undefined,
					})}
				/>
				<Spinner showSpinner={showSpinner} />
			</div>
			<ul
				{...cb.getMenuProps({
					className: clsx(
						'absolute z-10 bg-white shadow-lg rounded-b w-full border border-t-0 border-gray-500 max-h-[180px] overflow-scroll',
						{ hidden: !displayMenu },
					),
				})}
			>
				{displayMenu
					? trails.map((trail, index) => (
							<li
								className={clsx('cursor-pointer py-1 px-2', {
									'bg-green-200': cb.highlightedIndex === index,
								})}
								key={trail.id}
								{...cb.getItemProps({ item: trail, index })}
							>
								{trail.name} ({trail.routeType})
							</li>
					  ))
					: null}
			</ul>
		</div>
	)
}
