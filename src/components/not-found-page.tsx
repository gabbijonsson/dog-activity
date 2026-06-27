import { Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'

export function NotFoundPage() {
	return (
		<div className="rise-in flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
			<div className="island-shell max-w-md rounded-xl p-8">
				<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted/80 text-primary">
					<Compass className="size-6" aria-hidden="true" />
				</div>
				<p className="island-kicker">404</p>
				<h1 className="display-title mt-2 text-2xl">Sidan hittades inte</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					Adressen finns inte i appen. Kontrollera länken eller gå tillbaka till
					översikten.
				</p>
				<Button asChild className="mt-6" variant="link">
					<Link to="/">Till översikten</Link>
				</Button>
			</div>
		</div>
	)
}
