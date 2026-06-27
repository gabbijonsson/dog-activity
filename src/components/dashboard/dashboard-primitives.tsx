import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button.tsx'

const SKELETON_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<div className="space-y-3" aria-hidden="true">
			{SKELETON_IDS.slice(0, rows).map((id) => (
				<div key={id} className="h-12 animate-pulse rounded-md bg-muted/60" />
			))}
		</div>
	)
}

export function EmptyState({
	title,
	description,
	action,
}: {
	title: string
	description: string
	action?: ReactNode
}) {
	return (
		<div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center">
			<p className="text-sm font-medium text-foreground">{title}</p>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	)
}

export function ErrorState({
	title,
	description,
	onRetry,
}: {
	title: string
	description: string
	onRetry?: () => void
}) {
	return (
		<div
			className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-8 text-center"
			role="alert"
		>
			<p className="text-sm font-medium text-foreground">{title}</p>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			{onRetry ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-4"
					onClick={onRetry}
				>
					Försök igen
				</Button>
			) : null}
		</div>
	)
}
