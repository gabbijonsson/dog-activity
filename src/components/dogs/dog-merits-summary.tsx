import {
	noseworkClassLabel,
	noseworkTypeLabel,
	rallyLevelLabel,
} from '#/lib/competition-labels.ts'
import type { DogMeritsSummary as DogMeritsData } from '#/lib/dog-merits.ts'
import { cn } from '#/lib/utils.ts'

interface DogMeritsSummaryProps {
	merits: DogMeritsData
	variant?: 'compact' | 'full'
	className?: string
}

export function DogMeritsSummary({
	merits,
	variant = 'full',
	className,
}: DogMeritsSummaryProps) {
	const hasMerits = merits.nosework.length > 0 || merits.rally.length > 0

	if (!hasMerits) {
		return (
			<p className={cn('text-xs text-muted-foreground', className)}>
				Inga meriter registrerade än.
			</p>
		)
	}

	if (variant === 'compact') {
		return (
			<ul className={cn('flex flex-wrap gap-1.5', className)}>
				{merits.nosework.map((row) => (
					<li key={`${row.type}-${row.class}`}>
						<span className="merit-chip merit-chip-nosework">
							{noseworkTypeLabel(row.type)} {noseworkClassLabel(row.class)} ·{' '}
							{row.total} diplom
						</span>
					</li>
				))}
				{merits.rally.map((row) => (
					<li key={row.level}>
						<span className="merit-chip merit-chip-rally">
							{rallyLevelLabel(row.level)} · {row.total} kval
						</span>
					</li>
				))}
			</ul>
		)
	}

	return (
		<div className={cn('space-y-4', className)}>
			{merits.nosework.length > 0 ? (
				<div>
					<p className="island-kicker mb-2">Nose Work</p>
					<ul className="space-y-1.5">
						{merits.nosework.map((row) => (
							<li
								key={`${row.type}-${row.class}`}
								className="flex items-baseline justify-between gap-3 text-sm"
							>
								<span className="text-muted-foreground">
									{noseworkTypeLabel(row.type)} ·{' '}
									{noseworkClassLabel(row.class)}
								</span>
								<span className="shrink-0 font-medium tabular-nums">
									{row.total} diplom
									{row.prior > 0 && row.fromApp > 0 ? (
										<span className="ml-1 text-xs font-normal text-muted-foreground">
											({row.prior} tidigare, {row.fromApp} i app)
										</span>
									) : null}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{merits.rally.length > 0 ? (
				<div>
					<p className="island-kicker mb-2">Rally</p>
					<ul className="space-y-1.5">
						{merits.rally.map((row) => (
							<li
								key={row.level}
								className="flex items-baseline justify-between gap-3 text-sm"
							>
								<span className="text-muted-foreground">
									{rallyLevelLabel(row.level)}
								</span>
								<span className="shrink-0 font-medium tabular-nums">
									{row.total} kvalificerade
									{row.prior > 0 && row.fromApp > 0 ? (
										<span className="ml-1 text-xs font-normal text-muted-foreground">
											({row.prior} tidigare, {row.fromApp} i app)
										</span>
									) : null}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}
		</div>
	)
}
