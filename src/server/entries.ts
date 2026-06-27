import { createServerFn } from '@tanstack/react-start'

import type { Database } from '#/lib/database.types.ts'
import { entryRequiresDogHandler } from '#/lib/entry-validation.ts'
import {
	entryCreateSchema,
	entryDeleteSchema,
	entryUpdateSchema,
	entryUpdateStatusSchema,
} from '#/lib/schemas.ts'
import { createServerSupabase } from '#/lib/supabase.server.ts'

type Sport = Database['public']['Enums']['sport']
type EntryStatus = Database['public']['Enums']['entry_status']

type EntryRow = Pick<
	Database['public']['Tables']['entries']['Row'],
	'id' | 'competition_id' | 'dog_id' | 'handler_id' | 'status' | 'sport'
>

export class EntryError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'EntryError'
	}
}

async function requireAuthUser(
	supabase: ReturnType<typeof createServerSupabase>,
) {
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		throw new EntryError('Du måste vara inloggad')
	}

	return user
}

async function fetchCompetitionSport(
	supabase: ReturnType<typeof createServerSupabase>,
	competitionId: string,
): Promise<Sport> {
	const { data, error } = await supabase
		.from('competitions')
		.select('sport')
		.eq('id', competitionId)
		.maybeSingle()

	if (error) throw new EntryError(error.message)
	if (!data) throw new EntryError('Tävlingen hittades inte')

	return data.sport
}

async function fetchEntry(
	supabase: ReturnType<typeof createServerSupabase>,
	id: string,
): Promise<EntryRow> {
	const { data, error } = await supabase
		.from('entries')
		.select('id, competition_id, dog_id, handler_id, status, sport')
		.eq('id', id)
		.maybeSingle()

	if (error) throw new EntryError(error.message)
	if (!data) throw new EntryError('Anmälan hittades inte')

	return data
}

function normalizeParticipantId(value: string): string | null {
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

function assertParticipantsForStatus(
	status: EntryStatus,
	dogId: string | null,
	handlerId: string | null,
) {
	if (!entryRequiresDogHandler(status)) return

	if (!dogId) {
		throw new EntryError('Välj hund innan du sätter status Anmäld eller senare')
	}

	if (!handlerId) {
		throw new EntryError(
			'Välj hundförare innan du sätter status Anmäld eller senare',
		)
	}
}

async function validateEntryConstraints(
	supabase: ReturnType<typeof createServerSupabase>,
	competitionId: string,
	dogId: string | null,
	handlerId: string | null,
	sport: Sport,
	excludeEntryId?: string,
) {
	if (dogId) {
		let query = supabase
			.from('entries')
			.select('id')
			.eq('competition_id', competitionId)
			.eq('dog_id', dogId)

		if (excludeEntryId) {
			query = query.neq('id', excludeEntryId)
		}

		const { data: existingDog, error: dogError } = await query.maybeSingle()

		if (dogError) throw new EntryError(dogError.message)
		if (existingDog) {
			throw new EntryError('Hunden är redan anmäld till denna tävling')
		}
	}

	if (sport !== 'nosework' || !handlerId) return

	let handlerQuery = supabase
		.from('entries')
		.select('id')
		.eq('competition_id', competitionId)
		.eq('handler_id', handlerId)

	if (excludeEntryId) {
		handlerQuery = handlerQuery.neq('id', excludeEntryId)
	}

	const { data: existingHandler, error: handlerError } =
		await handlerQuery.maybeSingle()

	if (handlerError) throw new EntryError(handlerError.message)
	if (existingHandler) {
		throw new EntryError('Handlern är redan anmäld till denna tävling')
	}
}

function mapInsertError(error: { code?: string; message: string }): never {
	if (error.code === '23505') {
		if (error.message.includes('entries_nosework_handler_unique')) {
			throw new EntryError('Handlern är redan anmäld till denna tävling')
		}
		throw new EntryError('Hunden är redan anmäld till denna tävling')
	}

	throw new EntryError(error.message)
}

export const createEntry = createServerFn({ method: 'POST' })
	.validator(entryCreateSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

		const sport = await fetchCompetitionSport(supabase, data.competition_id)
		const dogId = normalizeParticipantId(data.dog_id)
		const handlerId = normalizeParticipantId(data.handler_id)

		assertParticipantsForStatus(data.status, dogId, handlerId)
		await validateEntryConstraints(
			supabase,
			data.competition_id,
			dogId,
			handlerId,
			sport,
		)

		const { data: created, error } = await supabase
			.from('entries')
			.insert({
				competition_id: data.competition_id,
				dog_id: dogId,
				handler_id: handlerId,
				status: data.status,
				sport,
			})
			.select('id')
			.single()

		if (error) mapInsertError(error)
		return { id: created.id }
	})

export const updateEntry = createServerFn({ method: 'POST' })
	.validator(entryUpdateSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

		const existing = await fetchEntry(supabase, data.id)
		const dogId =
			data.dog_id !== undefined
				? normalizeParticipantId(data.dog_id)
				: existing.dog_id
		const handlerId =
			data.handler_id !== undefined
				? normalizeParticipantId(data.handler_id)
				: existing.handler_id
		const status = data.status ?? existing.status

		assertParticipantsForStatus(status, dogId, handlerId)
		await validateEntryConstraints(
			supabase,
			existing.competition_id,
			dogId,
			handlerId,
			existing.sport,
			existing.id,
		)

		const { error } = await supabase
			.from('entries')
			.update({
				dog_id: dogId,
				handler_id: handlerId,
				status,
			})
			.eq('id', existing.id)

		if (error) mapInsertError(error)
		return { id: existing.id }
	})

export const updateEntryStatus = createServerFn({ method: 'POST' })
	.validator(entryUpdateStatusSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

		const existing = await fetchEntry(supabase, data.id)
		assertParticipantsForStatus(
			data.status,
			existing.dog_id,
			existing.handler_id,
		)

		const { error } = await supabase
			.from('entries')
			.update({ status: data.status })
			.eq('id', data.id)

		if (error) throw new EntryError(error.message)
		return { id: data.id }
	})

export const deleteEntry = createServerFn({ method: 'POST' })
	.validator(entryDeleteSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

		const { error } = await supabase.from('entries').delete().eq('id', data.id)

		if (error) throw new EntryError(error.message)
		return { id: data.id }
	})
