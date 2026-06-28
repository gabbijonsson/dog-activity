import type { Competition } from '#/lib/competition-queries.ts'
import type { Database } from '#/lib/database.types.ts'
import { nowIso } from '#/lib/dates.ts'
import type { EntryStatus } from '#/lib/entries.ts'
import type { ProfileListItem } from '#/lib/profile-queries.ts'
import { profileDisplayName } from '#/lib/profile-queries.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type { Competition } from '#/lib/competition-queries.ts'
export { fetchCompetitionById } from '#/lib/competition-queries.ts'
export type CalendarEvent =
	Database['public']['Tables']['calendar_events']['Row']

export type CompetitionEntrySummary = Pick<
	Database['public']['Tables']['entries']['Row'],
	'id' | 'status' | 'handler_id'
> & {
	handler: Pick<
		Database['public']['Tables']['profiles']['Row'],
		'id' | 'full_name'
	> | null
	dog: Pick<Database['public']['Tables']['dogs']['Row'], 'name'> | null
}

export type DashboardCompetition = Competition & {
	nosework_details: Pick<
		Database['public']['Tables']['nosework_details']['Row'],
		'type'
	> | null
	rally_details: Pick<
		Database['public']['Tables']['rally_details']['Row'],
		'number_of_starts'
	> | null
	entries: CompetitionEntrySummary[]
}

type ProfileHandlerFields = Pick<
	Database['public']['Tables']['profiles']['Row'],
	'id' | 'full_name' | 'calendar_emoji'
>

export type CalendarEventWithCompetition = CalendarEvent & {
	competitions:
		| (Pick<Competition, 'id' | 'name' | 'sport' | 'location'> & {
				nosework_details: {
					type: Database['public']['Enums']['nosework_type']
				} | null
				entries: Array<{
					status: Database['public']['Enums']['entry_status']
					handler: ProfileHandlerFields | null
				}>
		  })
		| null
}

export type DashboardSummary = {
	signUpsOpening: DashboardCompetition[]
	upcomingCompetitions: DashboardCompetition[]
	upcomingCalendarEvents: CalendarEventWithCompetition[]
	registeredHandlers: ProfileListItem[]
}

export type ConfirmedUpcomingRow = {
	key: string
	competition: DashboardCompetition
	entry: CompetitionEntrySummary
}

export const CONFIRMED_UPCOMING_STATUSES = new Set<EntryStatus>([
	'slot_assigned',
	'reserve_slot',
	'paid',
])

export const CONFIRMED_UPCOMING_LIMIT = 5

export function isConfirmedUpcomingEntry(
	entry: Pick<CompetitionEntrySummary, 'status'>,
): boolean {
	return CONFIRMED_UPCOMING_STATUSES.has(entry.status)
}

export function buildConfirmedUpcomingRows(
	competitions: DashboardCompetition[],
	options?: { handlerId?: string; limit?: number },
): ConfirmedUpcomingRow[] {
	const limit = options?.limit ?? CONFIRMED_UPCOMING_LIMIT

	return competitions
		.flatMap((competition) =>
			competition.entries
				.filter(isConfirmedUpcomingEntry)
				.filter(
					(entry) =>
						!options?.handlerId || entry.handler_id === options.handlerId,
				)
				.map((entry) => ({ key: entry.id, competition, entry })),
		)
		.sort((a, b) =>
			a.competition.event_date.localeCompare(b.competition.event_date),
		)
		.slice(0, limit)
}

function extractConfirmedHandlers(
	competitions: DashboardCompetition[],
): ProfileListItem[] {
	const byId = new Map<string, ProfileListItem>()

	for (const competition of competitions) {
		for (const entry of competition.entries) {
			if (!isConfirmedUpcomingEntry(entry) || !entry.handler) continue
			byId.set(entry.handler.id, {
				id: entry.handler.id,
				full_name: entry.handler.full_name,
				email: '',
			})
		}
	}

	return [...byId.values()].sort((a, b) =>
		profileDisplayName(a).localeCompare(profileDisplayName(b), 'sv'),
	)
}

const competitionWithEntriesSelect =
	'*, nosework_details(type), rally_details(number_of_starts), entries(id, status, handler_id, handler:profiles(id, full_name), dog:dogs(name))'

const calendarEventCompetitionSelect =
	'id, name, sport, location, nosework_details(type), entries(status, handler:profiles(id, full_name, calendar_emoji))'

const FULLY_REGISTERED_STATUSES = new Set(['signed_up', 'paid'])

function isFullyRegistered(
	entries: Pick<Database['public']['Tables']['entries']['Row'], 'status'>[],
): boolean {
	if (entries.length === 0) return false
	return entries.every((entry) => FULLY_REGISTERED_STATUSES.has(entry.status))
}

export async function fetchDashboardSummary(
	supabase: TypedSupabaseClient,
): Promise<DashboardSummary> {
	const now = nowIso()

	const [openingResult, competitionsResult, eventsResult] = await Promise.all([
		supabase
			.from('competitions')
			.select(competitionWithEntriesSelect)
			.gte('sign_up_opens', now)
			.order('sign_up_opens', { ascending: true })
			.limit(20),
		supabase
			.from('competitions')
			.select(competitionWithEntriesSelect)
			.gte('event_date', now)
			.order('event_date', { ascending: true })
			.limit(100),
		supabase
			.from('calendar_events')
			.select(`*, competitions(${calendarEventCompetitionSelect})`)
			.gte('event_date', now)
			.order('event_date', { ascending: true })
			.limit(20),
	])

	if (openingResult.error) throw openingResult.error
	if (competitionsResult.error) throw competitionsResult.error
	if (eventsResult.error) throw eventsResult.error

	const signUpsOpening = (openingResult.data as DashboardCompetition[])
		.filter((competition) => !isFullyRegistered(competition.entries))
		.slice(0, 5)

	const upcomingCompetitions = competitionsResult.data as DashboardCompetition[]

	return {
		signUpsOpening,
		upcomingCompetitions,
		upcomingCalendarEvents: eventsResult.data,
		registeredHandlers: extractConfirmedHandlers(upcomingCompetitions),
	}
}

export async function fetchCalendarEventsForRange(
	supabase: TypedSupabaseClient,
	from: string,
	to: string,
): Promise<CalendarEventWithCompetition[]> {
	const { data, error } = await supabase
		.from('calendar_events')
		.select(`*, competitions(${calendarEventCompetitionSelect})`)
		.gte('event_date', from)
		.lte('event_date', to)
		.order('event_date', { ascending: true })

	if (error) throw error
	return data
}
