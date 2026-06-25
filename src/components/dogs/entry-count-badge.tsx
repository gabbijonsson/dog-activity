import { cn } from '#/lib/utils.ts'

export function EntryCountBadge({ count }: { count: number }) {
	return (
		<span
			className={cn(
				'inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5',
				'text-xs font-bold tabular-nums',
				count > 0
					? 'bg-[color-mix(in_oklab,var(--palm)_18%,transparent)] text-[var(--palm)]'
					: 'bg-muted/70 text-muted-foreground',
			)}
		>
			{count}
		</span>
	)
}
