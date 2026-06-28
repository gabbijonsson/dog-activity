import { useQuery } from '@tanstack/react-query'
import {
	CalendarClock,
	Check,
	Flag,
	HandCoins,
	Hourglass,
	type LucideIcon,
} from 'lucide-react'
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
import { competitionTypeLabel } from '#/lib/competition-labels.ts'
import {
	type Competition,
	type CompetitionEntrySummary,
	type ConfirmedUpcomingRow,
	type DashboardCompetition,
	buildConfirmedUpcomingRows,
	fetchDashboardSummary,
} from '#/lib/dashboard-queries.ts'
import { formatShortDate, formatShortDateTime } from '#/lib/dates.ts'
import type { EntryStatus } from '#/lib/entries.ts'
import { cityFromAddress } from '#/lib/location.ts'
import { profileDisplayName } from '#/lib/profile-queries.ts'
import { queryKeys } from '#/lib/queryKeys.ts'
import { sportLabel } from '#/lib/sports.ts'
import { getBrowserSupabase } from '#/lib/supabase.ts'
import { cn } from '#/lib/utils.ts'

interface DeadlineCardsProps {
	onCompetitionSelect: (competitionId: string) => void
}

const DEADLINE_SKELETON_IDS = ['opening', 'competitions'] as const
const CARD_GRID_CLASS =
	'grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4'
const CARD_CLASS = 'island-shell min-w-[400px] gap-4 border-0 border-l-4'

const ENTRY_STATUS_BADGE: Partial<
	Record<EntryStatus, { icon: LucideIcon; boxClass: string; label: string }>
