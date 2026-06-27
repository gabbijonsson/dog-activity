import type { ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'

export function ErrorPage({ error, reset }: ErrorComponentProps) {
	const message =
		error instanceof Error ? error.message : 'Något gick fel vid laddning.'

	return (
		<div className="rise-in flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
			<div className="island-shell max-w-md rounded-xl p-8">
				<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
					<AlertTriangle className="size-6" aria-hidden="true" />
				</div>
				<p className="island-kicker">Fel</p>
				<h1 className="display-title mt-2 text-2xl">Kunde inte ladda sidan</h1>
				<p className="mt-3 text-sm text-muted-foreground">{message}</p>
				<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
					<Button type="button" onClick={reset}>
						Försök igen
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => window.location.assign('/')}
					>
						Till översikten
					</Button>
				</div>
			</div>
		</div>
	)
}
