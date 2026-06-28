import { CalendarPlus } from 'lucide-react'

import { Button } from '#/components/ui/button.tsx'
import {
	buildGoogleCalendarUrl,
	type CalendarExportInput,
} from '#/lib/calendar-export.ts'
import { cn } from '#/lib/utils.ts'

interface AddToCalendarButtonProps {
	event: CalendarExportInput
	className?: string
	size?: 'icon-sm' | 'icon-xs'
	label?: string
}

export function AddToCalendarButton({
	event,
	className,
	size = 'icon-sm',
	label = 'Lägg till i Google Kalender',
}: AddToCalendarButtonProps) {
	return (
		<Button
			type="button"
			variant="ghost"
			size={size}
			className={cn(
				'shrink-0 text-muted-foreground hover:text-foreground',
				className,
			)}
			aria-label={label}
			title={label}
			asChild
		>
			<a
				href={buildGoogleCalendarUrl(event)}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(clickEvent) => clickEvent.stopPropagation()}
			>
				<CalendarPlus className="size-4" aria-hidden="true" />
			</a>
		</Button>
	)
}
