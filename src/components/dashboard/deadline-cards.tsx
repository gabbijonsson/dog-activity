import { useQuery } from '@tanstack/react-query'
import { CalendarClock, Flag, Timer } from 'lucide-react'
import {
	EmptyState,
	ErrorState,
	SectionSkeleton,
} from '#/components/dashboard/dashboard-primitives.tsx'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '#/components/ui/card.tsx'
import {
	type Competition,
	type CompetitionEntrySummary,
	type DashboardCompetition,
	fetchDashboardSummary,
} from '#/lib/dashboard-queries.ts'
import { formatShortDate, formatShortDateTime } from '#/lib/dates.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface DeadlineCardsProps {
	onCompetitionSelect: (competitionId: string) => void
}

const DEADLINE_SKELETON_IDS = ['opening', 'closing', 'competitions'] as const

export function DeadlineCards({ onCompetitionSelect }: DeadlineCardsProps) {
	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: queryKeys.dashboard.summary(),
		queryFn: async () => {
			const supabase = getBrowserSupabase()
			return fetchDashboardSummary(supabase)
		},
	})

	if (isLoading) {
		return (
			<div className="grid gap-4 lg:grid-cols-3">
				{DEADLINE_SKELETON_IDS.map((id) => (
					<Card key={id} className="island-shell border-0">
						<CardHeader>
							<div className="h-4 w-32 animate-pulse rounded bg-muted" />
						</CardHeader>
						<CardContent>
							<SectionSkeleton rows={3} />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (isError || !data) {
		return (
			<ErrorState
				title="Kunde inte ladda deadlines"
				description="Kontrollera anslutningen och försök igen."
				onRetry={() => void refetch()}
			/>
		)
	}

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<DeadlineCard
				title="Anmälan öppnar"
				icon={CalendarClock}
				accent="border-l-event-sign-up-open"
				competitions={data.signUpsOpening}
				dateField="sign_up_opens"
				emptyTitle="Ingen anmälan"
				emptyDescription="Alla kommande anmälningar är redan öppna."
				onCompetitionSelect={onCompetitionSelect}
			/>
			<DeadlineCard
				title="Anmälan stänger"
				icon={Timer}
				accent="border-l-event-sign-up-close"
				competitions={data.signUpsClosing}
				dateField="sign_up_closes"
				emptyTitle="Ingen anmälan"
				emptyDescription="Alla kommande anmälningar är redan stängda."
				onCompetitionSelect={onCompetitionSelect}
			/>
			<DeadlineCard
				title="Kommande tävlingar"
				icon={Flag}
				accent="border-l-event-day"
				competitions={data.upcomingCompetitions}
				dateField="event_date"
				emptyTitle="Inga tävlingar"
				emptyDescription="Lägg till en tävling för att se den här."
				onCompetitionSelect={onCompetitionSelect}
			/>
		</div>
	)
}

function entryTag(
	competition: DashboardCompetition,
	entry?: CompetitionEntrySummary,
): string {
	const sport = sportLabel(competition.sport)
	if (!entry) return sport

	const handler = entry.handler?.full_name ?? 'Okänd förare'
	const dog = entry.dog?.name ?? 'Okänd hund'
	return `${sport} • ${handler} & ${dog}`
}

type CompetitionRow = {
	key: string
	competition: DashboardCompetition
	entry?: CompetitionEntrySummary
}

function competitionRows(
	competitions: DashboardCompetition[],
): CompetitionRow[] {
	return competitions.flatMap((competition): CompetitionRow[] => {
		if (competition.entries.length === 0) {
			return [{ key: competition.id, competition }]
		}

		return competition.entries.map((entry) => ({
			key: entry.id,
			competition,
			entry,
		}))
	})
}

function DeadlineCard({
	title,
	icon: Icon,
	accent,
	competitions,
	dateField,
	emptyTitle,
	emptyDescription,
	onCompetitionSelect,
}: {
	title: string
	icon: React.ComponentType<{ className?: string }>
	accent: string
	competitions: DashboardCompetition[]
	dateField: keyof Pick<
		Competition,
		'sign_up_opens' | 'sign_up_closes' | 'event_date'
	>
	emptyTitle: string
	emptyDescription: string
	onCompetitionSelect: (competitionId: string) => void
}) {
	const rows = competitionRows(competitions)

	return (
		<Card className={cn('island-shell border-0 border-l-4 gap-4', accent)}>
			<CardHeader>
				<div className="flex items-start gap-3">
					<div className="rounded-md bg-muted/80 p-2 text-primary">
						<Icon className="size-4" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<CardTitle className="text-base">{title}</CardTitle>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{rows.length === 0 ? (
					<EmptyState title={emptyTitle} description={emptyDescription} />
				) : (
					<ul className="space-y-1">
						{rows.map(({ key, competition, entry }) => (
							<li key={key}>
								<button
									type="button"
									className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60"
									onClick={() => onCompetitionSelect(competition.id)}
								>
									<span className="min-w-0">
										<span className="block truncate text-sm font-medium">
											{competition.name}
										</span>
										<span className="block truncate text-xs text-muted-foreground">
											{entryTag(competition, entry)}
										</span>
									</span>
									<time
										dateTime={competition[dateField]}
										className="shrink-0 text-xs font-semibold tabular-nums text-primary"
									>
										{dateField === 'sign_up_closes'
											? formatShortDate(competition[dateField])
											: formatShortDateTime(competition[dateField])}
									</time>
								</button>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
