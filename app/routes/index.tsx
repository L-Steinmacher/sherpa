import { type V2_MetaFunction } from "@remix-run/node";

export const meta: V2_MetaFunction = ({ matches }) => {
	return matches.find(match => match.route.id === 'root')?.meta ?? []
}

export default function Index() {
  return (
    <main>
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Welcome to Sherpa</h1>
        <p className="text-xl text-gray-500">A place to track your hikes</p>
      </div>
    </main>
  );
}