> = {
	paid: {
		icon: Check,
		boxClass:
			'bg-[color-mix(in_oklab,var(--palm)_22%,transparent)] text-[var(--palm)]',
		label: 'Betald',
	},
	slot_assigned: {
		icon: HandCoins,
		boxClass:
			'bg-[color-mix(in_oklab,var(--lagoon-deep)_18%,transparent)] text-[var(--lagoon-deep)]',
		label: 'Startplats',
	},
	reserve_slot: {
		icon: Hourglass,
		boxClass:
			'bg-[color-mix(in_oklab,var(--reserve-deep)_18%,transparent)] text-[var(--reserve-deep)]',
		label: 'Reserv',
	},
}

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
			<div className={CARD_GRID_CLASS}>
				{DEADLINE_SKELETON_IDS.map((id) => (
					<Card key={id} className={cn(CARD_CLASS, 'border-l-0')}>
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
		<div className={CARD_GRID_CLASS}>
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
				title="Kommande tävlingar"
				icon={Flag}
				accent="border-l-event-day"
				rows={buildConfirmedUpcomingRows(data.upcomingCompetitions)}
				dateField="event_date"
				emptyTitle="Inga tävlingar"
				emptyDescription="Inga bekräftade startplatser eller reservplatser ännu."
				onCompetitionSelect={onCompetitionSelect}
				showStatusBadge
			/>
			{data.registeredHandlers.map((handler) => (
				<DeadlineCard
					key={handler.id}
					title={`Kommande tävlingar — ${profileDisplayName(handler)}`}
					icon={Flag}
					accent="border-l-event-day"
					rows={buildConfirmedUpcomingRows(data.upcomingCompetitions, {
						handlerId: handler.id,
					})}
					dateField="event_date"
					emptyTitle="Inga tävlingar"
					emptyDescription="Inga bekräftade startplatser eller reservplatser för den här föraren."
					onCompetitionSelect={onCompetitionSelect}
					hideHandlerInMeta
					showStatusBadge
				/>
			))}
		</div>
	)
}

function entryMeta(
	competition: DashboardCompetition,
	entry?: CompetitionEntrySummary,
	options?: { hideHandler?: boolean },
): string {
	const typeLabel = competitionTypeLabel(competition.sport, {
		noseworkType: competition.nosework_details?.type,
		rallyStarts: competition.rally_details?.number_of_starts,
	})
	const locationLabel = competition.location
		? (cityFromAddress(competition.location) ?? competition.location)
		: null

	const parts = [
		sportLabel(competition.sport),
		typeLabel,
		locationLabel,
	].filter((part) => part && part !== '—')

	if (entry) {
		const dog = entry.dog?.name ?? 'Okänd hund'
		if (options?.hideHandler) {
			parts.push(dog)
		} else {
			const handler = entry.handler?.full_name ?? 'Okänd förare'
			parts.push(`${handler} & ${dog}`)
		}
	}

	return parts.join(' · ')
}

function openingCompetitionRows(competitions: DashboardCompetition[]): Array<{
	key: string
	competition: DashboardCompetition
	entry?: CompetitionEntrySummary
}> {
	return competitions.flatMap((competition) => {
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

function EntryStatusBadge({ status }: { status: EntryStatus }) {
	const config = ENTRY_STATUS_BADGE[status]
	if (!config) return null

	const { icon: Icon, boxClass, label } = config

	return (
		<span
			className={cn(
				'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md',
				boxClass,
			)}
		>
			<Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
			<span className="sr-only">{label}</span>
		</span>
	)
}

function DeadlineCard({
	title,
	icon: Icon,
	accent,
	competitions,
	rows: rowsProp,
	dateField,
	emptyTitle,
	emptyDescription,
	onCompetitionSelect,
	showStatusBadge,
	hideHandlerInMeta,
}: {
	title: string
	icon: React.ComponentType<{ className?: string }>
	accent: string
	competitions?: DashboardCompetition[]
	rows?: ConfirmedUpcomingRow[]
	dateField: keyof Pick<
		Competition,
		'sign_up_opens' | 'sign_up_closes' | 'event_date'
	>
	emptyTitle: string
	emptyDescription: string
	onCompetitionSelect: (competitionId: string) => void
	showStatusBadge?: boolean
	hideHandlerInMeta?: boolean
}) {
	const rows =
		rowsProp ?? (competitions ? openingCompetitionRows(competitions) : [])

	return (
		<Card className={cn(CARD_CLASS, accent)}>
			<CardHeader>
				<div className="flex items-start gap-3">
					<div className="rounded-md bg-muted/80 p-2 text-primary">
						<Icon className="size-4" aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<CardTitle className="text-base leading-snug">{title}</CardTitle>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{rows.length === 0 ? (
					<EmptyState title={emptyTitle} description={emptyDescription} />
				) : (
					<ul className="space-y-1">
						{rows.map(({ key, competition, entry }) => {
							const formattedDate =
								dateField === 'sign_up_closes' || dateField === 'event_date'
									? formatShortDate(competition[dateField])
									: formatShortDateTime(competition[dateField])

							return (
								<li key={key}>
									<button
										type="button"
										className={cn(
											'flex w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60',
											showStatusBadge && entry
												? 'gap-3'
												: 'items-baseline gap-3',
										)}
										onClick={() => onCompetitionSelect(competition.id)}
									>
										{showStatusBadge && entry ? (
											<EntryStatusBadge status={entry.status} />
										) : null}
										{showStatusBadge && entry ? (
											<span className="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5">
												<span className="col-start-1 row-start-1 truncate text-sm font-medium">
													{competition.name}
												</span>
												<time
													dateTime={competition[dateField]}
													className="col-start-2 row-start-1 shrink-0 self-baseline text-xs font-semibold tabular-nums text-primary"
												>
													{formattedDate}
												</time>
												<span className="col-span-2 truncate text-xs text-muted-foreground">
													{entryMeta(competition, entry, {
														hideHandler: hideHandlerInMeta,
													})}
												</span>
											</span>
										) : (
											<>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium">
														{competition.name}
													</span>
													<span className="block truncate text-xs text-muted-foreground">
														{entryMeta(competition, entry, {
															hideHandler: hideHandlerInMeta,
														})}
													</span>
												</span>
												<time
													dateTime={competition[dateField]}
													className="shrink-0 text-xs font-semibold tabular-nums text-primary"
												>
													{formattedDate}
												</time>
											</>
										)}
									</button>
								</li>
							)
						})}
					</ul>
				)}
			</CardContent>
		</Card>
	)
}
