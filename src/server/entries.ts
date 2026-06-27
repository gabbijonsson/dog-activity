import { createServerFn } from '@tanstack/react-start'

import type { Database } from '#/lib/database.types.ts'
import {
	entryCreateSchema,
	entryDeleteSchema,
	entryUpdateStatusSchema,
} from '#/lib/schemas.ts'
import { createServerSupabase } from '#/lib/supabase.server.ts'

type Sport = Database['public']['Enums']['sport']

export class EntryError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'EntryError'
	}
}

async function requireAuthUser(supabase: ReturnType<typeof createServerSupabase>) {
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

async function validateEntryConstraints(
	supabase: ReturnType<typeof createServerSupabase>,
	competitionId: string,
	dogId: string,
	handlerId: string,
	sport: Sport,
) {
	const { data: existingDog, error: dogError } = await supabase
		.from('entries')
		.select('id')
		.eq('competition_id', competitionId)
		.eq('dog_id', dogId)
		.maybeSingle()

	if (dogError) throw new EntryError(dogError.message)
	if (existingDog) {
		throw new EntryError('Hunden är redan anmäld till denna tävling')
	}

	if (sport !== 'nosework') return

	const { data: existingHandler, error: handlerError } = await supabase
		.from('entries')
		.select('id')
		.eq('competition_id', competitionId)
		.eq('handler_id', handlerId)
		.maybeSingle()

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
		await validateEntryConstraints(
			supabase,
			data.competition_id,
			data.dog_id,
			data.handler_id,
			sport,
		)

		const { data: created, error } = await supabase
			.from('entries')
			.insert({
				competition_id: data.competition_id,
				dog_id: data.dog_id,
				handler_id: data.handler_id,
				status: data.status,
				sport,
			})
			.select('id')
			.single()

		if (error) mapInsertError(error)
		return { id: created.id }
	})

export const updateEntryStatus = createServerFn({ method: 'POST' })
	.validator(entryUpdateStatusSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

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
