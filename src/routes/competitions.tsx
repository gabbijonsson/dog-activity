import { createFileRoute } from "@tanstack/react-router"

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx"

export const Route = createFileRoute("/competitions")({
	component: CompetitionsPage,
})

function CompetitionsPage() {
	return (
		<Card className="island-shell max-w-lg border-0">
			<CardHeader>
				<CardTitle className="display-title">Competitions</CardTitle>
				<CardDescription>
					Competition list and CRUD land in Epic 6.
				</CardDescription>
			</CardHeader>
		</Card>
	)
}
