import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'

export const Route = createFileRoute('/')({ component: DashboardPage })

function DashboardPage() {
	return (
		<div className="rise-in space-y-6">
			<div>
				<p className="island-kicker">Dog sports competition tracker</p>
				<h1 className="display-title mt-2 text-3xl font-bold tracking-tight">
					Dashboard
				</h1>
				<p className="mt-2 max-w-xl text-muted-foreground">
					Track NoseWork and Rally competitions, sign-up deadlines, and entries.
					Epic 4 fills this page with calendar and cards.
				</p>
			</div>
			<Card className="island-shell max-w-lg border-0">
				<CardHeader>
					<CardTitle>Ready for Epic 1</CardTitle>
					<CardDescription>
						Supabase schema, RLS, and seed data come next.
					</CardDescription>
				</CardHeader>
			</Card>
		</div>
	)
}
