import type { CalendarEventType } from '#/lib/calendar-events.ts'
import { CALENDAR_EVENT_CONFIG } from '#/lib/calendar-events.ts'
import { cn } from '#/lib/utils.ts'

interface EventTypeLegendProps {
	selectedTypes?: CalendarEventType[]
	onToggleType?: (type: CalendarEventType) => void
	onClear?: () => void
}

export function EventTypeLegend({
	selectedTypes = [],
	onToggleType,
	onClear,
}: EventTypeLegendProps) {
	const isInteractive = Boolean(onToggleType)
	const hasSelection = selectedTypes.length > 0
	const items = Object.entries(CALENDAR_EVENT_CONFIG).map(([type, config]) => ({
		type: type as CalendarEventType,
		label: config.label,
		className: config.dotClass,
	}))

	return (
		<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
			{hasSelection && onClear ? (
				<button
					type="button"
					className="text-xs font-medium text-primary underline-offset-4 hover:underline"
					onClick={onClear}
				>
					Rensa
				</button>
			) : null}
			{items.map(({ type, label, className }) => {
				const isSelected = selectedTypes.includes(type)

				if (!isInteractive) {
					return (
						<div
							key={type}
							className="flex items-center gap-1.5 text-xs text-muted-foreground"
						>
							<span
								className={cn('size-2 rounded-full', className)}
								aria-hidden="true"
							/>
							{label}
						</div>
					)
				}

				return (
					<button
						key={type}
						type="button"
						aria-pressed={isSelected}
						className={cn(
							'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors',
							isSelected
								? 'bg-muted text-foreground ring-1 ring-border'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
						)}
						onClick={() => onToggleType?.(type)}
					>
						<span
							className={cn('size-2 rounded-full', className)}
							aria-hidden="true"
						/>
						{label}
					</button>
				)
			})}
		</div>
	)
}
