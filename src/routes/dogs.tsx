import { createFileRoute } from "@tanstack/react-router"

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx"

export const Route = createFileRoute("/dogs")({
	component: DogsPage,
})

function DogsPage() {
	return (
		<Card className="island-shell max-w-lg border-0">
			<CardHeader>
				<CardTitle className="display-title">Dogs</CardTitle>
				<CardDescription>Dog list and CRUD land in Epic 5.</CardDescription>
			</CardHeader>
		</Card>
	)
}
