import { createFileRoute } from '@tanstack/react-router'

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'

export const Route = createFileRoute('/login')({
	component: LoginPage,
})

function LoginPage() {
	return (
		<Card className="island-shell mx-auto max-w-md border-0">
			<CardHeader>
				<CardTitle className="display-title">Login</CardTitle>
				<CardDescription>Auth flow lands in Epic 3.</CardDescription>
			</CardHeader>
		</Card>
	)
}
