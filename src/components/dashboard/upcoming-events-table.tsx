import { useQuery } from '@tanstack/react-query'

import {
	EmptyState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import {
	CALENDAR_EVENT_CONFIG,
	calendarEventDisplayTitle,
} from '#/lib/calendar-events.ts'
import { fetchDashboardSummary } from '#/lib/dashboard-queries.ts'
import { formatDisplayDate, formatDisplayDateTime } from '#/lib/dates.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface UpcomingEventsTableProps {
	onCompetitionSelect: (competitionId: string) => void
}

export function UpcomingEventsTable({
	onCompetitionSelect,
}: UpcomingEventsTableProps) {
	const { data, isLoading, isError } = useQuery({
		queryKey: queryKeys.dashboard.summary(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDashboardSummary(supabase)
		},
	})

	return (
		<section className="island-shell rounded-xl p-4 sm:p-6">
			<div className="mb-4">
				<h2 className="island-kicker">Tidslinje</h2>
			</div>

			{isLoading ? (
				<SectionSkeleton rows={8} />
			) : isError || !data ? (
				<EmptyState
					title="Kunde inte ladda kommande händelser"
					description="Uppdatera sidan för att försöka igen."
				/>
			) : data.upcomingCalendarEvents.length === 0 ? (
				<EmptyState
					title="Inga kommande händelser"
					description="Händelser visas när du lägger till tävlingar."
				/>
			) : (
				<ul className="divide-y divide-border/60 rounded-lg border border-border/70">
					{data.upcomingCalendarEvents.map((event) => {
						const config = CALENDAR_EVENT_CONFIG[event.event_type]
						const title = calendarEventDisplayTitle(event)
						const sport = event.competitions
							? sportLabel(event.competitions.sport)
							: '—'
						const showTime = event.event_type !== 'payment'

						return (
							<li
								key={event.id}
								className="group grid grid-cols-[10rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 px-4 py-3 first:rounded-t-lg last:rounded-b-lg"
							>
								<span
									className={cn(
										'inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
										'bg-muted/70',
										config.textClass,
									)}
								>
									<span
										className={cn('size-1.5 rounded-full', config.dotClass)}
										aria-hidden="true"
									/>
									{config.label}
								</span>
								<span className="min-w-0 text-xs text-muted-foreground">
									{sport}
								</span>
								<time
									dateTime={event.event_date}
									className="text-sm font-medium tabular-nums"
								>
									{showTime
										? formatDisplayDateTime(event.event_date)
										: formatDisplayDate(event.event_date)}
								</time>
								<button
									type="button"
									className="min-w-0 truncate text-left text-sm font-medium text-foreground underline-offset-2 transition-colors group-hover:text-primary hover:underline"
									onClick={() => onCompetitionSelect(event.competition_id)}
								>
									{title}
								</button>
							</li>
						)
					})}
				</ul>
			)}
		</section>
	)
}
