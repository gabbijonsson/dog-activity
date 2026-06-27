import type { CompetitionStatus } from '#/lib/competition-labels.ts'
import { competitionStatusLabel } from '#/lib/competition-labels.ts'
import { cn } from '#/lib/utils.ts'

const STATUS_STYLES: Record<CompetitionStatus, string> = {
	empty: 'bg-muted/70 text-muted-foreground',
	interested:
		'bg-[color-mix(in_oklab,var(--signal)_16%,transparent)] text-[var(--signal-hot)]',
	in_progress:
		'bg-[color-mix(in_oklab,var(--lagoon)_16%,transparent)] text-[var(--lagoon-deep)]',
	reserve_slot: 'bg-reserve text-reserve-deep',
	registered:
		'bg-[color-mix(in_oklab,var(--lagoon)_12%,transparent)] text-[var(--lagoon-deep)]',
	paid: 'bg-[color-mix(in_oklab,var(--palm)_18%,transparent)] text-[var(--palm)]',
}

export function CompetitionStatusBadge({
	status,
}: {
	status: CompetitionStatus
}) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
				STATUS_STYLES[status],
			)}
		>
			{competitionStatusLabel(status)}
		</span>
	)
}
