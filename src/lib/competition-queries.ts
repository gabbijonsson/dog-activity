import { deriveCompetitionStatus } from '#/lib/competition-labels.ts'
import type { Database } from '#/lib/database.types.ts'
import {
	datetimeFromDateAndTime,
	paymentDeadlineFromDate,
	splitDateTime,
} from '#/lib/dates.ts'
import type {
	CompetitionFormInput,
	CompetitionSaveInput,
} from '#/lib/schemas.ts'
import type { TypedSupabaseClient } from '#/lib/supabase.ts'

export type Competition = Database['public']['Tables']['competitions']['Row']
export type CalendarEvent =
	Database['public']['Tables']['calendar_events']['Row']

export type CompetitionEntry = Pick<
	Database['public']['Tables']['entries']['Row'],
	'id' | 'status' | 'dog_id' | 'handler_id'
> & {
	dog: Pick<Database['public']['Tables']['dogs']['Row'], 'id' | 'name'> | null
	handler: Pick<
		Database['public']['Tables']['profiles']['Row'],
		'id' | 'full_name' | 'email'
	> | null
}

export type CompetitionDetail = Competition & {
	nosework_details:
		| Database['public']['Tables']['nosework_details']['Row']
		| null
	rally_details: Database['public']['Tables']['rally_details']['Row'] | null
	entries: CompetitionEntry[]
	calendar_events: CalendarEvent[]
}

export type CompetitionListItem = Competition & {
	nosework_details:
		| Pick<
				Database['public']['Tables']['nosework_details']['Row'],
				'type'
		  >
		| null
	rally_details:
		| Pick<
				Database['public']['Tables']['rally_details']['Row'],
				'number_of_starts'
		  >
		| null
	entries: Pick<
		Database['public']['Tables']['entries']['Row'],
		'id' | 'status'
	>[]
	status: ReturnType<typeof deriveCompetitionStatus>
}

function toNullable(value: string): string | null {
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

export function formInputToSavePayload(
	input: Omit<
		CompetitionFormInput,
		'entry_dog_id' | 'entry_handler_id' | 'entry_status'
	>,
): CompetitionSaveInput {
	return {
		name: input.name.trim(),
		sport: input.sport,
		location: input.location,
		origin_location: input.origin_location,
		sign_up_opens: datetimeFromDateAndTime(
			input.sign_up_opens_date,
			input.sign_up_opens_time,
		),
		sign_up_closes: paymentDeadlineFromDate(input.sign_up_closes),
		payment_deadline: paymentDeadlineFromDate(input.payment_deadline),
		event_date: datetimeFromDateAndTime(input.event_date, input.event_time),
		url: input.url,
		notes: input.notes,
		nosework_type: input.nosework_type,
		nosework_class: input.nosework_class,
		nosework_official_status: input.nosework_official_status,
		number_of_starts: input.number_of_starts,
	}
}

export function competitionToFormInput(
	competition: CompetitionDetail,
): CompetitionFormInput {
	const opens = splitDateTime(competition.sign_up_opens)
	const event = splitDateTime(competition.event_date)

	return {
		name: competition.name,
		sport: competition.sport,
		location: competition.location ?? '',
		origin_location: competition.origin_location ?? '',
		sign_up_opens_date: opens.date,
		sign_up_opens_time: opens.time,
		sign_up_closes: splitDateTime(competition.sign_up_closes).date,
		payment_deadline: splitDateTime(competition.payment_deadline).date,
		event_date: event.date,
		event_time: event.time,
		url: competition.url ?? '',
		notes: competition.notes ?? '',
		nosework_type: competition.nosework_details?.type,
		nosework_class: competition.nosework_details?.class,
		nosework_official_status: competition.nosework_details?.official_status,
		number_of_starts: competition.rally_details?.number_of_starts,
		entry_dog_id: '',
		entry_handler_id: '',
		entry_status: 'interested',
	}
}

function toCompetitionRowPayload(input: CompetitionSaveInput) {
	return {
		name: input.name.trim(),
		sport: input.sport,
		location: toNullable(input.location),
		origin_location: toNullable(input.origin_location),
		sign_up_opens: input.sign_up_opens,
		sign_up_closes: input.sign_up_closes,
		payment_deadline: input.payment_deadline,
		event_date: input.event_date,
		url: toNullable(input.url),
		notes: toNullable(input.notes),
	}
}

export async function fetchCompetitionsList(
	supabase: TypedSupabaseClient,
): Promise<CompetitionListItem[]> {
	const { data, error } = await supabase
		.from('competitions')
		.select(
			'*, nosework_details(type), rally_details(number_of_starts), entries(id, status)',
		)
		.order('event_date', { ascending: true })

	if (error) throw error

	return data.map((competition) => ({
		...competition,
		status: deriveCompetitionStatus(competition.entries),
	}))
}

export async function fetchCompetitionById(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<CompetitionDetail | null> {
	const { data, error } = await supabase
		.from('competitions')
		.select(
			'*, nosework_details(*), rally_details(*), entries(id, status, dog_id, handler_id, dog:dogs(id, name), handler:profiles(id, full_name, email)), calendar_events(*)',
		)
		.eq('id', id)
		.maybeSingle()

	if (error) throw error
	if (!data) return null

	const competition = data as CompetitionDetail
	competition.calendar_events.sort((a, b) =>
		a.event_date.localeCompare(b.event_date),
	)
	competition.entries.sort((a, b) =>
		(a.dog?.name ?? '').localeCompare(b.dog?.name ?? ''),
	)

	return competition
}

export async function deleteCompetition(
	supabase: TypedSupabaseClient,
	id: string,
): Promise<void> {
	const { error } = await supabase.from('competitions').delete().eq('id', id)
	if (error) throw error
}

export { toCompetitionRowPayload }
