import { createServerFn } from '@tanstack/react-start'

import { toCompetitionRowPayload } from '#/lib/competition-queries.ts'
import { competitionSaveSchema } from '#/lib/schemas.ts'
import { createServerSupabase } from '#/lib/supabase.server.ts'

export class CompetitionSaveError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'CompetitionSaveError'
	}
}

function mapSaveError(error: { code?: string; message: string }): never {
	if (error.code === '23514') {
		throw new CompetitionSaveError(
			'Datumen måste följa ordningen: öppnar ≤ stänger ≤ betalning, och öppnar/stänger ≤ tävlingsdag.',
		)
	}

	throw new CompetitionSaveError(error.message)
}

async function upsertSportDetails(
	supabase: ReturnType<typeof createServerSupabase>,
	competitionId: string,
	input: ReturnType<typeof competitionSaveSchema.parse>,
) {
	await supabase
		.from('nosework_details')
		.delete()
		.eq('competition_id', competitionId)
	await supabase
		.from('rally_details')
		.delete()
		.eq('competition_id', competitionId)

	if (input.sport === 'nosework') {
		if (
			!input.nosework_type ||
			!input.nosework_class ||
			!input.nosework_official_status
		) {
			throw new CompetitionSaveError('Nose Work-fält saknas')
		}

		const { error } = await supabase.from('nosework_details').insert({
			competition_id: competitionId,
			type: input.nosework_type,
			class: input.nosework_class,
			official_status: input.nosework_official_status,
		})
		if (error) mapSaveError(error)
		return
	}

	if (!input.number_of_starts) {
		throw new CompetitionSaveError('Rally-fält saknas')
	}

	const { error } = await supabase.from('rally_details').insert({
		competition_id: competitionId,
		number_of_starts: input.number_of_starts,
	})
	if (error) mapSaveError(error)
}

export const saveCompetition = createServerFn({ method: 'POST' })
	.validator(competitionSaveSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			throw new CompetitionSaveError('Du måste vara inloggad')
		}

		const payload = toCompetitionRowPayload(data)

		if (data.id) {
			const { error } = await supabase
				.from('competitions')
				.update(payload)
				.eq('id', data.id)

			if (error) mapSaveError(error)

			await upsertSportDetails(supabase, data.id, data)
			return { id: data.id }
		}

		const { data: created, error } = await supabase
			.from('competitions')
			.insert({
				...payload,
				created_by: user.id,
			})
			.select('id')
			.single()

		if (error) mapSaveError(error)

		try {
			await upsertSportDetails(supabase, created.id, data)
		} catch (detailError) {
			await supabase.from('competitions').delete().eq('id', created.id)
			throw detailError
		}

		return { id: created.id }
	})
