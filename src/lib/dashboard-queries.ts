import type { Database } from '#/lib/database.types.ts'
import { nowIso } from '#/lib/dates.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type Competition = Database['public']['Tables']['competitions']['Row']
export type CalendarEvent =
	Database['public']['Tables']['calendar_events']['Row']

export type CompetitionEntrySummary = Pick<
	Database['public']['Tables']['entries']['Row'],
	'id' | 'status'
> & {
	handler: Pick<
		Database['public']['Tables']['profiles']['Row'],
		'full_name'
	> | null
	dog: Pick<Database['public']['Tables']['dogs']['Row'], 'name'> | null
}

export type DashboardCompetition = Competition & {
	entries: CompetitionEntrySummary[]
}

export type CalendarEventWithCompetition = CalendarEvent & {
	competitions: Pick<Competition, 'id' | 'name' | 'sport' | 'location'> | null
}

export type DashboardSummary = {
	signUpsOpening: DashboardCompetition[]
	signUpsClosing: DashboardCompetition[]
	upcomingCompetitions: DashboardCompetition[]
	upcomingCalendarEvents: CalendarEventWithCompetition[]
}

const competitionWithEntriesSelect =
	'*, entries(id, status, handler:profiles(full_name), dog:dogs(name))'

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

	const [
		openingResult,
		closingResult,
		competitionsResult,
		eventsResult,
	] = await Promise.all([
		supabase
			.from('competitions')
			.select(competitionWithEntriesSelect)
			.gte('sign_up_opens', now)
			.order('sign_up_opens', { ascending: true })
			.limit(20),
		supabase
			.from('competitions')
			.select(competitionWithEntriesSelect)
			.gte('sign_up_closes', now)
			.order('sign_up_closes', { ascending: true })
			.limit(3),
		supabase
			.from('competitions')
			.select(competitionWithEntriesSelect)
			.gte('event_date', now)
			.order('event_date', { ascending: true })
			.limit(5),
		supabase
			.from('calendar_events')
			.select('*, competitions(id, name, sport, location)')
			.gte('event_date', now)
			.order('event_date', { ascending: true })
			.limit(20),
	])

	if (openingResult.error) throw openingResult.error
	if (closingResult.error) throw closingResult.error
	if (competitionsResult.error) throw competitionsResult.error
	if (eventsResult.error) throw eventsResult.error

	const signUpsOpening = (openingResult.data as DashboardCompetition[])
		.filter((competition) => !isFullyRegistered(competition.entries))
		.slice(0, 5)

	return {
		signUpsOpening,
		signUpsClosing: closingResult.data as DashboardCompetition[],
		upcomingCompetitions: competitionsResult.data as DashboardCompetition[],
		upcomingCalendarEvents: eventsResult.data,
	}
}

export async function fetchCalendarEventsForRange(
	supabase: TypedSupabaseClient,
	from: string,
	to: string,
): Promise<CalendarEventWithCompetition[]> {
	const { data, error } = await supabase
		.from('calendar_events')
		.select('*, competitions(id, name, sport, location)')
		.gte('event_date', from)
		.lte('event_date', to)
		.order('event_date', { ascending: true })

	if (error) throw error
	return data
}

export async function fetchCompetitionById(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<Competition | null> {
	const { data, error } = await supabase
		.from('competitions')
		.select('*')
		.eq('id', id)
		.maybeSingle()

	if (error) throw error
	return data
}
