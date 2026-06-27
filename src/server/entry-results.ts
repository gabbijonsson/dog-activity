import { createServerFn } from '@tanstack/react-start'
import { noseworkCountsTowardPromotion } from '#/lib/promotion-tracking.ts'
import {
	noseworkEntryResultsSchema,
	rallyEntryResultsSchema,
} from '#/lib/schemas.ts'
import { createServerSupabase } from '#/lib/supabase.server.ts'

export class EntryResultsError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'EntryResultsError'
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
		throw new EntryResultsError('Du måste vara inloggad')
	}

	return user
}

async function requireOfficialNoseworkEntry(
	supabase: ReturnType<typeof createServerSupabase>,
	entryId: string,
) {
	const { data, error } = await supabase
		.from('entries')
		.select(
			'competition:competitions!inner(sport, nosework_details(official_status))',
		)
		.eq('id', entryId)
		.single()

	if (error || !data?.competition) {
		throw new EntryResultsError('Kunde inte hitta tilldelningen')
	}

	if (data.competition.sport !== 'nosework') return

	if (
		!noseworkCountsTowardPromotion(
			data.competition.nosework_details?.official_status,
		)
	) {
		throw new EntryResultsError(
			'Resultat sparas bara för officiella nose work-tävlingar',
		)
	}
}

export const saveNoseworkEntryResults = createServerFn({ method: 'POST' })
	.validator(noseworkEntryResultsSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)
		await requireOfficialNoseworkEntry(supabase, data.entry_id)

		const { error } = await supabase.from('nosework_entry_results').upsert(
			{
				entry_id: data.entry_id,
				diploma_result: data.diploma_result,
				search_1_placement: data.search_1_placement,
				search_2_placement: data.search_2_placement,
				search_3_placement: data.search_3_placement,
				search_4_placement: data.search_4_placement,
				total_placement: data.total_placement,
			},
			{ onConflict: 'entry_id' },
		)

		if (error) throw new EntryResultsError(error.message)
		return { entry_id: data.entry_id }
	})

export const saveRallyEntryResults = createServerFn({ method: 'POST' })
	.validator(rallyEntryResultsSchema)
	.handler(async ({ data }) => {
		const supabase = createServerSupabase()
		await requireAuthUser(supabase)

		await supabase
			.from('rally_start_results')
			.delete()
			.eq('entry_id', data.entry_id)

		const rows = data.starts
			.filter((start) => start.points != null)
			.map((start) => ({
				entry_id: data.entry_id,
				start_number: start.start_number,
				points: start.points,
			}))

		if (rows.length === 0) {
			return { entry_id: data.entry_id }
		}

		const { error } = await supabase.from('rally_start_results').insert(rows)

		if (error) throw new EntryResultsError(error.message)
		return { entry_id: data.entry_id }
	})
